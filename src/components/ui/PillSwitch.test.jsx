import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PillSwitch from "./PillSwitch";

describe("PillSwitch", () => {
  test("renders with correct aria-checked state", () => {
    const { rerender } = render(<PillSwitch enabled={false} onToggle={() => {}} ariaLabel="Toggle" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    rerender(<PillSwitch enabled={true} onToggle={() => {}} ariaLabel="Toggle" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  test("calls onToggle with inverted value on click", () => {
    const onToggle = vi.fn();
    render(<PillSwitch enabled={false} onToggle={onToggle} ariaLabel="Toggle" />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  test("accepts data-testid", () => {
    render(<PillSwitch enabled={false} onToggle={() => {}} ariaLabel="Toggle" testId="my-switch" />);
    expect(screen.getByTestId("my-switch")).toBeInTheDocument();
  });
});
