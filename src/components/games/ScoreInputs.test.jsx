import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { useState } from "react";

import ScoreInputQuickButtons from "./ScoreInputQuickButtons";
import ScoreInputStepper from "./ScoreInputStepper";
import ScoreInputText from "./ScoreInputText";

const labels = ["Alice", "Bob"];
const t = (key) => ({
  add: "Add",
  confirmHand: "Confirm hand",
  confirmRound: "Confirm round",
  hand: "Hand",
  ptsCanBeNegative: "Can be negative",
  roundLabel: "Round",
  score: "Score",
  subtract: "Subtract",
  undo: "Undo",
}[key] || key);

function QuickButtonsHarness({ commit = vi.fn(), undo = vi.fn() } = {}) {
  const [roundInputs, setRoundInputs] = useState(["", "10"]);
  return (
    <ScoreInputQuickButtons
      labels={labels}
      roundInputs={roundInputs}
      setRoundInputs={setRoundInputs}
      rounds={1}
      undo={undo}
      commit={commit}
      t={t}
      idPrefix="test"
      quickValues={[100, -50]}
    />
  );
}

function TextHarness({ commit = vi.fn() } = {}) {
  const [roundInputs, setRoundInputs] = useState(["", ""]);
  return (
    <ScoreInputText
      labels={labels}
      roundInputs={roundInputs}
      setRoundInputs={setRoundInputs}
      rounds={0}
      undo={vi.fn()}
      commit={commit}
      t={t}
      idPrefix="text"
    />
  );
}

function StepperHarness({ commit = vi.fn(), undo = vi.fn() } = {}) {
  const [adds, setAdds] = useState([0, 2]);
  return (
    <ScoreInputStepper
      labels={["Team A", "Team B"]}
      adds={adds}
      setAdds={setAdds}
      rounds={2}
      undo={undo}
      commit={commit}
      t={t}
    />
  );
}

describe("shared score input controls", () => {
  test("quick buttons fill the first empty score and then accumulate on the first score", () => {
    render(<QuickButtonsHarness />);

    fireEvent.click(screen.getByRole("button", { name: "+100" }));
    expect(screen.getByLabelText("Round Alice")).toHaveValue(100);
    expect(screen.getByLabelText("Round Bob")).toHaveValue(10);

    fireEvent.click(screen.getByRole("button", { name: "-50" }));
    expect(screen.getByLabelText("Round Alice")).toHaveValue(50);
  });

  test("text input updates the selected player score and confirms", () => {
    const commit = vi.fn();
    render(<TextHarness commit={commit} />);

    fireEvent.change(screen.getByLabelText("Round Bob"), { target: { value: "-25" } });
    expect(screen.getByLabelText("Round Bob")).toHaveValue(-25);

    fireEvent.click(screen.getByRole("button", { name: "Confirm round" }));
    expect(commit).toHaveBeenCalledOnce();
  });

  test("stepper changes only the selected team and never goes below zero", () => {
    render(<StepperHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Subtract Team A" }));
    expect(screen.getByTestId("team-adds-0")).toHaveTextContent("0");

    fireEvent.click(screen.getByRole("button", { name: "Add Team B" }));
    expect(screen.getByTestId("team-adds-0")).toHaveTextContent("0");
    expect(screen.getByTestId("team-adds-1")).toHaveTextContent("3");
  });

  test("stepper exposes undo after previous rounds and confirms the hand", () => {
    const undo = vi.fn();
    const commit = vi.fn();
    render(<StepperHarness undo={undo} commit={commit} />);

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm hand" }));

    expect(undo).toHaveBeenCalledOnce();
    expect(commit).toHaveBeenCalledOnce();
  });
});
