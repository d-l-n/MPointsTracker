import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";

const translations = {
  spotifyAuthError: "No se pudo conectar Spotify",
  spotifyConnect: "Conectar Spotify",
  spotifyDevice: "Dispositivo",
  spotifyDisconnect: "Desconectar",
  spotifyNoTrack: "Sin cancion activa",
  spotifyNotConfigured: "Configura Spotify",
  spotifyOpenAppHint: "Elegí música en Spotify",
  spotifyPlayerUnavailable: "Player no disponible",
  spotifyPremiumNote: "Spotify Premium requerido",
  spotifyPremiumRequired: "Spotify Premium requerido",
  spotifyConnectPromptTitle: "Musica para la partida",
  spotifyConnectPromptSubtitle: "Conectá tu cuenta Premium para controlar Spotify desde MPoints.",
  spotifySecureContextRequired: "Conexion segura requerida para conectar Spotify.",
  spotifyShuffle: "Aleatorio",
  spotifyRepeat: "Repetir",
  spotifyPrevious: "Anterior",
  spotifyPlayPause: "Reproducir o pausar",
  spotifyNext: "Siguiente",
  moreOptions: "Más opciones",
  spotifyExit: "Salir de Spotify",
  spotifyDisabledToast: "Ocultar Spotify",
  spotifyTransferHere: "Usar acá",
  spotifyTransferred: "Reproducción transferida",
  spotifyVolume: "Volumen",
  spotifyQueue: "en cola",
  spotifyShowQueue: "Mostrar cola",
  spotifyHideQueue: "Ocultar cola",
  spotifyEmptyQueue: "No hay canciones en cola",
  spotifyExpandPlayer: "Abrir reproductor",
  spotifyLikeTrack: "Guardar canción",
  spotifyUnlikeTrack: "Quitar canción guardada",
  spotifySearchPlaceholder: "Buscar canciones",
  spotifySearch: "Buscar",
  spotifySearchResults: "Resultados",
  spotifyPlayTrack: "Reproducir canción",
  spotifyPlaylists: "Playlists",
  spotifyLoadPlaylists: "Ver playlists",
  spotifyPlayPlaylist: "Reproducir playlist",
};

function createContextValue(overrides = {}) {
  return {
    spotifyEnabled: true,
    spotifyPosition: "center",
    saveSpotifyPreference: vi.fn(),
    t: (key) => translations[key] || key,
    showToast: vi.fn(),
    ...overrides,
  };
}

function createPlaybackPayload(overrides = {}) {
  return {
    is_playing: true,
    progress_ms: 45_000,
    shuffle_state: false,
    repeat_state: "off",
    device: {
      id: "phone-device",
      is_active: true,
      name: "iPhone",
      volume_percent: 35,
      supports_volume: true,
    },
    item: {
        name: "Mesa Song",
        id: "track-1",
        uri: "spotify:track:track-1",
        duration_ms: 180_000,
        artists: [{ name: "The Players" }],
        album: { images: [{ url: "https://example.test/cover.jpg" }] },
    },
    ...overrides,
  };
}

function mockSpotifyFetch({
  playback = createPlaybackPayload(),
  devices,
  queue = [],
  liked = [false],
  searchTracks = [],
  playlists = [],
} = {}) {
  const calls = [];
  const fetchMock = vi.fn(async (url, options = {}) => {
    calls.push({ url: String(url), options });
    const path = String(url);
    if (path.includes("/me/tracks/contains")) {
      return {
        ok: true,
        status: 200,
        json: async () => liked,
      };
    }
    if (path.includes("/search")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ tracks: { items: searchTracks } }),
      };
    }
    if (path.includes("/me/playlists")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ items: playlists }),
      };
    }
    if (path.includes("/me/player/devices")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          devices: devices || [
            playback.device,
            { id: "browser-device", name: "MPoints Tracker", type: "Computer", is_active: false, supports_volume: true },
          ],
        }),
      };
    }
    if (path.includes("/me/player/queue")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ queue }),
      };
    }
    if (path.includes("/me/player") && (!options.method || options.method === "GET")) {
      return {
        ok: true,
        status: 200,
        json: async () => playback,
      };
    }
    return {
      ok: true,
      status: 204,
      json: async () => ({}),
    };
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, calls };
}

