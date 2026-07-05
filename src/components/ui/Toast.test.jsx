import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import Toast from "./Toast";

describe("Toast", () => {
  test("shows message when show is true", () => {
    render(<Toast msg="Hello" show={true} />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByTestId("toast-root")).toHaveClass("show");
  });

  test("hides message when show is false", () => {
    render(<Toast msg="Hello" show={false} />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByTestId("toast-root")).not.toHaveClass("show");
  });
});
