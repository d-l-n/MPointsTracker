import { test, expect } from "@playwright/test";
import { getTranslationParityReport, TRANSLATIONS } from "../src/data/translations.ts";

test("translation locales stay in key parity with es", () => {
  const parity = getTranslationParityReport(TRANSLATIONS, "es");
  const failures = Object.entries(parity)
    .filter(([, diff]) => diff.missing.length > 0 || diff.extra.length > 0)
    .map(([lang, diff]) => ({
      lang,
      missing: diff.missing,
      extra: diff.extra,
    }));

  expect(failures).toEqual([]);
});