function seedTokens() {
  localStorage.setItem("bgt_spotify_tokens", JSON.stringify({
    accessToken: "access-token",
    refreshToken: "refresh-token",
    expiresAt: Date.now() + 60_000,
  }));
}

function seedExpiredTokens(overrides = {}) {
  localStorage.setItem("bgt_spotify_tokens", JSON.stringify({
    accessToken: "expired-access-token",
    refreshToken: "refresh-token",
    expiresAt: Date.now() - 1_000,
    ...overrides,
  }));
}

function setLocationSearch(search, hash = "") {
  window.history.replaceState({}, "", `/settings${search}${hash}`);
}

function NavigateToGameButton() {
  const navigate = useNavigate();
  return <button type="button" onClick={() => navigate("/game/uno")}>go game</button>;
}

async function renderSpotifyMiniPlayer(contextValue = createContextValue(), { route = "/settings", withNavigator = false } = {}) {
  vi.resetModules();
  vi.stubEnv("VITE_SPOTIFY_CLIENT_ID", "spotify-client-id");
  const { AppProvider } = await import("../../context/AppContext");
  const { default: SpotifyMiniPlayer } = await import("./SpotifyMiniPlayer");

  render(
    <MemoryRouter initialEntries={[route]}>
      <AppProvider value={contextValue}>
        {withNavigator && <NavigateToGameButton />}
        <Routes>
          <Route path="*" element={<SpotifyMiniPlayer />} />
        </Routes>
      </AppProvider>
    </MemoryRouter>,
  );
}

