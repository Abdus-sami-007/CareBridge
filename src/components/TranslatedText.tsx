import React, { useEffect, useState } from 'react';
import { translateUI, useLanguage } from '../lib/i18n';

interface TranslatedTextProps {
  children: React.ReactNode;
}

export function TranslatedText({
  children,
}: TranslatedTextProps) {
  const { language } = useLanguage();
  const rawText = typeof children === 'string' || typeof children === 'number' ? String(children) : '';
  const cleanText = rawText.replace(/\s+/g, ' ').trim();
  const [text, setText] = useState(rawText);

  useEffect(() => {
    let cancelled = false;

    if (language === 'en' || !cleanText) {
      setText(rawText);
      return;
    }

    translateUI(cleanText, language).then(result => {
      if (!cancelled) {
        setText(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [cleanText, rawText, language]);

  return <>{text || rawText}</>;
}

export default TranslatedText;
