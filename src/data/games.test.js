import { describe, expect, test } from "vitest";
import { GAMES, getTagline, getGameName } from "./games.ts";

describe("getTagline", () => {
  test("translates tagline for known games", () => {
    const t = (key) => ({ taglineUno: "500 pts - Classic" }[key] || key);
    expect(getTagline("uno", t)).toBe("500 pts - Classic");
  });

  test("returns empty string for unknown game id", () => {
    expect(getTagline("nonexistent", (key) => key)).toBe("");
  });
});

describe("getGameName", () => {
  test("translates game name via GAME_NAME_KEYS", () => {
    const t = (key) => ({ gn_uno: "UNO Spanish" }[key] || key);
    expect(getGameName("uno", t)).toBe("UNO Spanish");
  });

  test("falls back to portion food name for portion keys", () => {
    const t = (key) => ({ foodPizza: "Pizza" }[key] || key);
    expect(getGameName("pizza", t)).toBe("Pizza");
  });

  test("falls back to GAMES entry name when no translation key exists", () => {
    expect(getGameName("otros_porciones", (key) => key)).toBe("Otros");
  });

  test("returns raw gameId when game is completely unknown", () => {
    expect(getGameName("totally_fake", (key) => key)).toBe("totally_fake");
  });
});
