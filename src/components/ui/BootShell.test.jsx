import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import BootShell from "./BootShell";

describe("BootShell", () => {
  test("renders splash stage with copy", () => {
    render(<BootShell stage="splash" copy="Welcome to MPoints Tracker" />);

    expect(screen.getByTestId("boot-shell")).toHaveAttribute("data-boot-stage", "splash");
    expect(screen.getByText("Welcome to MPoints Tracker")).toBeInTheDocument();
    expect(screen.getByText("MPOINTS")).toBeInTheDocument();
    expect(screen.getByText("TRACKER")).toBeInTheDocument();
  });

  test("renders loading stage without loadingLabel", () => {
    render(<BootShell stage="loading" copy="Loading data..." />);

    expect(screen.getByTestId("boot-shell")).toHaveAttribute("data-boot-stage", "loading");
    expect(screen.getByText("Loading data...")).toBeInTheDocument();
    expect(screen.queryByTestId("boot-loading-copy")).not.toBeInTheDocument();
  });

  test("renders loading stage with loadingLabel", () => {
    render(<BootShell stage="loading" copy="Loading data..." loadingLabel="Cargando datos" />);

    expect(screen.getByTestId("boot-loading-copy")).toHaveTextContent("Cargando datos");
  });

  test("renders 3 skeleton rows", () => {
    render(<BootShell stage="loading" copy="Loading" loadingLabel="loading" />);

    expect(screen.getAllByTestId("boot-skeleton-row")).toHaveLength(3);
  });

  test("applies splash CSS class for splash stage", () => {
    const { container } = render(<BootShell stage="splash" copy="hello" />);

    expect(container.firstChild).toHaveClass("boot-shell--splash");
  });

  test("applies loading CSS class for loading stage", () => {
    const { container } = render(<BootShell stage="loading" copy="hello" loadingLabel="x" />);

    expect(container.firstChild).toHaveClass("boot-shell--loading");
  });
});
