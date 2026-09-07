export type SupportedLanguage = 'en' | 'hy' | 'ru' | 'hi' | 'pa';

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  jwCode: string;
  jwLocale: string;
  scriptDescription: string;
}

export const LANGUAGE_REGISTRY: Record<SupportedLanguage, LanguageMeta> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    jwCode: 'E',
    jwLocale: 'E',
    scriptDescription: 'English (Latin script)',
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    jwCode: 'U',
    jwLocale: 'U',
    scriptDescription: 'Russian (Cyrillic script)',
  },
  hy: {
    code: 'hy',
    name: 'Armenian',
    nativeName: 'Հայերեն',
    jwCode: 'REA',
    jwLocale: 'REA',
    scriptDescription: 'Armenian (Armenian script)',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    jwCode: 'HI',
    jwLocale: 'HI',
    scriptDescription: 'Hindi (Devanagari script)',
  },
  pa: {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    jwCode: 'PJ',
    jwLocale: 'PJ',
    scriptDescription: 'Punjabi (Gurmukhi script)',
  },
};

export interface AnalyzedMinistryQuery {
  language: SupportedLanguage;
  intent: 'MINISTRY_PROGRESS' | 'JW_RESEARCH' | 'HYBRID';
  topic: string;
  primarySearchQuery: string;
  broaderSearchQuery: string;
  englishFallbackQuery: string;
  wantsWOL: boolean;
  confidence: number;
}

interface MinistryThemePattern {
  keywords: string[];
  canonicalQuery: string;
  broaderQuery: string;
  englishQuery: string;
  topicLabel: string;
}

export class LanguageIntelligence {
  /**
   * Safe language normalizer
   */
  static normalizeLanguage(lang?: string): SupportedLanguage {
    if (!lang) return 'en';
    const lower = lang.toLowerCase();
    if (lower.startsWith('hy') || lower.includes('armenia')) return 'hy';
    if (lower.startsWith('ru') || lower.includes('russia')) return 'ru';
    if (lower.startsWith('hi') || lower.includes('hindi')) return 'hi';
    if (lower.startsWith('pa') || lower.includes('punjab')) return 'pa';
    return 'en';
  }

  static getMeta(lang: SupportedLanguage): LanguageMeta {
    return LANGUAGE_REGISTRY[lang] || LANGUAGE_REGISTRY.en;
  }

