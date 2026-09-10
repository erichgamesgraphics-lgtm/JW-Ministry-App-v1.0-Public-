import { SupportedLanguage } from '../../src/types.js';
import { CategoryType } from './MinistryAssistantRouter.js';

export class LanguageService {
  /**
   * Normalize input language string to supported language
   */
  static normalizeLanguage(lang?: string): SupportedLanguage {
    if (!lang) return 'en';
    const clean = lang.toLowerCase().trim().split('-')[0].split('_')[0];
    if (clean === 'hy' || clean === 'armenian') return 'hy';
    if (clean === 'ru' || clean === 'russian') return 'ru';
    if (clean === 'hi' || clean === 'hindi') return 'hi';
    if (clean === 'pa' || clean === 'punjabi') return 'pa';
    return 'en';
  }

  /**
   * Detect language from text message based on character scripts and language keywords
   */
  static detectLanguage(message: string, fallbackLang: string = 'en'): SupportedLanguage {
    if (!message || typeof message !== 'string') return this.normalizeLanguage(fallbackLang);

    // Armenian Unicode range
    if (/[\u0530-\u058F]/.test(message)) return 'hy';
    // Cyrillic Unicode range
    if (/[\u0400-\u04FF]/.test(message)) return 'ru';
    // Devanagari (Hindi) Unicode range
    if (/[\u0900-\u097F]/.test(message)) return 'hi';
    // Gurmukhi (Punjabi) Unicode range
    if (/[\u0A00-\u0A7F]/.test(message)) return 'pa';

    // Keyword detection fallbacks
    const lower = message.toLowerCase();
    if (lower.includes('ժամ') || lower.includes('նպատակ') || lower.includes('ծառայություն')) return 'hy';
    if (lower.includes('часы') || lower.includes('цель') || lower.includes('служение')) return 'ru';
    if (lower.includes('घंटे') || lower.includes('लक्ष्य') || lower.includes('प्रचार')) return 'hi';
    if (lower.includes('ਘੰਟੇ') || lower.includes('ਨਿਸ਼ਾਨਾ') || lower.includes('ਪ੍ਰਚਾਰ')) return 'pa';

    return this.normalizeLanguage(fallbackLang);
  }

