import { SupportedLanguage, TranslationSchema } from './types.ts';
import { en } from './en.ts';
import { hy } from './hy.ts';
import { ru } from './ru.ts';
import { hi } from './hi.ts';
import { pa } from './pa.ts';

export * from './types.ts';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
];

export const translations: Record<SupportedLanguage, TranslationSchema> = {
  en,
  hy,
  ru,
  hi,
  pa,
};

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

/**
 * Detect the browser / system device language.
 * Checks navigator.languages, navigator.language, etc.
 * Supports:
 * - Armenian (hy, hy-AM, etc.) -> 'hy'
 * - Russian (ru, ru-RU, etc.) -> 'ru'
 * - Hindi (hi, hi-IN, etc.) -> 'hi'
 * - Punjabi (pa, pa-IN, etc.) -> 'pa'
 * - English (en, en-US, en-GB, etc.) -> 'en'
 * Fallbacks to English for unsupported languages.
 */
export function detectSystemLanguage(): SupportedLanguage {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const rawLanguages: string[] = [];
  if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
    rawLanguages.push(...navigator.languages);
  }
  if (navigator.language) {
    rawLanguages.push(navigator.language);
  }

  for (const raw of rawLanguages) {
    if (!raw || typeof raw !== 'string') continue;
    const clean = raw.toLowerCase().trim();
    if (clean.startsWith('hy')) {
      return 'hy';
    }
    if (clean.startsWith('ru')) {
      return 'ru';
    }
    if (clean.startsWith('hi')) {
      return 'hi';
    }
    if (clean.startsWith('pa')) {
      return 'pa';
    }
    if (clean.startsWith('en')) {
      return 'en';
    }
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Get initial language before the application renders:
 * 1. User's saved manual language preference (stored in localStorage)
 * 2. System/browser language
 * 3. English fallback
 */
export function getInitialLanguage(): SupportedLanguage {
  try {
    const rawSettings = localStorage.getItem('ministry_tracker_settings_v2') || localStorage.getItem('ministry_tracker_settings_v1');
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings);
      if (parsed && (parsed.language === 'en' || parsed.language === 'hy' || parsed.language === 'ru' || parsed.language === 'hi' || parsed.language === 'pa')) {
        return parsed.language;
      }
    }
  } catch {}

  return detectSystemLanguage();
}

export function getTranslation(lang?: SupportedLanguage): TranslationSchema {
  if (lang && translations[lang]) {
    return translations[lang];
  }
  return translations[DEFAULT_LANGUAGE];
}

/**
 * Format a duration in minutes into a localized string (e.g. "1h 30m" or "1 ժ 30 ր" or "1 ч 30 мин")
 */
export function formatDurationLocalized(
  minutes: number,
  lang: SupportedLanguage = 'en'
): string {
  const t = getTranslation(lang);
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hrs > 0) {
    if (mins > 0) {
      return `${hrs}${t.common.hoursShort} ${mins}${t.common.minutesShort}`;
    }
    return `${hrs}${t.common.hoursShort}`;
  }
  return `${mins}${t.common.minutesShort}`;
}

/**
 * Format a date nicely using Intl based on the active language
 */
export function formatDateLocalized(
  dateOrMillis: Date | number,
  lang: SupportedLanguage = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof dateOrMillis === 'number' ? new Date(dateOrMillis) : dateOrMillis;
  const localeMap: Record<SupportedLanguage, string> = {
    en: 'en-US',
    hy: 'hy-AM',
    ru: 'ru-RU',
    hi: 'hi-IN',
    pa: 'pa-IN',
  };
  const locale = localeMap[lang] || 'en-US';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  try {
    return date.toLocaleDateString(locale, options || defaultOptions);
  } catch {
    return date.toLocaleDateString('en-US', options || defaultOptions);
  }
}

/**
 * Format Month and Year localized (e.g. "May 2026", "Մայիս 2026", "Май 2026")
 */
export function formatMonthYearLocalized(
  dateOrMillis: Date | number,
  lang: SupportedLanguage = 'en'
): string {
  return formatDateLocalized(dateOrMillis, lang, { month: 'long', year: 'numeric' });
}