  /**
   * Deterministic language-aware query analyzer
   * Acts as high-accuracy pre-analyzer and failsafe when Gemini is offline
   */
  static analyzeLocally(question: string, lang: SupportedLanguage): AnalyzedMinistryQuery {
    const qLower = question.toLowerCase();
    const cleanQ = question.replace(/[?։!।.,;:"'«»()]/g, ' ').replace(/\s+/g, ' ').trim();

    // Check for explicit Watchtower Online Library preference
    const wantsWOL =
      qLower.includes('wol') ||
      qLower.includes('watchtower online library') ||
      qLower.includes('օնլայն գրադարան') ||
      qLower.includes('онлайн-библиотек') ||
      qLower.includes('ऑनलाइन लाइब्रेरी') ||
      qLower.includes('ਆਨਲਾਈਨ ਲਾਇਬ੍ਰੇਰੀ');

    // Progress keywords per language
    const progressKeywords: Record<SupportedLanguage, string[]> = {
      en: [
        'hour', 'goal', 'how many hours', 'remaining', 'progress', 'doing this month',
        'my ministry', 'my time', 'my report', 'my hours', 'return visit', 'bible stud',
        'placement', 'schedule', 'stats', 'tracker', 'pacing', 'streak', 'how am i doing'
      ],
      ru: [
        'час', 'цел', 'сколько часов', 'осталось', 'прогресс', 'мои часы', 'повторн',
        'изучен', 'как мои успехи', 'мой отчет', 'мои отчеты', 'статистика', 'график',
        'служение в этом месяце', 'темп', 'пионер'
      ],
      hy: [
        'ժամ', 'նպատակ', 'քանի ժամ', 'մնացել', 'առաջընթաց', 'իմ ժամերը', 'վերայցել',
        'ուսումնասիրություն', 'հաշվետվություն', 'ինչպես են իմ ժամերը', 'տվյալներ',
        'գրաֆիկ', 'տեմպ', 'ռահվիրա', 'ծառայությունս այս ամիս'
      ],
      hi: [
        'घंटे', 'लक्ष्य', 'कितने घंटे', 'बाकी', 'प्रगति', 'मेरे घंटे', 'पुनर्भेंट',
        'बाइबल अध्ययन', 'मेरी रिपोर्ट', 'मेरी प्रगति', 'आंकड़े', 'पायनियर', 'सेवा'
      ],
      pa: [
        'ਘੰਟੇ', 'ਟੀਚਾ', 'ਕਿੰਨੇ ਘੰਟੇ', 'ਬਾਕੀ', 'ਤਰੱਕੀ', 'ਮੇਰੇ ਘੰਟੇ', 'ਮੁੜ-ਮੁਲਾਕਾਤ',
        'ਬਾਈਬਲ ਸਟੱਡੀ', 'ਮੇਰੀ ਰਿਪੋਰਟ', 'ਮੇਰੀ ਤਰੱਕੀ', 'ਅੰਕੜੇ', 'ਪਾਇਨੀਅਰ', 'ਸੇਵਕਾਈ'
      ],
    };

    // Thematic dictionary for Bible / field ministry research in all 5 languages
    const ministryThemes: Record<SupportedLanguage, MinistryThemePattern[]> = {
      hy: [
        {
          keywords: ['ուսումնասիր', 'սկսել', 'անցկացնել', 'ուսումնասիրող', 'ինչպես սկսել'],
          canonicalQuery: 'սկսել Աստվածաշնչի ուսումնասիրություն',
          broaderQuery: 'Աստվածաշնչի ուսումնասիրություն',
          englishQuery: 'start Bible study',
          topicLabel: 'Աստվածաշնչի ուսումնասիրություն սկսել',
        },
        {
          keywords: ['տառապանք', 'ցավ', 'չարիք', 'ինչու է աստված թույլ տալիս', 'թույլ'],
          canonicalQuery: 'ինչու է Աստված թույլ տալիս տառապանքը',
          broaderQuery: 'տառապանք',
          englishQuery: 'why does God allow suffering',
          topicLabel: 'Ինչու՞ է Աստված թույլ տալիս տառապանքը',
        },
        {
          keywords: ['թագավորություն', 'արքայություն', 'աստծու թագավորություն'],
          canonicalQuery: 'ինչ է Աստծու Թագավորությունը',
          broaderQuery: 'Աստծու Թագավորություն',
          englishQuery: "what is God's Kingdom",
          topicLabel: 'Աստծու Թագավորությունը',
        },
        {
          keywords: ['մահ', 'մահացած', 'հարություն', 'գերեզման', 'ինչ է լինում'],
          canonicalQuery: 'հույս մահացածների համար հարություն',
          broaderQuery: 'հարություն մահ',
          englishQuery: 'resurrection hope what happens when you die',
          topicLabel: 'Մահ և Հարության հույս',
        },
        {
          keywords: ['աղոթք', 'աղոթել', 'լսում է', 'ինչպես աղոթել'],
          canonicalQuery: 'ինչպես աղոթել Աստծուն',
          broaderQuery: 'աղոթք',
          englishQuery: 'how to pray to God',
          topicLabel: 'Աղոթք',
        },
        {
          keywords: ['եհովա', 'աստված', 'արարիչ', 'ով է եհովան', 'անուն'],
          canonicalQuery: 'ով է Եհովա Աստված',
          broaderQuery: 'Եհովա Աստված',
          englishQuery: 'who is Jehovah God',
          topicLabel: 'Եհովա Աստված',
        },
        {
          keywords: ['հույս', 'ապագա', 'դրախտ', 'երկիր', 'երջանիկ'],
          canonicalQuery: 'իրական հույս ապագայի համար դրախտ',
          broaderQuery: 'հույս դրախտ',
          englishQuery: 'hope for future paradise earth',
          topicLabel: 'Հույս ապագայի համար',
        },
        {
          keywords: ['ընտանիք', 'ամուսնություն', 'երեխա', 'ամուսին', 'կին'],
          canonicalQuery: 'ընտանեկան երջանկության գաղտնիքը',
          broaderQuery: 'ընտանիք ամուսնություն',
          englishQuery: 'secret of family happiness marriage',
          topicLabel: 'Ընտանիք և ամուսնություն',
        },
        {
          keywords: ['զրույց', 'տնետուն', 'ծառայություն', 'ինչ ասել', 'քարոզել'],
          canonicalQuery: 'զրույց սկսել ծառայության մեջ',
          broaderQuery: 'ծառայություն տնետուն',
          englishQuery: 'conversations in ministry',
          topicLabel: 'Զրույց սկսել ծառայության մեջ',
        },
      ],
      ru: [
        {
          keywords: ['изучени', 'библи', 'начать', 'проводить', 'как начать изучение'],
          canonicalQuery: 'как начать изучение Библии',
          broaderQuery: 'изучение Библии',
          englishQuery: 'start Bible study',
          topicLabel: 'Как начать изучение Библии',
        },
        {
          keywords: ['страдан', 'боль', 'зло', 'почему бог допускает', 'допускает'],
          canonicalQuery: 'почему Бог допускает страдания',
          broaderQuery: 'страдания',
          englishQuery: 'why does God allow suffering',
          topicLabel: 'Почему Бог допускает страдания',
        },
        {
          keywords: ['царств', 'бога', 'что такое царство'],
          canonicalQuery: 'что такое Царство Бога',
          broaderQuery: 'Царство Бога',
          englishQuery: "what is God's Kingdom",
          topicLabel: 'Царство Бога',
        },
        {
          keywords: ['смерт', 'умерш', 'воскресен', 'что происходит после смерти'],
          canonicalQuery: 'что происходит после смерти воскресение',
          broaderQuery: 'воскресение надежда',
          englishQuery: 'resurrection death hope',
          topicLabel: 'Смерть и надежда на воскресение',
        },
        {
          keywords: ['молитв', 'молиться', 'как молиться'],
          canonicalQuery: 'как правильно молиться Богу',
          broaderQuery: 'молитва',
          englishQuery: 'how to pray to God',
          topicLabel: 'Молитва',
        },
        {
          keywords: ['иегов', 'бог', 'создатель', 'кто такой иегова', 'имя бога'],
          canonicalQuery: 'кто такой Иегова Бог',
          broaderQuery: 'Иегова Бог',
          englishQuery: 'who is Jehovah God',
          topicLabel: 'Кто такой Бог Иегова',
        },
        {
          keywords: ['надежд', 'будущ', 'рай', 'земл', 'будущее'],
          canonicalQuery: 'надежда на будущее рай на земле',
          broaderQuery: 'надежда рай',
          englishQuery: 'hope for future paradise earth',
          topicLabel: 'Надежда на прекрасное будущее',
        },
        {
          keywords: ['семь', 'брак', 'воспитани', 'дети', 'супруг'],
          canonicalQuery: 'секрет семейного счастья брак',
          broaderQuery: 'семья брак',
          englishQuery: 'family marriage happiness',
          topicLabel: 'Семья и брак',
        },
        {
          keywords: ['разговор', 'служени', 'проповеди', 'первое посещение', 'что сказать'],
          canonicalQuery: 'как начать разговор в служении',
          broaderQuery: 'служение проповедь',
          englishQuery: 'conversations in ministry',
          topicLabel: 'Как начать разговор в служении',
        },
      ],
      hi: [
        {
          keywords: ['अध्ययन', 'बाइबल', 'शुरू', 'सिखाना'],
          canonicalQuery: 'बाइबल अध्ययन कैसे शुरू करें',
          broaderQuery: 'बाइबल अध्ययन',
          englishQuery: 'start Bible study',
          topicLabel: 'बाइबल अध्ययन शुरू करना',
        },
        {
          keywords: ['दुख', 'तकलीफ', 'बुराई', 'परमेश्वर क्यों'],
          canonicalQuery: 'परमेश्वर दुख-तकलीफों की अनुमति क्यों देता है',
          broaderQuery: 'दुख-तकलीफ',
          englishQuery: 'why does God allow suffering',
          topicLabel: 'परमेश्वर दुख-तकलीफों की अनुमति क्यों देता है',
        },
        {
          keywords: ['राज्य', 'परमेश्वर का राज्य'],
          canonicalQuery: 'परमेश्वर का राज्य क्या है',
          broaderQuery: 'परमेश्वर का राज्य',
          englishQuery: "what is God's Kingdom",
          topicLabel: 'परमेश्वर का राज्य',
        },
        {
          keywords: ['मौत', 'मरने', 'पुनरुत्थान', 'कब्र'],
          canonicalQuery: 'मौत के बाद क्या होता है पुनरुत्थान',
          broaderQuery: 'पुनरुत्थान आशा',
          englishQuery: 'resurrection hope',
          topicLabel: 'मौत और पुनरुत्थान की आशा',
        },
        {
          keywords: ['प्रार्थना', 'दुआ', 'कैसे प्रार्थना करें'],
          canonicalQuery: 'प्रार्थना कैसे करें परमेश्वर',
          broaderQuery: 'प्रार्थना',
          englishQuery: 'how to pray',
          topicLabel: 'प्रार्थना कैसे करें',
        },
        {
          keywords: ['यहोवा', 'परमेश्वर', 'सृष्टिकर्ता'],
          canonicalQuery: 'यहोवा परमेश्वर कौन है',
          broaderQuery: 'यहोवा',
          englishQuery: 'who is Jehovah God',
          topicLabel: 'यहोवा परमेश्वर कौन है',
        },
        {
          keywords: ['आशा', 'भविष्य', 'फिरदौस', 'धरती'],
          canonicalQuery: 'भविष्य की सच्ची आशा फिरदौस',
          broaderQuery: 'आशा फिरदौस',
          englishQuery: 'hope for future paradise',
          topicLabel: 'भविष्य के लिए आशा',
        },
        {
          keywords: ['परिवार', 'विवाह', 'शादी', 'बच्चे'],
          canonicalQuery: 'पारिवारिक खुशी का राज़ विवाह',
          broaderQuery: 'परिवार विवाह',
          englishQuery: 'family marriage happiness',
          topicLabel: 'पारिवारिक जीवन और विवाह',
        },
        {
          keywords: ['बातचीत', 'प्रचार', 'सेवा', 'शुरू'],
          canonicalQuery: 'प्रचार में बातचीत कैसे शुरू करें',
          broaderQuery: 'प्रचार गवाही',
          englishQuery: 'conversations in ministry',
          topicLabel: 'प्रचार में बातचीत शुरू करना',
        },
      ],
      pa: [
        {
          keywords: ['ਸਟੱਡੀ', 'ਬਾਈਬਲ', 'ਸ਼ੁਰੂ', 'ਸਿਖਾਉਣਾ'],
          canonicalQuery: 'ਬਾਈਬਲ ਸਟੱਡੀ ਕਿਵੇਂ ਸ਼ੁਰੂ ਕਰੀਏ',
          broaderQuery: 'ਬਾਈਬਲ ਸਟੱਡੀ',
          englishQuery: 'start Bible study',
          topicLabel: 'ਬਾਈਬਲ ਸਟੱਡੀ ਸ਼ੁਰੂ ਕਰਨੀ',
        },
        {
          keywords: ['ਦੁੱਖ', 'ਤਕਲੀਫ਼', 'ਬੁਰਾਈ', 'ਰੱਬ ਕਿਉਂ'],
          canonicalQuery: 'ਰੱਬ ਦੁੱਖ-ਤਕਲੀਫ਼ਾਂ ਕਿਉਂ ਆਉਣ ਦਿੰਦਾ ਹੈ',
          broaderQuery: 'ਦੁੱਖ ਤਕਲੀਫ਼',
          englishQuery: 'why does God allow suffering',
          topicLabel: 'ਰੱਬ ਦੁੱਖ-ਤਕਲੀਫ਼ਾਂ ਕਿਉਂ ਆਉਣ ਦਿੰਦਾ ਹੈ',
        },
        {
          keywords: ['ਰਾਜ', 'ਪਰਮੇਸ਼ੁਰ ਦਾ ਰਾਜ'],
          canonicalQuery: 'ਪਰਮੇਸ਼ੁਰ ਦਾ ਰਾਜ ਕੀ ਹੈ',
          broaderQuery: 'ਪਰਮੇਸ਼ੁਰ ਦਾ ਰਾਜ',
          englishQuery: "what is God's Kingdom",
          topicLabel: 'ਪਰਮੇਸ਼ੁਰ ਦਾ ਰਾਜ',
        },
        {
          keywords: ['ਮੌਤ', 'ਮਰਨ', 'ਜੀ ਉੱਠਣ', 'ਕਬਰ'],
          canonicalQuery: 'ਮੌਤ ਤੋਂ ਬਾਅਦ ਕੀ ਹੁੰਦਾ ਹੈ ਜੀ ਉੱਠਣ',
          broaderQuery: 'ਜੀ ਉੱਠਣ ਉਮੀਦ',
          englishQuery: 'resurrection hope',
          topicLabel: 'ਮੌਤ ਅਤੇ ਜੀ ਉੱਠਣ ਦੀ ਉਮੀਦ',
        },
        {
          keywords: ['ਪ੍ਰਾਰਥਨਾ', 'ਦੁਆ', 'ਕਿਵੇਂ ਪ੍ਰਾਰਥਨਾ'],
          canonicalQuery: 'ਪ੍ਰਾਰਥਨਾ ਕਿਵੇਂ ਕਰੀਏ ਰੱਬ',
          broaderQuery: 'ਪ੍ਰਾਰਥਨਾ',
          englishQuery: 'how to pray',
          topicLabel: 'ਪ੍ਰਾਰਥਨਾ ਕਿਵੇਂ ਕਰੀਏ',
        },
        {
          keywords: ['ਯਹੋਵਾਹ', 'ਪਰਮੇਸ਼ੁਰ', 'ਸਿਰਜਣਹਾਰ'],
          canonicalQuery: 'ਯਹੋਵਾਹ ਪਰਮੇਸ਼ੁਰ ਕੌਣ ਹੈ',
          broaderQuery: 'ਯਹੋਵਾਹ',
          englishQuery: 'who is Jehovah God',
          topicLabel: 'ਯਹੋਵਾਹ ਪਰਮੇਸ਼ੁਰ ਕੌਣ ਹੈ',
        },
        {
          keywords: ['ਉਮੀਦ', 'ਭਵਿੱਖ', 'ਫਿਰਦੌਸ', 'ਧਰਤੀ'],
          canonicalQuery: 'ਭਵਿੱਖ ਦੀ ਉਮੀਦ ਧਰਤੀ ਉੱਤੇ ਫਿਰਦੌਸ',
          broaderQuery: 'ਉਮੀਦ ਫਿਰਦੌਸ',
          englishQuery: 'hope for future paradise',
          topicLabel: 'ਭਵਿੱਖ ਲਈ ਉਮੀਦ',
        },
        {
          keywords: ['ਪਰਿਵਾਰ', 'ਵਿਆਹ', 'ਬੱਚੇ'],
          canonicalQuery: 'ਸੁਖੀ ਪਰਿਵਾਰ ਦਾ ਰਾਜ਼ ਵਿਆਹ',
          broaderQuery: 'ਪਰਿਵਾਰ ਵਿਆਹ',
          englishQuery: 'family marriage happiness',
          topicLabel: 'ਪਰਿਵਾਰਕ ਜੀਵਨ ਅਤੇ ਵਿਆਹ',
        },
        {
          keywords: ['ਗੱਲਬਾਤ', 'ਪ੍ਰਚਾਰ', 'ਸੇਵਕਾਈ', 'ਸ਼ੁਰੂ'],
          canonicalQuery: 'ਪ੍ਰਚਾਰ ਵਿਚ ਗੱਲਬਾਤ ਕਿਵੇਂ ਸ਼ੁਰੂ ਕਰੀਏ',
          broaderQuery: 'ਪ੍ਰਚਾਰ ਗਵਾਹੀ',
          englishQuery: 'conversations in ministry',
          topicLabel: 'ਪ੍ਰਚਾਰ ਵਿਚ ਗੱਲਬਾਤ ਸ਼ੁਰੂ ਕਰਨੀ',
        },
      ],
      en: [
        {
          keywords: ['bible study', 'start study', 'conduct study', 'how to start a bible study'],
          canonicalQuery: 'how to start Bible study',
          broaderQuery: 'Bible study',
          englishQuery: 'start Bible study',
          topicLabel: 'Starting a Bible Study',
        },
        {
          keywords: ['suffering', 'pain', 'evil', 'why does god allow', 'allow suffering'],
          canonicalQuery: 'why does God allow suffering',
          broaderQuery: 'suffering',
          englishQuery: 'why does God allow suffering',
          topicLabel: 'Why Does God Allow Suffering',
        },
        {
          keywords: ['kingdom', "god's kingdom", 'what is the kingdom'],
          canonicalQuery: "what is God's Kingdom",
          broaderQuery: "God's Kingdom",
          englishQuery: "God's Kingdom",
          topicLabel: "God's Kingdom",
        },
        {
          keywords: ['death', 'die', 'dead', 'resurrection', 'grave', 'what happens when you die'],
          canonicalQuery: 'resurrection hope what happens when you die',
          broaderQuery: 'resurrection hope',
          englishQuery: 'resurrection hope',
          topicLabel: 'Death and Resurrection Hope',
        },
        {
          keywords: ['pray', 'prayer', 'how to pray', 'answers prayers'],
          canonicalQuery: 'how to pray to God',
          broaderQuery: 'prayer',
          englishQuery: 'how to pray',
          topicLabel: 'Prayer',
        },
        {
          keywords: ['jehovah', 'god', 'creator', 'who is jehovah', "god's name"],
          canonicalQuery: 'who is Jehovah God',
          broaderQuery: 'Jehovah God',
          englishQuery: 'who is Jehovah God',
          topicLabel: 'Who is Jehovah God',
        },
        {
          keywords: ['hope', 'future', 'paradise', 'earth', 'peace'],
          canonicalQuery: 'real hope for the future paradise earth',
          broaderQuery: 'hope paradise',
          englishQuery: 'hope for the future',
          topicLabel: 'Hope for the Future',
        },
        {
          keywords: ['family', 'marriage', 'children', 'husband', 'wife'],
          canonicalQuery: 'secret of family happiness marriage',
          broaderQuery: 'family marriage',
          englishQuery: 'family happiness marriage',
          topicLabel: 'Family and Marriage',
        },
        {
          keywords: ['conversation', 'door', 'householder', 'ministry', 'what to say', 'preach'],
          canonicalQuery: 'how to start conversations in ministry',
          broaderQuery: 'ministry preaching',
          englishQuery: 'conversations in ministry',
          topicLabel: 'Starting Conversations in Ministry',
        },
      ],
    };

    // Check progress keywords
    const pKeywords = progressKeywords[lang] || progressKeywords.en;
    const isProgress = pKeywords.some((kw) => qLower.includes(kw));

    // Check themes
    const themes = ministryThemes[lang] || ministryThemes.en;
    let matchedTheme: MinistryThemePattern | undefined;

    for (const theme of themes) {
      if (theme.keywords.some((kw) => qLower.includes(kw))) {
        matchedTheme = theme;
        break;
      }
    }

    let intent: 'MINISTRY_PROGRESS' | 'JW_RESEARCH' | 'HYBRID' = 'JW_RESEARCH';
    if (isProgress && matchedTheme) {
      intent = 'HYBRID';
    } else if (isProgress) {
      intent = 'MINISTRY_PROGRESS';
    }

    // Generate language-specific queries
    let primarySearchQuery = cleanQ;
    let broaderSearchQuery = cleanQ;
    let englishFallbackQuery = cleanQ;
    let topic = cleanQ;

    if (matchedTheme) {
      primarySearchQuery = matchedTheme.canonicalQuery;
      broaderSearchQuery = matchedTheme.broaderQuery;
      englishFallbackQuery = matchedTheme.englishQuery;
      topic = matchedTheme.topicLabel;
    } else {
      // Clean stop words from cleanQ to build a concise search term in that language
      const stopWords: Record<SupportedLanguage, string[]> = {
        hy: ['ինչպես', 'կարող', 'եմ', 'ես', 'ենք', 'ավելի', 'լավ', 'ինչու', 'ինչ', 'է', 'են', 'որտեղ', 'մասին', 'մեջ', 'համար', 'այս', 'այդ'],
        ru: ['как', 'могу', 'ли', 'я', 'мы', 'лучше', 'почему', 'что', 'где', 'когда', 'о', 'об', 'в', 'на', 'для', 'это', 'этот'],
        hi: ['कैसे', 'कर', 'सकता', 'हूँ', 'हम', 'क्यों', 'क्या', 'कहाँ', 'कब', 'में', 'पर', 'के', 'लिए', 'यह', 'वह', 'और'],
        pa: ['ਕਿਵੇਂ', 'ਕਰ', 'ਸਕਦਾ', 'ਹਾਂ', 'ਅਸੀਂ', 'ਕਿਉਂ', 'ਕੀ', 'ਕਿੱਥੇ', 'ਕਦੋਂ', 'ਵਿਚ', 'ਤੇ', 'ਲਈ', 'ਇਹ', 'ਉਹ', 'ਅਤੇ'],
        en: ['how', 'can', 'i', 'we', 'better', 'why', 'what', 'where', 'when', 'in', 'on', 'for', 'the', 'a', 'an', 'to', 'and'],
      };

      const langStops = new Set(stopWords[lang] || stopWords.en);
      const words = cleanQ.split(/\s+/).filter((w) => w.length > 1 && !langStops.has(w.toLowerCase()));
      if (words.length > 0) {
        primarySearchQuery = words.slice(0, 4).join(' ');
        broaderSearchQuery = words.slice(0, 2).join(' ');
      }
    }

    return {
      language: lang,
      intent,
      topic,
      primarySearchQuery,
      broaderSearchQuery,
      englishFallbackQuery,
      wantsWOL,
      confidence: matchedTheme ? 0.95 : 0.7,
    };
  }

  /**
   * Scripture of encouragement in the user's native language
   */
  static getEncouragementScripture(lang: SupportedLanguage): { text: string; reference: string } {
    switch (lang) {
      case 'hy':
        return {
          text: 'Քանզի Աստված անարդար չէ, որ մոռանա ձեր գործը և այն սերը, որ դրսևորեցիք իր անվան հանդեպ:',
          reference: 'Եբրայեցիներ 6:10',
        };
      case 'ru':
        return {
          text: 'Ибо не неправеден Бог, чтобы забыть дело ваше и труд любви, которую вы оказали во имя Его.',
          reference: 'Евреям 6:10',
        };
      case 'hi':
        return {
          text: 'क्योंकि परमेश्वर अन्यायी नहीं कि तुम्हारे काम और उस प्रेम को भूल जाए जो तुमने उसके नाम के लिए दिखाया।',
          reference: 'इब्रानियों 6:10',
        };
      case 'pa':
        return {
          text: 'ਕਿਉਂਕਿ ਪਰਮੇਸ਼ੁਰ ਅਣਧਰਮੀ ਨਹੀਂ ਹੈ ਕਿ ਉਹ ਤੁਹਾਡੇ ਕੰਮ ਅਤੇ ਉਸ ਪਿਆਰ ਨੂੰ ਭੁੱਲ ਜਾਵੇ ਜੋ ਤੁਸੀਂ ਉਸ ਦੇ ਨਾਂ ਲਈ ਦਿਖਾਇਆ ਹੈ।',
          reference: 'ਇਬਰਾਨੀਆਂ 6:10',
        };
      case 'en':
      default:
        return {
          text: 'For God is not unrighteous so as to forget your work and the love you showed for his name.',
          reference: 'Hebrews 6:10',
        };
    }
  }

  /**
   * User-facing notice when no articles are found in that language
   */
  static getNoSourcesMessage(lang: SupportedLanguage, queryOrTopic: string): string {
    switch (lang) {
      case 'hy':
        return `**JW.ORG** կամ **WOL.JW.ORG**-ում «${queryOrTopic}» թեմայով համապատասխան հրատարակված նյութեր չգտնվեցին: Խնդրում ենք փորձել այլ աստվածաշնչյան բանալի բառեր (օրինակ՝ «հույս», «տառապանք», «Թագավորություն», «աղոթք») կամ որոնել ընդհանուր թեմայով:`;
      case 'ru':
        return `На **JW.ORG** и **WOL.JW.ORG** по теме «${queryOrTopic}» не найдено подходящих опубликованных статей. Попробуйте использовать другие библейские ключевые слова (например: «надежда», «страдания», «Царство», «молитва») или сформулировать вопрос иначе.`;
      case 'hi':
        return `**JW.ORG** या **WOL.JW.ORG** पर "${queryOrTopic}" के लिए कोई उपयुक्त लेख नहीं मिले। कृपया अन्य बाइबल शब्दों (जैसे "आशा", "दुख-तकलीफ", "राज्य", "प्रार्थना") के साथ खोजें।`;
      case 'pa':
        return `**JW.ORG** ਜਾਂ **WOL.JW.ORG** 'ਤੇ "${queryOrTopic}" ਲਈ ਕੋਈ ਲੇਖ ਨਹੀਂ ਮਿਲੇ। ਕਿਰਪਾ ਕਰਕੇ ਹੋਰ ਬਾਈਬਲ ਸ਼ਬਦਾਂ (ਜਿਵੇਂ "ਉਮੀਦ", "ਦੁੱਖ", "ਰਾਜ", "ਪ੍ਰਾਰਥਨਾ") ਨਾਲ ਖੋਜ ਕਰਨ ਦੀ ਕੋਸ਼ਿਸ਼ ਕਰੋ।`;
      case 'en':
      default:
        return `No relevant published articles were found on **JW.ORG** or **WOL.JW.ORG** for "${queryOrTopic}". Please try searching with different Bible keywords (e.g. "hope", "suffering", "Kingdom", "prayer") or a broader subject.`;
    }
  }

  /**
   * User-facing service error message
   */
  static getServiceErrorMessage(lang: SupportedLanguage): string {
    switch (lang) {
      case 'hy':
        return 'Այս պահին հնարավոր չէ կապ հաստատել JW.ORG / WOL որոնողական ծառայության հետ: Խնդրում ենք ստուգել ինտերնետ կապը և փորձել կրկին:';
      case 'ru':
        return 'В данный момент не удалось связаться со службой поиска JW.ORG / WOL. Пожалуйста, проверьте подключение к интернету и повторите попытку.';
      case 'hi':
        return 'इस समय JW.ORG / WOL खोज सेवा से संपर्क नहीं हो सका। कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।';
      case 'pa':
        return 'ਇਸ ਵੇਲੇ JW.ORG / WOL ਖੋਜ ਸੇਵਾ ਨਾਲ ਸੰਪਰਕ ਨਹੀਂ ਹੋ ਸਕਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਇੰਟਰਨੈੱਟ ਕਨੈਕਸ਼ਨ ਚੈੱਕ ਕਰੋ ਅਤੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।';
      case 'en':
      default:
        return 'Unable to reach JW.ORG / WOL.JW.ORG search services at this moment. Please check your internet connection and try again.';
    }
  }
}
