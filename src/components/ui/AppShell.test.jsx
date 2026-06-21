import { describe, expect, test } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AppShell from "./AppShell";

describe("AppShell", () => {
  test("renders children", () => {
    render(
      <AppShell dark={false} toast={{ msg: "", show: false }}>
        <div data-testid="child">Hello</div>
      </AppShell>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  test("applies dark class when dark is true", () => {
    const { container } = render(
      <AppShell dark={true} toast={{ msg: "", show: false }}>
        <div>content</div>
      </AppShell>,
    );
    expect(container.querySelector(".app")).toHaveClass("dark");
  });

  test("applies light class when dark is false", () => {
    const { container } = render(
      <AppShell dark={false} toast={{ msg: "", show: false }}>
        <div>content</div>
      </AppShell>,
    );
    expect(container.querySelector(".app")).toHaveClass("light");
  });

  test("renders Toast with message", () => {
    render(
      <AppShell dark={false} toast={{ msg: "Error!", show: true }}>
        <div>content</div>
      </AppShell>,
    );
    expect(screen.getByText("Error!")).toBeInTheDocument();
  });

  test("renders a development indicator on localhost", () => {
    render(
      <AppShell dark={false} toast={{ msg: "", show: false }}>
        <div>content</div>
      </AppShell>,
    );

    expect(screen.getByTestId("dev-environment-indicator")).toHaveTextContent("DEV");
  });

  test("recognizes only local hosts as development hosts", async () => {
    const { isLocalDevelopmentHost } = await import("./AppShell");

    expect(isLocalDevelopmentHost("localhost")).toBe(true);
    expect(isLocalDevelopmentHost("127.0.0.1")).toBe(true);
    expect(isLocalDevelopmentHost("::1")).toBe(true);
    expect(isLocalDevelopmentHost("mpoints-tracker.pages.dev")).toBe(false);
  });

  test("forwards wheel events outside content to scroll", () => {
    const { container } = render(
      <AppShell dark={false} toast={{ msg: "", show: false }}>
        <div>content</div>
      </AppShell>,
    );
    const app = container.querySelector(".app");
    fireEvent.wheel(app, { deltaY: 100 });
  });
});
