import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import OfflineBanner from "./OfflineBanner";

const identity = (key) => key;

describe("OfflineBanner", () => {
  test("renders with default props", () => {
    render(<OfflineBanner t={identity} />);
    expect(screen.getByTestId("offline-banner")).toBeInTheDocument();
  });

  test("renders in compact mode", () => {
    render(<OfflineBanner compact={true} t={identity} />);
    expect(screen.getByTestId("offline-banner")).toBeInTheDocument();
  });
});
