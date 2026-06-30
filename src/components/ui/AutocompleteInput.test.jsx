import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AutocompleteInput from "./AutocompleteInput";

describe("AutocompleteInput", () => {
  test("renders with value", () => {
    render(<AutocompleteInput value="test" onChange={() => {}} />);
    expect(screen.getByRole("combobox")).toHaveValue("test");
  });

  test("calls onChange when typing", () => {
    const onChange = vi.fn();
    render(<AutocompleteInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "hello" } });
    expect(onChange).toHaveBeenCalledWith("hello");
  });

  test("renders datalist with matching suggestions", () => {
    render(<AutocompleteInput value="a" onChange={() => {}} suggestions={["Alice", "Bob", "Ana"]} />);
    const input = screen.getByRole("combobox");
    const listId = input.getAttribute("list");
    expect(listId).toBeTruthy();

    const datalist = document.getElementById(listId);
    expect(datalist).toBeInTheDocument();
    expect(datalist).toContainHTML("<option value=\"Alice\"></option>");
    expect(datalist).toContainHTML("<option value=\"Ana\"></option>");
    expect(datalist).not.toContainHTML("<option value=\"Bob\"></option>");
  });

  test("does not render datalist when there are no matching suggestions", () => {
    render(<AutocompleteInput value="xyz" onChange={() => {}} suggestions={["Alice", "Bob"]} />);
    const input = screen.getByRole("combobox");
    const listId = input.getAttribute("list");
    expect(listId).toBeTruthy();

    const datalist = document.getElementById(listId);
    expect(datalist).toBeInTheDocument();
    expect(datalist?.querySelectorAll("option")).toHaveLength(0);
  });

  test("renders label when provided", () => {
    render(<AutocompleteInput value="" onChange={() => {}} label="Name" id="name-input" />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("id", "name-input");
  });
});
