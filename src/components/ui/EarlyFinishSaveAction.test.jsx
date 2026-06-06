import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EarlyFinishSaveAction from "./EarlyFinishSaveAction";

describe("EarlyFinishSaveAction", () => {
  const t = (key) => key;

  test("renders save button when canSave is true and isNaturalFinish", () => {
    render(<EarlyFinishSaveAction canSave={true} isNaturalFinish={true} onSave={() => {}} t={t} />);
    expect(screen.getByText("saveMatch")).toBeInTheDocument();
  });

  test("renders finish button when canSave is true and not natural finish", () => {
    render(<EarlyFinishSaveAction canSave={true} isNaturalFinish={false} onSave={() => {}} t={t} />);
    expect(screen.getByText("finishMatchNow")).toBeInTheDocument();
  });

  test("calls onSave directly when isNaturalFinish", () => {
    const onSave = vi.fn();
    render(<EarlyFinishSaveAction canSave={true} isNaturalFinish={true} onSave={onSave} t={t} />);
    fireEvent.click(screen.getByTestId("save-match"));
    expect(onSave).toHaveBeenCalled();
  });

  test("shows modal when not natural finish", () => {
    render(<EarlyFinishSaveAction canSave={true} isNaturalFinish={false} onSave={() => {}} t={t} />);
    fireEvent.click(screen.getByTestId("save-match"));
    expect(screen.getByTestId("early-finish-modal")).toBeInTheDocument();
  });

  test("returns null when canSave is false", () => {
    const { container } = render(<EarlyFinishSaveAction canSave={false} isNaturalFinish={false} onSave={() => {}} t={t} />);
    expect(container.innerHTML).toBe("");
  });
});
