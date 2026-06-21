import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import OfflineBanner from "./OfflineBanner";
import { setGlobalT } from "../../data/translations";

setGlobalT((key) => {
  const map = {
    offline: "Sin conexion",
    offlineBannerDesc: "Estás usando datos locales guardados. Los cambios volverán a sincronizarse al reconectar.",
  };
  return map[key] || key;
});

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
