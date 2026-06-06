export type SpotifyTokenState = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};

export type SpotifyDevice = {
  id: string | null;
  is_active?: boolean;
  is_restricted?: boolean;
  name?: string;
  type?: string;
  volume_percent?: number | null;
  supports_volume?: boolean;
};

export type SpotifyTrack = {
  name?: string;
  artists?: Array<{ name?: string }>;
  album?: {
    images?: Array<{ url?: string }>;
  };
  duration_ms?: number;
};

export type SpotifyPlaybackState = {
  device?: SpotifyDevice;
  repeat_state?: "off" | "track" | "context" | string;
  shuffle_state?: boolean;
  progress_ms?: number;
  is_playing?: boolean;
  item?: SpotifyTrack | null;
};

export type SpotifyQueueState = {
  queue?: SpotifyTrack[];
};

export const SPOTIFY_TOKEN_KEY = "bgt_spotify_tokens";
export const SPOTIFY_VERIFIER_KEY = "bgt_spotify_code_verifier";
export const SPOTIFY_STATE_KEY = "bgt_spotify_oauth_state";
export const SPOTIFY_SECURE_CONTEXT_ERROR = "spotify-secure-context-required";

const SPOTIFY_ACCOUNTS_URL = "https://accounts.spotify.com";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";

export function readSpotifyTokens(): SpotifyTokenState | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(SPOTIFY_TOKEN_KEY) || "null");
    if (!parsed || typeof parsed.accessToken !== "string" || typeof parsed.expiresAt !== "number") {
      return null;
    }
    return parsed as SpotifyTokenState;
  } catch {
    return null;
  }
}

export function writeSpotifyTokens(tokens: SpotifyTokenState | null) {
  try {
    if (tokens) {
      localStorage.setItem(SPOTIFY_TOKEN_KEY, JSON.stringify(tokens));
    } else {
      localStorage.removeItem(SPOTIFY_TOKEN_KEY);
    }
  } catch {
    // ignore storage failures
  }
}

export function clearSpotifyAuthStorage() {
  try {
    localStorage.removeItem(SPOTIFY_TOKEN_KEY);
    localStorage.removeItem(SPOTIFY_VERIFIER_KEY);
    localStorage.removeItem(SPOTIFY_STATE_KEY);
  } catch {
    // ignore storage failures
  }
}

function base64UrlEncode(bytes: ArrayBuffer): string {
  const values = Array.from(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...values))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function getUsableWebCrypto(): Crypto | null {
  const webCrypto = globalThis.crypto;
  if (
    !webCrypto
    || typeof webCrypto.getRandomValues !== "function"
    || !webCrypto.subtle
    || typeof webCrypto.subtle.digest !== "function"
  ) {
    return null;
  }
  return webCrypto;
}

function randomString(webCrypto: Crypto, length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = new Uint8Array(length);
  webCrypto.getRandomValues(values);
  return Array.from(values, (value) => chars[value % chars.length]).join("");
}

async function createCodeChallenge(webCrypto: Crypto, verifier: string): Promise<string> {
  const encoded = new TextEncoder().encode(verifier);
  const digest = await webCrypto.subtle.digest("SHA-256", encoded);
  return base64UrlEncode(digest);
}

export async function buildSpotifyAuthUrl({
  clientId,
  scopes,
  redirectPath,
}: {
  clientId: string;
  scopes: string;
  redirectPath: string;
}): Promise<string> {
  const webCrypto = getUsableWebCrypto();
  if (!webCrypto) {
    throw new Error(SPOTIFY_SECURE_CONTEXT_ERROR);
  }
  const verifier = randomString(webCrypto, 96);
  const state = `mpoints-${randomString(webCrypto, 32)}`;
  const challenge = await createCodeChallenge(webCrypto, verifier);
  const redirectUri = `${window.location.origin}${redirectPath}`;

  localStorage.setItem(SPOTIFY_VERIFIER_KEY, verifier);
  localStorage.setItem(SPOTIFY_STATE_KEY, state);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    state,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });
  return `${SPOTIFY_ACCOUNTS_URL}/authorize?${params.toString()}`;
}

export async function exchangeSpotifyCodeForTokens({
  code,
  clientId,
  redirectPath,
}: {
  code: string;
  clientId: string;
  redirectPath: string;
}): Promise<SpotifyTokenState> {
  const verifier = localStorage.getItem(SPOTIFY_VERIFIER_KEY) || "";
  const redirectUri = `${window.location.origin}${redirectPath}`;
  const response = await fetch(`${SPOTIFY_ACCOUNTS_URL}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: verifier,
    }),
  });
  if (!response.ok) {
    throw new Error("spotify-token-exchange-failed");
  }
  const payload = await response.json() as { access_token: string; refresh_token?: string; expires_in: number };
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + Math.max(payload.expires_in - 60, 1) * 1000,
  };
}

export async function refreshSpotifyTokens(tokens: SpotifyTokenState, clientId: string): Promise<SpotifyTokenState> {
  if (!tokens.refreshToken) {
    throw new Error("spotify-refresh-token-missing");
  }
  const response = await fetch(`${SPOTIFY_ACCOUNTS_URL}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken,
      client_id: clientId,
    }),
  });
  if (!response.ok) {
    throw new Error("spotify-token-refresh-failed");
  }
  const payload = await response.json() as { access_token: string; refresh_token?: string; expires_in: number };
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || tokens.refreshToken,
    expiresAt: Date.now() + Math.max(payload.expires_in - 60, 1) * 1000,
  };
}

async function spotifyApiRequest<T>(
  accessToken: string,
  path: string,
  options: RequestInit = {},
): Promise<T | null> {
  const response = await fetch(`${SPOTIFY_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  if (response.status === 204) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`spotify-api-${response.status}`);
  }
  return await response.json() as T;
}

export function createSpotifyApi(getAccessToken: () => Promise<string>) {
  const withToken = async <T>(path: string, options?: RequestInit) => spotifyApiRequest<T>(await getAccessToken(), path, options);

  return {
    getPlaybackState: () => withToken<SpotifyPlaybackState>("/me/player"),
    getDevices: async () => {
      const payload = await withToken<{ devices?: SpotifyDevice[] }>("/me/player/devices");
      return payload?.devices || [];
    },
    getQueue: () => withToken<SpotifyQueueState>("/me/player/queue"),
    transferPlayback: (deviceId: string, play = false) => withToken<null>("/me/player", {
      method: "PUT",
      body: JSON.stringify({ device_ids: [deviceId], play }),
    }),
    setVolume: (volumePercent: number, deviceId?: string | null) => {
      const params = new URLSearchParams({ volume_percent: String(Math.max(0, Math.min(100, volumePercent))) });
      if (deviceId) params.set("device_id", deviceId);
      return withToken<null>(`/me/player/volume?${params.toString()}`, { method: "PUT" });
    },
    setShuffle: (state: boolean, deviceId?: string | null) => {
      const params = new URLSearchParams({ state: String(state) });
      if (deviceId) params.set("device_id", deviceId);
      return withToken<null>(`/me/player/shuffle?${params.toString()}`, { method: "PUT" });
    },
    setRepeat: (state: "off" | "track" | "context", deviceId?: string | null) => {
      const params = new URLSearchParams({ state });
      if (deviceId) params.set("device_id", deviceId);
      return withToken<null>(`/me/player/repeat?${params.toString()}`, { method: "PUT" });
    },
  };
}
