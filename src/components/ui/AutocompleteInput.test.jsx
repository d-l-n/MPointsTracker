import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AutocompleteInput from "./AutocompleteInput";

describe("AutocompleteInput", () => {
  test("renders with value", () => {
    render(<AutocompleteInput value="test" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("test");
  });

  test("calls onChange when typing", () => {
    const onChange = vi.fn();
    render(<AutocompleteInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "hello" } });
    expect(onChange).toHaveBeenCalledWith("hello");
  });

  test("shows filtered suggestions", () => {
    render(<AutocompleteInput value="a" onChange={() => {}} suggestions={["Alice", "Bob", "Ana"]} />);
    fireEvent.focus(screen.getByRole("textbox"));
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  test("selects suggestion on mousedown", () => {
    const onChange = vi.fn();
    render(<AutocompleteInput value="a" onChange={onChange} suggestions={["Alice", "Bob"]} />);
    fireEvent.focus(screen.getByRole("textbox"));
    fireEvent.mouseDown(screen.getByText("Alice"));
    expect(onChange).toHaveBeenCalledWith("Alice");
  });
});
