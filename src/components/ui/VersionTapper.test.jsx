import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import VersionTapper from "./VersionTapper";

vi.mock("../../context/AppContext", () => ({
  useAppContext: () => ({
    t: (key) => ({
      themeToggleDark: "Dark mode",
      themeToggleLight: "Light mode",
      bjCpuTitle: "BLACKJACK",
      bjCpuSubtitle: "VS CPU · {n} DECKS",
      bjCpuChips: "CHIPS",
      bjCpuTabGame: "🎮 Game",
      bjCpuTabStats: "📊 Stats",
      bjCpuTabHistory: "📋 History",
      bjCpuYourBet: "Your bet",
      bjCpuClear: "Clear",
      bjCpuRepeat: "Repeat",
      bjCpuAllIn: "All in",
      bjCpuChooseBet: "Choose bet",
      bjCpuNoChips: "No chips",
      bjCpuRuleBj: "Blackjack pays 3:2",
      bjCpuRuleDealer: "Dealer hits soft 17",
      bjCpuRuleSplit: "Split pairs",
      bjCpuRuleDouble: "Double down",
      bjCpuRuleIns: "Insurance",
      bjCpuRuleDecks: "{n} decks",
    }[key] || key),
  }),
}));

describe("VersionTapper", () => {
  test("renders version", () => {
    render(<VersionTapper />);
    expect(screen.getByText(/v\d+\.\d+\.\d+/)).toBeInTheDocument();
  });

  test("shows hint after first tap", () => {
    render(<VersionTapper />);
    fireEvent.click(screen.getByText(/v\d+\.\d+\.\d+/));
    expect(screen.getByText(/\(6\.\.\.\)/)).toBeInTheDocument();
  });

  test("easter egg theme control dispatches the global theme mode event", () => {
    const events = [];
    const listener = (event) => events.push(event.detail);
    window.addEventListener("bgt:theme-mode-change", listener);
    document.documentElement.dataset.theme = "light";

    try {
      render(<VersionTapper />);
      const version = screen.getByText(/v\d+\.\d+\.\d+/);
      for (let i = 0; i < 7; i += 1) {
        fireEvent.click(version);
      }

      fireEvent.click(screen.getByTitle(/dark mode/i));

      expect(events).toEqual(["dark"]);
      expect(document.documentElement.dataset.theme).toBe("light");
    } finally {
      window.removeEventListener("bgt:theme-mode-change", listener);
      delete document.documentElement.dataset.theme;
    }
  });

  test("easter egg tabs do not duplicate translated emoji", () => {
    render(<VersionTapper />);
    const version = screen.getByText(/v\d+\.\d+\.\d+/);
    for (let i = 0; i < 7; i += 1) {
      fireEvent.click(version);
    }

    expect(screen.getByText("🎮 Game")).toBeInTheDocument();
    expect(screen.getByText("📊 Stats")).toBeInTheDocument();
    expect(screen.getByText("📋 History")).toBeInTheDocument();
    expect(screen.queryByText("🎮")).not.toBeInTheDocument();
    expect(screen.queryByText("📊")).not.toBeInTheDocument();
    expect(screen.queryByText("📋")).not.toBeInTheDocument();
  });
});
