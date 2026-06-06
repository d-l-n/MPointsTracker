import { test, expect } from "@playwright/test";
import {
  INVITE_TTL_MS,
  buildInvitePayload,
  createInviteLinkWithStore,
  resolveInviteDoc,
} from "../src/lib/inviteService.ts";

test.describe("invite service", () => {
  test("buildInvitePayload uses display name fallback and 24h expiry", () => {
    const now = 1_700_000_000_000;

    expect(
      buildInvitePayload(
        {
          uid: "user-1",
          email: "ana@test.dev",
          photoURL: null,
        },
        now
      )
    ).toEqual({
      uid: "user-1",
      displayName: "ana",
      photoURL: null,
      createdAt: now,
      expiresAt: now + INVITE_TTL_MS,
    });
  });

  test("resolveInviteDoc rejects expired docs and normalizes valid docs", () => {
    const now = 1_700_000_000_000;

    expect(
      resolveInviteDoc(
        {
          uid: "user-1",
          displayName: "Ana",
          photoURL: null,
          expiresAt: now - 1,
        },
        now
      )
    ).toBeNull();

    expect(
      resolveInviteDoc(
        {
          uid: "user-1",
          displayName: "Ana",
          photoURL: "https://img.test/ana.png",
          expiresAt: now + 10_000,
        },
        now
      )
    ).toEqual({
      uid: "user-1",
      displayName: "Ana",
      photoURL: "https://img.test/ana.png",
    });
  });

  test("createInviteLinkWithStore replaces the previous invite for the same user", async () => {
    const deleted = [];
    const written = [];

    const url = await createInviteLinkWithStore({
      user: { uid: "user-1", displayName: "Ana", photoURL: null },
      now: 1_700_000_000_000,
      listInvitesByUid: async () => [{ code: "old-code" }],
      deleteInviteByCode: async (code) => {
        deleted.push(code);
      },
      writeInvite: async (code, payload) => {
        written.push({ code, payload });
      },
      generateCode: () => "new-code",
      getBaseUrl: () => "https://mpoints.test/app?foo=1#hash",
    });

    expect(deleted).toEqual(["old-code"]);
    expect(written).toHaveLength(1);
    expect(written[0].code).toBe("new-code");
    expect(url).toBe("https://mpoints.test/app?foo=1&invite=new-code");
  });
});
