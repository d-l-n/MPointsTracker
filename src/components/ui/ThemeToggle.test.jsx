import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ThemeToggle from "./ThemeToggle";

describe("ThemeToggle", () => {
  test("renders moon icon when dark mode", () => {
    const { container } = render(<ThemeToggle dark={true} onChange={() => {}} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  test("renders sun icon when light mode", () => {
    const { container } = render(<ThemeToggle dark={false} onChange={() => {}} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  test("calls onChange on click", () => {
    const onChange = vi.fn();
    render(<ThemeToggle dark={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onChange).toHaveBeenCalled();
  });

  test("calls onLongPress on long press", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const onChange = vi.fn();
    render(<ThemeToggle dark={false} onChange={onChange} onLongPress={onLongPress} />);
    fireEvent.pointerDown(screen.getByRole("button"));
    vi.advanceTimersByTime(700);
    expect(onLongPress).toHaveBeenCalled();
    vi.useRealTimers();
  });

  test("does not call onChange after long press", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const onChange = vi.fn();
    render(<ThemeToggle dark={false} onChange={onChange} onLongPress={onLongPress} />);
    fireEvent.pointerDown(screen.getByRole("button"));
    vi.advanceTimersByTime(700);
    fireEvent.pointerUp(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button"));
    expect(onChange).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  test("cancels long press on pointer leave", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    render(<ThemeToggle dark={false} onChange={() => {}} onLongPress={onLongPress} />);
    fireEvent.pointerDown(screen.getByRole("button"));
    fireEvent.pointerLeave(screen.getByRole("button"));
    vi.advanceTimersByTime(700);
    expect(onLongPress).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
