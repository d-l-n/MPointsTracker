import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../auth/LinkedPlayerInput", () => ({
  default: ({ onChange, ...rest }) => (
    <input data-testid="linked-player-input" {...rest} onChange={(e) => onChange(e.target.value)} />
  ),
}));

vi.mock("../ui/GroupPicker", () => ({
  default: () => <div data-testid="group-picker" />,
}));

vi.mock("../ui/SaveGroupButton", () => ({
  default: () => <div data-testid="save-group-button" />,
}));

vi.mock("../ui/EarlyFinishSaveAction", () => ({
  default: ({ onSave }) => (
    <button data-testid="early-finish-save" aria-label="save" onClick={() => onSave("Player 1")}>Save</button>
  ),
}));

vi.mock("../ui/ConfirmModal", () => ({
  default: ({ title, msg, confirmLabel, onConfirm, onCancel }) => (
    <div data-testid="confirm-modal">
      <span>{title}</span>
      <span>{msg}</span>
      <button aria-label="confirm" onClick={onConfirm}>{confirmLabel}</button>
      <button aria-label="cancel" onClick={onCancel}>cancel</button>
    </div>
  ),
}));

vi.mock("../ui/AutocompleteInput", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input data-testid="autocomplete-input" aria-label="autocomplete" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  ),
}));

vi.mock("../ui/Dropdown", () => ({
  default: () => <div data-testid="dropdown" />,
}));

vi.mock("../ui/PillSwitch", () => ({
  default: () => <div data-testid="pill-switch" />,
}));

vi.mock("../ui/Tooltip", () => ({
  default: ({ children }) => <span data-testid="tooltip">{children}</span>,
}));

vi.mock("./MercyEliminator", () => ({
  default: () => <div data-testid="mercy-eliminator" />,
}));

import GenericNewMatch from "./GenericNewMatch";
import BlackjackNewMatch from "./BlackjackNewMatch";
import ChinNewMatch from "./ChinNewMatch";
import RachaPerdidaNewMatch from "./RachaPerdidaNewMatch";
import AjedrezNewMatch from "./AjedrezNewMatch";
import PorcionNewMatch from "./PorcionNewMatch";
import PokerNewMatch from "./PokerNewMatch";
import GeneralaNewMatch from "./GeneralaNewMatch";
import BurakoNewMatch from "./BurakoNewMatch";
import CanastaNewMatch from "./CanastaNewMatch";
import ChanchoNewMatch from "./ChanchoNewMatch";
import EsquinadosNewMatch from "./EsquinadosNewMatch";
import CustomNewMatch from "./CustomNewMatch";
import SushiDoNewMatch from "./SushiDoNewMatch";

const game = {
  id: "generic",
  name: "Generic",
  emoji: "🎲",
  color: "#006D77",
  type: "score",
  winScore: 100,
};

const baseProps = {
  game,
  onSave: vi.fn(),
  knownNames: [],
  linkedPlayers: [],
  onLinkedPlayersChange: vi.fn(),
  playerGroups: [],
  onSavePlayerGroups: vi.fn(),
  draft: null,
  onDraftChange: vi.fn(),
  matches: [],
  t: (k) => k,
};

const forms = [
  ["GenericNewMatch", GenericNewMatch],
  ["BlackjackNewMatch", BlackjackNewMatch],
  ["ChinNewMatch", ChinNewMatch],
  ["RachaPerdidaNewMatch", RachaPerdidaNewMatch],
  ["AjedrezNewMatch", AjedrezNewMatch],
  ["PorcionNewMatch", PorcionNewMatch],
  ["PokerNewMatch", PokerNewMatch],
  ["GeneralaNewMatch", GeneralaNewMatch],
  ["BurakoNewMatch", BurakoNewMatch],
  ["CanastaNewMatch", CanastaNewMatch],
  ["ChanchoNewMatch", ChanchoNewMatch],
  ["EsquinadosNewMatch", EsquinadosNewMatch],
  ["CustomNewMatch", CustomNewMatch],
  ["SushiDoNewMatch", SushiDoNewMatch],
];

describe("game match forms smoke tests", () => {
  test.each(forms)("%s renders without crashing", (_name, Form) => {
    const { container } = render(<Form {...baseProps} />);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  test("GenericNewMatch adds a player row", () => {
    render(<GenericNewMatch {...baseProps} />);
    expect(screen.getAllByTestId("linked-player-input").length).toBeGreaterThanOrEqual(2);
    fireEvent.click(screen.getByText("addPlayer"));
    const countAfter = screen.getAllByTestId("linked-player-input").length;
    expect(countAfter).toBeGreaterThanOrEqual(3);
  });

  test("GenericNewMatch fills players and shows scoreboard", () => {
    render(<GenericNewMatch {...baseProps} />);
    const inputs = screen.getAllByTestId("linked-player-input");
    fireEvent.change(inputs[0], { target: { value: "Alice" } });
    fireEvent.change(inputs[1], { target: { value: "Bob" } });
    expect(screen.getByText((c) => c.startsWith("metaHeader"))).toBeInTheDocument();
  });
});
