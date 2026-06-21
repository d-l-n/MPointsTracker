import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  SPOTIFY_TOKEN_KEY,
  exchangeSpotifyCodeForTokens,
  readSpotifyTokens,
  refreshSpotifyTokens,
} from "./spotifyClient";

describe("spotifyClient", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  test("ignores malformed token storage", () => {
    localStorage.setItem(SPOTIFY_TOKEN_KEY, JSON.stringify({
      accessToken: 123,
      expiresAt: "tomorrow",
    }));

    expect(readSpotifyTokens()).toBeNull();
  });

  test("rejects authorization-code token responses without a valid access token", async () => {
    localStorage.setItem("bgt_spotify_code_verifier", "verifier");
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        refresh_token: "refresh-token",
        expires_in: 3600,
      }),
    })));

    await expect(exchangeSpotifyCodeForTokens({
      code: "code",
      clientId: "client-id",
      redirectPath: "/settings",
    })).rejects.toThrow("spotify-token-exchange-invalid");
  });

  test("rejects refresh token responses without a valid expiration", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: "access-token",
      }),
    })));

    await expect(refreshSpotifyTokens({
      accessToken: "expired-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() - 1_000,
    }, "client-id")).rejects.toThrow("spotify-token-refresh-invalid");
  });
});
