import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { usePendingInvite } from "./usePendingInvite";

vi.mock("../lib/inviteService", () => ({
  getInviteCodeFromUrl: vi.fn(() => "code-1"),
  clearInviteFromUrl: vi.fn(),
  resolveInvite: vi.fn(async () => ({ uid: "host-1", displayName: "Ana Host", photoURL: null })),
}));

import { getInviteCodeFromUrl, resolveInvite } from "../lib/inviteService";

const t = (key) => key;
const showToast = vi.fn();

describe("usePendingInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getInviteCodeFromUrl.mockReturnValue("code-1");
    resolveInvite.mockResolvedValue({ uid: "host-1", displayName: "Ana Host", photoURL: null });
  });

  test("resolves a valid invite into an open join prompt without a toast", async () => {
    const { result } = renderHook(() => usePendingInvite({ showToast, t }));

    await waitFor(() => expect(result.current.pendingInvite).not.toBeNull());

    expect(result.current.invitePromptOpen).toBe(true);
    expect(result.current.pendingInvite).toEqual({
      uid: "host-1",
      displayName: "Ana Host",
      photoURL: null,
    });
    expect(showToast).not.toHaveBeenCalled();
  });

  test("accept keeps the invite claimable and confirms via toast", async () => {
    const { result } = renderHook(() => usePendingInvite({ showToast, t }));
    await waitFor(() => expect(result.current.invitePromptOpen).toBe(true));

    act(() => result.current.acceptPendingInvite());

    expect(result.current.invitePromptOpen).toBe(false);
    // Invite survives so LinkedPlayerInput can claim it on next match form.
    expect(result.current.claimPendingInvite()).toEqual({
      uid: "host-1",
      displayName: "Ana Host",
      photoURL: null,
    });
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining("inviteJoinDone"));
  });

  test("decline discards the invite entirely", async () => {
    const { result } = renderHook(() => usePendingInvite({ showToast, t }));
    await waitFor(() => expect(result.current.invitePromptOpen).toBe(true));

    act(() => result.current.declinePendingInvite());

    expect(result.current.invitePromptOpen).toBe(false);
    expect(result.current.claimPendingInvite()).toBeNull();
    expect(showToast).not.toHaveBeenCalled();
  });

  test("shows expired toast when resolution fails", async () => {
    resolveInvite.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => usePendingInvite({ showToast, t }));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith("inviteExpiredOrInvalid"));
    expect(result.current.invitePromptOpen).toBe(false);
  });
});
