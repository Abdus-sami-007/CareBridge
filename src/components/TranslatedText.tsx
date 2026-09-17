import React, { useEffect, useState } from 'react';
import { translateUI, useLanguage } from '../lib/i18n';

interface TranslatedTextProps {
  children: string;
}

export function TranslatedText({
  children,
}: TranslatedTextProps) {
  const { language } = useLanguage();
  const [text, setText] = useState(children);

  useEffect(() => {
    let cancelled = false;

    if (language === 'en' || !children) {
      setText(children);
      return;
    }

    translateUI(children, language).then(result => {
      if (!cancelled) {
        setText(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [children, language]);

  return <>{text}</>;
}

export default TranslatedText;
