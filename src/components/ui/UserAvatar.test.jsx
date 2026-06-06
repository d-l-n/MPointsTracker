import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import UserAvatar from "./UserAvatar";

describe("UserAvatar", () => {
  test("renders placeholder with initials from displayName", () => {
    render(<UserAvatar user={{ displayName: "Alice Bob" }} />);
    expect(screen.getByText("AB")).toBeInTheDocument();
  });

  test("renders placeholder with initials from email", () => {
    render(<UserAvatar user={{ email: "alice@test.com" }} />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  test("renders placeholder with ? when no name or email", () => {
    render(<UserAvatar user={{}} />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  test("renders image when photoURL is provided", () => {
    render(<UserAvatar user={{ displayName: "Alice", photoURL: "alice.jpg" }} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "alice.jpg");
    expect(img).toHaveAttribute("alt", "Alice");
  });
});
