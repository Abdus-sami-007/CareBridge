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
  if (!text || !text.trim() || language === 'en') return text;

  const cleanText = text.trim();

  // 1. Check static dictionary
  if (translations[language]?.[cleanText]) {
    return translations[language][cleanText];
  }

  // 2. Check memory cache
  const cached = translatedCache.get(`${language}|${cleanText}`);
  if (cached && cached !== cleanText) return cached;

  // 3. Try backend API /api/translate
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        targetLanguage: language,
        texts: [cleanText],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const translated = data.translations?.[0];

      if (translated && translated.trim() !== cleanText) {
        translatedCache.set(`${language}|${cleanText}`, translated);
        return translated;
      }
    }
  } catch (err) {
    console.warn('[i18n] Backend translate call failed, trying client fallback:', err);
  }

  // 4. Browser direct Google Translate GTX fallback (works 100% in browser CORS)
  try {
    const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(language)}&dt=t&q=${encodeURIComponent(cleanText)}`;
    const gtxRes = await fetch(gtxUrl);
    if (gtxRes.ok) {
      const gtxData = await gtxRes.json();
      if (Array.isArray(gtxData) && Array.isArray(gtxData[0])) {
        const clientTranslated = gtxData[0].map((part: any) => part[0]).join('');
        if (clientTranslated && clientTranslated.trim() !== cleanText) {
          translatedCache.set(`${language}|${cleanText}`, clientTranslated);
          return clientTranslated;
        }
      }
    }
  } catch (err) {
    console.warn('[i18n] Client GTX translate fallback error:', err);
  }

  return text;
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
