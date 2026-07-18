import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";

import ShareResultButton, {
  resolveShareTheme,
  buildShareResultText,
  generateResultImage,
} from "./ShareResultCard";

const t = (key) => key;

describe("resolveShareTheme", () => {
  test("returns dark palette by default", () => {
    const theme = resolveShareTheme();
    expect(theme.mode).toBe("dark");
    expect(theme.text).toBe("#ffffff");
  });

  test("returns light palette", () => {
    expect(resolveShareTheme("light").mode).toBe("light");
    expect(resolveShareTheme("light").text).toBe("#101426");
  });

  test("returns oled palette", () => {
    expect(resolveShareTheme("oled").mode).toBe("oled");
    expect(resolveShareTheme("oled").background.start).toBe("#010101");
  });

  test("unknown mode falls back to dark", () => {
    expect(resolveShareTheme("weird").mode).toBe("dark");
  });

  test("injects game color into glow", () => {
    expect(resolveShareTheme("dark", "#ABCDEF").glow).toContain("#ABCDEF");
  });
});

describe("buildShareResultText", () => {
  test("includes winner", () => {
    expect(buildShareResultText({ winner: "Ana" })).toContain("🏆 Ana");
  });

  test("empty when no winner and no roster", () => {
    expect(buildShareResultText({})).toBe("");
  });

  test("includes uno roster summary sorted by round", () => {
    const text = buildShareResultText({
      rosterEvents: [
        { type: "leave", playerName: "Beto", effectiveRound: 3 },
        { type: "join", playerName: "Ana", effectiveRound: 1 },
      ],
    });
    expect(text).toBe("+Ana R1 · -Beto R3");
  });

  test("joins winner and roster with newline", () => {
    const text = buildShareResultText({
      winner: "Ana",
      rosterEvents: [{ type: "join", playerName: "Ana", effectiveRound: 1 }],
    });
    expect(text).toBe("🏆 Ana\n+Ana R1");
  });
});

describe("generateResultImage", () => {
  test("returns null when canvas context unavailable", async () => {
    const spy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const blob = await generateResultImage({ winner: "Ana", players: [] }, null, "dark", t);
    expect(blob).toBeNull();
    spy.mockRestore();
  });
});

describe("ShareResultButton", () => {
  let clickSpy;

  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    global.URL.createObjectURL = vi.fn(() => "blob:x");
    global.URL.revokeObjectURL = vi.fn();
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete navigator.canShare;
    delete navigator.share;
  });

  test("renders share label", () => {
    render(<ShareResultButton match={{ winner: "Ana", players: [] }} t={t} />);
    expect(screen.getByText(/shareResult/)).toBeInTheDocument();
  });

  test("aborts gracefully when image blob is null", async () => {
    render(<ShareResultButton match={{ winner: "Ana", players: [] }} t={t} />);
    fireEvent.click(screen.getByText(/shareResult/));
    await waitFor(() => expect(screen.getByText(/shareResult/)).not.toBeDisabled());
    expect(clickSpy).not.toHaveBeenCalled();
  });

  test("falls back to download when native share unavailable", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      scale: vi.fn(), createLinearGradient: () => ({ addColorStop: vi.fn() }),
      createRadialGradient: () => ({ addColorStop: vi.fn() }), fillRect: vi.fn(),
      beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), arcTo: vi.fn(), closePath: vi.fn(),
      fill: vi.fn(), stroke: vi.fn(), fillText: vi.fn(), measureText: () => ({ width: 40 }),
      set fillStyle(_v) {}, set strokeStyle(_v) {}, set lineWidth(_v) {}, set font(_v) {},
      set textAlign(_v) {}, set textBaseline(_v) {},
    });
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((cb) => cb(new Blob(["x"])));
    render(<ShareResultButton match={{ winner: "Ana", players: [{ name: "Ana", score: 10 }] }} t={t} />);
    fireEvent.click(screen.getByText(/shareResult/));
    await waitFor(() => expect(clickSpy).toHaveBeenCalled());
  });
});