  /**
   * Centralized intent classifier covering all 5 supported languages
   */
  static getLocalizedIntent(message: string, lang: SupportedLanguage): { primaryCategory: CategoryType; isCombined: boolean } {
    const lower = message.toLowerCase().trim();

    // 1. Progress keywords across languages
    const isProgress =
      lower.includes('progress') || lower.includes('doing') || lower.includes('how am i') || lower.includes('summary') || lower.includes('overview') || lower.includes('month') ||
      lower.includes('առաջընթաց') || lower.includes('ինչպես') || lower.includes('ամիս') || lower.includes('ամսական') ||
      lower.includes('прогресс') || lower.includes('как дела') || lower.includes('месяц') || lower.includes('итоги') ||
      lower.includes('प्रगति') || lower.includes('स्थिति') || lower.includes('महीना') || lower.includes('कैसा') ||
      lower.includes('ਤਰੱਕੀ') || lower.includes('ਮਹੀਨਾ') || lower.includes('ਕਿਵੇਂ');

    // 2. Hours keywords across languages
    const isHours =
      lower.includes('hour') || lower.includes('left') || lower.includes('remaining') || lower.includes('completed') || lower.includes('how many') ||
      lower.includes('ժամ') || lower.includes('մնացած') || lower.includes('քանի') ||
      lower.includes('часы') || lower.includes('осталось') || lower.includes('сколько') || lower.includes('записано') ||
      lower.includes('घंटे') || lower.includes('शेष') || lower.includes('कितने') || lower.includes('दर्ज') ||
      lower.includes('ਘੰਟੇ') || lower.includes('ਬਾਕੀ') || lower.includes('ਕਿੰਨੇ') || lower.includes('ਦਰਜ');

    // 3. Goal keywords across languages
    const isGoal =
      lower.includes('goal') || lower.includes('target') || lower.includes('status') || lower.includes('pioneer') ||
      lower.includes('նպատակ') || lower.includes('կարգավիճակ') || lower.includes('ռահվիրա') ||
      lower.includes('цель') || lower.includes('статус') || lower.includes('пионер') ||
      lower.includes('लक्ष्य') || lower.includes('पायनियर') ||
      lower.includes('ਨਿਸ਼ਾਨਾ') || lower.includes('ਪਾਇਨੀਅਰ');

    // 4. History keywords across languages
    const isHistory =
      lower.includes('history') || lower.includes('yesterday') || lower.includes('recent') || lower.includes('logged') || lower.includes('entries') || lower.includes('records') ||
      lower.includes('պատմություն') || lower.includes('գրանցումներ') || lower.includes('վերջին') ||
      lower.includes('история') || lower.includes('записи') || lower.includes('недавно') ||
      lower.includes('इतिहास') || lower.includes('पिछला') || lower.includes('रिकॉर्ड') ||
      lower.includes('ਇਤਿਹਾਸ') || lower.includes('ਰਿਕਾਰਡ');

    // 5. Schedule keywords across languages
    const isSchedule =
      lower.includes('schedule') || lower.includes('calendar') || lower.includes('tomorrow') || lower.includes('weekend') || lower.includes('arrangement') || lower.includes('upcoming') ||
      lower.includes('ժամանակացույց') || lower.includes('օրացույց') || lower.includes('պայմանավորվածություն') ||
      lower.includes('расписание') || lower.includes('календарь') || lower.includes('запланировано') || lower.includes('встреча') ||
      lower.includes('कार्यक्रम') || lower.includes('कैलेंडर') || lower.includes('योजना') ||
      lower.includes('ਸ਼ੈਡਿਊਲ') || lower.includes('ਕੈਲੰਡਰ') || lower.includes('ਪ੍ਰਬੰਧ');

    // 6. Tips keywords across languages
    const isTips =
      lower.includes('tip') || lower.includes('suggestion') || lower.includes('behind') || lower.includes('improve') || lower.includes('pace') || lower.includes('advice') ||
      lower.includes('խորհուրդ') || lower.includes('առաջարկ') || lower.includes('բարելավել') ||
      lower.includes('совет') || lower.includes('улучшить') || lower.includes('темп') || lower.includes('подсказка') ||
      lower.includes('सुझाव') || lower.includes('सलाह') || lower.includes('सुधार') ||
      lower.includes('ਸੁਝਾਅ') || lower.includes('ਸਲਾਹ');

    // 7. JW Search keywords across languages
    const isJWSearch =
      lower.includes('jw.org') || lower.includes('article') || lower.includes('find') || lower.includes('show me') || lower.includes('suffering') || lower.includes('hope') || lower.includes('kingdom') || lower.includes('resurrection') || lower.includes('bible study') || lower.includes('anxiety') || lower.includes('prayer') || lower.includes('pray') ||
      lower.includes('հոդված') || lower.includes('տառապանք') || lower.includes('հույս') || lower.includes('թագավորություն') || lower.includes('հարություն') || lower.includes('աղոթք') || lower.includes('ուսումնասիրություն') ||
      lower.includes('статья') || lower.includes('страдания') || lower.includes('надежда') || lower.includes('царство') || lower.includes('воскресение') || lower.includes('молитва') || lower.includes('изучение') ||
      lower.includes('लेख') || lower.includes('दुख') || lower.includes('आशा') || lower.includes('राज्य') || lower.includes('पुनरुत्थान') || lower.includes('प्रार्थना') || lower.includes('अध्ययन') ||
      lower.includes('ਲੇਖ') || lower.includes('ਦੁੱਖ') || lower.includes('ਆਸ') || lower.includes('ਰਾਜ') || lower.includes('ਮੁੜ-ਜੀਉਂਦਾ') || lower.includes('ਪ੍ਰਾਰਥਨਾ') || lower.includes('ਸਟੱਡੀ');

    // 8. WOL Search keywords
    const isWOLSearch =
      lower.includes('wol') || lower.includes('watchtower library') || lower.includes('insight') || lower.includes('research guide') ||
      lower.includes('գրադարան') || lower.includes('օնլայն') ||
      lower.includes('библиотека') || lower.includes('онлайн') ||
      lower.includes('लाइब्रेरी') ||
      lower.includes('ਲਾਇਬ੍ਰੇਰੀ');

    const isJWSource = lower.includes('open') && (lower.includes('jw.org') || lower.includes('wol'));

    const researchCount = (isJWSearch ? 1 : 0) + (isWOLSearch ? 1 : 0);
    const progressCount = (isProgress ? 1 : 0) + (isHours ? 1 : 0) + (isGoal ? 1 : 0) + (isHistory ? 1 : 0) + (isSchedule ? 1 : 0) + (isTips ? 1 : 0);

    const isCombined = researchCount > 0 && progressCount > 0;

    if (isCombined) return { primaryCategory: 'COMBINED', isCombined: true };
    if (isJWSource) return { primaryCategory: 'JW_SOURCE', isCombined: false };
    if (isWOLSearch) return { primaryCategory: 'WOL_SEARCH', isCombined: false };
    if (isJWSearch) return { primaryCategory: 'JW_SEARCH', isCombined: false };
    if (isHours) return { primaryCategory: 'MINISTRY_HOURS', isCombined: false };
    if (isGoal) return { primaryCategory: 'MINISTRY_GOAL', isCombined: false };
    if (isHistory) return { primaryCategory: 'MINISTRY_HISTORY', isCombined: false };
    if (isSchedule) return { primaryCategory: 'MINISTRY_SCHEDULE', isCombined: false };
    if (isTips) return { primaryCategory: 'MINISTRY_TIPS', isCombined: false };
    if (isProgress) return { primaryCategory: 'MINISTRY_PROGRESS', isCombined: false };

    return { primaryCategory: 'GENERAL', isCombined: false };
  }

