import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import OfflineBanner from "./OfflineBanner";

describe("OfflineBanner", () => {
  test("renders with default props", () => {
    render(<OfflineBanner />);
    expect(screen.getByTestId("offline-banner")).toBeInTheDocument();
    expect(screen.getByText("Sin conexion")).toBeInTheDocument();
  });

  test("renders in compact mode", () => {
    render(<OfflineBanner compact={true} />);
    expect(screen.getByTestId("offline-banner")).toBeInTheDocument();
  });
});
