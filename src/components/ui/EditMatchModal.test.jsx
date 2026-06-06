import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import EditMatchModal from "./EditMatchModal";

const t = (key) => {
  const labels = {
    editMatch: "Edit match",
    dateTime: "Date & time",
    playersAndScores: "Players & scores",
    namePlaceholder: "Name",
    winner: "Winner",
    noWinner: "No winner",
    dupPlayerWarning: "Duplicate names",
    matchNoteLabel: "Note",
    notePlaceholder: "Optional note...",
    cancel: "Cancel",
    saveChanges: "Save changes",
    whatStreak: "What streak?",
    penalty: "Penalty",
  };
  return labels[key] || key;
};

function baseMatch(overrides = {}) {
  return {
    id: "m1",
    _gid: "uno",
    date: "2026-05-20T12:00:00.000Z",
    players: [
      { name: "Ana", score: 10 },
      { name: "Bruno", score: 8 },
    ],
    winner: "Ana",
    ...overrides,
  };
}

describe("EditMatchModal", () => {
  test("renders title, inputs, and buttons", () => {
    render(<EditMatchModal match={baseMatch()} onSave={vi.fn()} onClose={vi.fn()} t={t} />);

    expect(screen.getByText("Edit match")).toBeInTheDocument();
    expect(screen.getByText("Save changes")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ana")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Bruno")).toBeInTheDocument();
  });

  test("calls onClose when overlay is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(<EditMatchModal match={baseMatch()} onSave={vi.fn()} onClose={onClose} t={t} />);

    const overlay = container.firstChild;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledOnce();
  });

  test("does not call onClose when inner box is clicked", () => {
    const onClose = vi.fn();
    render(<EditMatchModal match={baseMatch()} onSave={vi.fn()} onClose={onClose} t={t} />);

    fireEvent.click(screen.getByText("Edit match"));
    expect(onClose).not.toHaveBeenCalled();
  });

  test("calls onClose on cancel button", () => {
    const onClose = vi.fn();
    render(<EditMatchModal match={baseMatch()} onSave={vi.fn()} onClose={onClose} t={t} />);

    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  test("save button is disabled when no named players", () => {
    render(
      <EditMatchModal
        match={baseMatch({ players: [{ name: "", score: 10 }] })}
        onSave={vi.fn()}
        onClose={vi.fn()}
        t={t}
      />,
    );

    expect(screen.getByText("Save changes")).toBeDisabled();
  });

  test("save button is disabled when duplicate names exist", () => {
    render(
      <EditMatchModal
        match={baseMatch({ players: [{ name: "Ana", score: 5 }, { name: "ana", score: 10 }] })}
        onSave={vi.fn()}
        onClose={vi.fn()}
        t={t}
      />,
    );

    expect(screen.getByText("Save changes")).toBeDisabled();
  });

  test("shows duplicate warning when names differ only by case", () => {
    render(
      <EditMatchModal
        match={baseMatch({ players: [{ name: "Ana", score: 5 }, { name: "ana", score: 10 }] })}
        onSave={vi.fn()}
        onClose={vi.fn()}
        t={t}
      />,
    );

    expect(screen.getByText("Duplicate names")).toBeInTheDocument();
  });

  test("updates player name on input change", () => {
    render(<EditMatchModal match={baseMatch()} onSave={vi.fn()} onClose={vi.fn()} t={t} />);

    const nameInput = screen.getByDisplayValue("Ana");
    fireEvent.change(nameInput, { target: { value: "Anita" } });

    expect(screen.getByDisplayValue("Anita")).toBeInTheDocument();
  });

  test("updates player score on input change", () => {
    render(<EditMatchModal match={baseMatch()} onSave={vi.fn()} onClose={vi.fn()} t={t} />);

    const scoreInputs = screen.getAllByPlaceholderText("Pts");
    expect(scoreInputs).toHaveLength(2);

    fireEvent.change(scoreInputs[0], { target: { value: "15" } });
    expect(scoreInputs[0]).toHaveValue(15);
  });

  test("shows winner selection buttons for each named player", () => {
    render(<EditMatchModal match={baseMatch()} onSave={vi.fn()} onClose={vi.fn()} t={t} />);

    expect(screen.getByText("🏆 Ana")).toBeInTheDocument();
    expect(screen.getByText("🏆 Bruno")).toBeInTheDocument();
    expect(screen.getByText("— No winner")).toBeInTheDocument();
  });

  test("changing winner updates selection", () => {
    render(<EditMatchModal match={baseMatch()} onSave={vi.fn()} onClose={vi.fn()} t={t} />);

    fireEvent.click(screen.getByText("🏆 Bruno"));
    expect(screen.getByText("— No winner")).toBeInTheDocument();
  });

  test("calls onSave with parsed match data", () => {
    const onSave = vi.fn();
    render(<EditMatchModal match={baseMatch()} onSave={onSave} onClose={vi.fn()} t={t} />);

    fireEvent.click(screen.getByText("Save changes"));

    expect(onSave).toHaveBeenCalledOnce();
    const saved = onSave.mock.calls[0][0];
    expect(saved.id).toBe("m1");
    expect(saved.winner).toBe("Ana");
    expect(saved.players[0]).toEqual({ name: "Ana", score: 10 });
    expect(saved.players[1]).toEqual({ name: "Bruno", score: 8 });
    expect(saved.note).toBeUndefined();
  });

  test("calls onSave with updated date", () => {
    const onSave = vi.fn();
    render(<EditMatchModal match={baseMatch()} onSave={onSave} onClose={vi.fn()} t={t} />);

    fireEvent.change(screen.getByDisplayValue("2026-05-20T12:00"), {
      target: { value: "2026-06-01T15:30" },
    });
    fireEvent.click(screen.getByText("Save changes"));

    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave.mock.calls[0][0].date).toContain("2026-06-01");
  });

  test("shows racha fields when match has penalty", () => {
    render(
      <EditMatchModal
        match={baseMatch({ penalty: "some penalty", streakType: "win streak" })}
        onSave={vi.fn()}
        onClose={vi.fn()}
        t={t}
      />,
    );

    expect(screen.getByText("Penalty")).toBeInTheDocument();
    expect(screen.getByText("What streak?")).toBeInTheDocument();
  });

  test("does not show score inputs for racha matches", () => {
    render(
      <EditMatchModal
        match={baseMatch({ penalty: "bad day", streakType: "lose streak" })}
        onSave={vi.fn()}
        onClose={vi.fn()}
        t={t}
      />,
    );

    expect(screen.queryByPlaceholderText("Pts")).not.toBeInTheDocument();
  });

  test("updates note and shows character count near limit", () => {
    render(<EditMatchModal match={baseMatch()} onSave={vi.fn()} onClose={vi.fn()} t={t} />);

    const noteInput = screen.getByPlaceholderText("Optional note...");
    fireEvent.change(noteInput, { target: { value: "x".repeat(260) } });

    expect(screen.getByDisplayValue("x".repeat(260))).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
  });

  test("strips scores with undefined value from saved match", () => {
    const match = baseMatch({
      players: [
        { name: "Ana", score: undefined },
        { name: "Bruno", score: 8 },
      ],
    });
    const onSave = vi.fn();
    render(<EditMatchModal match={match} onSave={onSave} onClose={vi.fn()} t={t} />);

    fireEvent.click(screen.getByText("Save changes"));

    const saved = onSave.mock.calls[0][0];
    expect(saved.players[0]).toEqual({ name: "Ana" });
    expect(saved.players[1]).toEqual({ name: "Bruno", score: 8 });
  });
});