describe("SpotifyMiniPlayer", () => {
  beforeEach(() => {
    document.querySelectorAll(".app-content").forEach((node) => node.remove());
    localStorage.clear();
    window.history.replaceState({}, "", "/settings");
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  test("shows a secure context message instead of throwing when Web Crypto digest is unavailable", async () => {
    const showToast = vi.fn();
    const cryptoWithoutSubtle = {
      getRandomValues: (values) => values.fill(1),
    };
    vi.stubGlobal("crypto", cryptoWithoutSubtle);

    await renderSpotifyMiniPlayer(createContextValue({ showToast }));

    fireEvent.click(screen.getByRole("button", { name: "Conectar Spotify" }));

    await waitFor(() => {
      expect(screen.getByText(translations.spotifySecureContextRequired)).toBeInTheDocument();
    });
    expect(showToast).toHaveBeenCalledWith(translations.spotifySecureContextRequired);
  });

  test("invites the user to connect before Spotify is authenticated", async () => {
    await renderSpotifyMiniPlayer();

    const player = screen.getByTestId("spotify-mini-player");
    expect(player).toHaveClass("spotify-mini-player--prompt");
    expect(screen.getByText(translations.spotifyConnectPromptTitle)).toBeInTheDocument();
    expect(screen.getByText(translations.spotifyConnectPromptSubtitle)).toBeInTheDocument();
    expect(screen.queryByText(translations.spotifyNoTrack)).not.toBeInTheDocument();
    expect(player.querySelector(".spotify-mini-art")).toBeNull();
  });

  test("cleans OAuth error callbacks from the URL and drops pending verifier state", async () => {
    const showToast = vi.fn();
    localStorage.setItem("bgt_spotify_code_verifier", "verifier");
    localStorage.setItem("bgt_spotify_oauth_state", "mpoints-expected-state");
    setLocationSearch("?error=access_denied&state=mpoints-expected-state&code=ignored", "#music");
    vi.stubGlobal("fetch", vi.fn());

    await renderSpotifyMiniPlayer(createContextValue({ showToast }));

    await waitFor(() => {
      expect(screen.getByText(translations.spotifyAuthError)).toBeInTheDocument();
    });
    expect(window.location.pathname + window.location.search + window.location.hash).toBe("/settings#music");
    expect(localStorage.getItem("bgt_spotify_code_verifier")).toBeNull();
    expect(localStorage.getItem("bgt_spotify_oauth_state")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(translations.spotifyAuthError);
  });

  test("rejects mismatched OAuth state, cleans the callback URL, and does not exchange the code", async () => {
    localStorage.setItem("bgt_spotify_code_verifier", "verifier");
    localStorage.setItem("bgt_spotify_oauth_state", "mpoints-expected-state");
    setLocationSearch("?tab=music&code=spotify-code&state=mpoints-attacker-state");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await renderSpotifyMiniPlayer();

    await waitFor(() => {
      expect(screen.getByText(translations.spotifyAuthError)).toBeInTheDocument();
    });
    expect(window.location.pathname + window.location.search).toBe("/settings?tab=music");
    expect(localStorage.getItem("bgt_spotify_code_verifier")).toBeNull();
    expect(localStorage.getItem("bgt_spotify_oauth_state")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("does not treat a stored pending state as a callback when the URL has no OAuth params", async () => {
    localStorage.setItem("bgt_spotify_code_verifier", "verifier");
    localStorage.setItem("bgt_spotify_oauth_state", "mpoints-expected-state");
    setLocationSearch("?tab=music");
    vi.stubGlobal("fetch", vi.fn());

    await renderSpotifyMiniPlayer();

    expect(screen.getByText(translations.spotifyConnectPromptSubtitle)).toBeInTheDocument();
    expect(window.location.pathname + window.location.search).toBe("/settings?tab=music");
    expect(localStorage.getItem("bgt_spotify_code_verifier")).toBe("verifier");
    expect(localStorage.getItem("bgt_spotify_oauth_state")).toBe("mpoints-expected-state");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("stores tokens from a valid OAuth callback and removes one-time OAuth storage", async () => {
    localStorage.setItem("bgt_spotify_code_verifier", "verifier");
    localStorage.setItem("bgt_spotify_oauth_state", "mpoints-expected-state");
    setLocationSearch("?code=spotify-code&state=mpoints-expected-state");
    vi.stubGlobal("fetch", vi.fn(async (url, options = {}) => {
      const path = String(url);
      if (path.includes("/api/token")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: "new-access-token",
            refresh_token: "new-refresh-token",
            expires_in: 3600,
          }),
        };
      }
      return {
        ok: true,
        status: path.includes("/me/player") && (!options.method || options.method === "GET") ? 200 : 204,
        json: async () => path.includes("/me/player/devices") ? { devices: [] } : null,
      };
    }));

    await renderSpotifyMiniPlayer();

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem("bgt_spotify_tokens")).accessToken).toBe("new-access-token");
    });
    expect(window.location.pathname + window.location.search).toBe("/settings");
    expect(localStorage.getItem("bgt_spotify_code_verifier")).toBeNull();
    expect(localStorage.getItem("bgt_spotify_oauth_state")).toBeNull();
  });

  test("shows current playback, device, queue, and expanded controls from Spotify Web API", async () => {
    seedTokens();
    mockSpotifyFetch({ queue: [{ name: "Next one" }, { name: "After that" }] });
    vi.stubGlobal("Spotify", {
      Player: class {
        addListener() { return true; }
        connect() { return Promise.resolve(true); }
        disconnect() {}
        previousTrack() { return Promise.resolve(); }
        togglePlay() { return Promise.resolve(); }
        nextTrack() { return Promise.resolve(); }
      },
    });

    await renderSpotifyMiniPlayer();

    await waitFor(() => {
      expect(screen.getByText("Mesa Song")).toBeInTheDocument();
    });
    expect(screen.getByText(/The Players/)).toBeInTheDocument();
    expect(screen.getByText(/Dispositivo: iPhone/)).toBeInTheDocument();
    expect(screen.getByText(/2 en cola/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: translations.spotifyShuffle })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: translations.spotifyRepeat })).toBeInTheDocument();
    expect(screen.getByLabelText(translations.spotifyVolume)).toHaveValue("35");
  });

  test("marks nonessential connected controls as mobile extras", async () => {
    seedTokens();
    mockSpotifyFetch();
    vi.stubGlobal("Spotify", {
      Player: class {
        addListener() { return true; }
        connect() { return Promise.resolve(true); }
        disconnect() {}
        previousTrack() { return Promise.resolve(); }
        togglePlay() { return Promise.resolve(); }
        nextTrack() { return Promise.resolve(); }
      },
    });

    await renderSpotifyMiniPlayer();

    expect(await screen.findByRole("button", { name: translations.spotifyLikeTrack })).toHaveClass("spotify-mini-mobile-extra");
    expect(screen.getByRole("button", { name: translations.spotifyShowQueue })).toHaveClass("spotify-mini-mobile-extra");
    expect(screen.getByRole("button", { name: translations.spotifyDisconnect })).toHaveClass("spotify-mini-disconnect");
  });

  test("toggles a readable queue panel with upcoming songs", async () => {
    seedTokens();
    mockSpotifyFetch({
      queue: [
        { name: "Next one", artists: [{ name: "Band A" }] },
        { name: "After that", artists: [{ name: "Band B" }] },
      ],
    });
    vi.stubGlobal("Spotify", {
      Player: class {
        addListener() { return true; }
        connect() { return Promise.resolve(true); }
        disconnect() {}
        previousTrack() { return Promise.resolve(); }
        togglePlay() { return Promise.resolve(); }
        nextTrack() { return Promise.resolve(); }
      },
    });

    await renderSpotifyMiniPlayer();
    const queueButton = await screen.findByRole("button", { name: translations.spotifyShowQueue });
    fireEvent.click(queueButton);

    expect(screen.getByText("Next one")).toBeInTheDocument();
    expect(screen.getByText("Band A")).toBeInTheDocument();
    expect(screen.getByText("After that")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: translations.spotifyHideQueue })).toBeInTheDocument();
  });

  test("collapses on downward scroll and expands from the cover button", async () => {
    seedTokens();
    mockSpotifyFetch();
    vi.stubGlobal("Spotify", {
      Player: class {
        addListener() { return true; }
        connect() { return Promise.resolve(true); }
        disconnect() {}
        previousTrack() { return Promise.resolve(); }
        togglePlay() { return Promise.resolve(); }
        nextTrack() { return Promise.resolve(); }
      },
    });

    await renderSpotifyMiniPlayer();
    const player = await screen.findByTestId("spotify-mini-player");

    fireEvent.wheel(window, { deltaY: 180 });

    await waitFor(() => {
      expect(player).toHaveClass("spotify-mini-player--collapsed");
    });
    fireEvent.click(screen.getByRole("button", { name: translations.spotifyExpandPlayer }));
    expect(player).not.toHaveClass("spotify-mini-player--collapsed");
  });

  test("collapses when the app content area is scrolled with a wheel gesture", async () => {
    seedTokens();
    mockSpotifyFetch();
    vi.stubGlobal("Spotify", {
      Player: class {
        addListener() { return true; }
        connect() { return Promise.resolve(true); }
        disconnect() {}
        previousTrack() { return Promise.resolve(); }
        togglePlay() { return Promise.resolve(); }
        nextTrack() { return Promise.resolve(); }
      },
    });
    const content = document.createElement("div");
    content.className = "app-content";
    document.body.appendChild(content);

    await renderSpotifyMiniPlayer();
    const player = await screen.findByTestId("spotify-mini-player");
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.wheel(content, { deltaY: 180 });

    await waitFor(() => {
      expect(player).toHaveClass("spotify-mini-player--collapsed");
    });
    content.remove();
  });

  test("collapses when navigation enters another route", async () => {
    seedTokens();
    setLocationSearch("");
    mockSpotifyFetch();
    vi.stubGlobal("Spotify", {
      Player: class {
        addListener() { return true; }
        connect() { return Promise.resolve(true); }
        disconnect() {}
        previousTrack() { return Promise.resolve(); }
        togglePlay() { return Promise.resolve(); }
        nextTrack() { return Promise.resolve(); }
      },
    });

    await renderSpotifyMiniPlayer(createContextValue(), { withNavigator: true });
    const player = await screen.findByTestId("spotify-mini-player");
    expect(player).not.toHaveClass("spotify-mini-player--collapsed");

    fireEvent.click(screen.getByRole("button", { name: "go game" }));

    await waitFor(() => {
      expect(player).toHaveClass("spotify-mini-player--collapsed");
    });
  });

  test("keeps the SDK track visible when a delayed Web API refresh still returns the previous song", async () => {
    const listeners = {};
    seedTokens();
    mockSpotifyFetch();
    vi.stubGlobal("Spotify", {
      Player: class {
        addListener(event, listener) {
          listeners[event] = listener;
          return true;
        }
        connect() { return Promise.resolve(true); }
        disconnect() {}
        previousTrack() { return Promise.resolve(); }
        togglePlay() { return Promise.resolve(); }
        nextTrack() { return Promise.resolve(); }
      },
    });

    await renderSpotifyMiniPlayer();
    await screen.findByText("Mesa Song");

    act(() => {
      listeners.player_state_changed({
        paused: false,
        position: 1_000,
        duration: 200_000,
        track_window: {
          current_track: {
            name: "New Song",
            id: "track-2",
            uri: "spotify:track:track-2",
            duration_ms: 200_000,
            artists: [{ name: "New Artist" }],
            album: { images: [{ url: "https://example.test/new-cover.jpg" }] },
          },
        },
      });
    });

    expect(screen.getByText("New Song")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: translations.spotifyNext }));

    await waitFor(() => {
      expect(screen.getByText("New Song")).toBeInTheDocument();
    });
    expect(screen.queryByText("Mesa Song")).not.toBeInTheDocument();
  });

  test("transfers playback to the browser device reported by the SDK", async () => {
    const listeners = {};
    seedTokens();
    const { calls } = mockSpotifyFetch();
    vi.stubGlobal("Spotify", {
      Player: class {
        addListener(event, listener) {
          listeners[event] = listener;
          return true;
        }
        connect() { return Promise.resolve(true); }
        disconnect() {}
        previousTrack() { return Promise.resolve(); }
        togglePlay() { return Promise.resolve(); }
        nextTrack() { return Promise.resolve(); }
      },
    });

    await renderSpotifyMiniPlayer();
    act(() => {
      listeners.ready({ device_id: "browser-device" });
    });
    const transferButton = await screen.findByRole("button", { name: translations.spotifyTransferHere });
    fireEvent.click(transferButton);

    await waitFor(() => {
      expect(calls.some((call) => (
        String(call.url).endsWith("/me/player")
        && call.options.method === "PUT"
        && String(call.options.body).includes("browser-device")
      ))).toBe(true);
    });
  });

  test("sends volume live, shuffle, and repeat commands through Web API", async () => {
    seedTokens();
    const { calls } = mockSpotifyFetch();
    vi.stubGlobal("Spotify", {
      Player: class {
        addListener() { return true; }
        connect() { return Promise.resolve(true); }
        disconnect() {}
        previousTrack() { return Promise.resolve(); }
        togglePlay() { return Promise.resolve(); }
        nextTrack() { return Promise.resolve(); }
      },
    });

    await renderSpotifyMiniPlayer();
    await screen.findByText("Mesa Song");

    fireEvent.input(screen.getByLabelText(translations.spotifyVolume), { target: { value: "62" } });
    fireEvent.click(screen.getByRole("button", { name: translations.spotifyShuffle }));
    fireEvent.click(screen.getByRole("button", { name: translations.spotifyRepeat }));

    await waitFor(() => {
      expect(calls.some((call) => String(call.url).includes("/me/player/volume?volume_percent=62"))).toBe(true);
      expect(calls.some((call) => String(call.url).includes("/me/player/shuffle?state=true"))).toBe(true);
      expect(calls.some((call) => String(call.url).includes("/me/player/repeat?state=context"))).toBe(true);
    });
  });

  test("syncs saved-track like state and can toggle it", async () => {
    seedTokens();
    const { calls } = mockSpotifyFetch({ liked: [false] });
    vi.stubGlobal("Spotify", {
      Player: class {
        addListener() { return true; }
        connect() { return Promise.resolve(true); }
        disconnect() {}
        previousTrack() { return Promise.resolve(); }
        togglePlay() { return Promise.resolve(); }
        nextTrack() { return Promise.resolve(); }
      },
    });

    await renderSpotifyMiniPlayer();
    const likeButton = await screen.findByRole("button", { name: translations.spotifyLikeTrack });
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(calls.some((call) => String(call.url).includes("/me/tracks?ids=track-1") && call.options.method === "PUT")).toBe(true);
    });
    expect(screen.getByRole("button", { name: translations.spotifyUnlikeTrack })).toBeInTheDocument();
  });

  test("searches tracks and plays a selected search result", async () => {
    seedTokens();
    const { calls } = mockSpotifyFetch({
      searchTracks: [
        {
          name: "Search Song",
          uri: "spotify:track:search-song",
          artists: [{ name: "Search Artist" }],
          album: { images: [] },
        },
      ],
    });
    vi.stubGlobal("Spotify", {
      Player: class {
        addListener() { return true; }
        connect() { return Promise.resolve(true); }
        disconnect() {}
        previousTrack() { return Promise.resolve(); }
        togglePlay() { return Promise.resolve(); }
        nextTrack() { return Promise.resolve(); }
      },
    });

    await renderSpotifyMiniPlayer();
    await screen.findByText("Mesa Song");
    fireEvent.change(screen.getByPlaceholderText(translations.spotifySearchPlaceholder), { target: { value: "search song" } });
    fireEvent.click(screen.getByRole("button", { name: translations.spotifySearch }));

    expect(await screen.findByText("Search Song")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: translations.spotifyPlayTrack }));

    await waitFor(() => {
      expect(calls.some((call) => (
        String(call.url).endsWith("/me/player/play?device_id=phone-device")
        && call.options.method === "PUT"
        && String(call.options.body).includes("spotify:track:search-song")
      ))).toBe(true);
    });
  });

  test("loads saved playlists and can start one", async () => {
    seedTokens();
    const { calls } = mockSpotifyFetch({
      playlists: [
        {
          name: "Mesa playlist",
          uri: "spotify:playlist:mesa",
          tracks: { total: 12 },
          images: [],
        },
      ],
    });
    vi.stubGlobal("Spotify", {
      Player: class {
        addListener() { return true; }
        connect() { return Promise.resolve(true); }
        disconnect() {}
        previousTrack() { return Promise.resolve(); }
        togglePlay() { return Promise.resolve(); }
        nextTrack() { return Promise.resolve(); }
      },
    });

    await renderSpotifyMiniPlayer();
    const playlistsButton = await screen.findByRole("button", { name: translations.spotifyLoadPlaylists });
    fireEvent.click(playlistsButton);

    expect(await screen.findByText("Mesa playlist")).toBeInTheDocument();
    expect(playlistsButton).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("button", { name: translations.spotifyPlayPlaylist }));

    await waitFor(() => {
      expect(calls.some((call) => (
        String(call.url).endsWith("/me/player/play?device_id=phone-device")
        && call.options.method === "PUT"
        && String(call.options.body).includes("spotify:playlist:mesa")
      ))).toBe(true);
    });

    fireEvent.click(playlistsButton);
    expect(screen.queryByText("Mesa playlist")).not.toBeInTheDocument();
    expect(playlistsButton).toHaveAttribute("aria-expanded", "false");
  });

  test("keeps connected controls visible when the playback SDK reports an authentication error", async () => {
    const listeners = {};
    seedTokens();
    mockSpotifyFetch();
    vi.stubGlobal("Spotify", {
      Player: class {
        addListener(event, listener) {
          listeners[event] = listener;
          return true;
        }

        connect() {
          return Promise.resolve(true);
        }

        disconnect() {}

        previousTrack() {
          return Promise.resolve();
        }

        togglePlay() {
          return Promise.resolve();
        }

        nextTrack() {
          return Promise.resolve();
        }
      },
    });

    await renderSpotifyMiniPlayer();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: translations.spotifyDisconnect })).toBeInTheDocument();
    });

    act(() => {
      listeners.authentication_error();
    });

    expect(screen.queryByRole("button", { name: translations.spotifyConnect })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: translations.spotifyDisconnect })).toBeInTheDocument();
    expect(screen.getByText(translations.spotifyAuthError)).toBeInTheDocument();
  });

  test("clears expired tokens and falls back to the connect prompt when refresh fails", async () => {
    seedExpiredTokens();
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      if (String(url).includes("/api/token")) {
        return {
          ok: false,
          status: 400,
          json: async () => ({ error: "invalid_grant" }),
        };
      }
      throw new Error(`unexpected request: ${url}`);
    }));
    vi.stubGlobal("Spotify", {
      Player: class {
        addListener() { return true; }
        connect() { return Promise.resolve(true); }
        disconnect() {}
        previousTrack() { return Promise.resolve(); }
        togglePlay() { return Promise.resolve(); }
        nextTrack() { return Promise.resolve(); }
      },
    });

    await renderSpotifyMiniPlayer();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: translations.spotifyConnect })).toBeInTheDocument();
    });
    expect(localStorage.getItem("bgt_spotify_tokens")).toBeNull();
    expect(screen.getByText(translations.spotifyAuthError)).toBeInTheDocument();
  });

  test("clicking outside the player while expanded collapses mobileExpanded", async () => {
    seedTokens();
    mockSpotifyFetch();
    vi.stubGlobal("Spotify", {
      Player: class {
        addListener() { return true; }
        connect() { return Promise.resolve(true); }
        disconnect() {}
        previousTrack() { return Promise.resolve(); }
        togglePlay() { return Promise.resolve(); }
        nextTrack() { return Promise.resolve(); }
      },
    });

    await renderSpotifyMiniPlayer(createContextValue());

    // Wait for playback to load
    await screen.findByText("Mesa Song");

    // Click the ⋮ button to expand mobileExpanded
    const moreButton = screen.getByRole("button", { name: "Más opciones" });
    fireEvent.click(moreButton);
    expect(moreButton).toHaveClass("is-active");

    // Dispatch a mousedown event outside the player (on document.body)
    fireEvent.mouseDown(document.body);

    // mobileExpanded should now be false → button loses is-active
    await waitFor(() => {
      expect(moreButton).not.toHaveClass("is-active");
    });
  });

  test("applies --left class when spotifyPosition is left and player is collapsed", async () => {
    seedTokens();
    mockSpotifyFetch();
    vi.stubGlobal("Spotify", {
      Player: class {
        addListener() { return true; }
        connect() { return Promise.resolve(true); }
        disconnect() {}
        previousTrack() { return Promise.resolve(); }
        togglePlay() { return Promise.resolve(); }
        nextTrack() { return Promise.resolve(); }
      },
    });

    await renderSpotifyMiniPlayer(createContextValue({ spotifyPosition: "left" }));
    const player = await screen.findByTestId("spotify-mini-player");

    // Wait for playback to load
    await screen.findByText("Mesa Song");

    // Trigger collapse via wheel event
    fireEvent.wheel(window, { deltaY: 100 });

    await waitFor(() => {
      expect(player).toHaveClass("spotify-mini-player--collapsed");
    });
    expect(player).toHaveClass("spotify-mini-player--left");
  });

  test("applies --right class when spotifyPosition is right and player is collapsed", async () => {
    seedTokens();
    mockSpotifyFetch();
    vi.stubGlobal("Spotify", {
      Player: class {
        addListener() { return true; }
        connect() { return Promise.resolve(true); }
        disconnect() {}
        previousTrack() { return Promise.resolve(); }
        togglePlay() { return Promise.resolve(); }
        nextTrack() { return Promise.resolve(); }
      },
    });

    await renderSpotifyMiniPlayer(createContextValue({ spotifyPosition: "right" }));
    const player = await screen.findByTestId("spotify-mini-player");

    await screen.findByText("Mesa Song");

    fireEvent.wheel(window, { deltaY: 100 });

    await waitFor(() => {
      expect(player).toHaveClass("spotify-mini-player--collapsed");
    });
    expect(player).toHaveClass("spotify-mini-player--right");
  });

  test("applies --draggable class when spotifyPosition is draggable and player is collapsed", async () => {
    seedTokens();
    mockSpotifyFetch();
    vi.stubGlobal("Spotify", {
      Player: class {
        addListener() { return true; }
        connect() { return Promise.resolve(true); }
        disconnect() {}
        previousTrack() { return Promise.resolve(); }
        togglePlay() { return Promise.resolve(); }
        nextTrack() { return Promise.resolve(); }
      },
    });

    await renderSpotifyMiniPlayer(createContextValue({ spotifyPosition: "draggable" }));
    const player = await screen.findByTestId("spotify-mini-player");

    await screen.findByText("Mesa Song");

    fireEvent.wheel(window, { deltaY: 100 });

    await waitFor(() => {
      expect(player).toHaveClass("spotify-mini-player--collapsed");
    });
    expect(player).toHaveClass("spotify-mini-player--draggable");
  });
});
