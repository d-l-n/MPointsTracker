import { describe, expect, test, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import DiscardMatchButton from "./DiscardMatchButton";
import DiscardPreferenceSection from "../settings/DiscardPreferenceSection";
import { readDiscardGoesHome, writeDiscardGoesHome } from "../../lib/discardPreference";

const t = (key) => ({
  abandonMatchBtn: "Abandonar partida",
  abandonMatch: "¿Abandonar partida?",
  abandon: "Abandonar",
  cancel: "Cancelar",
  discardMatchMsg: "Se descartará la partida en curso.",
  discardMatchSection: "Descartar partida",
  discardGoesHome: "Volver al inicio al descartar",
  discardGoesHomeDesc: "Descripción",
}[key] || key);

describe("discard preference helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("defaults to false and persists writes", () => {
    expect(readDiscardGoesHome()).toBe(false);
    writeDiscardGoesHome(true);
    expect(readDiscardGoesHome()).toBe(true);
    writeDiscardGoesHome(false);
    expect(readDiscardGoesHome()).toBe(false);
  });
});

describe("DiscardMatchButton", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("confirm triggers onDiscard and does not navigate home by default", () => {
    const onDiscard = vi.fn();
    const onBack = vi.fn();
    render(<DiscardMatchButton t={t} onDiscard={onDiscard} onBack={onBack} />);

    fireEvent.click(screen.getByText("Abandonar partida"));
    fireEvent.click(screen.getByText("Abandonar"));

    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(onBack).not.toHaveBeenCalled();
  });

  test("navigates home after discarding when the preference is enabled", () => {
    writeDiscardGoesHome(true);
    const onDiscard = vi.fn();
    const onBack = vi.fn();
    render(<DiscardMatchButton t={t} onDiscard={onDiscard} onBack={onBack} />);

    fireEvent.click(screen.getByText("Abandonar partida"));
    fireEvent.click(screen.getByText("Abandonar"));

    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  test("cancel does not discard", () => {
    const onDiscard = vi.fn();
    render(<DiscardMatchButton t={t} onDiscard={onDiscard} />);

    fireEvent.click(screen.getByText("Abandonar partida"));
    fireEvent.click(screen.getByText("Cancelar"));

    expect(onDiscard).not.toHaveBeenCalled();
  });
});

describe("DiscardPreferenceSection", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("toggling persists the preference", () => {
    render(<DiscardPreferenceSection t={t} />);
    expect(readDiscardGoesHome()).toBe(false);

    fireEvent.click(screen.getByTestId("discard-preference-toggle"));
    expect(readDiscardGoesHome()).toBe(true);
  });
});