  /**
   * Localized Month Names
   */
  static getMonthName(monthIndex: number, lang: SupportedLanguage): string {
    const months: Record<SupportedLanguage, string[]> = {
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      hy: ['Հունվար', 'Փետրվար', 'Մարտ', 'Ապրիլ', 'Մայիս', 'Հունիս', 'Հուլիս', 'Օգոստոս', 'Սեպտեմբեր', 'Հոկտեմբեր', 'Նոյեմբեր', 'Դեկտեմբեր'],
      ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
      hi: ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'],
      pa: ['ਜਨਵਰੀ', 'ਫਰਵਰੀ', 'ਮਾਰਚ', 'ਅਪ੍ਰੈਲ', 'ਮਈ', 'ਜੂਨ', 'ਜੁਲਾਈ', 'ਅਗਸਤ', 'ਸਤੰਬਰ', 'ਅਕਤੂਬਰ', 'ਨਵੰਬਰ', 'ਦਸੰਬਰ'],
    };
    const validIndex = Math.max(0, Math.min(11, monthIndex));
    return months[lang]?.[validIndex] || months['en'][validIndex];
  }

  /**
   * Localized Publisher Status Display Names
   */
  static getPublisherStatusDisplayName(status: string, lang: SupportedLanguage): string {
    const statuses: Record<SupportedLanguage, Record<string, string>> = {
      en: {
        PUBLISHER: 'Publisher',
        AUXILIARY_PIONEER: 'Auxiliary Pioneer',
        AUXILIARY_PIONEER_15: 'Auxiliary Pioneer (15h)',
        AUXILIARY_PIONEER_30: 'Auxiliary Pioneer (30h)',
        PIONEER: 'Regular Pioneer',
        REGULAR_PIONEER_50: 'Regular Pioneer',
        SPECIAL_PIONEER: 'Special Pioneer',
        SPECIAL_PIONEER_100: 'Special Pioneer (100h)',
        CUSTOM: 'Custom Goal',
      },
      hy: {
        PUBLISHER: 'Քարոզիչ',
        AUXILIARY_PIONEER: 'Օժանդակ Ռահվիրա',
        AUXILIARY_PIONEER_15: 'Օժանդակ Ռահվիրա (15ժ)',
        AUXILIARY_PIONEER_30: 'Օժանդակ Ռահվիրա (30ժ)',
        PIONEER: 'Կանոնավոր Ռահվիրա',
        REGULAR_PIONEER_50: 'Կանոնավոր Ռահվիրա',
        SPECIAL_PIONEER: 'Հատուկ Ռահվիրա',
        SPECIAL_PIONEER_100: 'Հատուկ Ռահվիրա (100ժ)',
        CUSTOM: 'Անհատական Նպատակ',
      },
      ru: {
        PUBLISHER: 'Возгласитель',
        AUXILIARY_PIONEER: 'Подсобный Пионер',
        AUXILIARY_PIONEER_15: 'Подсобный Пионер (15 ч.)',
        AUXILIARY_PIONEER_30: 'Подсобный Пионер (30 ч.)',
        PIONEER: 'Общий Пионер',
        REGULAR_PIONEER_50: 'Общий Пионер',
        SPECIAL_PIONEER: 'Специальный Пионер',
        SPECIAL_PIONEER_100: 'Специальный Пионер (100 ч.)',
        CUSTOM: 'Индивидуальная Цель',
      },
      hi: {
        PUBLISHER: 'प्रकाशक',
        AUXILIARY_PIONEER: 'सहायक पायनियर',
        AUXILIARY_PIONEER_15: 'सहायक पायनियर (15 घंटे)',
        AUXILIARY_PIONEER_30: 'सहायक पायनियर (30 घंटे)',
        PIONEER: 'नियमित पायनियर',
        REGULAR_PIONEER_50: 'नियमित पायनियर',
        SPECIAL_PIONEER: 'विशेष पायनियर',
        SPECIAL_PIONEER_100: 'विशेष पायनियर (100 घंटे)',
        CUSTOM: 'कस्टम लक्ष्य',
      },
      pa: {
        PUBLISHER: 'ਪ੍ਰਚਾਰਕ',
        AUXILIARY_PIONEER: 'ਸਹਾਇਕ ਪਾਇਨੀਅਰ',
        AUXILIARY_PIONEER_15: 'ਸਹਾਇਕ ਪਾਇਨੀਅਰ (15 ਘੰਟੇ)',
        AUXILIARY_PIONEER_30: 'ਸਹਾਇਕ ਪਾਇਨੀਅਰ (30 ਘੰਟੇ)',
        PIONEER: 'ਨਿਯਮਿਤ ਪਾਇਨੀਅਰ',
        REGULAR_PIONEER_50: 'ਨਿਯਮਿਤ ਪਾਇਨੀਅਰ',
        SPECIAL_PIONEER: 'ਖਾਸ ਪਾਇਨੀਅਰ',
        SPECIAL_PIONEER_100: 'ਖਾਸ ਪਾਇਨੀਅਰ (100 ਘੰਟੇ)',
        CUSTOM: 'ਕਸਟਮ ਨਿਸ਼ਾਨਾ',
      },
    };

    return statuses[lang]?.[status] || statuses['en'][status] || status;
  }

