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
    fireEvent.focus(screen.getByTestId("player-input"));
    expect(screen.getByRole("option", { name: "Alice" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Ana" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Bob" })).not.toBeInTheDocument();
  });

  test("selects suggestion on mousedown", () => {
    const onChange = vi.fn();
    render(<PlayerInput value="A" onChange={onChange} knownNames={["Alice", "Bob"]} />);
    fireEvent.focus(screen.getByTestId("player-input"));
    fireEvent.mouseDown(screen.getByRole("option", { name: "Alice" }));
    expect(onChange).toHaveBeenCalledWith("Alice");
  });
});
