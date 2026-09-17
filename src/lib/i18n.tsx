import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  LANGUAGES,
  RTL_LANGUAGES,
  type LanguageCode,
} from "../i18n/languages";

import { translations } from "../i18n/translations";

export { LANGUAGES, RTL_LANGUAGES, type LanguageCode } from "../i18n/languages";
export { translations } from "../i18n/translations";

export const translatedCache = new Map<string, string>();

export async function translateUI(
  text: string,
  language: LanguageCode
): Promise<string> {
  if (!text || language === 'en') return text;

  const cached = translatedCache.get(`${language}|${text}`);
  if (cached) return cached;

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        targetLanguage: language,
        texts: [text],
      }),
    });

    if (!response.ok) return text;

    const data = await response.json();

    const translated = data.translations?.[0] || text;

    translatedCache.set(`${language}|${text}`, translated);

    return translated;
  } catch {
    return text;
  }
}

type I18nContextType = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
};

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = "carebridge-language";

export function I18nProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (
      saved &&
      LANGUAGES.some((lang) => lang.code === saved)
    ) {
      return saved as LanguageCode;
    }

    return "en";
  });

  const setLanguage = (nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage);
    localStorage.setItem(STORAGE_KEY, nextLanguage);
  };

  useEffect(() => {
    document.documentElement.lang = language;

    document.documentElement.dir = RTL_LANGUAGES.includes(language)
      ? "rtl"
      : "ltr";
  }, [language]);

  const value = useMemo<I18nContextType>(
    () => ({
      language,
      setLanguage,

      t: (key, fallback) => {
        return (
          translations[language]?.[key] ||
          translations.en[key] ||
          fallback ||
          key
        );
      },
    }),
    [language]
  );

  return React.createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return context;
}

export const useLanguage = useI18n;
