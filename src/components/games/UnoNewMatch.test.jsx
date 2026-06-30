import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UnoNewMatch from "./UnoNewMatch";

vi.mock("../auth/LinkedPlayerInput", () => ({
  default: ({ value, placeholder, onChange, "aria-label": ariaLabel }) => (
    <input data-testid="linked-player-input" value={value} placeholder={placeholder} aria-label={ariaLabel} onChange={(e) => onChange(e.target.value)} />
  ),
}));

vi.mock("../ui/GroupPicker", () => ({
  default: () => <div data-testid="group-picker" />,
}));

vi.mock("../ui/SaveGroupButton", () => ({
  default: () => <div data-testid="save-group-button" />,
}));

vi.mock("../ui/EarlyFinishSaveAction", () => ({
  default: ({ canSave, isNaturalFinish, eligiblePlayers, onSave, t, style }) => (
    <button data-testid="early-finish-save" disabled={!canSave} onClick={() => onSave("Player 1")}>Save</button>
  ),
}));

vi.mock("../ui/ConfirmModal", () => ({
  default: ({ title, msg, confirmLabel, cancelLabel, onConfirm, onCancel }) => (
    <div data-testid="confirm-modal">
      <span>{title}</span>
      <span>{msg}</span>
      <button data-testid="confirm-yes" onClick={onConfirm}>{confirmLabel}</button>
      <button data-testid="confirm-no" onClick={onCancel}>{cancelLabel}</button>
    </div>
  ),
}));

vi.mock("./MercyEliminator", () => ({
  default: () => <div data-testid="mercy-eliminator" />,
}));

const unoGame = {
  id: "uno",
  name: "UNO",
  emoji: "\u{1F0CF}",
  color: "#E63946",
  type: "uno_classic",
  winScore: 500,
};

const defaultProps = {
  game: unoGame,
  onSave: vi.fn(),
  knownNames: [],
  linkedPlayers: [],
  onLinkedPlayersChange: vi.fn(),
  t: (k) => k,
  playerGroups: [],
  onSavePlayerGroups: vi.fn(),
};

describe("UnoNewMatch", () => {
  test("renders setup with 2 empty player inputs and group picker", () => {
    render(<UnoNewMatch {...defaultProps} />);
    expect(screen.getByTestId("group-picker")).toBeInTheDocument();
    expect(screen.getAllByTestId("linked-player-input")).toHaveLength(2);
    expect(screen.getByTestId("add-player")).toBeInTheDocument();
    expect(screen.getByTestId("save-group-button")).toBeInTheDocument();
  });

  test("adds a player row up to 10", () => {
    render(<UnoNewMatch {...defaultProps} />);
    expect(screen.getAllByTestId("linked-player-input")).toHaveLength(2);
    fireEvent.click(screen.getByTestId("add-player"));
    expect(screen.getAllByTestId("linked-player-input")).toHaveLength(3);
  });

  test("shows scoreboard and legend when 2 players have names", () => {
    render(<UnoNewMatch {...defaultProps} />);
    const inputs = screen.getAllByTestId("linked-player-input");
    fireEvent.change(inputs[0], { target: { value: "Alice" } });
    fireEvent.change(inputs[1], { target: { value: "Bob" } });
    expect(screen.getByText((c) => c.startsWith("scoreboard"))).toBeInTheDocument();
    expect(screen.getByText((c) => c.startsWith("meta"))).toBeInTheDocument();
  });

  test("shows duplicate warning when players share a name", () => {
    render(<UnoNewMatch {...defaultProps} />);
    const inputs = screen.getAllByTestId("linked-player-input");
    fireEvent.change(inputs[0], { target: { value: "Alice" } });
    fireEvent.change(inputs[1], { target: { value: "Alice" } });
    expect(screen.getByText("dupPlayerWarning")).toBeInTheDocument();
  });

  test("renders early finish save action", () => {
    render(<UnoNewMatch {...defaultProps} />);
    expect(screen.getByTestId("early-finish-save")).toBeInTheDocument();
  });
});
