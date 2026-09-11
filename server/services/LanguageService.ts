import { SupportedLanguage } from '../../src/types.js';
import type { CategoryType, ScriptureMatch } from './types.js';

export type { CategoryType, ScriptureMatch };

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

    // Armenian Unicode range (\u0530-\u058F)
    if (/[\u0530-\u058F]/.test(message)) return 'hy';
    // Cyrillic Unicode range (\u0400-\u04FF)
    if (/[\u0400-\u04FF]/.test(message)) return 'ru';
    // Devanagari (Hindi) Unicode range (\u0900-\u097F)
    if (/[\u0900-\u097F]/.test(message)) return 'hi';
    // Gurmukhi (Punjabi) Unicode range (\u0A00-\u0A7F)
    if (/[\u0A00-\u0A7F]/.test(message)) return 'pa';

    // Keyword detection fallbacks
    const lower = message.toLowerCase();
    if (lower.includes('ժամ') || lower.includes('նպատակ') || lower.includes('ծառայություն') || lower.includes('հոդված')) return 'hy';
    if (lower.includes('часы') || lower.includes('цель') || lower.includes('служение') || lower.includes('статья') || lower.includes('библия')) return 'ru';
    if (lower.includes('घंटे') || lower.includes('लक्ष्य') || lower.includes('प्रचार') || lower.includes('बाइबल') || lower.includes('लेख')) return 'hi';
    if (lower.includes('ਘੰਟੇ') || lower.includes('ਨਿਸ਼ਾਨਾ') || lower.includes('ਪ੍ਰਚਾਰ') || lower.includes('ਬਾਈਬਲ') || lower.includes('ਲੇਖ')) return 'pa';

    return this.normalizeLanguage(fallbackLang);
  }

  /**
   * Cleans conversational query phrasing to extract core search terms across all 5 languages
   */
  static cleanSearchQuery(query: string, lang: SupportedLanguage): string {
    let clean = query.trim();

    // Remove punctuation like quotes, question marks, leading bullet points
    clean = clean.replace(/^[?\s•\-"'`]+|[?\s•\-"'`]+$/g, '');

    // Conversational prefixes & filler patterns across languages
    const fillerPatterns: RegExp[] = [
      // English
      /^(?:please\s+)?(?:can\s+you\s+)?(?:search\s+(?:for|jw\.org\s+for|wol\s+for)?|find\s+(?:information\s+(?:about|on)|articles?\s+(?:about|on)|something\s+(?:about|on)|material\s+(?:about|on))?|look\s+up|what\s+does\s+(?:jw\.org|the\s+bible|wol)\s+say\s+about|show\s+me\s+(?:articles?\s+(?:about|on)|information\s+(?:about|on))?|tell\s+me\s+about|do\s+you\s+have\s+articles?\s+(?:about|on)|what\s+are\s+some\s+articles?\s+(?:about|on)|give\s+me\s+(?:information|articles?)\s+(?:about|on)|search\s+jw\.org\s+for|search\s+wol\s+for)\s+/i,
      // Russian
      /^(?:пожалуйста\s*,?\s*)?(?:найди\s+(?:статьи\s+о|информацию\s+о|материалы\s+о|что-нибудь\s+о)?|поищи\s+(?:статьи\s+о|информацию\s+о)?|что\s+(?:говорится\s+на\s+jw\.org|библия\s+говорит|говорит\s+библия)\s+о|покажи\s+(?:статьи\s+о|материалы\s+о)?|расскажи\s+о|поиск\s+(?:в\s+jw\.org|в\s+wol|по\s+теме)?|есть\s+ли\s+статьи\s+о)\s*/i,
      // Armenian
      /^(?:խնդրում\s+եմ\s*,?\s*)?(?:գտիր\s+(?:հոդվածներ\s+|տեղեկություն\s+|նյութեր\s+)?|որոնիր\s+(?:հոդվածներ\s+|տեղեկություն\s+|նյութեր\s+)?|փնտրիր\s+(?:հոդվածներ\s+)?|ի՞նչ\s+է\s+ասում\s+(?:jw\.org-ը|աստվածաշունչը)\s+|ցույց\s+տուր\s+(?:հոդվածներ\s+)?|պատմիր\s+)\s*/i,
      // Hindi
      /^(?:कृपया\s*)?(?:के\s+बारे\s+में\s+(?:खोजें|लेख\s+खोजें|जानकारी\s+खोजें|बताएं)|बाइबल\s+क्या\s+कहती\s+है|jw\.org\s+पर\s+खोजें|खोजें\s+|ढूंढें\s+|दिखाएं\s+)\s*/i,
      // Punjabi
      /^(?:ਕਿਰਪਾ\s+ਕਰਕੇ\s*)?(?:ਬਾਰੇ\s+(?:ਜਾਣਕਾਰੀ\s+ਲੱਭੋ|ਲੇਖ\s+ਲੱਭੋ|ਦੱਸੋ)|ਬਾਈਬਲ\s+ਕੀ\s+ਕਹਿੰਦੀ\s+ਹੈ|jw\.org\s+'ਤੇ\s+ਖੋਜੋ|ਲੱਭੋ\s+|ਦਿਖਾਓ\s+)\s*/i,
    ];

    for (const pattern of fillerPatterns) {
      clean = clean.replace(pattern, '').trim();
    }

    // Trailing query phrases and post-position action verbs across languages
    clean = clean.replace(/\s+(?:in\s+the\s+bible|on\s+jw\.org|in\s+wol|в\s+библии|на\s+jw\.org|в\s+wol|աստվածաշնչում|jw\.org-ում|մասին|बाइबल\s+में|jw\.org\s+पर|के\s+बारे\s+में\s+खोजें|खोजें|ढूंढें|ਬਾਈਬਲ\s+ਵਿੱਚ|jw\.org\s+'ਤੇ|ਬਾਰੇ\s+ਜਾਣਕਾਰੀ|ਲੱਭੋ|ਖੋਜੋ)$/i, '').trim();

    return clean || query.trim();
  }

  /**
   * Recognizes Bible book references and chapter:verse patterns across all 5 languages
   */
  static extractScriptureReference(message: string): ScriptureMatch | null {
    const text = message.trim();

    // Standard English Bible book names pattern
    const enBooks = '(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1\\s*Samuel|2\\s*Samuel|1\\s*Kings|2\\s*Kings|1\\s*Chronicles|2\\s*Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song\\s*of\\s*Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1\\s*Corinthians|2\\s*Corinthians|Galatians|Ephesians|Philippians|Colossians|1\\s*Thessalonians|2\\s*Thessalonians|1\\s*Timothy|2\\s*Timothy|Titus|Philemon|Hebrews|James|1\\s*Peter|2\\s*Peter|1\\s*John|2\\s*John|3\\s*John|Jude|Revelation)';

    // Russian Bible book names
    const ruBooks = '(?:Бытие|Исход|Левит|Числа|Второзаконие|Иисус\\s*Навин|Судьи|Руфь|1\\s*Самуила|2\\s*Самуила|1\\s*Царей|2\\s*Царей|1\\s*Паралипоменон|2\\s*Паралипоменон|Ездра|Неемия|Эсфирь|Иов|Псалмы?|Псалом|Притчи|Экклезиаст|Песнь\\s*Песней|Исайя|Исаия|Иеремия|Плач\\s*Иеремии|Иезекииль|Даниил|Осия|Иоиль|Амос|Авдий|Иона|Михей|Наум|Аввакум|Софония|Аггей|Захария|Малахия|Матфея|Марка|Луки|Иоанна|Деяния|Римлянам|1\\s*Коринфянам|2\\s*Коринфянам|Галатам|Эфесянам|Филиппийцам|Колоссянам|1\\s*Фессалоникийцам|2\\s*Фессалоникийцам|1\\s*Тимофею|2\\s*Тимофею|Титу|Филимону|Евреям|Иакова|1\\s*Петра|2\\s*Петра|1\\s*Иоанна|2\\s*Иоанна|3\\s*Иоанна|Иуды|Откровение)';

    // Armenian Bible book names
    const hyBooks = '(?:Ծննդոց|Ելք|Ղևտական|Թվեր|Երկրորդ\\s*Օրենք|Հեսու|Դատավորներ|Հռութ|1\\s*Սամուել|2\\s*Սամուել|1\\s*Թագավորներ|2\\s*Թագավորներ|1\\s*Տարեգրություն|2\\s*Տարեգրություն|Եզրաս|Նեեմիա|Եսթեր|Հոբ|Սաղմոսներ|Սաղմոս|Առակներ|Ժողովող|Երգ\\s*Երգոց|Եսայիա|Երեմիա|Ողբ|Եզեկիել|Դանիել|Օսեե|Հովել|Ամոս|Աբդիու|Հովնան|Միքիա|Նաում|Ամբակում|Սոփոնիա|Անգե|Զաքարիա|Մաղաքիա|Մատթեոս|Մարկոս|Ղուկաս|Հովհաննես|Գործեր|Հռոմեացիներ|1\\s*Կորնթացիներ|2\\s*Կորնթացիներ|Գաղատացիներ|Եփեսացիներ|Փիլիպպեցիներ|Կողոսացիներ|1\\s*Թեսաղոնիկեցիներ|2\\s*Թեսաղոնիկեցիներ|1\\s*Տիմոթեոս|2\\s*Տիմոթեոս|Տիտոս|Փիլիմոն|Եբրայեցիներ|Հակոբոս|1\\s*Պետրոս|2\\s*Պետրոս|1\\s*Հովհաննես|2\\s*Հովհաննես|3\\s*Հովհաննես|Հուդա|Հայտնություն)';

    // Hindi Bible book names
    const hiBooks = '(?:उत्पत्ति|निर्गमन|लैव्यव्यवस्था|गिनती|व्यवस्थाविवरण|यहोशू|न्यायियों|रूत|1\\s*शमूएल|2\\s*शमूएल|1\\s*राजा|2\\s*राजा|भजन|नीतिवचन|मत्ती|मरकुस|लूका|यूहन्ना|प्रेरितों|रोमियों|1\\s*कुरिन्थियों|2\\s*कुरिन्थियों|गलातियों|इफिसियों|फिलिप्पियों|कुलुस्सियों|1\\s*थिस्सलुनीकियों|2\\s*थिस्सलुनीकियों|1\\s*तीमुथियुस|2\\s*तीमुथियुस|तीतुस|इब्रानियों|याकूब|1\\s*पतरस|2\\s*पतरस|1\\s*यूहन्ना|प्रकाशितवाक्य)';

    // Punjabi Bible book names
    const paBooks = '(?:ਉਤਪਤ|ਕੂਚ|ਲੇਵੀਆਂ|ਗਿਣਤੀ|ਬਿਵਸਥਾ\\s*ਸਾਰ|ਯਸ਼ੂਆ|ਨਿਆਈਆਂ|ਰੂਥ|1\\s*ਸਮੂਏਲ|2\\s*ਸਮੂਏਲ|ਜ਼ਬੂਰ|ਕਹਾਉਤਾਂ|ਮੱਤੀ|ਮਰਕੁਸ|ਲੂਕਾ|ਯੂਹੰਨਾ|ਰਸੂਲਾਂ\\s*ਦੇ\\s*ਕਰਤੱਬ|ਰੋਮੀਆਂ|1\\s*ਕੁਰਿੰਥੀਆਂ|2\\s*ਕੁਰਿੰਥੀਆਂ|ਗਲਾਤੀਆਂ|ਅਫ਼ਸੀਆਂ|ਫ਼ਿਲਿੱਪੀਆਂ|ਕੁਲੁੱਸੀਆਂ|1\\s*ਥੱਸਲੁਨੀਕੀਆਂ|2\\s*ਥੱਸਲੁਨੀਕੀਆਂ|1\\s*ਤਿਮੋਥਿਉਸ|2\\s*ਤਿਮੋਥਿਉਸ|ਤੀਤੁਸ|ਇਬਰਾਨੀਆਂ|ਯਾਕੂਬ|1\\s*ਪਤਰਸ|2\\s*ਪਤਰਸ|1\\s*ਯੂਹੰਨਾ|ਪ੍ਰਕਾਸ਼\\s*ਦੀ\\s*ਪੋਥੀ)';

    // Universal regex without ASCII \b to support Unicode Cyrillic, Armenian, Devanagari, Gurmukhi
    const scriptureRegex = new RegExp(
      `(?:^|[\\s,.:;!?"'«»(])(${enBooks}|${ruBooks}|${hyBooks}|${hiBooks}|${paBooks})\\s*(\\d+)(?:[:.](\\d+(?:[\\-,–\\s]\\d+)*))?(?:$|[\\s,.:;!?"'«»)])`,
      'iu'
    );

    const match = text.match(scriptureRegex);
    if (match) {
      const bookStr = match[1].trim();
      const chapterNum = parseInt(match[2], 10);
      const verseStr = match[3] ? match[3].trim() : undefined;
      return {
        isScripture: true,
        book: bookStr,
        chapter: chapterNum,
        verses: verseStr,
        rawReference: `${bookStr} ${chapterNum}${verseStr ? ':' + verseStr : ''}`,
      };
    }

    return null;
  }

  /**
   * Checks if user message is a follow-up referring to previous search results or advice
   */
  static isFollowUpQuestion(message: string, hasPreviousResults: boolean): boolean {
    if (!hasPreviousResults) return false;
    const lower = message.toLowerCase().trim();

    const followUpIndicators = [
      'which one', 'which of these', 'the first one', 'the second', 'the third', 'the last one',
      'tell me more', 'more about this', 'more details', 'explain the first', 'what about young people',
      'what about youth', 'what about children', 'how does this apply', 'how can i use this',
      'какая из них', 'какой из этих', 'первая статья', 'вторая статья', 'расскажи подробнее',
      'а для молодежи', 'а для детей', 'как применить это',
      'ո՞րն է ավելի լավ', 'առաջին հոդվածը', 'երկրորդ հոդվածը', 'մանրամասնիր', 'իսկ երիտասարդների համար',
      'इनमें से कौन सा', 'पहला लेख', 'दूसरा लेख', 'और विस्तार से बताएं', 'युवाओं के लिए',
      'ਇਨ੍ਹਾਂ ਵਿੱਚੋਂ ਕਿਹੜਾ', 'ਪਹਿਲਾ ਲੇਖ', 'ਦੂਜਾ ਲੇਖ', 'ਹੋਰ ਜਾਣਕਾਰੀ ਦਿਓ', 'ਨੌਜਵਾਨਾਂ ਲਈ'
    ];

    return followUpIndicators.some(ind => lower.includes(ind));
  }

  /**
   * Centralized flexible intent classifier covering all 5 supported languages
   */
  static getLocalizedIntent(
    message: string,
    lang: SupportedLanguage,
    hasPreviousResults: boolean = false
  ): { primaryCategory: CategoryType; isCombined: boolean; searchQuery: string } {
    const lower = message.toLowerCase().trim();
    const cleanSearchTerm = this.cleanSearchQuery(message, lang);

    // 0. Check Contextual Follow-Up
    if (this.isFollowUpQuestion(message, hasPreviousResults)) {
      return { primaryCategory: 'FOLLOW_UP', isCombined: false, searchQuery: cleanSearchTerm };
    }

    // 1. Scripture lookup check
    const scriptureMatch = this.extractScriptureReference(message);
    if (scriptureMatch && scriptureMatch.isScripture) {
      return { primaryCategory: 'BIBLE_SEARCH', isCombined: false, searchQuery: scriptureMatch.rawReference };
    }

    // 2. Progress keywords across languages
    const isProgress =
      lower.includes('progress') || lower.includes('doing') || lower.includes('how am i') || lower.includes('summary') || lower.includes('overview') || lower.includes('month') ||
      lower.includes('առաջընթաց') || lower.includes('ինչպես') || lower.includes('ամիս') || lower.includes('ամսական') ||
      lower.includes('прогресс') || lower.includes('как дела') || lower.includes('месяц') || lower.includes('итоги') ||
      lower.includes('प्रगति') || lower.includes('स्थिति') || lower.includes('महीन') || lower.includes('कैसा') ||
      lower.includes('ਤਰੱਕੀ') || lower.includes('ਪ੍ਰਗਤੀ') || lower.includes('ਮਹੀਨ') || lower.includes('ਕਿਵੇਂ') || lower.includes('ਕਿਹੋ ਜਿਹੀ');

    // 3. Hours keywords across languages
    const isHours =
      lower.includes('hour') || lower.includes('left') || lower.includes('remaining') || lower.includes('completed') || lower.includes('how many') ||
      lower.includes('ժամ') || lower.includes('մնացած') || lower.includes('քանի') ||
      lower.includes('часы') || lower.includes('осталось') || lower.includes('сколько') || lower.includes('записано') ||
      lower.includes('घंटे') || lower.includes('शेष') || lower.includes('कितने') || lower.includes('दर्ज') ||
      lower.includes('ਘੰਟੇ') || lower.includes('ਬਾਕੀ') || lower.includes('ਕਿੰਨੇ') || lower.includes('ਦਰਜ');

    // 4. Goal keywords across languages
    const isGoal =
      lower.includes('goal') || lower.includes('target') || lower.includes('status') || lower.includes('pioneer') ||
      lower.includes('նպատակ') || lower.includes('կարգավիճակ') || lower.includes('ռահվիրա') ||
      lower.includes('цель') || lower.includes('статус') || lower.includes('пионер') ||
      lower.includes('लक्ष्य') || lower.includes('पायनियर') ||
      lower.includes('ਨਿਸ਼ਾਨਾ') || lower.includes('ਪਾਇਨੀਅਰ');

    // 5. History keywords across languages
    const isHistory =
      lower.includes('history') || lower.includes('yesterday') || lower.includes('recent') || lower.includes('logged') || lower.includes('entries') || lower.includes('records') ||
      lower.includes('պատմություն') || lower.includes('գրանցումներ') || lower.includes('վերջին') ||
      lower.includes('история') || lower.includes('записи') || lower.includes('недавно') ||
      lower.includes('इतिहास') || lower.includes('पिछला') || lower.includes('रिकॉर्ड') ||
      lower.includes('ਇਤਿਹਾਸ') || lower.includes('ਰਿਕਾਰਡ');

    // 6. Schedule keywords across languages
    const isSchedule =
      lower.includes('schedule') || lower.includes('calendar') || lower.includes('tomorrow') || lower.includes('weekend') || lower.includes('arrangement') || lower.includes('upcoming') || lower.includes('next') || lower.includes('when is my') || lower.includes('when do i') ||
      lower.includes('ժամանակացույց') || lower.includes('օրացույց') || lower.includes('պայմանավորվածություն') || lower.includes('հաջորդ') || lower.includes('երբ է') || lower.includes('երբ ունեմ') ||
      lower.includes('расписание') || lower.includes('календарь') || lower.includes('запланировано') || lower.includes('встреча') || lower.includes('график') || lower.includes('следующ') || lower.includes('когда мо') || lower.includes('когда служение') ||
      lower.includes('कार्यक्रम') || lower.includes('कैलेंडर') || lower.includes('योजना') || lower.includes('अगला') || lower.includes('कब है') ||
      lower.includes('ਸ਼ੈਡਿਊਲ') || lower.includes('ਕੈਲੰਡਰ') || lower.includes('ਪ੍ਰਬੰਧ') || lower.includes('ਅਗਲਾ') || lower.includes('ਕਦੋਂ ਹੈ');

    // 7. Tips keywords across languages
    const isTips =
      lower.includes('tip') || lower.includes('suggestion') || lower.includes('behind') || lower.includes('improve') || lower.includes('pace') || lower.includes('advice') ||
      lower.includes('խորհուրդ') || lower.includes('առաջարկ') || lower.includes('բարելավել') ||
      lower.includes('совет') || lower.includes('улучшить') || lower.includes('темп') || lower.includes('подсказка') ||
      lower.includes('सुझाव') || lower.includes('सलाह') || lower.includes('सुधार') ||
      lower.includes('ਸੁਝਾਅ') || lower.includes('ਸਲਾਹ');

    // 8. Explicit WOL search
    const isWOLSearch =
      lower.includes('wol') || lower.includes('watchtower library') || lower.includes('insight') || lower.includes('research guide') ||
      lower.includes('գրադարան') || lower.includes('օնլայն') ||
      lower.includes('библиотека') || lower.includes('онлайн') ||
      lower.includes('लाइब्रेरी') ||
      lower.includes('ਲਾਇਬ੍ਰੇਰੀ');

    // 9. General Search Intent words (User explicitly asking to find/search/look up anything)
    const isExplicitSearch =
      lower.includes('search') || lower.includes('find') || lower.includes('article') || lower.includes('show me') ||
      lower.includes('look up') || lower.includes('information') || lower.includes('jw.org') || lower.includes('publication') ||
      lower.includes('поиск') || lower.includes('найди') || lower.includes('поищи') || lower.includes('стать') || lower.includes('материал') ||
      lower.includes('գտիր') || lower.includes('փնտրիր') || lower.includes('հոդված') || lower.includes('տեղեկություն') ||
      lower.includes('खोज') || lower.includes('ढूंढ') || lower.includes('लेख') || lower.includes('जानकारी') ||
      lower.includes('ਖੋਜ') || lower.includes('ਲੱਭ') || lower.includes('ਲੇਖ');

    // Preaching/ministry research intent specifically
    const isMinistryResearch =
      isExplicitSearch ||
      lower.includes('tip') || lower.includes('encouragement') || lower.includes('improve') || lower.includes('how to') || lower.includes('advice') ||
      lower.includes('խրախուսանք') || lower.includes('քաջալերանք') || lower.includes('բարելավել') ||
      lower.includes('ободрение') || lower.includes('улучшить') || lower.includes('совет') ||
      lower.includes('प्रोत्साहन') || lower.includes('सुधार') || lower.includes('ਸੁਝਾਅ') || lower.includes('ਉਤਸ਼ਾਹ') || lower.includes('ਹੌਸਲਾ');

    // 10. Recognizable Spiritual/Bible/Ministry Search Topics
    const isTopicSearch =
      lower.includes('suffering') || lower.includes('pain') || lower.includes('grief') ||
      lower.includes('kingdom') || lower.includes('paradise') || lower.includes('hope') ||
      lower.includes('resurrection') || lower.includes('death') || lower.includes('afterlife') ||
      lower.includes('anxiety') || lower.includes('stress') || lower.includes('worry') || lower.includes('depression') ||
      lower.includes('family') || lower.includes('marriage') || lower.includes('children') || lower.includes('youth') || lower.includes('teen') || lower.includes('young') ||
      lower.includes('patience') || lower.includes('endurance') || lower.includes('faith') || lower.includes('love') || lower.includes('peace') ||
      lower.includes('bible study') || lower.includes('study the bible') || lower.includes('read bible') ||
      lower.includes('prayer') || lower.includes('pray') || lower.includes('forgiveness') || lower.includes('anger') ||
      (isMinistryResearch && (lower.includes('preaching') || lower.includes('ministry') || lower.includes('door to door') || lower.includes('return visit'))) ||
      lower.includes('loneliness') || lower.includes('creation') || lower.includes('evolution') || lower.includes('science') ||
      lower.includes('prophecy') || lower.includes('last days') || lower.includes('holy spirit') || lower.includes('trinity') ||
      // Russian topics
      lower.includes('страдан') || lower.includes('боль') || lower.includes('царств') || lower.includes('надежд') || lower.includes('воскресен') ||
      lower.includes('тревог') || lower.includes('стресс') || lower.includes('беспокойств') || lower.includes('семь') || lower.includes('брак') ||
      lower.includes('молодеж') || lower.includes('подрост') || lower.includes('терпени') || lower.includes('стойкост') || lower.includes('вера') ||
      lower.includes('молитв') || lower.includes('изучение библии') || (isMinistryResearch && (lower.includes('проповед') || lower.includes('служени'))) || lower.includes('одиночеств') ||
      // Armenian topics
      lower.includes('տառապանք') || lower.includes('ցավ') || lower.includes('թագավորություն') || lower.includes('հույս') || lower.includes('հարություն') ||
      lower.includes('անհանգստություն') || lower.includes('սթրես') || lower.includes('ընտանիք') || lower.includes('ամուսնություն') || lower.includes('երիտասարդ') ||
      lower.includes('համբերություն') || lower.includes('հավատ') || lower.includes('աղոթք') || lower.includes('սեր') || (isMinistryResearch && lower.includes('քարոզչություն')) ||
      // Hindi topics
      lower.includes('दुख') || lower.includes('तकलीफ') || lower.includes('राज्य') || lower.includes('आशा') || lower.includes('पुनरुत्थान') ||
      lower.includes('चिंता') || lower.includes('तनाव') || lower.includes('परिवार') || lower.includes('विवाह') || lower.includes('युवा') ||
      lower.includes('धैर्य') || lower.includes('विश्वास') || lower.includes('प्रार्थना') || lower.includes('प्रेम') || lower.includes('शांति') || (isMinistryResearch && lower.includes('प्रचार')) ||
      // Punjabi topics
      lower.includes('ਦੁੱਖ') || lower.includes('ਤਕਲੀਫ਼') || lower.includes('ਰਾਜ') || lower.includes('ਆਸ') || lower.includes('ਮੁੜ-ਜੀਉਂਦਾ') ||
      lower.includes('ਚਿੰਤਾ') || lower.includes('ਤਣਾਅ') || lower.includes('ਪਰਿਵਾਰ') || lower.includes('ਵਿਆਹ') || lower.includes('ਨੌਜਵਾਨ') ||
      lower.includes('ਧੀਰਜ') || lower.includes('ਨਿਹਚਾ') || lower.includes('ਪ੍ਰਾਰਥਨਾ') || lower.includes('ਪਿਆਰ') || lower.includes('ਸ਼ਾਂਤੀ') || (isMinistryResearch && lower.includes('ਪ੍ਰਚਾਰ'));

    // Schedule check priority: If user asks about their schedule or next arrangement, it's a schedule query
    if (isSchedule && !isExplicitSearch) {
      return { primaryCategory: 'MINISTRY_SCHEDULE', isCombined: false, searchQuery: cleanSearchTerm };
    }

    const progressCount = (isProgress ? 1 : 0) + (isHours ? 1 : 0) + (isGoal ? 1 : 0) + (isHistory ? 1 : 0) + (isSchedule ? 1 : 0) + (isTips ? 1 : 0);
    const searchCount = (isExplicitSearch ? 1 : 0) + (isTopicSearch ? 1 : 0) + (isWOLSearch ? 1 : 0);

    // Combined request: both tracker data + search request
    if (progressCount > 0 && searchCount > 0) {
      return { primaryCategory: 'COMBINED', isCombined: true, searchQuery: cleanSearchTerm };
    }

    if (isWOLSearch) {
      return { primaryCategory: 'WOL_SEARCH', isCombined: false, searchQuery: cleanSearchTerm };
    }

    if (isExplicitSearch || isTopicSearch) {
      return { primaryCategory: 'JW_SEARCH', isCombined: false, searchQuery: cleanSearchTerm };
    }

    if (isHours) return { primaryCategory: 'MINISTRY_HOURS', isCombined: false, searchQuery: cleanSearchTerm };
    if (isGoal) return { primaryCategory: 'MINISTRY_GOAL', isCombined: false, searchQuery: cleanSearchTerm };
    if (isHistory) return { primaryCategory: 'MINISTRY_HISTORY', isCombined: false, searchQuery: cleanSearchTerm };
    if (isSchedule) return { primaryCategory: 'MINISTRY_SCHEDULE', isCombined: false, searchQuery: cleanSearchTerm };
    if (isTips) return { primaryCategory: 'MINISTRY_TIPS', isCombined: false, searchQuery: cleanSearchTerm };
    if (isProgress) return { primaryCategory: 'MINISTRY_PROGRESS', isCombined: false, searchQuery: cleanSearchTerm };

    // If query has at least 2 words and is not just a greeting, treat as open-ended topic search!
    const wordCount = message.trim().split(/\s+/).length;
    if (wordCount >= 2 && !lower.includes('hello') && !lower.includes('hi') && !lower.includes('привет') || wordCount >= 3) {
      return { primaryCategory: 'JW_SEARCH', isCombined: false, searchQuery: cleanSearchTerm };
    }

    return { primaryCategory: 'GENERAL', isCombined: false, searchQuery: cleanSearchTerm };
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
    return months[lang][validIndex];
  }

  /**
   * Localized Publisher Status Display Names
   */
  static getPublisherStatusDisplayName(status: string, lang: SupportedLanguage): string {
    const statusMap: Record<string, Record<SupportedLanguage, string>> = {
      PUBLISHER: {
        en: 'Publisher',
        hy: 'Քարոզիչ',
        ru: 'Возвещатель',
        hi: 'प्रकाशक',
        pa: 'ਪ੍ਰਚਾਰਕ',
      },
      AUXILIARY_PIONEER: {
        en: 'Auxiliary Pioneer (30h)',
        hy: 'Ենթառահվիրա (30ժ)',
        ru: 'Подсобный пионер (30 ч.)',
        hi: 'सहायक पायनियर (30 घंटे)',
        pa: 'ਸਹਾਇਕ ਪਾਇਨੀਅਰ (30 ਘੰਟੇ)',
      },
      AUXILIARY_PIONEER_15: {
        en: 'Auxiliary Pioneer (15h)',
        hy: 'Ենթառահվիրա (15ժ)',
        ru: 'Подсобный пионер (15 ч.)',
        hi: 'सहायक पायनियर (15 घंटे)',
        pa: 'ਸਹਾਇਕ ਪਾਇਨੀਅਰ (15 ਘੰਟੇ)',
      },
      AUXILIARY_PIONEER_30: {
        en: 'Auxiliary Pioneer (30h)',
        hy: 'Ենթառահվիրա (30ժ)',
        ru: 'Подсобный пионер (30 ч.)',
        hi: 'सहायक पायनियर (30 घंटे)',
        pa: 'ਸਹਾਇਕ ਪਾਇਨੀਅਰ (30 ਘੰਟੇ)',
      },
      PIONEER: {
        en: 'Regular Pioneer (50h)',
        hy: 'Ընդհանուր ռահվիրա (50ժ)',
        ru: 'Общий пионер (50 ч.)',
        hi: 'नियमित पायनियर (50 घंटे)',
        pa: 'ਰੈਗੂਲਰ ਪਾਇਨੀਅਰ (50 ਘੰਟੇ)',
      },
      REGULAR_PIONEER_50: {
        en: 'Regular Pioneer (50h)',
        hy: 'Ընդհանուր ռահվիրա (50ժ)',
        ru: 'Общий пионер (50 ч.)',
        hi: 'नियमित पायनियर (50 घंटे)',
        pa: 'ਰੈਗੂਲਰ ਪਾਇਨੀਅਰ (50 ਘੰਟੇ)',
      },
      SPECIAL_PIONEER: {
        en: 'Special Pioneer (100h)',
        hy: 'Հատուկ ռահվիրա (100ժ)',
        ru: 'Специальный пионер (100 ч.)',
        hi: 'विशेष पायनियर (100 घंटे)',
        pa: 'ਖ਼ਾਸ ਪਾਇਨੀਅਰ (100 ਘੰਟੇ)',
      },
      SPECIAL_PIONEER_100: {
        en: 'Special Pioneer (100h)',
        hy: 'Հատուկ ռահվիրա (100ժ)',
        ru: 'Специальный пионер (100 ч.)',
        hi: 'विशेष पायनियर (100 घंटे)',
        pa: 'ਖ਼ਾਸ ਪਾਇਨੀਅਰ (100 ਘੰਟੇ)',
      },
      CUSTOM: {
        en: 'Custom Goal',
        hy: 'Անհատական նպատակ',
        ru: 'Индивидуальная цель',
        hi: 'कस्टम लक्ष्य',
        pa: 'ਕਸਟਮ ਨਿਸ਼ਾਨਾ',
      },
    };

    return statusMap[status]?.[lang] || statusMap[status]?.['en'] || status;
  }

  /**
   * Localized "No search results found" message
   */
  static getNoResultsMessage(topic: string, lang: SupportedLanguage, source: 'JW.ORG' | 'WOL.JW.ORG' = 'JW.ORG'): string {
    const cleanTopic = topic.trim();
    switch (lang) {
      case 'hy':
        return `«**${cleanTopic}**» թեմայով համապատասխան հոդվածներ չեն գտնվել **${source}**-ում:\n\n💡 *Առաջարկ*՝ Փորձեք օգտագործել այլ բանալի բառեր կամ որոնել անմիջապես պաշտոնական [${source}](https://www.${source.toLowerCase()}) կայքում։`;
      case 'ru':
        return `По запросу «**${cleanTopic}**» на **${source}** не найдено достаточно точных совпадений.\n\n💡 *Совет*: Попробуйте изменить ключевые слова или поискать напрямую на официальном сайте [${source}](https://www.${source.toLowerCase()}).`;
      case 'hi':
        return `«**${cleanTopic}**» के लिए **${source}** पर कोई सटीक मेल नहीं मिला।\n\n💡 *सुझाव*: अन्य कीवर्ड आज़माएं या सीधे आधिकारिक [${source}](https://www.${source.toLowerCase()}) पर खोजें।`;
      case 'pa':
        return `«**${cleanTopic}**» ਲਈ **${source}** 'ਤੇ ਕੋਈ ਸਹੀ ਮੇਲ ਨਹੀਂ ਮਿਲਿਆ।\n\n💡 *ਸੁਝਾਅ*: ਹੋਰ ਸ਼ਬਦ ਵਰਤ ਕੇ ਵੇਖੋ ਜਾਂ ਸਿੱਧਾ ਅਧਿਕਾਰਤ [${source}](https://www.${source.toLowerCase()}) 'ਤੇ ਖੋਜ ਕਰੋ।`;
      default:
        return `No sufficiently relevant articles matching "**${cleanTopic}**" were found on **${source}**.\n\n💡 *Tip*: Try refining your search terms with broader concepts, or search directly on official [${source}](https://www.${source.toLowerCase()}).`;
    }
  }

  /**
   * Localized Suggestions dynamically tailored to context
   */
  static getLocalizedSuggestions(lang: SupportedLanguage, category?: CategoryType): string[] {
    if (category === 'JW_SEARCH' || category === 'WOL_SEARCH' || category === 'BIBLE_SEARCH') {
      switch (lang) {
        case 'hy':
          return [
            'Ո՞րն է ավելի լավ երիտասարդների համար',
            'Ինչպե՞ս կարող եմ սա կիրառել քարոզչության մեջ',
            'Փնտրել համբերության մասին հոդվածներ',
            'Իմ այս ամսվա առաջընթացը',
          ];
        case 'ru':
          return [
            'Какая из этих статей лучше подойдет для молодежи?',
            'Как применить это в проповеди?',
            'Найди статьи о терпении',
            'Мой прогресс за этот месяц',
          ];
        case 'hi':
          return [
            'इनमें से कौन सा लेख युवाओं के लिए सबसे अच्छा है?',
            'प्रचार में इसका उपयोग कैसे करें?',
            'धैर्य के बारे में लेख खोजें',
            'इस महीने की मेरी प्रगति',
          ];
        case 'pa':
          return [
            'ਇਨ੍ਹਾਂ ਵਿੱਚੋਂ ਕਿਹੜਾ ਲੇਖ ਨੌਜਵਾਨਾਂ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਹੈ?',
            'ਪ੍ਰਚਾਰ ਵਿੱਚ ਇਸ ਨੂੰ ਕਿਵੇਂ ਲਾਗੂ ਕਰੀਏ?',
            'ਧੀਰਜ ਬਾਰੇ ਲੇਖ ਲੱਭੋ',
            'ਇਸ ਮਹੀਨੇ ਦੀ ਮੇਰੀ ਤਰੱਕੀ',
          ];
        default:
          return [
            'Which of these is best for young people?',
            'How can I use this in my ministry?',
            'Search for articles about patience',
            'My progress this month',
          ];
      }
    }

    // Default primary questions
    switch (lang) {
      case 'hy':
        return [
          'Ինչպե՞ս է իմ ծառայության առաջընթացն այս ամիս',
          'Քանի՞ ժամ է ինձ մնացել նպատակին հասնելու համար',
          'Հոդվածներ տառապանքի և ցավի պատճառների մասին',
          'Փնտրել խրախուսանք քարոզչության մասին',
        ];
      case 'ru':
        return [
          'Как продвигается мое служение в этом месяце?',
          'Сколько часов мне осталось до цели?',
          'Статьи о том, почему Бог допускает страдания',
          'Найди ободрение для проповеднического служения',
        ];
      case 'hi':
        return [
          'इस महीने मेरी प्रचार प्रगति कैसी है?',
          'मुझे अपने लक्ष्य तक पहुँचने के लिए कितने घंटे बाकी हैं?',
          'ईश्वर दुख-तकलीफों की अनुमति क्यों देता है?',
          'प्रचार कार्य के लिए प्रोत्साहन खोजें',
        ];
      case 'pa':
        return [
          'ਇਸ ਮਹੀਨੇ ਮੇਰੇ ਪ੍ਰਚਾਰ ਦੀ ਤਰੱਕੀ ਕਿਵੇਂ ਹੈ?',
          'ਮੈਨੂੰ ਆਪਣੇ ਨਿਸ਼ਾਨੇ ਤੱਕ ਪਹੁੰਚਣ ਲਈ ਕਿੰਨੇ ਘੰਟੇ ਬਾਕੀ ਹਨ?',
          'ਪਰਮੇਸ਼ੁਰ ਦੁੱਖਾਂ ਦੀ ਇਜਾਜ਼ਤ ਕਿਉਂ ਦਿੰਦਾ ਹੈ?',
          'ਪ੍ਰਚਾਰ ਕੰਮ ਲਈ ਉਤਸ਼ਾਹ ਲੱਭੋ',
        ];
      default:
        return [
          'How is my ministry progress this month?',
          'How many hours do I have left to reach my goal?',
          'Articles on why God allows suffering',
          'Search for encouragement about preaching',
        ];
    }
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
