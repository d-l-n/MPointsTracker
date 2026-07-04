import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { useAppContext } from "../../context/AppContext";
import {
  SPOTIFY_SECURE_CONTEXT_ERROR,
  SPOTIFY_STATE_KEY,
  buildSpotifyAuthUrl,
  clearSpotifyAuthStorage,
  clearSpotifyOAuthStorage,
  createSpotifyApi,
  exchangeSpotifyCodeForTokens,
  readSpotifyTokens,
  refreshSpotifyTokens,
  writeSpotifyTokens,
  type SpotifyDevice,
  type SpotifyPlaylist,
  type SpotifyPlaybackState,
  type SpotifyTokenState,
  type SpotifyTrack,
} from "../../lib/spotifyClient";
import type { AppContextValue } from "../../types";

type SpotifySdkTrack = SpotifyTrack & {
  id?: string;
};

type SpotifyPlayerState = {
  paused: boolean;
  position?: number;
  duration?: number;
  track_window?: {
    current_track?: SpotifySdkTrack;
  };
};

type SpotifyPlayer = {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, listener: (...args: unknown[]) => void) => boolean;
  removeListener: (event: string) => boolean;
  togglePlay: () => Promise<void>;
  previousTrack: () => Promise<void>;
  nextTrack: () => Promise<void>;
};

