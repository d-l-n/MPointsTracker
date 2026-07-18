import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FamilyVariantPicker from "./FamilyVariantPicker.tsx";

const t = (k) => k;

const card = {
  id: "uno-family",
  game: { id: "uno-family", name: "Familia UNO", tagline: "Elige", color: "#ff0000", type: "uno_classic", hiddenFromCatalog: false },
  heroFamily: "uno",
  identity: { key: "uno-family", glyph: "U", label: "UNO", tone: "arcade", accent: "#ff6b6b" },
  hasDraft: false,
  isRecent: false,
  badgeKey: "",
  metadata: "3",
  matchCount: 3,
  latestMatch: null,
  latestDate: null,
  sortDate: 0,
  playerCount: 0,
  actions: [],
  groupKey: "uno-family",
  isFamily: true,
  variants: [
    { id: "uno", name: "UNO", tagline: "500", color: "#E63946", accent: "#ff6b6b" },
    { id: "uno_flip", name: "UNO Flip", tagline: "500", color: "#7B2FBE", accent: "#b87cff" },
  ],
};

describe("FamilyVariantPicker", () => {
  test("renders variants and calls onSelect", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<FamilyVariantPicker card={card} t={t} onSelect={onSelect} onClose={onClose} />);
    expect(screen.getByTestId("uno-family-picker")).not.toBeNull();
    fireEvent.click(screen.getByTestId("uno-family-variant-uno_flip"));
    expect(onSelect).toHaveBeenCalledWith("uno_flip");
  });

  test("closes when tapping outside the sheet", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<FamilyVariantPicker card={card} t={t} onSelect={onSelect} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("uno-family-picker"));
    expect(onClose).toHaveBeenCalled();
  });

  test("shows in-progress badge for variants with a draft", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const cardWithDraft = {
      ...card,
      variants: [
        { ...card.variants[0], hasDraft: true },
        { ...card.variants[1], hasDraft: false },
      ],
    };
    render(<FamilyVariantPicker card={cardWithDraft} t={t} onSelect={onSelect} onClose={onClose} />);
    expect(screen.getByText("matchInProgress")).not.toBeNull();
  });
});
