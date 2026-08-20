import { describe, expect, test } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UserAvatar from "./UserAvatar";

describe("UserAvatar", () => {
  test("renders image when photoURL is provided", () => {
    render(<UserAvatar user={{ displayName: "Alice", photoURL: "alice.jpg" }} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "alice.jpg");
    expect(img).toHaveAttribute("alt", "Alice");
  });

  test("renders Blobatar img when no photoURL but email is available", () => {
    const { container } = render(<UserAvatar user={{ email: "alice@test.com" }} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img.getAttribute("src")).toMatch(/^data:image\/svg\+xml,/);
  });

  test("renders Blobatar img when no photoURL but displayName is available", () => {
    const { container } = render(<UserAvatar user={{ displayName: "Alice" }} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img.getAttribute("src")).toMatch(/^data:image\/svg\+xml,/);
  });

  test("falls back to initials placeholder when Blobatar fails", () => {
    const { container } = render(<UserAvatar user={{ email: "alice@test.com" }} />);
    const img = container.querySelector("img");
    fireEvent.error(img);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  test("falls back to initials placeholder when Blobatar fails with no email", () => {
    const { container } = render(<UserAvatar user={{ displayName: "Alice Bob" }} />);
    const img = container.querySelector("img");
    fireEvent.error(img);
    expect(screen.getByText("AB")).toBeInTheDocument();
  });

  test("renders placeholder with ? when no name or email", () => {
    render(<UserAvatar user={{}} />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  test("falls back to initials when photoURL fails and no identifier for Blobatar", () => {
    const { container } = render(<UserAvatar user={{ photoURL: "bad.jpg" }} />);
    const img = container.querySelector("img");
    fireEvent.error(img);
    expect(screen.getByText("?")).toBeInTheDocument();
  });
});
