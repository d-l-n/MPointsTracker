import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TrucoNewMatch from "./TrucoNewMatch";

vi.mock("../auth/LinkedPlayerInput", () => ({
  default: ({ value, placeholder, onChange, "aria-label": ariaLabel }) => (
    <input data-testid="linked-player-input" value={value} placeholder={placeholder} aria-label={ariaLabel} onChange={onChange} />
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
  default: ({ title, onConfirm, onCancel }) => (
    <div data-testid="confirm-modal">
      <span>{title}</span>
      <button data-testid="confirm-yes" onClick={onConfirm}>Yes</button>
      <button data-testid="confirm-no" onClick={onCancel}>No</button>
    </div>
  ),
}));

const defaultProps = {
  onSave: vi.fn(),
  knownNames: [],
  linkedPlayers: [],
  onLinkedPlayersChange: vi.fn(),
  t: (k) => k,
  playerGroups: [],
  onSavePlayerGroups: vi.fn(),
};

describe("TrucoNewMatch", () => {
  test("renders setup step with mode selection and point limit", () => {
    render(<TrucoNewMatch {...defaultProps} />);
    expect(screen.getByText("mode")).toBeInTheDocument();
    expect(screen.getByText("pointLimit")).toBeInTheDocument();
    expect(screen.getByText("15 PTS")).toBeInTheDocument();
    expect(screen.getByText("30 PTS")).toBeInTheDocument();
  });

  test("defaults to teams mode with prefilled team names", () => {
    render(<TrucoNewMatch {...defaultProps} />);
    expect(screen.getByDisplayValue("teamUs")).toBeInTheDocument();
    expect(screen.getByDisplayValue("teamThem")).toBeInTheDocument();
  });

  test("start match button is enabled with default team names", () => {
    render(<TrucoNewMatch {...defaultProps} />);
    expect(screen.getByText("startMatch")).not.toBeDisabled();
  });

  test("allows toggling point limit from 15 to 30", () => {
    render(<TrucoNewMatch {...defaultProps} />);
    const pts30 = screen.getByText("30 PTS");
    fireEvent.click(pts30);
    expect(pts30).toHaveStyle({ fontFamily: "'Bebas Neue',sans-serif" });
  });

  test("switching to individual mode shows player inputs", () => {
    render(<TrucoNewMatch {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /individual/ }));
    expect(screen.getByTestId("group-picker")).toBeInTheDocument();
  });

  test("adds a player row in individual mode", () => {
    render(<TrucoNewMatch {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /individual/ }));
    const initialCount = screen.getAllByTestId("linked-player-input").length;
    fireEvent.click(screen.getByText("addPlayer"));
    expect(screen.getAllByTestId("linked-player-input").length).toBe(initialCount + 1);
  });
});
