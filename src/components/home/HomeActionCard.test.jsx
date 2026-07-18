import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HomeActionCard from "./HomeActionCard.tsx";

const t = (k) => k;

const familyCard = {
  id: "uno-family",
  game: { id: "uno-family", name: "Familia UNO", tagline: "Elige tu variante", color: "#ff0000", type: "uno_classic", hiddenFromCatalog: false },
  heroFamily: "uno",
  identity: { key: "uno-family", glyph: "U", label: "UNO", tone: "arcade", accent: "#ff6b6b" },
  hasDraft: false,
  isRecent: false,
  badgeKey: "",
  metadata: "3 matchesPlayed",
  matchCount: 3,
  latestMatch: null,
  latestDate: null,
  sortDate: 0,
  playerCount: 0,
  actions: [{ key: "new", label: "Nueva", emphasis: "primary" }],
  groupKey: "uno-family",
  isFamily: true,
  variants: [
    { id: "uno", name: "UNO", tagline: "500 pts", color: "#E63946", accent: "#ff6b6b" },
    { id: "uno_flip", name: "UNO Flip", tagline: "500 pts", color: "#7B2FBE", accent: "#b87cff" },
  ],
};

describe("HomeActionCard family", () => {
  test("clicking the surface opens the family picker", () => {
    const onOpenGame = vi.fn();
    const onQuickAction = vi.fn();
    const onPickFamily = vi.fn();
    render(
      <HomeActionCard
        card={familyCard}
        t={t}
        onOpenGame={onOpenGame}
        onQuickAction={onQuickAction}
        onPickFamily={onPickFamily}
      />,
    );

    fireEvent.click(screen.getByTestId("game-uno-family"));
    expect(onPickFamily).toHaveBeenCalledWith(familyCard);
    expect(onOpenGame).not.toHaveBeenCalled();
  });

  test("clicking Nueva partida opens the family picker", () => {
    const onOpenGame = vi.fn();
    const onQuickAction = vi.fn();
    const onPickFamily = vi.fn();
    render(
      <HomeActionCard
        card={familyCard}
        t={t}
        onOpenGame={onOpenGame}
        onQuickAction={onQuickAction}
        onPickFamily={onPickFamily}
      />,
    );

    fireEvent.click(screen.getByTestId("game-uno-family-action-new"));
    expect(onPickFamily).toHaveBeenCalledWith(familyCard);
  });
});