declare global {
  interface Window {
    Spotify?: {
      Player: new (options: {
        name: string;
        getOAuthToken: (callback: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayer;
    };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "";
const SPOTIFY_SCOPES = [
  "streaming",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "user-library-read",
  "user-library-modify",
  "playlist-read-private",
  "playlist-read-collaborative",
].join(" ");
const REDIRECT_PATH = "/settings";
const PLAYBACK_POLL_MS = 15_000;
const SPOTIFY_AUTH_EXPIRED_ERROR = "spotify-auth-expired";

function loadSpotifySdk(): Promise<void> {
  if (window.Spotify?.Player) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://sdk.scdn.co/spotify-player.js"]');
    const previousReady = window.onSpotifyWebPlaybackSDKReady;
    window.onSpotifyWebPlaybackSDKReady = () => {
      previousReady?.();
      resolve();
    };
    if (existing) {
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    script.onerror = () => reject(new Error("spotify-sdk-load-failed"));
    document.body.appendChild(script);
  });
}

function formatProgress(ms?: number, duration?: number): string {
  if (!ms || !duration) return "";
  const toLabel = (value: number) => {
    const totalSeconds = Math.max(0, Math.floor(value / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  };
  return `${toLabel(ms)} / ${toLabel(duration)}`;
}

function getTrackCover(track?: SpotifyTrack | null): string | undefined {
  return track?.album?.images?.[0]?.url;
}

function getArtistLabel(track?: SpotifyTrack | null): string {
  return track?.artists?.map((artist) => artist.name).filter(Boolean).join(", ") || "";
}

function getRepeatLabel(repeatState?: string): string {
  if (repeatState === "track") return "1";
  if (repeatState === "context") return "∞";
  return "↻";
}

function cleanSpotifyCallbackUrl() {
  const params = new URLSearchParams(window.location.search);
  params.delete("code");
  params.delete("state");
  params.delete("error");
  const query = params.toString();
  const cleanUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash || ""}`;
  window.history.replaceState({}, "", cleanUrl);
}

export default function SpotifyMiniPlayer() {
  const location = useLocation();
  const {
    spotifyEnabled,
    spotifyPosition,
    saveSpotifyPreference,
    t,
    showToast,
  } = useAppContext() as AppContextValue;
  const [tokens, setTokens] = useState<SpotifyTokenState | null>(() => readSpotifyTokens());
  const [playerReady, setPlayerReady] = useState(false);
  const [status, setStatus] = useState("");
  const [playerState, setPlayerState] = useState<SpotifyPlayerState | null>(null);
  const [playbackState, setPlaybackState] = useState<SpotifyPlaybackState | null>(null);
  const [devices, setDevices] = useState<SpotifyDevice[]>([]);
  const [browserDeviceId, setBrowserDeviceId] = useState<string | null>(null);
  const [queueCount, setQueueCount] = useState<number | null>(null);
  const [queueTracks, setQueueTracks] = useState<SpotifyTrack[]>([]);
  const [queueOpen, setQueueOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [localVolume, setLocalVolume] = useState(60);
  const [likedTrack, setLikedTrack] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [playlistsOpen, setPlaylistsOpen] = useState(false);
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const lastPathnameRef = useRef(location.pathname);
  const hasClientId = Boolean(SPOTIFY_CLIENT_ID);

  const resetSpotifySession = useCallback((message = "") => {
    playerRef.current?.disconnect();
    playerRef.current = null;
    setTokens(null);
    setPlayerReady(false);
    setPlayerState(null);
    setPlaybackState(null);
    setDevices([]);
    setBrowserDeviceId(null);
    setQueueCount(null);
    setQueueTracks([]);
    setQueueOpen(false);
    setLikedTrack(null);
    setSearchQuery("");
    setSearchResults([]);
    setPlaylists([]);
    setPlaylistsOpen(false);
    setStatus(message);
    clearSpotifyAuthStorage();
  }, []);

  const getAccessToken = useCallback(async () => {
    let current = readSpotifyTokens();
    if (!current) {
      throw new Error("spotify-not-authenticated");
    }
    if (current.expiresAt <= Date.now()) {
      try {
        current = await refreshSpotifyTokens(current, SPOTIFY_CLIENT_ID);
        writeSpotifyTokens(current);
        setTokens(current);
      } catch {
        resetSpotifySession(t("spotifyAuthError"));
        throw new Error(SPOTIFY_AUTH_EXPIRED_ERROR);
      }
    }
    return current.accessToken;
  }, [resetSpotifySession, t]);

  const spotifyApi = useMemo(() => createSpotifyApi(getAccessToken), [getAccessToken]);

  const playbackTrack = playbackState?.item || null;
  const sdkTrack = playerState?.track_window?.current_track || null;
  const track = sdkTrack || playbackTrack;
  const isPlaying = sdkTrack && playerState ? !playerState.paused : playbackState?.is_playing ?? (playerState ? !playerState.paused : false);
  const activeDevice = playbackState?.device || devices.find((device) => device.is_active) || null;
  const currentDeviceId = activeDevice?.id || browserDeviceId;
  const volume = activeDevice?.volume_percent ?? null;
  const progressLabel = formatProgress(
    sdkTrack ? playerState?.position : playbackState?.progress_ms ?? playerState?.position,
    track?.duration_ms ?? playerState?.duration,
  );
  const artistLabel = getArtistLabel(track);
  const rawCover = getTrackCover(track);
  const coverUrl = rawCover?.startsWith("https://") ? rawCover : null;
  const trackId = track?.id || null;
  const titleLabel = !tokens ? t("spotifyConnectPromptTitle") : track?.name || t("spotifyNoTrack");
  const subtitleParts = [
    artistLabel,
    activeDevice?.name ? `${t("spotifyDevice")}: ${activeDevice.name}` : "",
    progressLabel,
  ].filter(Boolean);
  const subtitleLabel = !tokens
    ? status || t("spotifyConnectPromptSubtitle")
    : subtitleParts.join(" · ") || status || t("spotifyPremiumNote");
  const canUseWebApiControls = Boolean(tokens && currentDeviceId);
  const canUseSdkControls = Boolean(tokens && playerReady);
  const canControlPlayback = canUseWebApiControls || canUseSdkControls;

  const progressPct = useMemo(() => {
    const pos = sdkTrack ? playerState?.position : (playbackState?.progress_ms ?? playerState?.position);
    const dur = track?.duration_ms ?? playerState?.duration;
    if (!pos || !dur || dur === 0) return 0;
    return Math.min(100, Math.max(0, (pos / dur) * 100));
  }, [playerState?.position, playerState?.duration, playbackState?.progress_ms, track?.duration_ms, sdkTrack]);

  const collapsePlayer = useCallback(() => {
    setQueueOpen(false);
    setPlaylistsOpen(false);
    setMobileExpanded(false);
    setIsCollapsed(true);
  }, []);

  const refreshPlayback = useCallback(async () => {
    if (!tokens || !hasClientId) return;
    try {
      const [nextPlayback, nextDevices] = await Promise.all([
        spotifyApi.getPlaybackState(),
        spotifyApi.getDevices(),
      ]);
      setPlaybackState(nextPlayback);
      setDevices(nextDevices);
      const nextQueue = await spotifyApi.getQueue().catch(() => null);
      const nextQueueTracks = nextQueue?.queue || [];
      setQueueTracks(nextQueueTracks);
      setQueueCount(nextQueueTracks.length);
      if (nextPlayback || nextDevices.length > 0) {
        setStatus("");
      }
    } catch (error) {
      const message = error instanceof Error && error.message === "spotify-api-403"
        ? t("spotifyPremiumRequired")
        : error instanceof Error && error.message === SPOTIFY_AUTH_EXPIRED_ERROR
          ? t("spotifyAuthError")
          : t("spotifyPlayerUnavailable");
      setStatus(message);
    }
  }, [hasClientId, spotifyApi, t, tokens]);

  const disconnect = useCallback(() => {
    resetSpotifySession("");
  }, [resetSpotifySession]);

  const connect = useCallback(async () => {
    if (!hasClientId) {
      setStatus(t("spotifyNotConfigured"));
      return;
    }
    try {
      const url = await buildSpotifyAuthUrl({
        clientId: SPOTIFY_CLIENT_ID,
        scopes: SPOTIFY_SCOPES,
        redirectPath: REDIRECT_PATH,
      });
      window.location.assign(url);
    } catch (error) {
      const message = error instanceof Error && error.message === SPOTIFY_SECURE_CONTEXT_ERROR
        ? t("spotifySecureContextRequired")
        : t("spotifyAuthError");
      setStatus(message);
      showToast?.(message);
    }
  }, [hasClientId, showToast, t]);

  const transferToBrowser = useCallback(async () => {
    if (!browserDeviceId) return;
    try {
      await spotifyApi.transferPlayback(browserDeviceId, false);
      setStatus(t("spotifyTransferred"));
      await refreshPlayback();
    } catch {
      setStatus(t("spotifyPlayerUnavailable"));
    }
  }, [browserDeviceId, refreshPlayback, spotifyApi, t]);

  const togglePlay = useCallback(async () => {
    if (playerReady) {
      await playerRef.current?.togglePlay();
      return;
    }
    setStatus(t("spotifyOpenAppHint"));
  }, [playerReady, t]);

  const previousTrack = useCallback(async () => {
    await playerRef.current?.previousTrack();
    await refreshPlayback();
  }, [refreshPlayback]);

  const nextTrack = useCallback(async () => {
    await playerRef.current?.nextTrack();
    await refreshPlayback();
  }, [refreshPlayback]);

  const handleVolume = useCallback(async (nextVolume: number) => {
    setLocalVolume(nextVolume);
    setPlaybackState((current) => current ? {
      ...current,
      device: current.device ? { ...current.device, volume_percent: nextVolume } : current.device,
    } : current);
    try {
      await spotifyApi.setVolume(nextVolume, currentDeviceId);
    } catch {
      setStatus(t("spotifyPlayerUnavailable"));
    }
  }, [currentDeviceId, spotifyApi, t]);

  const toggleLikedTrack = useCallback(async () => {
    if (!trackId) return;
    const nextLiked = !likedTrack;
    setLikedTrack(nextLiked);
    try {
      if (nextLiked) {
        await spotifyApi.saveTracks([trackId]);
      } else {
        await spotifyApi.removeSavedTracks([trackId]);
      }
    } catch {
      setLikedTrack(!nextLiked);
      setStatus(t("spotifyPlayerUnavailable"));
    }
  }, [likedTrack, spotifyApi, t, trackId]);

  const searchTracks = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }
    try {
      setSearchResults(await spotifyApi.searchTracks(query));
    } catch {
      setStatus(t("spotifyPlayerUnavailable"));
    }
  }, [searchQuery, spotifyApi, t]);

  const togglePlaylists = useCallback(async () => {
    if (playlistsOpen) {
      setPlaylistsOpen(false);
      return;
    }
    setPlaylistsOpen(true);
    if (playlists.length > 0) return;
    try {
      setPlaylists(await spotifyApi.getPlaylists());
    } catch {
      setPlaylistsOpen(false);
      setStatus(t("spotifyPlayerUnavailable"));
    }
  }, [playlists.length, playlistsOpen, spotifyApi, t]);

  const playTrack = useCallback(async (selectedTrack: SpotifyTrack) => {
    if (!selectedTrack.uri) return;
    try {
      await spotifyApi.play({ uris: [selectedTrack.uri], deviceId: currentDeviceId });
      await refreshPlayback();
    } catch {
      setStatus(t("spotifyPlayerUnavailable"));
    }
  }, [currentDeviceId, refreshPlayback, spotifyApi, t]);

  const playPlaylist = useCallback(async (playlist: SpotifyPlaylist) => {
    if (!playlist.uri) return;
    try {
      await spotifyApi.play({ contextUri: playlist.uri, deviceId: currentDeviceId });
      await refreshPlayback();
    } catch {
      setStatus(t("spotifyPlayerUnavailable"));
    }
  }, [currentDeviceId, refreshPlayback, spotifyApi, t]);

  const toggleShuffle = useCallback(async () => {
    const nextShuffle = !playbackState?.shuffle_state;
    setPlaybackState((current) => current ? { ...current, shuffle_state: nextShuffle } : current);
    try {
      await spotifyApi.setShuffle(nextShuffle, currentDeviceId);
    } catch {
      setStatus(t("spotifyPlayerUnavailable"));
    }
  }, [currentDeviceId, playbackState?.shuffle_state, spotifyApi, t]);

  const cycleRepeat = useCallback(async () => {
    const nextRepeat = playbackState?.repeat_state === "off"
      ? "context"
      : playbackState?.repeat_state === "context" ? "track" : "off";
    setPlaybackState((current) => current ? { ...current, repeat_state: nextRepeat } : current);
    try {
      await spotifyApi.setRepeat(nextRepeat, currentDeviceId);
    } catch {
      setStatus(t("spotifyPlayerUnavailable"));
    }
  }, [currentDeviceId, playbackState?.repeat_state, spotifyApi, t]);

  useEffect(() => {
    if (!spotifyEnabled) {
      playerRef.current?.disconnect();
      playerRef.current = null;
      setPlayerReady(false);
      setPlayerState(null);
      setPlaybackState(null);
      return;
    }
  }, [spotifyEnabled]);

  useEffect(() => {
    if (volume !== null) {
      setLocalVolume(volume);
    }
  }, [volume]);

  useEffect(() => {
    if (!tokens || !trackId) {
      setLikedTrack(null);
      return;
    }
    let cancelled = false;
    spotifyApi.containsSavedTracks([trackId])
      .then((saved) => {
        if (!cancelled) {
          setLikedTrack((current) => current === null ? Boolean(saved?.[0]) : current);
        }
      })
      .catch(() => {
        if (!cancelled) setLikedTrack(null);
      });
    return () => {
      cancelled = true;
    };
  }, [spotifyApi, tokens, trackId]);

  useEffect(() => {
    if (!tokens) return;

    const collapse = () => collapsePlayer();
    const expand = () => setIsCollapsed(false);

    // ── Touch swipe (mobile) ─────────────────────────────────────────────────
    // Native scroll events are unreliable when AppShell manually sets scrollTop
    // or when the active scroll container is .detail-wrapper, not .app-content.
    // Tracking touchmove directly is the most reliable approach on mobile.
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.(".spotify-mini-player")) return;
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.(".spotify-mini-player")) return;
      const delta = touchStartY - e.touches[0].clientY;
      touchStartY = e.touches[0].clientY;
      if (delta > 6) collapse();
    };

    // ── Capture-phase scroll (any nested container) ──────────────────────────
    // Catches scroll from .app-content, .detail-wrapper, or any other
    // overflow:auto child — the class check in the old code was the root cause.
    const scrollTops = new Map<EventTarget, number>();
    const onScroll = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target || target.closest?.(".spotify-mini-player")) return;
      const prev = scrollTops.get(target) ?? 0;
      const curr = target.scrollTop ?? window.scrollY ?? 0;
      scrollTops.set(target, curr);
      const delta = curr - prev;
      if (curr > 80 && delta > 8) collapse();
    };

    // ── Wheel (desktop hover-scroll) ─────────────────────────────────────────
    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.(".spotify-mini-player")) return;
      if (e.deltaY > 8) collapse();
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("wheel", onWheel);
    };
  }, [collapsePlayer, tokens]);

  useEffect(() => {
    if (!tokens) return;
    const enteredGame = location.pathname.startsWith("/game/");
    const changedPath = location.pathname !== lastPathnameRef.current;
    lastPathnameRef.current = location.pathname;
    if (enteredGame || changedPath) {
      collapsePlayer();
    }
  }, [collapsePlayer, location.pathname, tokens]);

  useEffect(() => {
    if (!spotifyEnabled || !hasClientId) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");
    const expectedState = localStorage.getItem(SPOTIFY_STATE_KEY);
    const hasCallbackParam = params.has("code") || params.has("state") || params.has("error");
    const isSpotifyCallback = hasCallbackParam && Boolean(state?.startsWith("mpoints-") || expectedState);

    if (!isSpotifyCallback) return;

    cleanSpotifyCallbackUrl();

    if (error || !code || !state || state !== expectedState) {
      clearSpotifyOAuthStorage();
      setStatus(t("spotifyAuthError"));
      showToast?.(t("spotifyAuthError"));
      return;
    }

    exchangeSpotifyCodeForTokens({ code, clientId: SPOTIFY_CLIENT_ID, redirectPath: REDIRECT_PATH })
      .then((nextTokens) => {
        writeSpotifyTokens(nextTokens);
        setTokens(nextTokens);
        clearSpotifyOAuthStorage();
        showToast?.(t("spotifyReady"));
      })
      .catch(() => {
        clearSpotifyOAuthStorage();
        setStatus(t("spotifyAuthError"));
        showToast?.(t("spotifyAuthError"));
      });
  }, [hasClientId, showToast, spotifyEnabled, t]);

  useEffect(() => {
    if (!spotifyEnabled || !tokens || !hasClientId || playerRef.current) return;
    let cancelled = false;

    loadSpotifySdk()
      .then(() => {
        if (cancelled || !window.Spotify?.Player) return;
        const player = new window.Spotify.Player({
          name: "MPoints Tracker",
          volume: 0.6,
          getOAuthToken: (callback) => {
            void getAccessToken().then(callback).catch(() => {
              setStatus(t("spotifyAuthError"));
            });
          },
        });

        player.addListener("ready", (payload) => {
          const deviceId = typeof payload === "object" && payload && "device_id" in payload
            ? String((payload as { device_id: string }).device_id)
            : null;
          setBrowserDeviceId(deviceId);
          setPlayerReady(true);
          setStatus(t("spotifyOpenAppHint"));
          void refreshPlayback();
        });
        player.addListener("not_ready", () => {
          setPlayerReady(false);
          setStatus(t("spotifyPlayerUnavailable"));
        });
        player.addListener("player_state_changed", (state) => {
          const nextState = (state as SpotifyPlayerState) || null;
          setPlayerState(nextState);
          if (nextState?.track_window?.current_track) {
            setPlaybackState((current) => ({
              ...current,
              item: nextState.track_window?.current_track || current?.item,
              is_playing: !nextState.paused,
              progress_ms: nextState.position,
            }));
          }
        });
        player.addListener("account_error", () => {
          setStatus(t("spotifyPremiumRequired"));
        });
        player.addListener("authentication_error", () => {
          setStatus(t("spotifyAuthError"));
          setPlayerReady(false);
        });
        playerRef.current = player;
        void player.connect();
      })
      .catch(() => setStatus(t("spotifyPlayerUnavailable")));

    return () => {
      cancelled = true;
      playerRef.current?.disconnect();
      playerRef.current = null;
    };
  }, [getAccessToken, hasClientId, refreshPlayback, spotifyEnabled, t, tokens]);

  useEffect(() => {
    if (!spotifyEnabled || !tokens || !hasClientId) return;
    void refreshPlayback();
    const id = window.setInterval(() => void refreshPlayback(), PLAYBACK_POLL_MS);
    return () => window.clearInterval(id);
  }, [hasClientId, refreshPlayback, spotifyEnabled, tokens]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (mobileExpanded && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMobileExpanded(false);
      }
    };
    if (mobileExpanded) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [mobileExpanded]);

  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const isDragMove = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (spotifyPosition !== "draggable") return;
    isDragging.current = true;
    isDragMove.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY, startX: dragPos.x, startY: dragPos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDragMove.current = true;
    setDragPos({
      x: dragStart.current.startX + dx,
      y: dragStart.current.startY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleFloatClick = () => {
    if (isDragMove.current) {
      isDragMove.current = false;
      return;
    }
    setIsCollapsed(false);
  };

  if (!spotifyEnabled) {
    return null;
  }

  const isDraggable = spotifyPosition === "draggable";
  const playerClassName = [
    "spotify-mini-player",
    !tokens ? "spotify-mini-player--prompt" : "",
    tokens && isCollapsed ? "spotify-mini-player--collapsed" : "",
    tokens && isCollapsed && spotifyPosition === "left" ? "spotify-mini-player--left" : "",
    tokens && isCollapsed && spotifyPosition === "right" ? "spotify-mini-player--right" : "",
    tokens && isCollapsed && isDraggable ? "spotify-mini-player--draggable" : "",
    mobileExpanded ? "spotify-mini-player--mobile-expanded" : "",
  ].filter(Boolean).join(" ");

  return (
    <div
      className={playerClassName}
      data-testid="spotify-mini-player"
      ref={containerRef}
      style={tokens && isCollapsed && isDraggable ? { transform: `translate(${dragPos.x}px, ${dragPos.y}px)` } : undefined}
    >
      {tokens && isCollapsed ? (
        <button
          className="spotify-mini-float"
          aria-label={t("spotifyExpandPlayer")}
          onClick={handleFloatClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {coverUrl ? <img src={coverUrl} alt="" draggable={false} /> : <span>♪</span>}
        </button>
      ) : (
        <>
          <div className="spotify-mini-track">
            {tokens && (
              <div className="spotify-mini-art" aria-hidden="true">
                {coverUrl ? <img src={coverUrl} alt="" /> : <span>♪</span>}
              </div>
            )}
            <div className="spotify-mini-copy">
              <div className="spotify-mini-title">{titleLabel}</div>
              <div className="spotify-mini-subtitle">{subtitleLabel}</div>
              {tokens && (
                <div className="spotify-mini-meta">
                  {queueCount !== null && <span>{queueCount} {t("spotifyQueue")}</span>}
                  {status && <span>{status}</span>}
                </div>
              )}
            </div>
          </div>
      {!tokens ? (
        <button className="spotify-mini-action" onClick={connect} disabled={!hasClientId}>
          {hasClientId ? t("spotifyConnect") : t("spotifyNotConfigured")}
        </button>
      ) : (
        <div className="spotify-mini-panel">
          <div className="spotify-mini-controls">
            <button className="spotify-mini-prev" aria-label={t("spotifyPrevious")} onClick={() => void previousTrack()} disabled={!canControlPlayback}>‹</button>
            <button aria-label={t("spotifyPlayPause")} className="spotify-mini-ctrl--play" onClick={() => void togglePlay()} disabled={!canControlPlayback}>
              {isPlaying ? "Ⅱ" : "▶"}
            </button>
            <button aria-label={t("spotifyNext")} onClick={() => void nextTrack()} disabled={!canControlPlayback}>›</button>
            <button
              className={["spotify-mini-mobile-toggle", mobileExpanded ? "is-active" : ""].filter(Boolean).join(" ")}
              aria-label={t("moreOptions")}
              onClick={() => setMobileExpanded(!mobileExpanded)}
            >
              {mobileExpanded ? "✕" : "⋮"}
            </button>
            <button
              className={["spotify-mini-mobile-extra", likedTrack ? "is-active" : ""].filter(Boolean).join(" ")}
              aria-label={likedTrack ? t("spotifyUnlikeTrack") : t("spotifyLikeTrack")}
              onClick={() => void toggleLikedTrack()}
              disabled={!trackId}
            >
              ♥
            </button>
            <button
              className={["spotify-mini-mobile-extra", queueOpen ? "is-active" : ""].filter(Boolean).join(" ")}
              aria-label={queueOpen ? t("spotifyHideQueue") : t("spotifyShowQueue")}
              onClick={() => setQueueOpen((open) => !open)}
            >
              ☰
            </button>
            <button
              className={["spotify-mini-advanced", playbackState?.shuffle_state ? "is-active" : ""].filter(Boolean).join(" ")}
              aria-label={t("spotifyShuffle")}
              onClick={() => void toggleShuffle()}
              disabled={!canUseWebApiControls}
            >
              ⇄
            </button>
            <button
              className={["spotify-mini-advanced", playbackState?.repeat_state && playbackState.repeat_state !== "off" ? "is-active" : ""].filter(Boolean).join(" ")}
              aria-label={t("spotifyRepeat")}
              onClick={() => void cycleRepeat()}
              disabled={!canUseWebApiControls}
            >
              {getRepeatLabel(playbackState?.repeat_state)}
            </button>
            <button className="spotify-mini-disconnect" aria-label={t("spotifyDisconnect")} onClick={disconnect}>{t("spotifyExit")}</button>
          </div>
          <div className="spotify-mini-secondary">
            <button
              className="spotify-mini-transfer"
              onClick={() => void transferToBrowser()}
              disabled={!browserDeviceId || activeDevice?.id === browserDeviceId}
            >
              {t("spotifyTransferHere")}
            </button>
            <label className="spotify-mini-volume">
              <span>{t("spotifyVolume")}</span>
              <input
                type="range"
                id="spotify-volume"
                name="spotify-volume"
                min="0"
                max="100"
                value={volume ?? localVolume}
                disabled={!canUseWebApiControls || activeDevice?.supports_volume === false}
                onInput={(event) => void handleVolume(Number((event.target as HTMLInputElement).value))}
              />
            </label>
          </div>
          <div className="spotify-mini-browser">
            <div className="spotify-mini-search">
              <input
                type="search"
                id="spotify-search"
                name="spotify-search"
                value={searchQuery}
                placeholder={t("spotifySearchPlaceholder")}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void searchTracks();
                }}
                aria-label={t("spotifySearch")}
              />
              <button type="button" onClick={() => void searchTracks()}>{t("spotifySearch")}</button>
              <button
                type="button"
                className={playlistsOpen ? "is-active" : ""}
                aria-expanded={playlistsOpen}
                onClick={() => void togglePlaylists()}
              >
                {t("spotifyLoadPlaylists")}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="spotify-mini-list" aria-label={t("spotifySearchResults")}>
                {searchResults.map((result, index) => (
                  <div className="spotify-mini-list-row" key={`${result.uri || result.name}-${index}`}>
                    <span>
                      <strong>{result.name}</strong>
                      <small>{getArtistLabel(result)}</small>
                    </span>
                    <button
                      aria-label={t("spotifyPlayTrack")}
                      onClick={() => void playTrack(result)}
                      disabled={!result.uri || !canUseWebApiControls}
                    >
                      ▶
                    </button>
                  </div>
                ))}
              </div>
            )}
            {playlistsOpen && playlists.length > 0 && (
              <div className="spotify-mini-list" aria-label={t("spotifyPlaylists")}>
                {playlists.map((playlist, index) => (
                  <div className="spotify-mini-list-row" key={`${playlist.uri || playlist.name}-${index}`}>
                    <span>
                      <strong>{playlist.name}</strong>
                      <small>{playlist.tracks?.total ?? 0} {t("spotifyQueue")}</small>
                    </span>
                    <button
                      aria-label={t("spotifyPlayPlaylist")}
                      onClick={() => void playPlaylist(playlist)}
                      disabled={!playlist.uri || !canUseWebApiControls}
                    >
                      ▶
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {queueOpen && (
            <div className="spotify-mini-queue">
              {queueTracks.length > 0 ? queueTracks.slice(0, 6).map((queueTrack, index) => (
                <div className="spotify-mini-queue-row" key={`${queueTrack.uri || queueTrack.name}-${index}`}>
                  <strong>{queueTrack.name}</strong>
                  <small>{getArtistLabel(queueTrack)}</small>
                </div>
              )) : (
                <div className="spotify-mini-empty">{t("spotifyEmptyQueue")}</div>
              )}
            </div>
          )}
        </div>
      )}
      <button
        className="spotify-mini-disable"
        aria-label={t("spotifyDisabledToast")}
        onClick={() => {
          disconnect();
          void saveSpotifyPreference(false);
        }}
      >
        ×
      </button>
      {tokens && progressPct > 0 && (
        <div className="spotify-mini-progress" aria-hidden="true">
          <div className="spotify-mini-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      )}
        </>
      )}
    </div>
  );
}
