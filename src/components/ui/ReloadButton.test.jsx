import { describe, expect, test, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import ReloadButton from "./ReloadButton";

describe("ReloadButton", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { onLine: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("renders reload icon when online and no update", () => {
    render(<ReloadButton t={(key) => key} />);
    expect(screen.getByText("↻")).toBeInTheDocument();
  });

  test("shows offline indicator when offline", () => {
    vi.stubGlobal("navigator", { onLine: false });
    render(<ReloadButton t={(key) => key} />);
    expect(screen.getByText("📶")).toBeInTheDocument();
  });

  test("shows update available indicator after sw-update-available event", () => {
    render(<ReloadButton t={(key) => key} />);
    act(() => { window.dispatchEvent(new Event("sw-update-available")); });
    expect(screen.getByText("↑")).toBeInTheDocument();
  });

  test("handleClick without update ready reloads page", () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: reloadSpy }, writable: true, configurable: true,
    });
    render(<ReloadButton t={(key) => key} />);
    fireEvent.click(screen.getByText("↻"));
    expect(reloadSpy).toHaveBeenCalled();
  });
});
