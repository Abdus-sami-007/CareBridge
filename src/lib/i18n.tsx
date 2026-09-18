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

export async function translateBatch(
  texts: string[],
  language: LanguageCode
): Promise<Map<string, string>> {
  const resultMap = new Map<string, string>();
  if (!texts.length || language === 'en') {
    texts.forEach(t => resultMap.set(t, t));
    return resultMap;
  }

  const missing: string[] = [];

  for (const raw of texts) {
    const clean = raw.trim();
    if (!clean || !/[a-zA-Z]/.test(clean) || clean === 'CareBridge') {
      resultMap.set(raw, raw);
      continue;
    }

    // 1. Check static dictionary
    if (translations[language]?.[clean]) {
      resultMap.set(raw, raw.replace(clean, translations[language][clean]));
      continue;
    }

    // 2. Check memory cache
    const cached = translatedCache.get(`${language}|${clean}`);
    if (cached && cached !== clean) {
      resultMap.set(raw, raw.replace(clean, cached));
      continue;
    }

    missing.push(clean);
  }

  if (missing.length > 0) {
    // 3. Try backend API /api/translate
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ targetLanguage: language, texts: missing }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.translations) && data.translations.length === missing.length) {
          data.translations.forEach((tr: string, idx: number) => {
            const orig = missing[idx];
            if (tr && tr.trim() !== orig) {
              translatedCache.set(`${language}|${orig}`, tr);
            }
          });
        }
      }
    } catch (err) {
      console.warn('[i18n] Batch backend translate failed:', err);
    }

    // 4. Direct browser GTX API fallback for any unfulfilled items
    const unfulfilled = missing.filter(m => !translatedCache.has(`${language}|${m}`));
    if (unfulfilled.length > 0) {
      await Promise.all(
        unfulfilled.map(async (orig) => {
          try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(language)}&dt=t&q=${encodeURIComponent(orig)}`;
            const res = await fetch(url);
            if (res.ok) {
              const gtxData = await res.json();
              if (Array.isArray(gtxData) && Array.isArray(gtxData[0])) {
                const tr = gtxData[0].map((part: any) => part[0]).join('');
                if (tr && tr.trim() !== orig) {
                  translatedCache.set(`${language}|${orig}`, tr);
                }
              }
            }
          } catch {}
        })
      );
    }
  }

  // Assemble final resultMap
  for (const raw of texts) {
    if (!resultMap.has(raw)) {
      const clean = raw.trim();
      const cached = translatedCache.get(`${language}|${clean}`);
      if (cached) {
        resultMap.set(raw, raw.replace(clean, cached));
      } else {
        resultMap.set(raw, raw);
      }
    }
  }

  return resultMap;
}

export async function translateUI(
  text: string,
  language: LanguageCode
): Promise<string> {
  if (!text || !text.trim() || language === 'en') return text;
  const resMap = await translateBatch([text], language);
  return resMap.get(text) || text;
}

export function translateDomTree(
  root: HTMLElement,
  language: LanguageCode
) {
  if (!root || language === 'en') return;

  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toLowerCase();
        if (
          tag === 'script' ||
          tag === 'style' ||
          tag === 'code' ||
          tag === 'pre' ||
          tag === 'textarea' ||
          tag === 'select' ||
          tag === 'option' ||
          parent.classList.contains('notranslate') ||
          parent.hasAttribute('data-no-translate')
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        const text = node.nodeValue || '';
        if (!text.trim() || !/[a-zA-Z]/.test(text.trim())) {
          return NodeFilter.FILTER_SKIP;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  if (textNodes.length === 0) return;

  textNodes.forEach((node) => {
    if ((node as any).__origText === undefined) {
      (node as any).__origText = node.nodeValue || '';
    }
  });

  const rawTexts = Array.from(
    new Set(textNodes.map((n) => (n as any).__origText))
  );

  translateBatch(rawTexts, language).then((resultMap) => {
    textNodes.forEach((node) => {
      const orig = (node as any).__origText || '';
      const translated = resultMap.get(orig);
      if (translated && node.nodeValue !== translated) {
        node.nodeValue = translated;
      }
    });
  });
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

    if (language === 'en') {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        if ((node as any).__origText !== undefined) {
          node.nodeValue = (node as any).__origText;
        }
      }
      return;
    }

    const runTranslation = () => {
      translateDomTree(document.body, language);
    };

    runTranslation();
    const timer1 = setTimeout(runTranslation, 150);
    const timer2 = setTimeout(runTranslation, 500);

    let observerTimeout: any = null;
    const observer = new MutationObserver(() => {
      if (observerTimeout) clearTimeout(observerTimeout);
      observerTimeout = setTimeout(() => {
        translateDomTree(document.body, language);
      }, 100);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (observerTimeout) clearTimeout(observerTimeout);
      observer.disconnect();
    };
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
