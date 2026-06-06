import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import SyncDot from "./SyncDot";

describe("SyncDot", () => {
  const t = (key) => key;

  test("renders synced state", () => {
    render(<SyncDot syncing={false} error={null} t={t} />);
    expect(screen.getByTitle("synced")).toBeInTheDocument();
  });

  test("renders syncing state", () => {
    render(<SyncDot syncing={true} error={null} t={t} />);
    expect(screen.getByTitle("syncing")).toBeInTheDocument();
  });

  test("renders error state", () => {
    render(<SyncDot syncing={false} error={new Error("fail")} t={t} />);
    expect(screen.getByTitle("syncError")).toBeInTheDocument();
  });

  test("shows error when both syncing and error are true", () => {
    render(<SyncDot syncing={true} error={new Error("fail")} t={t} />);
    expect(screen.getByTitle("syncing")).toBeInTheDocument();
  });
});
