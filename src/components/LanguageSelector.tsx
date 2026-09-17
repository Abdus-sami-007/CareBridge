import { LANGUAGES } from "../i18n/languages";
import { useI18n } from "../i18n";

export default function LanguageSelector() {
  const { language, setLanguage } = useI18n();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">
        🌐
      </span>

      <select
        value={language}
        onChange={(e) =>
          setLanguage(e.target.value as typeof language)
        }
        className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs bg-white text-stone-800 font-medium cursor-pointer focus:outline-none focus:border-emerald-500"
        aria-label="Select language"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} — {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
