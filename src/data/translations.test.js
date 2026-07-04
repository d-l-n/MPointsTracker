import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import {
  detectLang, saveLang,
  flattenTranslationKeys, getTranslationParityReport, TRANSLATIONS,
} from "./translations.ts";

describe("saveLang", () => {
  beforeEach(() => localStorage.removeItem("bgt_lang"));

  test("saves language to localStorage", () => {
    saveLang("en");
    expect(JSON.parse(localStorage.getItem("bgt_lang"))).toBe("en");
  });

  test("does not throw when localStorage is unavailable", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(() => saveLang("fr")).not.toThrow();
    setItem.mockRestore();
  });
});

describe("detectLang", () => {
  beforeEach(() => localStorage.removeItem("bgt_lang"));

  test("returns saved language from localStorage", () => {
    localStorage.setItem("bgt_lang", JSON.stringify("en"));
    expect(detectLang()).toBe("en");
  });

  test("returns es when navigator language is es-*", () => {
    vi.stubGlobal("navigator", { language: "es-AR" });
    expect(detectLang()).toBe("es");
  });

  test("returns en as fallback when not in supported languages", () => {
    vi.stubGlobal("navigator", { language: "it-IT" });
    expect(detectLang()).toBe("en");
  });

  test("handles localStorage getItem throwing", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("access denied");
    });
    vi.stubGlobal("navigator", { language: "de-DE" });
    expect(detectLang()).toBe("de");
  });
});

describe("flattenTranslationKeys", () => {
  test("flattens nested objects into dot-separated keys", () => {
    expect(flattenTranslationKeys({ a: { b: "x" }, c: "y" })).toEqual(["a.b", "c"]);
  });

  test("handles empty object", () => {
    expect(flattenTranslationKeys({})).toEqual([]);
  });
});

describe("getTranslationParityReport", () => {
  test("returns missing and extra keys for each locale", () => {
    const report = getTranslationParityReport({
      es: { hello: "hola", goodbye: "adios" },
      en: { hello: "hello" },
    }, "es");

    expect(report.en.missing).toEqual(["goodbye"]);
    expect(report.en.extra).toEqual([]);
    expect(report.es.missing).toEqual([]);
  });

  test("reports extra keys", () => {
    const report = getTranslationParityReport({
      es: { a: "1" },
      en: { a: "1", b: "2" },
    }, "es");

    expect(report.en.extra).toEqual(["b"]);
  });
});

describe("useT", () => {
  test("returns a function that translates keys", async () => {
    const { renderHook } = await import("@testing-library/react");
    const { useT } = await import("./translations.ts");
    const { result } = renderHook(() => useT("en"));
    expect(result.current("gn_uno")).toBe("UNO");
    expect(result.current("nonexistent.key")).toBe("nonexistent.key");
  });
});
