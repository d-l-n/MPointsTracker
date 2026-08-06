import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CanastaNewMatch from "./CanastaNewMatch";
import BurakoNewMatch from "./BurakoNewMatch";

vi.mock("../auth/LinkedPlayerInput", () => ({
  default: ({ value, placeholder, onChange, "aria-label": ariaLabel }) => (
    <input
      data-testid="linked-player-input"
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock("../ui/GroupPicker", () => ({
  default: () => <div data-testid="group-picker" />,
}));

vi.mock("../ui/SaveGroupButton", () => ({
  default: () => <div data-testid="save-group-button" />,
}));

vi.mock("../ui/EarlyFinishSaveAction", () => ({
  default: ({ canSave, onSave }) => (
    <button data-testid="early-finish-save" disabled={!canSave} onClick={() => onSave("Player 1")}>Save</button>
  ),
}));

vi.mock("../ui/ConfirmModal", () => ({
  default: ({ title, msg, confirmLabel, onConfirm, onCancel }) => (
    <div data-testid="confirm-modal">
      <span>{title}</span>
      <span>{msg}</span>
      <button data-testid="confirm-yes" onClick={onConfirm}>{confirmLabel}</button>
      <button data-testid="confirm-no" onClick={onCancel}>cancel</button>
    </div>
  ),
}));

vi.mock("../ui/Tooltip", () => ({
  default: ({ children }) => <span data-testid="tooltip">{children}</span>,
}));

const defaultProps = {
  onSave: vi.fn(),
  knownNames: [],
  linkedPlayers: [],
  onLinkedPlayersChange: vi.fn(),
  t: (k) => k,
  playerGroups: [],
  onSavePlayerGroups: vi.fn(),
  draft: null,
  onDraftChange: vi.fn(),
};

function startIndividualMatch(name, count) {
  fireEvent.click(screen.getByRole("button", { name: /individual/ }));
  while (screen.getAllByTestId("linked-player-input").length < count) {
    fireEvent.click(screen.getByText("addPlayer"));
  }
  const inputs = screen.getAllByTestId("linked-player-input");
  for (let i = 0; i < count; i += 1) {
    fireEvent.change(inputs[i], { target: { value: `Player ${i + 1}` } });
  }
  fireEvent.click(screen.getByText("startMatch"));
}

describe("CanastaNewMatch with more than 2 players (issue #31)", () => {
  test("individual mode with 3 players starts without crashing and renders 3 score cards", () => {
    render(<CanastaNewMatch {...defaultProps} />);
    startIndividualMatch("canasta", 3);

    // Regression for "Cannot read properties of undefined (reading 'toLocaleString')"
    expect(screen.getByTestId("team-score-0")).toHaveTextContent("0");
    expect(screen.getByTestId("team-score-1")).toHaveTextContent("0");
    expect(screen.getByTestId("team-score-2")).toHaveTextContent("0");
  });

  test("individual mode with 4 players commits a round and saves all four scores", () => {
    const onSave = vi.fn();
    render(<CanastaNewMatch {...defaultProps} onSave={onSave} />);
    startIndividualMatch("canasta", 4);

    fireEvent.change(screen.getByLabelText(/Player 3/), { target: { value: "120" } });
    fireEvent.change(screen.getByLabelText(/Player 4/), { target: { value: "40" } });
    fireEvent.click(screen.getByText("confirmRound"));

    expect(screen.getByTestId("team-score-0")).toHaveTextContent("0");
    expect(screen.getByTestId("team-score-1")).toHaveTextContent("0");
    expect(screen.getByTestId("team-score-2")).toHaveTextContent("120");
    expect(screen.getByTestId("team-score-3")).toHaveTextContent("40");

    fireEvent.click(screen.getByTestId("early-finish-save"));
    const match = onSave.mock.calls[0][0];
    expect(match.players.map((p) => p.name)).toEqual(["Player 1", "Player 2", "Player 3", "Player 4"]);
    expect(match.players.map((p) => p.score)).toEqual([0, 0, 120, 40]);
  });

  test("undo subtracts from the correct player when more than 2 play", () => {
    render(<CanastaNewMatch {...defaultProps} />);
    startIndividualMatch("canasta", 3);

    fireEvent.change(screen.getByLabelText(/Player 3/), { target: { value: "100" } });
    fireEvent.click(screen.getByText("confirmRound"));
    expect(screen.getByTestId("team-score-2")).toHaveTextContent("100");

    fireEvent.click(screen.getByText("undo"));
    expect(screen.getByTestId("team-score-2")).toHaveTextContent("0");
  });

  test("legacy 2-slot draft with 4 players renders padded without crashing", () => {
    const draft = {
      step: "playing",
      mode: "individual",
      limit: 5000,
      players: [
        { id: "1", name: "Ana" },
        { id: "2", name: "Beto" },
        { id: "3", name: "Carla" },
        { id: "4", name: "Diego" },
      ],
      scores: [1000, 500],
      rounds: 1,
      hist: [[100, 50]],
      over: false,
      wi: null,
    };
    render(<CanastaNewMatch {...defaultProps} draft={draft} />);

    expect(screen.getByTestId("team-score-0")).toHaveTextContent(/1[.,]000/);
    expect(screen.getByTestId("team-score-1")).toHaveTextContent("500");
    expect(screen.getByTestId("team-score-2")).toHaveTextContent("0");
    expect(screen.getByTestId("team-score-3")).toHaveTextContent("0");

    // Undo against a legacy 2-slot hist entry subtracts only from the first two slots
    fireEvent.click(screen.getByText("undo"));
    expect(screen.getByTestId("team-score-0")).toHaveTextContent("900");
    expect(screen.getByTestId("team-score-1")).toHaveTextContent("450");
    expect(screen.getByTestId("team-score-2")).toHaveTextContent("0");
  });

  test("teams mode still works with exactly 2 slots", () => {
    const onSave = vi.fn();
    render(<CanastaNewMatch {...defaultProps} onSave={onSave} />);
    fireEvent.click(screen.getByText("startMatch"));

    fireEvent.change(screen.getByLabelText(/teamUs/), { target: { value: "150" } });
    fireEvent.click(screen.getByText("confirmRound"));

    expect(screen.getByTestId("team-score-0")).toHaveTextContent("150");
    expect(screen.getByTestId("team-score-1")).toHaveTextContent("0");
  });
});

describe("BurakoNewMatch with more than 2 players (issue #31)", () => {
  test("individual mode with 3 players starts and scores without crashing", () => {
    const onSave = vi.fn();
    render(<BurakoNewMatch {...defaultProps} onSave={onSave} />);
    startIndividualMatch("burako", 3);

    expect(screen.getByTestId("team-score-2")).toHaveTextContent("0");

    fireEvent.change(screen.getByLabelText(/Player 3/), { target: { value: "75" } });
    fireEvent.click(screen.getByText("confirmRound"));

    expect(screen.getByTestId("team-score-2")).toHaveTextContent("75");

    fireEvent.click(screen.getByTestId("early-finish-save"));
    const match = onSave.mock.calls[0][0];
    expect(match.players.map((p) => p.score)).toEqual([0, 0, 75]);
  });
});
