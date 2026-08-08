import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ThemeSection, { THEME_ACCENT_SWATCHES } from "./ThemeSection";

function renderThemeSection(overrides = {}) {
  const props = {
    dark: false,
    themeMode: "light",
    onThemeMode: vi.fn(),
    themeAccentMode: "default",
    onThemeAccentMode: vi.fn(),
    themeCustomAccent: "#006d77",
    onThemeCustomAccent: vi.fn(),
    oledEnabled: false,
    onToggleOled: vi.fn(),
    t: (key) => key,
    ...overrides,
  };
  const utils = render(<ThemeSection {...props} />);
  return { ...utils, props };
}

describe("ThemeSection accent picker (issue #34)", () => {
  test("renders three exclusive accent modes with default active", () => {
    renderThemeSection();

    const defaultMode = screen.getByTestId("accent-mode-default");
    const monetMode = screen.getByTestId("accent-mode-monet");
    const customMode = screen.getByTestId("accent-mode-custom");

    expect(defaultMode).toHaveAttribute("role", "radio");
    expect(defaultMode).toHaveAttribute("aria-checked", "true");
    expect(monetMode).toHaveAttribute("aria-checked", "false");
    expect(customMode).toHaveAttribute("aria-checked", "false");
  });

  test("switches to monet and reports the mode change", () => {
    const { props } = renderThemeSection({ themeAccentMode: "default" });

    fireEvent.click(screen.getByTestId("accent-mode-monet"));
    expect(props.onThemeAccentMode).toHaveBeenCalledWith("monet");
  });

  test("custom mode reveals the palette and free color input", () => {
    renderThemeSection({ themeAccentMode: "custom" });

    expect(screen.getByTestId("accent-swatch-row")).toBeInTheDocument();
    expect(screen.getByTestId("custom-accent-input")).toBeInTheDocument();
    expect(screen.getAllByTestId(/^accent-swatch-[0-9a-fA-F]{6}$/)).toHaveLength(THEME_ACCENT_SWATCHES.length);
  });

  test("palette stays hidden when not in custom mode", () => {
    renderThemeSection({ themeAccentMode: "monet" });
    expect(screen.queryByTestId("accent-swatch-row")).not.toBeInTheDocument();
  });

  test("picking a swatch sets the hex", () => {
    const { props } = renderThemeSection({ themeAccentMode: "custom" });

    fireEvent.click(screen.getByTestId("accent-swatch-E63946"));
    expect(props.onThemeCustomAccent).toHaveBeenCalledWith("#E63946");
  });

  test("free color input reports its value", () => {
    const { props } = renderThemeSection({ themeAccentMode: "custom" });

    fireEvent.change(screen.getByTestId("custom-accent-input"), { target: { value: "#7B2FBE" } });
    // jsdom lowercases color values before dispatching the change event
    expect(props.onThemeCustomAccent).toHaveBeenCalledWith("#7b2fbe");
  });

  test("keeps the OLED toggle available", () => {
    renderThemeSection();
    expect(screen.getByTestId("oled-toggle")).toBeInTheDocument();
  });
});
