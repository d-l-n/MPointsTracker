import { describe, expect, test, vi } from "vitest";
import {
  INVITE_TTL_MS, buildInvitePayload, resolveInviteDoc,
  getInviteCodeFromUrl, clearInviteFromUrl,
  createInviteLinkWithStore,
} from "./inviteService.ts";

describe("buildInvitePayload", () => {
  const user = { uid: "abc", displayName: "TestUser", email: "a@b.com", photoURL: "pic.jpg" };

  test("creates payload with all fields", () => {
    const now = 1_000_000;
    const p = buildInvitePayload(user, now);
    expect(p.uid).toBe("abc");
    expect(p.displayName).toBe("TestUser");
    expect(p.photoURL).toBe("pic.jpg");
    expect(p.createdAt).toBe(now);
    expect(p.expiresAt).toBe(now + INVITE_TTL_MS);
  });

  test("derives displayName from email when missing", () => {
    const p = buildInvitePayload({ uid: "x", email: "alice@test.com" });
    expect(p.displayName).toBe("alice");
  });

  test("falls back to uid slice when both displayName and email missing", () => {
    const p = buildInvitePayload({ uid: "long-enough-uid" });
    expect(p.displayName).toBe("long-eno");
  });

  test("throws when uid is missing", () => {
    expect(() => buildInvitePayload({})).toThrow("missing-user");
    expect(() => buildInvitePayload(null)).toThrow("missing-user");
    expect(() => buildInvitePayload(undefined)).toThrow("missing-user");
  });
});

describe("resolveInviteDoc", () => {
  test("returns null for null/undefined data", () => {
    expect(resolveInviteDoc(null)).toBeNull();
    expect(resolveInviteDoc(undefined)).toBeNull();
  });

  test("returns null when required fields are missing", () => {
    expect(resolveInviteDoc({ uid: "x" })).toBeNull();
    expect(resolveInviteDoc({ uid: "x", displayName: "X" })).toBeNull();
  });

  test("returns null when expired", () => {
    expect(resolveInviteDoc(
      { uid: "x", displayName: "X", expiresAt: 100 }, 200,
    )).toBeNull();
  });

  test("returns parsed invite when valid", () => {
    const result = resolveInviteDoc(
      { uid: "x", displayName: "X", photoURL: "pic.jpg", expiresAt: 200 }, 100,
    );
    expect(result).toEqual({ uid: "x", displayName: "X", photoURL: "pic.jpg" });
  });

  test("handles missing photoURL", () => {
    const result = resolveInviteDoc(
      { uid: "x", displayName: "X", expiresAt: 200 }, 100,
    );
    expect(result.photoURL).toBeNull();
  });
});

describe("getInviteCodeFromUrl", () => {
  test("extracts invite param", () => {
    expect(getInviteCodeFromUrl("http://test.com?invite=abc123")).toBe("abc123");
  });

  test("returns null when no invite param", () => {
    expect(getInviteCodeFromUrl("http://test.com")).toBeNull();
  });

  test("returns null on malformed URL", () => {
    expect(getInviteCodeFromUrl(":::")).toBeNull();
  });
});

describe("clearInviteFromUrl", () => {
  test("does not throw for valid URL", () => {
    expect(() => clearInviteFromUrl("http://test.com?invite=abc")).not.toThrow();
  });
});

describe("createInviteLinkWithStore", () => {
  const mockUser = { uid: "uid1", displayName: "Alice", email: "alice@t.com", photoURL: null };

  test("deletes old invites and creates a new link", async () => {
    const listInvitesByUid = vi.fn().mockResolvedValue([{ code: "old1" }]);
    const deleteInviteByCode = vi.fn().mockResolvedValue(undefined);
    const writeInvite = vi.fn().mockResolvedValue(undefined);
    const generateCode = vi.fn().mockReturnValue("new123");

    const url = await createInviteLinkWithStore({
      user: mockUser, now: 1000,
      listInvitesByUid, deleteInviteByCode, writeInvite,
      generateCode, getBaseUrl: () => "http://test.com",
    });

    expect(listInvitesByUid).toHaveBeenCalledWith("uid1");
    expect(deleteInviteByCode).toHaveBeenCalledWith("old1");
    expect(writeInvite).toHaveBeenCalledWith("new123", expect.objectContaining({
      uid: "uid1", displayName: "Alice",
    }));
    expect(url).toBe("http://test.com/?invite=new123");
  });

  test("works with no existing invites", async () => {
    const listInvitesByUid = vi.fn().mockResolvedValue([]);
    const deleteInviteByCode = vi.fn();
    const writeInvite = vi.fn().mockResolvedValue(undefined);

    const url = await createInviteLinkWithStore({
      user: mockUser, now: 1000,
      listInvitesByUid, deleteInviteByCode, writeInvite,
      generateCode: () => "abc",
      getBaseUrl: () => "http://test.com",
    });

    expect(deleteInviteByCode).not.toHaveBeenCalled();
    expect(url).toContain("invite=abc");
  });
});