  /**
   * Localized Suggested Follow-Up Questions
   */
  static getLocalizedSuggestions(lang: SupportedLanguage, category?: CategoryType): string[] {
    const isMinistryCategory = category ? category.startsWith('MINISTRY') : true;

    if (lang === 'hy') {
      return isMinistryCategory
        ? [
            'Քանի՞ ժամ է մնացել նպատակիս:',
            'Տվեք ինձ ծառայության խորհուրդներ:',
            'Գտնել հոդված JW.ORG-ում Աստվածաշնչի ուսումնասիրությունների մասին:',
            'Որոնել WOL-ում աղոթքի մասին:',
          ]
        : [
            'Ինչպե՞ս են իմ արդյունքներն այս ամիս:',
            'Քանի՞ ժամ է մնացել նպատակիս:',
            'Որոնել WOL-ում աղոթքի մասին:',
            'Գտնել հոդված տառապանքի պատճառների մասին:',
          ];
    }

    if (lang === 'ru') {
      return isMinistryCategory
        ? [
            'Сколько часов мне осталось?',
            'Дай мне практические советы для служения.',
            'Найти статью на JW.ORG о проведении изучений Библии.',
            'Искать в WOL информацию о молитве.',
          ]
        : [
            'Как мои успехи в этом месяце?',
            'Сколько часов осталось до цели?',
            'Искать в WOL о молитве.',
            'Найти статью на JW.ORG о надежде.',
          ];
    }

    if (lang === 'hi') {
      return isMinistryCategory
        ? [
            'मेरे लक्ष्य में कितने घंटे शेष हैं?',
            'मुझे प्रचार के लिए कुछ सुझाव दीजिए।',
            'JW.ORG पर बाइबल अध्ययन के बारे में लेख खोजें।',
            'WOL पर प्रार्थना के बारे में खोजें।',
          ]
        : [
            'इस महीने मेरी क्या प्रगति है?',
            'कितने घंटे शेष हैं?',
            'WOL पर प्रार्थना के बारे में खोजें।',
            'JW.ORG पर आशा के बारे में लेख खोजें।',
          ];
    }

    if (lang === 'pa') {
      return isMinistryCategory
        ? [
            'ਮੇਰੇ ਨਿਸ਼ਾਨੇ ਵਿੱਚ ਕਿੰਨੇ ਘੰਟੇ ਬਾਕੀ ਹਨ?',
            'ਮੈਨੂੰ ਪ੍ਰਚਾਰ ਲਈ ਸੁਝਾਅ ਦਿਓ।',
            "JW.ORG 'ਤੇ ਬਾਈਬਲ ਸਟੱਡੀ ਬਾਰੇ ਲੇਖ ਲੱਭੋ।",
            "WOL 'ਤੇ ਪ੍ਰਾਰਥਨਾ ਬਾਰੇ ਖੋਜੋ।",
          ]
        : [
            'ਇਸ ਮਹੀਨੇ ਮੇਰੀ ਕੀ ਤਰੱਕੀ ਹੈ?',
            'ਕਿੰਨੇ ਘੰਟੇ ਬਾਕੀ ਹਨ?',
            "WOL 'ਤੇ ਪ੍ਰਾਰਥਨਾ ਬਾਰੇ ਖੋਜੋ।",
            "JW.ORG 'ਤੇ ਆਸ ਬਾਰੇ ਲੇਖ ਲੱਭੋ।",
          ];
    }

    // Default English
    return isMinistryCategory
      ? [
          'How many hours do I have left?',
          'Give me some ministry tips.',
          'Find an article about Bible studies on JW.ORG.',
          'Search WOL for prayer.',
        ]
      : [
          'How am I doing this month?',
          'How many hours do I have left?',
          'Search WOL for prayer.',
          'Find an article about hope on JW.ORG.',
        ];
  }

