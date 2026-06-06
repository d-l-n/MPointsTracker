import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PlayerInput from "./PlayerInput";

describe("PlayerInput", () => {
  test("renders input with value", () => {
    render(<PlayerInput value="Alice" onChange={() => {}} />);
    expect(screen.getByTestId("player-input")).toHaveValue("Alice");
  });

  test("calls onChange when typing", () => {
    const onChange = vi.fn();
    render(<PlayerInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByTestId("player-input"), { target: { value: "Bob" } });
    expect(onChange).toHaveBeenCalledWith("Bob");
  });

  test("shows suggestions when focused and typing", () => {
    render(<PlayerInput value="A" onChange={() => {}} knownNames={["Alice", "Bob", "Ana"]} />);
    const input = screen.getByTestId("player-input");
    fireEvent.focus(input);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  test("selects suggestion on mousedown", () => {
    const onChange = vi.fn();
    render(<PlayerInput value="A" onChange={onChange} knownNames={["Alice", "Bob"]} />);
    fireEvent.focus(screen.getByTestId("player-input"));
    fireEvent.mouseDown(screen.getByText("Alice"));
    expect(onChange).toHaveBeenCalledWith("Alice");
  });
});
