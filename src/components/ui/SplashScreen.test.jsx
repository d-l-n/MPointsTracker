import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi, afterEach } from "vitest";
import SplashScreen from "./SplashScreen";

describe("SplashScreen", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("renders the hybrid splash shell with branded skeleton placeholders", () => {
    render(<SplashScreen dark={false} onDone={() => {}} />);
    expect(screen.getByTestId("boot-shell")).toBeInTheDocument();
    expect(screen.getByTestId("boot-shell")).toHaveAttribute("data-boot-stage", "splash");
    expect(screen.getByText("MPOINTS")).toBeInTheDocument();
    expect(screen.getByText("TRACKER")).toBeInTheDocument();
    expect(screen.getAllByTestId("boot-skeleton-row")).toHaveLength(3);
  });

  test("applies dark-splash class when dark is true", () => {
    const { container } = render(<SplashScreen dark={true} onDone={() => {}} />);
    expect(container.querySelector(".splash")).toHaveClass("dark-splash");
  });

  test("applies light-splash class when dark is false", () => {
    const { container } = render(<SplashScreen dark={false} onDone={() => {}} />);
    expect(container.querySelector(".splash")).toHaveClass("light-splash");
  });

  test("calls onDone after timeout", () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(<SplashScreen dark={false} onDone={onDone} />);
    vi.advanceTimersByTime(2100);
    expect(onDone).toHaveBeenCalled();
  });
});
