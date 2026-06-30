import { useCallback } from "react";
import { RULES_DATA } from "./rules";
import de from "./translations/de";
import en from "./translations/en";
import es from "./translations/es";
import fr from "./translations/fr";
import ja from "./translations/ja";
import zh from "./translations/zh";

type TranslationValue = string | TranslationMessages;
type TranslationMessages = {
  [key: string]: TranslationValue;
};
type TranslationMap = Record<string, TranslationMessages>;
type TranslationReport = Record<string, { missing: string[]; extra: string[] }>;

function buildRuleTranslationDefaults(): Record<string, string> {
  return Object.fromEntries(
    RULES_DATA.flatMap((game) =>
      game.sections.map((section, index) => [`r_${game.id}_${index}`, section.text])
    )
  );
}

function withRuleTranslations(messages: TranslationMessages): TranslationMessages {
  return {
    ...buildRuleTranslationDefaults(),
    ...messages,
  };
}

const TRANSLATIONS: TranslationMap = {
  es: withRuleTranslations(es),
  en: withRuleTranslations(en),
  de: withRuleTranslations(de),
  zh: withRuleTranslations(zh),
  ja: withRuleTranslations(ja),
  fr: withRuleTranslations(fr),
};
const SUPPORTED_LANGS = Object.freeze(Object.keys(TRANSLATIONS));
const DEFAULT_LANG = "es";
const FALLBACK_LANG = "en";

function flattenTranslationKeys(obj: TranslationMessages, prefix = ""): string[] {
  const keys = [];

  Object.entries(obj).forEach(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flattenTranslationKeys(value, nextKey));
      return;
    }
    keys.push(nextKey);
  });

  return keys;
}

function getTranslationParityReport(
  translations: TranslationMap = TRANSLATIONS,
  baseLang = DEFAULT_LANG,
): TranslationReport {
  const baseKeys = new Set(flattenTranslationKeys(translations[baseLang] || {}));

  return Object.fromEntries(
    Object.entries(translations).map(([lang, messages]) => {
      const localeKeys = new Set(flattenTranslationKeys(messages));
      const missing = [...baseKeys].filter((key) => !localeKeys.has(key)).sort();
      const extra = [...localeKeys].filter((key) => !baseKeys.has(key)).sort();

      return [lang, { missing, extra }];
    })
  );
}

let _globalT = (key) => key;

function setGlobalT(fn: (key: string) => string) {
  _globalT = fn;
}

/** @returns {function(string): string} */
function getGlobalT(): (key: string) => string {
  return _globalT;
}

function detectLang() {
  const saved = (() => {
    try {
      return JSON.parse(localStorage.getItem("bgt_lang"));
    } catch {
      return null;
    }
  })();

  if (SUPPORTED_LANGS.includes(saved)) return saved;

  const nav = (navigator.language || navigator.userLanguage || DEFAULT_LANG).toLowerCase();
  if (nav.startsWith("es")) return "es";
  if (nav.startsWith("de")) return "de";
  if (nav.startsWith("zh")) return "zh";
  if (nav.startsWith("ja")) return "ja";
  if (nav.startsWith("fr")) return "fr";
  return FALLBACK_LANG;
}

function saveLang(lang: string) {
  try {
    localStorage.setItem("bgt_lang", JSON.stringify(lang));
  } catch {
    // ignore
  }
}

function useT(lang: string) {
  return useCallback((key) => {
    const parts = key.split(".");
    let value = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANG];

    for (const part of parts) value = value?.[part];
    return value ?? key;
  }, [lang]);
}

export {
  DEFAULT_LANG,
  FALLBACK_LANG,
  SUPPORTED_LANGS,
  TRANSLATIONS,
  flattenTranslationKeys,
  getTranslationParityReport,
  getGlobalT,
  detectLang,
  saveLang,
  setGlobalT,
  useT,
};
