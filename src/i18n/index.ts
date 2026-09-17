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
} from "./languages";

import { translations } from "./translations";

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
