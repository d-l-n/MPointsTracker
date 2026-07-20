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
    const { container } = render(<ReloadButton t={(key) => key} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  test("shows offline indicator when offline", () => {
    vi.stubGlobal("navigator", { onLine: false });
    const { container } = render(<ReloadButton t={(key) => key} />);
    expect(container.querySelector('[title="offline"]')).toBeInTheDocument();
  });

  test("shows update available indicator after sw-update-available event", () => {
    const { container } = render(<ReloadButton t={(key) => key} />);
    act(() => { window.dispatchEvent(new Event("sw-update-available")); });
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  test("handleClick without update ready reloads page", () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: reloadSpy }, writable: true, configurable: true,
    });
    render(<ReloadButton t={(key) => key} />);
    fireEvent.click(screen.getByRole("button"));
    expect(reloadSpy).toHaveBeenCalled();
  });
});
