import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

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
  spotifyTransferHere: "Usar acá",
  spotifyTransferred: "Reproducción transferida",
  spotifyVolume: "Volumen",
  spotifyQueue: "en cola",
};

function createContextValue(overrides = {}) {
  return {
    spotifyEnabled: true,
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
      duration_ms: 180_000,
      artists: [{ name: "The Players" }],
      album: { images: [{ url: "https://example.test/cover.jpg" }] },
    },
    ...overrides,
  };
}

function mockSpotifyFetch({ playback = createPlaybackPayload(), devices, queue = [] } = {}) {
  const calls = [];
  const fetchMock = vi.fn(async (url, options = {}) => {
    calls.push({ url: String(url), options });
    const path = String(url);
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

async function renderSpotifyMiniPlayer(contextValue = createContextValue()) {
  vi.resetModules();
  vi.stubEnv("VITE_SPOTIFY_CLIENT_ID", "spotify-client-id");
  const { AppProvider } = await import("../../context/AppContext");
  const { default: SpotifyMiniPlayer } = await import("./SpotifyMiniPlayer");

  render(
    <AppProvider value={contextValue}>
      <SpotifyMiniPlayer />
    </AppProvider>,
  );
}

describe("SpotifyMiniPlayer", () => {
  beforeEach(() => {
    localStorage.clear();
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

    expect(screen.getByTestId("spotify-mini-player")).toHaveClass("spotify-mini-player--prompt");
    expect(screen.getByText(translations.spotifyConnectPromptTitle)).toBeInTheDocument();
    expect(screen.getByText(translations.spotifyConnectPromptSubtitle)).toBeInTheDocument();
    expect(screen.queryByText(translations.spotifyNoTrack)).not.toBeInTheDocument();
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

  test("sends volume, shuffle, and repeat commands through Web API", async () => {
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

    fireEvent.change(screen.getByLabelText(translations.spotifyVolume), { target: { value: "62" } });
    fireEvent.click(screen.getByRole("button", { name: translations.spotifyShuffle }));
    fireEvent.click(screen.getByRole("button", { name: translations.spotifyRepeat }));

    await waitFor(() => {
      expect(calls.some((call) => String(call.url).includes("/me/player/volume?volume_percent=62"))).toBe(true);
      expect(calls.some((call) => String(call.url).includes("/me/player/shuffle?state=true"))).toBe(true);
      expect(calls.some((call) => String(call.url).includes("/me/player/repeat?state=context"))).toBe(true);
    });
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
});
