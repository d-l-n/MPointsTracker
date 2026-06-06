import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAppContext } from "../../context/AppContext";
import {
  SPOTIFY_SECURE_CONTEXT_ERROR,
  SPOTIFY_STATE_KEY,
  SPOTIFY_VERIFIER_KEY,
  buildSpotifyAuthUrl,
  clearSpotifyAuthStorage,
  createSpotifyApi,
  exchangeSpotifyCodeForTokens,
  readSpotifyTokens,
  refreshSpotifyTokens,
  writeSpotifyTokens,
  type SpotifyDevice,
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
].join(" ");
const REDIRECT_PATH = "/settings";
const PLAYBACK_POLL_MS = 15_000;

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

export default function SpotifyMiniPlayer() {
  const {
    spotifyEnabled,
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
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const hasClientId = Boolean(SPOTIFY_CLIENT_ID);

  const getAccessToken = useCallback(async () => {
    let current = readSpotifyTokens();
    if (!current) {
      throw new Error("spotify-not-authenticated");
    }
    if (current.expiresAt <= Date.now()) {
      current = await refreshSpotifyTokens(current, SPOTIFY_CLIENT_ID);
      writeSpotifyTokens(current);
      setTokens(current);
    }
    return current.accessToken;
  }, []);

  const spotifyApi = useMemo(() => createSpotifyApi(getAccessToken), [getAccessToken]);

  const playbackTrack = playbackState?.item || null;
  const sdkTrack = playerState?.track_window?.current_track || null;
  const track = playbackTrack || sdkTrack;
  const isPlaying = playbackState?.is_playing ?? (playerState ? !playerState.paused : false);
  const activeDevice = playbackState?.device || devices.find((device) => device.is_active) || null;
  const currentDeviceId = activeDevice?.id || browserDeviceId;
  const volume = activeDevice?.volume_percent ?? null;
  const progressLabel = formatProgress(playbackState?.progress_ms ?? playerState?.position, playbackTrack?.duration_ms ?? playerState?.duration);
  const artistLabel = getArtistLabel(track);
  const coverUrl = getTrackCover(track);
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
      setQueueCount(nextQueue?.queue?.length ?? null);
      if (nextPlayback || nextDevices.length > 0) {
        setStatus("");
      }
    } catch (error) {
      const message = error instanceof Error && error.message === "spotify-api-403"
        ? t("spotifyPremiumRequired")
        : t("spotifyPlayerUnavailable");
      setStatus(message);
    }
  }, [hasClientId, spotifyApi, t, tokens]);

  const disconnect = useCallback(() => {
    playerRef.current?.disconnect();
    playerRef.current = null;
    setTokens(null);
    setPlayerReady(false);
    setPlayerState(null);
    setPlaybackState(null);
    setDevices([]);
    setBrowserDeviceId(null);
    setQueueCount(null);
    setStatus("");
    clearSpotifyAuthStorage();
  }, []);

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
    if (!spotifyEnabled || !hasClientId) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");
    const expectedState = localStorage.getItem(SPOTIFY_STATE_KEY);
    const isSpotifyCallback = Boolean(state?.startsWith("mpoints-") || expectedState);

    if (!isSpotifyCallback) return;

    const cleanUrl = `${window.location.pathname}${window.location.hash || ""}`;
    window.history.replaceState({}, "", cleanUrl);

    if (error || !code || !state || state !== expectedState) {
      setStatus(t("spotifyAuthError"));
      showToast?.(t("spotifyAuthError"));
      return;
    }

    exchangeSpotifyCodeForTokens({ code, clientId: SPOTIFY_CLIENT_ID, redirectPath: REDIRECT_PATH })
      .then((nextTokens) => {
        writeSpotifyTokens(nextTokens);
        setTokens(nextTokens);
        localStorage.removeItem(SPOTIFY_VERIFIER_KEY);
        localStorage.removeItem(SPOTIFY_STATE_KEY);
        showToast?.(t("spotifyReady"));
      })
      .catch(() => {
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

  if (!spotifyEnabled) {
    return null;
  }

  return (
    <div className={`spotify-mini-player${!tokens ? " spotify-mini-player--prompt" : ""}`} data-testid="spotify-mini-player">
      <div className="spotify-mini-art" aria-hidden="true">
        {coverUrl ? <img src={coverUrl} alt="" /> : <span>♪</span>}
      </div>
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
      {!tokens ? (
        <button className="spotify-mini-action" onClick={connect} disabled={!hasClientId}>
          {hasClientId ? t("spotifyConnect") : t("spotifyNotConfigured")}
        </button>
      ) : (
        <div className="spotify-mini-panel">
          <div className="spotify-mini-controls">
            <button aria-label={t("spotifyPrevious")} onClick={() => void previousTrack()} disabled={!canControlPlayback}>‹</button>
            <button aria-label={t("spotifyPlayPause")} onClick={() => void togglePlay()} disabled={!canControlPlayback}>
              {isPlaying ? "Ⅱ" : "▶"}
            </button>
            <button aria-label={t("spotifyNext")} onClick={() => void nextTrack()} disabled={!canControlPlayback}>›</button>
            <button
              aria-label={t("spotifyShuffle")}
              className={playbackState?.shuffle_state ? "is-active" : ""}
              onClick={() => void toggleShuffle()}
              disabled={!canUseWebApiControls}
            >
              ⇄
            </button>
            <button
              aria-label={t("spotifyRepeat")}
              className={playbackState?.repeat_state && playbackState.repeat_state !== "off" ? "is-active" : ""}
              onClick={() => void cycleRepeat()}
              disabled={!canUseWebApiControls}
            >
              {getRepeatLabel(playbackState?.repeat_state)}
            </button>
            <button aria-label={t("spotifyDisconnect")} onClick={disconnect}>×</button>
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
                min="0"
                max="100"
                value={volume ?? 60}
                disabled={!canUseWebApiControls || activeDevice?.supports_volume === false}
                onChange={(event) => void handleVolume(Number(event.target.value))}
              />
            </label>
          </div>
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
    </div>
  );
}