  /**
   * Localized User-Friendly Error Messages
   */
  static getLocalizedError(lang: SupportedLanguage, errorCode?: string): string {
    switch (lang) {
      case 'hy':
        return 'Ծառայության Օգնականը ժամանակավորապես անհասանելի է։ Խնդրում ենք փորձել նորից։';
      case 'ru':
        return 'Помощник Служения временно недоступен. Пожалуйста, попробуйте еще раз.';
      case 'hi':
        return 'प्रचार सहायक फिलहाल उपलब्ध नहीं है। कृपया पुन: प्रयास करें।';
      case 'pa':
        return 'ਪ੍ਰਚਾਰ ਸਹਾਇਕ ਇਸ ਵੇਲੇ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।';
      default:
        return 'Ministry Assistant is temporarily unavailable. Please try again.';
    }
  }

  /**
   * Localized General Greeting
   */
  static getGeneralGreeting(lang: SupportedLanguage): string {
    switch (lang) {
      case 'hy':
        return `Ողջույն։ Ես **JW Ministry Assistant**-ն եմ։

Ես պատրաստ եմ օգնել ձեզ՝
- **Ծառայության Առաջընթաց**՝ Վերլուծել ձեր ժամերը, նպատակները, վերայցելությունները և ուսումնասիրությունները։
- **JW.ORG և WOL Որոնում**՝ Գտնել հոդվածներ և նյութեր **JW.ORG** և **WOL.JW.ORG** կայքերում։

Ինչպե՞ս կարող եմ օգնել ձեզ այսօր։`;

      case 'ru':
        return `Здравствуйте! Я **JW Ministry Assistant**.

Я готов помочь вам:
- **Прогресс в Служении**: Анализ ваших часов, целей, повторных посещений и изучений Библии.
- **Поиск на JW.ORG и WOL**: Поиск статей и исследований на **JW.ORG** и **WOL.JW.ORG**.

Чем я могу помочь вам сегодня?`;

      case 'hi':
        return `नमस्ते! मैं **JW Ministry Assistant** हूँ।

मैं आपकी सहायता के लिए तैयार हूँ:
- **प्रचार प्रगति**: अपने घंटों, लक्ष्यों, पुनः भेटों और बाइबल अध्ययनों का विश्लेषण करें।
- **JW.ORG और WOL खोज**: **JW.ORG** और **WOL.JW.ORG** पर लेख खोजें।

आज मैं आपकी क्या सहायता कर सकता हूँ?`;

      case 'pa':
        return `ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ! ਮੈਂ **JW Ministry Assistant** ਹਾਂ।

ਮੈਂ ਤੁਹਾਡੀ ਮਦਦ ਕਰਨ ਲਈ ਤਿਆਰ ਹਾਂ:
- **ਪ੍ਰਚਾਰ ਦੀ ਤਰੱਕੀ**: ਆਪਣੇ ਘੰਟੇ, ਨਿਸ਼ਾਨੇ, ਮੁੜ-ਮੁਲਾਕਾਤਾਂ ਅਤੇ ਬਾਈਬਲ ਸਟੱਡੀਆਂ ਵੇਖੋ।
- **JW.ORG ਅਤੇ WOL ਖੋਜ**: **JW.ORG** ਅਤੇ **WOL.JW.ORG** 'ਤੇ ਲੇਖ ਖੋਜੋ।

ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?`;

      default:
        return `Hello! I am **JW Ministry Assistant**.

I am here to assist you with:
- **Ministry Tracker Progress**: Analyzing your monthly hours, goals, return visits, Bible studies, and placements.
- **JW.ORG & WOL Research**: Locating official articles and study materials on **JW.ORG** and **WOL.JW.ORG**.

How can I assist your ministry today?`;
    }
  }
}
