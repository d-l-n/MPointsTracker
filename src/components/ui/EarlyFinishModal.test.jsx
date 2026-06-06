import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EarlyFinishModal from "./EarlyFinishModal";

describe("EarlyFinishModal", () => {
  const t = (key) => key;

  test("renders with players list", () => {
    render(<EarlyFinishModal players={["Alice", "Bob"]} onCancel={() => {}} onConfirm={() => {}} t={t} />);
    expect(screen.getByTestId("early-finish-modal")).toBeInTheDocument();
    expect(screen.getByText("finishMatchEarlyTitle")).toBeInTheDocument();
  });

  test("selecting no_winner and confirm passes null", () => {
    const onConfirm = vi.fn();
    render(<EarlyFinishModal players={["Alice"]} onCancel={() => {}} onConfirm={onConfirm} t={t} />);
    fireEvent.click(screen.getByTestId("early-finish-no-winner"));
    fireEvent.click(screen.getByTestId("early-finish-confirm"));
    expect(onConfirm).toHaveBeenCalledWith(null);
  });

  test("selecting manual winner and confirm passes player name", () => {
    const onConfirm = vi.fn();
    render(<EarlyFinishModal players={["Alice", "Bob"]} onCancel={() => {}} onConfirm={onConfirm} t={t} />);
    fireEvent.click(screen.getByTestId("early-finish-choose-winner"));
    fireEvent.click(screen.getByTestId("early-finish-player-alice"));
    fireEvent.click(screen.getByTestId("early-finish-confirm"));
    expect(onConfirm).toHaveBeenCalledWith("Alice");
  });

  test("confirm is disabled when no choice made", () => {
    render(<EarlyFinishModal players={["Alice"]} onCancel={() => {}} onConfirm={() => {}} t={t} />);
    expect(screen.getByTestId("early-finish-confirm")).toBeDisabled();
  });

  test("calls onCancel on overlay click", () => {
    const onCancel = vi.fn();
    render(<EarlyFinishModal players={["Alice"]} onCancel={onCancel} onConfirm={() => {}} t={t} />);
    fireEvent.click(screen.getByTestId("early-finish-modal"));
    expect(onCancel).toHaveBeenCalled();
  });
});
