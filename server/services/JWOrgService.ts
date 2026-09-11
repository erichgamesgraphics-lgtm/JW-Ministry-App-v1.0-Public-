import { SearchResult } from './types.js';
import { LanguageService } from './LanguageService.js';
import { SupportedLanguage } from '../../src/types.js';

export interface MultilingualJWArticle {
  id: string;
  url: string;
  source: 'JW.ORG';
  bibleVerses: string[];
  topicKeywords: string[];
  localizations: Record<SupportedLanguage, { title: string; snippet: string; publication: string }>;
}

export const VERIFIED_JW_ARTICLES_CATALOG: MultilingualJWArticle[] = [
  {
    id: 'jw-suffering-1',
    url: 'https://www.jw.org/en/library/series/more-topics/what-does-bible-say-about-suffering/',
    source: 'JW.ORG',
    bibleVerses: ['Revelation 21:4', 'James 1:13', '1 John 5:19'],
    topicKeywords: ['suffering', 'pain', 'suffer', 'hardship', 'tragedy', 'why god allows', 'grief', 'տառապանք', 'ցավ', 'страдания', 'боль', 'дух', 'तकलीफ', 'ਦੁੱਖ'],
    localizations: {
      en: {
        title: 'What Does the Bible Say About Suffering?',
        snippet: 'Why is there so much suffering in the world? Is God responsible for our pain, or does he care about us? Find comforting answers from the Bible.',
        publication: 'Bible Teachings & Answers',
      },
      hy: {
        title: 'Ինչ է ասում Աստվածաշունչը տառապանքի մասին',
        snippet: 'Ինչու է աշխարհում այդքան տառապանք։ Արդյոք Աստված է պատասխանատու մեր ցավի համար, թե նա հոգ է տանում մեր մասին։',
        publication: 'Աստվածաշնչյան Ուսմունքներ',
      },
      ru: {
        title: 'Что Библия говорит о страданиях?',
        snippet: 'Почему в мире так много страданий? Виновен ли Бог в нашей боли или он заботится о нас? Узнайте утешительные ответы из Библии.',
        publication: 'Библейские Учения',
      },
      hi: {
        title: 'बाइबल दुख-तकलीफों के बारे में क्या कहती है?',
        snippet: 'दुनिया में इतनी दुख-तकलीफें क्यों हैं? क्या ईश्वर हमारे दुख के लिए जिम्मेदार है या वह हमारी परवाह करता है?',
        publication: 'बाइबल की शिक्षाएं',
      },
      pa: {
        title: 'ਬਾਈਬਲ ਦੁੱਖ-ਤਕਲੀਫ਼ਾਂ ਬਾਰੇ ਕੀ ਕਹਿੰਦੀ ਹੈ?',
        snippet: 'ਦੁਨੀਆਂ ਵਿੱਚ ਇੰਨੀਆਂ ਦੁੱਖ-ਤਕਲੀਫ਼ਾਂ ਕਿਉਂ ਹਨ? ਕੀ ਪਰਮੇਸ਼ੁਰ ਸਾਡੇ ਦੁੱਖਾਂ ਲਈ ਜ਼ਿੰਮੇਵਾਰ ਹੈ?',
        publication: 'ਬਾਈਬਲ ਦੀਆਂ ਸਿੱਖਿਆਵਾਂ',
      },
    },
  },
  {
    id: 'jw-kingdom-1',
    url: 'https://www.jw.org/en/bible-teachings/questions/what-is-gods-kingdom/',
    source: 'JW.ORG',
    bibleVerses: ['Daniel 2:44', 'Matthew 6:9, 10', 'Isaiah 9:6, 7'],
    topicKeywords: ['kingdom', 'gods kingdom', 'government', 'paradise', 'rule', 'jesus king', 'թագավորություն', 'царство', 'राज्य', 'ਰਾਜ'],
    localizations: {
      en: {
        title: 'What Is God’s Kingdom?',
        snippet: 'God’s Kingdom is a real government established by God in heaven. Jesus Christ is its King, and it will soon rule over all the earth with peace and righteousness.',
        publication: 'Bible Questions Answered',
      },
      hy: {
        title: 'Ինչ է Աստծու Թագավորությունը',
        snippet: 'Աստծու Թագավորությունը իրական կառավարություն է երկնքում։ Հիսուս Քրիստոսը նրա Թագավորն է, որը շուտով խաղաղություն կբերի երկրին։',
        publication: 'Աստվածաշնչյան Հարցեր',
      },
      ru: {
        title: 'Что такое Царство Бога?',
        snippet: 'Царство Бога — это реальное небесное правительство. Иисус Христос — его Царь, который вскоре установит мир на всей земле.',
        publication: 'Ответы на Библейские Вопросы',
      },
      hi: {
        title: 'परमेश्वर का राज्य क्या है?',
        snippet: 'ईश्वर का राज्य स्वर्ग में स्थापित एक वास्तविक सरकार है। यीशु मसीह इसका राजा है और यह जल्द ही पृथ्वी पर शांति लाएगी।',
        publication: 'बाइबल के प्रश्नों के उत्तर',
      },
      pa: {
        title: 'ਪਰਮੇਸ਼ੁਰ ਦਾ ਰਾਜ ਕੀ ਹੈ?',
        snippet: 'ਪਰਮੇਸ਼ੁਰ ਦਾ ਰਾਜ ਸਵਰਗ ਵਿੱਚ ਸਥਾਪਿਤ ਇੱਕ ਅਸਲ ਸਰਕਾਰ ਹੈ। ਯਿਸੂ ਮਸੀਹ ਇਸ ਦਾ ਰਾਜਾ ਹੈ।',
        publication: 'ਬਾਈਬਲ ਦੇ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ',
      },
    },
  },
  {
    id: 'jw-hope-1',
    url: 'https://www.jw.org/en/library/magazines/watchtower-no2-2021-may-jun/',
    source: 'JW.ORG',
    bibleVerses: ['Jeremiah 29:11', 'Romans 15:13', 'Psalm 37:11'],
    topicKeywords: ['hope', 'future', 'encouragement', 'better world', 'promises', 'հույս', 'надежда', 'आशा', 'ਆਸ'],
    localizations: {
      en: {
        title: 'Real Hope for a Better Tomorrow',
        snippet: 'Where can we find reliable hope when facing life’s challenges? The Bible offers a guaranteed promise of a world free from sickness, war, and death.',
        publication: 'The Watchtower',
      },
      hy: {
        title: 'Իրական Հույս Ապագայի Համար',
        snippet: 'Որտեղ կարող ենք գտնել հուսալի հույս։ Աստվածաշունչն առաջարկում է երաշխավորված խոստում՝ առանց հիվանդությունների և պատերազմների աշխարհի մասին։',
        publication: 'Դիտարան',
      },
      ru: {
        title: 'Надежная Надежда на Лучшее Будущее',
        snippet: 'Где найти надежду в трудное время? Библия гарантирует будущее без болезней, войн и страданий.',
        publication: 'Сторожевая Башня',
      },
      hi: {
        title: 'एक बेहतर कल की सच्ची आशा',
        snippet: 'जीवन की चुनौतियों का सामना करते समय हमें सच्ची आशा कहाँ से मिल सकती है? बाइबल एक बेहतर भविष्य का वादा करती है।',
        publication: 'प्रहरीदुर्ग',
      },
      pa: {
        title: 'ਬਿਹਤਰ ਭਵਿੱਖ ਦੀ ਅਸਲ ਆਸ',
        snippet: 'ਮੁਸ਼ਕਲ ਸਮੇਂ ਵਿੱਚ ਸਾਨੂੰ ਭਰੋਸੇਯੋਗ ਆਸ ਕਿੱਥੋਂ ਮਿਲ ਸਕਦੀ ਹੈ? ਬਾਈਬਲ ਬਿਮਾਰੀਆਂ ਅਤੇ ਦੁੱਖਾਂ ਤੋਂ ਮੁਕਤ ਦੁਨੀਆਂ ਦਾ ਵਾਅਦਾ ਕਰਦੀ ਹੈ।',
        publication: 'ਪਹਿਰਾਬੁਰਜ',
      },
    },
  },
  {
    id: 'jw-resurrection-1',
    url: 'https://www.jw.org/en/bible-teachings/questions/what-is-the-resurrection/',
    source: 'JW.ORG',
    bibleVerses: ['Acts 24:15', 'John 5:28, 29', 'Luke 7:11-15'],
    topicKeywords: ['resurrection', 'death', 'dead', 'passed away', 'grave', 'grief', 'հարություն', 'մահ', 'воскресение', 'смерть', 'पुनरुत्थान', 'मृत्यु', 'ਮੁੜ-ਜੀਉਂਦਾ'],
    localizations: {
      en: {
        title: 'What Is the Resurrection?',
        snippet: 'The Bible promises that millions who have died will live again right here on a restored paradise earth. Learn how this hope provides comfort.',
        publication: 'Bible Questions Answered',
      },
      hy: {
        title: 'Ինչ է Հարությունը',
        snippet: 'Աստվածաշունչը խոստանում է, որ մահացած միլիոնավոր մարդիկ կրկին կապրեն դրախտ երկրի վրա։',
        publication: 'Աստվածաշնչյան Հարցեր',
      },
      ru: {
        title: 'Что такое воскресение мертвых?',
        snippet: 'Библия обещает, что миллионы умерших вернутся к жизни на райской земле. Узнайте, как эта надежда приносит утешение.',
        publication: 'Ответы на Библейские Вопросы',
      },
      hi: {
        title: 'पुनरुत्थान क्या है?',
        snippet: 'बाइबल वादा करती है कि लाखों लोग जो मर चुके हैं वे इस सुंदर पृथ्वी पर फिर से जीवित होंगे।',
        publication: 'बाइबल के प्रश्नों के उत्तर',
      },
      pa: {
        title: 'ਮੁਰਦਿਆਂ ਦਾ ਜੀ ਉੱਠਣਾ ਕੀ ਹੈ?',
        snippet: 'ਬਾਈਬਲ ਵਾਅਦਾ ਕਰਦੀ ਹੈ ਕਿ ਮਰ ਚੁੱਕੇ ਲੱਖਾਂ ਲੋਕ ਇਸ ਸੋਹਣੀ ਧਰਤੀ ਉੱਤੇ ਦੁਬਾਰਾ ਜੀਉਂਦੇ ਹੋਣਗੇ।',
        publication: 'ਬਾਈਬਲ ਦੇ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ',
      },
    },
  },
  {
    id: 'jw-anxiety-1',
    url: 'https://www.jw.org/en/bible-teachings/peace-happiness/anxiety-stress/',
    source: 'JW.ORG',
    bibleVerses: ['Philippians 4:6, 7', '1 Peter 5:7', 'Matthew 6:34'],
    topicKeywords: ['anxiety', 'stress', 'worry', 'worried', 'nervous', 'panic', 'fear', 'mental health', 'անհանգստություն', 'սթրես', 'վախ', 'тревога', 'тревоге', 'тревоги', 'стресс', 'беспокойство', 'беспокойствах', 'беспокойства', 'переживания', 'चिंता', 'तनाव', 'ਚਿੰਤਾ', 'ਤਣਾਅ'],
    localizations: {
      en: {
        title: 'How Can the Bible Help With Anxiety and Worry?',
        snippet: 'Practical steps from God’s Word to find inner calm, throw your anxieties upon Jehovah in prayer, and deal with daily stress.',
        publication: 'Peace and Happiness',
      },
      hy: {
        title: 'Ինչպես կարող է Աստվածաշունչը օգնել անհանգստության ժամանակ',
        snippet: 'Գործնական խորհուրդներ Աստծու Խոսքից՝ ներքին խաղաղություն գտնելու և ձեր բոլոր հոգսերը Եհովայի վրա գցելու մասին։',
        publication: 'Խաղաղություն և Երջանկություն',
      },
      ru: {
        title: 'Как Библия помогает справляться с тревогой и стрессом?',
        snippet: 'Практические библейские советы о том, как обрести душевный покой, доверить свои переживания Богу в молитве и победить тревогу.',
        publication: 'Мир и Счастье',
      },
      hi: {
        title: 'बाइबल चिंता और तनाव से निपटने में कैसे मदद कर सकती है?',
        snippet: 'परमेश्वर के वचन से व्यावहारिक कदम: आंतरिक शांति पाना, अपनी चिंताओं को प्रार्थना में यहोवा पर डालना और तनाव से निपटना।',
        publication: 'शांति और खुशी',
      },
      pa: {
        title: 'ਬਾਈਬਲ ਚਿੰਤਾ ਅਤੇ ਤਣਾਅ ਨਾਲ ਨਜਿੱਠਣ ਵਿਚ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੀ ਹੈ?',
        snippet: 'ਰੱਬ ਦੇ ਬਚਨ ਵਿੱਚੋਂ ਵਿਹਾਰਕ ਕਦਮ: ਮਨ ਦੀ ਸ਼ਾਂਤੀ ਪਾਉਣਾ ਅਤੇ ਆਪਣੀਆਂ ਸਾਰੀਆਂ ਚਿੰਤਾਵਾਂ ਯਹੋਵਾਹ ਪਰਮੇਸ਼ੁਰ ਉੱਤੇ ਸੁੱਟਣਾ।',
        publication: 'ਸ਼ਾਂਤੀ ਅਤੇ ਖ਼ੁਸ਼ੀ',
      },
    },
  },
  {
    id: 'jw-family-worship-1',
    url: 'https://www.jw.org/en/library/magazines/w20140315/family-worship/',
    source: 'JW.ORG',
    bibleVerses: ['Deuteronomy 6:6, 7', 'Ephesians 6:4', 'Psalm 78:4'],
    topicKeywords: ['family worship', 'family study', 'worship evening', 'spiritual habits', 'children', 'ընտանեկան երկրպագություն', 'семейное поклонение', 'семья', 'परिवारिक आराधना', 'ਪਰਿਵਾਰਕ ਭਗਤੀ'],
    localizations: {
      en: {
        title: 'Family Worship — Practical Ideas and Encouragement',
        snippet: 'How to make your regular Family Worship evening lively, spiritually rewarding, engaging for children, and strengthening for the whole family.',
        publication: 'The Watchtower',
      },
      hy: {
        title: 'Ընտանեկան Երկրպագություն — Գործնական Գաղափարներ',
        snippet: 'Ինչպես դարձնել ընտանեկան երկրպագության երեկոն հետաքրքիր, ուսուցողական երեխաների համար և ամրապնդել ընտանիքը։',
        publication: 'Դիտարան',
      },
      ru: {
        title: 'Семейное поклонение — практические советы и ободрение',
        snippet: 'Как сделать вечер для семейного поклонения интересным, полезным для детей и созидающим для всей семьи.',
        publication: 'Сторожевая Башня',
      },
      hi: {
        title: 'पारिवारिक आराधना — व्यावहारिक विचार और प्रोत्साहन',
        snippet: 'अपने नियमित पारिवारिक अध्ययन को बच्चों के लिए रोचक और पूरे परिवार के लिए आध्यात्मिक रूप से मजबूत कैसे बनाएं।',
        publication: 'प्रहरीदुर्ग',
      },
      pa: {
        title: 'ਪਰਿਵਾਰਕ ਭਗਤੀ — ਵਿਹਾਰਕ ਸੁਝਾਅ ਅਤੇ ਉਤਸ਼ਾਹ',
        snippet: 'ਆਪਣੀ ਪਰਿਵਾਰਕ ਸਟੱਡੀ ਨੂੰ ਦਿਲਚਸਪ ਅਤੇ ਪੂਰੇ ਪਰਿਵਾਰ ਨੂੰ ਮਜ਼ਬੂਤ ਕਰਨ ਵਾਲੀ ਕਿਵੇਂ ਬਣਾਈਏ।',
        publication: 'ਪਹਿਰਾਬੁਰਜ',
      },
    },
  },
  {
    id: 'jw-youth-1',
    url: 'https://www.jw.org/en/bible-teachings/teenagers/',
    source: 'JW.ORG',
    bibleVerses: ['Ecclesiastes 12:1', '1 Timothy 4:12', 'Psalm 119:9'],
    topicKeywords: ['young people', 'youth', 'teen', 'teenagers', 'school', 'peer pressure', 'երիտասարդ', 'молодежь', 'подростки', 'युवा', 'किशोर', 'ਨੌਜਵਾਨ'],
    localizations: {
      en: {
        title: 'Questions Young People Ask — Answers That Work',
        snippet: 'Reliable Bible-based answers for teenagers facing peer pressure, school challenges, friendships, social media, and preparing for the future.',
        publication: 'Teenagers & Youth',
      },
      hy: {
        title: 'Երիտասարդների Հարցերը — Գործնական Պատասխաններ',
        snippet: 'Աստվածաշնչյան հուսալի պատասխաններ պատանիների համար՝ դպրոցական դժվարությունների, ընկերության և նպատակների մասին։',
        publication: 'Երիտասարդներ',
      },
      ru: {
        title: 'Вопросы молодежи — практические советы',
        snippet: 'Надежные библейские ответы для подростков: как противостоять давлению сверстников, преодолевать трудности в школе и ставить цели.',
        publication: 'Для Молодежи',
      },
      hi: {
        title: 'युवाओं के सवाल — उपयोगी जवाब',
        snippet: 'किशोरों और युवाओं के लिए बाइबल आधारित विश्वसनीय सलाह: साथियों के दबाव, स्कूल की चुनौतियों और भविष्य की तैयारी से कैसे निपटें।',
        publication: 'युवा और किशोर',
      },
      pa: {
        title: 'ਨੌਜਵਾਨਾਂ ਦੇ ਸਵਾਲ — ਲਾਭਦਾਇਕ ਜਵਾਬ',
        snippet: 'ਨੌਜਵਾਨਾਂ ਲਈ ਬਾਈਬਲ ਆਧਾਰਿਤ ਭਰੋਸੇਯੋਗ ਸਲਾਹ: ਸਕੂਲ ਦੀਆਂ ਮੁਸ਼ਕਲਾਂ ਅਤੇ ਸੱਚੇ ਦੋਸਤ ਬਣਾਉਣ ਬਾਰੇ।',
        publication: 'ਨੌਜਵਾਨ',
      },
    },
  },
  {
    id: 'jw-patience-1',
    url: 'https://www.jw.org/en/library/magazines/w20120915/patience-endurance/',
    source: 'JW.ORG',
    bibleVerses: ['Galatians 5:22', 'James 5:7, 8', 'Colossians 3:12'],
    topicKeywords: ['patience', 'patient', 'endurance', 'waiting', 'self-control', 'համբերություն', 'տոկունություն', 'терпение', 'стойкость', 'धैर्य', 'धीरज'],
    localizations: {
      en: {
        title: 'Developing True Patience and Endurance',
        snippet: 'Why is patience an essential fruit of God’s holy spirit? How does patience help us endure trials, treat others with love, and wait upon Jehovah?',
        publication: 'The Watchtower',
      },
      hy: {
        title: 'Ինչպես զարգացնել իսկական համբերություն և տոկունություն',
        snippet: 'Ինչու է համբերությունը սուրբ ոգու կարևոր պտուղ։ Ինչպես է այն օգնում դիմանալ դժվարություններին և սպասել Եհովային։',
        publication: 'Դիտարան',
      },
      ru: {
        title: 'Развивайте истинное терпение и стойкость',
        snippet: 'Почему терпение является важным плодом святого духа? Как оно помогает переносить испытания и проявлять любовь к другим.',
        publication: 'Сторожевая Башня',
      },
      hi: {
        title: 'सच्चा धैर्य और सहनशीलता कैसे विकसित करें?',
        snippet: 'धैर्य परमेश्वर की पवित्र आत्मा का एक अनिवार्य फल क्यों है? यह हमें मुश्किलों को सहने और दूसरों से प्रेम करने में कैसे मदद करता है।',
        publication: 'प्रहरीदुर्ग',
      },
      pa: {
        title: 'ਅਸਲ ਧੀਰਜ ਅਤੇ ਸਹਿਣਸ਼ੀਲਤਾ ਕਿਵੇਂ ਪੈਦਾ ਕਰੀਏ?',
        snippet: 'ਧੀਰਜ ਪਰਮੇਸ਼ੁਰ ਦੀ ਪਵਿੱਤਰ ਸ਼ਕਤੀ ਦਾ ਇੱਕ ਅਹਿਮ ਫਲ ਕਿਉਂ ਹੈ? ਇਹ ਸਾਨੂੰ ਅਜ਼ਮਾਇਸ਼ਾਂ ਸਹਿਣ ਵਿੱਚ ਕਿਵੇਂ ਮਦਦ ਕਰਦਾ ਹੈ।',
        publication: 'ਪਹਿਰਾਬੁਰਜ',
      },
    },
  },
  {
    id: 'jw-preaching-encouragement-1',
    url: 'https://www.jw.org/en/library/jw-meeting-workbook/ministry-skills/',
    source: 'JW.ORG',
    bibleVerses: ['Matthew 28:19, 20', 'Romans 10:13-15', '2 Timothy 4:2'],
    topicKeywords: ['preaching', 'ministry', 'encouragement', 'evangelizing', 'field service', 'zeal', 'door to door', 'cart', 'քարոզչություն', 'քարոզչության', 'ծառայություն', 'խրախուսանք', 'քաջալերանք', 'проповедь', 'служение', 'ободрение', 'проповеднического', 'проповедническое', 'проповедническом', 'प्रचार', 'सेवा', 'प्रोत्साहन', 'ਉਤਸ਼ਾਹ', 'ਪ੍ਰਚਾਰ', 'ਹੌਸਲਾ', 'ਹੌਸਲਾ-ਅਫ਼ਜ਼ਾਈ'],
    localizations: {
      en: {
        title: 'Encouragement and Joy in the Christian Ministry',
        snippet: 'Maintaining enthusiasm and joy in our field ministry. Practical tips for starting conversations, overcoming discouragement, and making fruitful return visits.',
        publication: 'Our Christian Life and Ministry',
      },
      hy: {
        title: 'Քաջալերանք և Ուրախություն Քրիստոնեական Ծառայության Մեջ',
        snippet: 'Ինչպես պահպանել եռանդը քարոզչական ծառայության մեջ, հաղթահարել հուսահատությունը և արդյունավետ վերայցելություններ անել։',
        publication: 'Մեր Կյանքը և Ծառայությունը',
      },
      ru: {
        title: 'Ободрение и Радость в Христианском Служении',
        snippet: 'Как сохранять радость и ревность в проповедническом служении. Советы по началу разговоров и преодолению разочарований.',
        publication: 'Христианская Жизнь и Служение',
      },
      hi: {
        title: 'प्रचार सेवा में प्रोत्साहन और आनंद',
        snippet: 'प्रचार कार्य में उत्साह और आनंद कैसे बनाए रखें। बातचीत शुरू करने और पुनः भेंट करने के व्यावहारिक सुझाव।',
        publication: 'हमारा मसीही जीवन और सेवा',
      },
      pa: {
        title: 'ਪ੍ਰਚਾਰ ਸੇਵਾ ਵਿੱਚ ਉਤਸ਼ਾਹ ਅਤੇ ਖ਼ੁਸ਼ੀ',
        snippet: 'ਆਪਣੀ ਪ੍ਰਚਾਰ ਸੇਵਾ ਵਿੱਚ ਜੋਸ਼ ਅਤੇ ਖ਼ੁਸ਼ੀ ਕਿਵੇਂ ਬਣਾਈ ਰੱਖੀਏ। ਗੱਲਬਾਤ ਸ਼ੁਰੂ ਕਰਨ ਦੇ ਵਿਹਾਰਕ ਨੁਕਤੇ।',
        publication: 'ਸਾਡੀ ਮਸੀਹੀ ਜ਼ਿੰਦਗੀ ਅਤੇ ਸੇਵਾ',
      },
    },
  },
  {
    id: 'jw-bible-study-1',
    url: 'https://www.jw.org/en/bible-teachings/questions/how-to-study-the-bible/',
    source: 'JW.ORG',
    bibleVerses: ['Joshua 1:8', 'Psalm 1:2, 3', 'Acts 17:11'],
    topicKeywords: ['bible study', 'personal study', 'study the bible', 'reading the bible', 'scriptures', 'ուսումնասիրություն', 'изучение библии', 'чтение библии', 'बाइबल अध्ययन', 'बਾਈਬਲ ਸਟੱਡੀ'],
    localizations: {
      en: {
        title: 'How to Benefit Most From Personal Bible Study',
        snippet: 'Methods to make personal Bible reading meaningful, rewarding, and deeply faith-building using research tools, meditation, and prayer.',
        publication: 'Bible Study Tools',
      },
      hy: {
        title: 'Ինչպես Առավելագույնս Օգտվել Աստվածաշնչի Ուսումնասիրությունից',
        snippet: 'Աստվածաշնչի անձնական ընթերցանությունը արդյունավետ և հետաքրքիր դարձնելու մեթոդներ՝ աղոթքով և խորհրդածությամբ։',
        publication: 'Աստվածաշնչյան Ուսումնասիրություն',
      },
      ru: {
        title: 'Как получить наибольшую пользу от личного изучения Библии',
        snippet: 'Методы эффективного чтения Священного Писания, глубокого размышления и применения библейских принципов в жизни.',
        publication: 'Изучение Библии',
      },
      hi: {
        title: 'व्यक्तिगत बाइबल अध्ययन से सबसे अधिक लाभ कैसे उठाएं?',
        snippet: 'बाइबल पढ़ने को सार्थक और विश्वास बढ़ाने वाला बनाने के तरीके: प्रार्थना, मनन और शोध के साधनों का उपयोग।',
        publication: 'बाइबल अध्ययन उपकरण',
      },
      pa: {
        title: 'ਨਿੱਜੀ ਬਾਈਬਲ ਅਧਿਐਨ ਤੋਂ ਸਭ ਤੋਂ ਵੱਧ ਲਾਭ ਕਿਵੇਂ ਲਈਏ?',
        snippet: 'ਰੋਜ਼ਾਨਾ ਬਾਈਬਲ ਪੜ੍ਹਨ ਨੂੰ ਲਾਭਦਾਇਕ ਅਤੇ ਨਿਹਚਾ ਮਜ਼ਬੂਤ ਕਰਨ ਵਾਲਾ ਬਣਾਉਣ ਦੇ ਤਰੀਕੇ।',
        publication: 'ਬਾਈਬਲ ਸਟੱਡੀ ਟੂਲਜ਼',
      },
    },
  },
  {
    id: 'jw-prayer-1',
    url: 'https://www.jw.org/en/bible-teachings/questions/how-to-pray/',
    source: 'JW.ORG',
    bibleVerses: ['Psalm 65:2', 'Philippians 4:6', '1 Thessalonians 5:17'],
    topicKeywords: ['prayer', 'pray', 'how to pray', 'answers to prayer', 'supplication', 'աղոթք', 'молитва', 'молиться', 'प्रार्थना', 'ਪ੍ਰਾਰਥਨਾ'],
    localizations: {
      en: {
        title: 'How to Pray and Have Your Prayers Heard by God',
        snippet: 'What kind of prayers does God listen to? The model prayer Jesus taught, acceptable ways to pray in Jesus’ name, and praying from the heart.',
        publication: 'Bible Questions Answered',
      },
      hy: {
        title: 'Ինչպես Աղոթել, որ Աստված Լսի Մեր Աղոթքները',
        snippet: 'Ինչպիսի՞ աղոթքներ է լսում Աստված։ Տերունական աղոթքը, Հիսուսի անունով աղոթելու կարևորությունը և սրտաբուխ աղոթքները։',
        publication: 'Աստվածաշնչյան Հարցեր',
      },
      ru: {
        title: 'Как правильно молиться Богу, чтобы он услышал?',
        snippet: 'Какие молитвы слышит Бог? Образцовая молитва Иисуса, молитвы во имя Иисуса Христа и искреннее излияние сердца.',
        publication: 'Ответы на Библейские Вопросы',
      },
      hi: {
        title: 'प्रार्थना कैसे करें ताकि परमेश्वर हमारी सुने?',
        snippet: 'परमेश्वर किस प्रकार की प्रार्थनाएं सुनता है? यीशु की आदर्श प्रार्थना, यीशु के नाम से प्रार्थना और दिल से की गई बिनती।',
        publication: 'बाइबल के प्रश्नों के उत्तर',
      },
      pa: {
        title: 'ਪ੍ਰਾਰਥਨਾ ਕਿਵੇਂ ਕਰੀਏ ਤਾਂ ਜੋ ਪਰਮੇਸ਼ੁਰ ਸਾਡੀ ਸੁਣੇ?',
        snippet: 'ਪਰਮੇਸ਼ੁਰ ਕਿਸ ਤਰ੍ਹਾਂ ਦੀਆਂ ਪ੍ਰਾਰਥਨਾਵਾਂ ਸੁਣਦਾ ਹੈ? ਯਿਸੂ ਦੀ ਆਦਰਸ਼ ਪ੍ਰਾਰਥਨਾ ਅਤੇ ਦਿਲੋਂ ਕੀਤੀ ਗਈ ਬੇਨਤੀ।',
        publication: 'ਬਾਈਬਲ ਦੇ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ',
      },
    },
  },
  {
    id: 'jw-marriage-1',
    url: 'https://www.jw.org/en/bible-teachings/family/marriage/',
    source: 'JW.ORG',
    bibleVerses: ['Ephesians 5:28, 33', 'Genesis 2:24', 'Colossians 3:18, 19'],
    topicKeywords: ['marriage', 'husband', 'wife', 'spouse', 'family', 'love', 'communication', 'ամուսնություն', 'բրակ', 'брак', 'семья', 'पति', 'पत्नी', 'ਵਿਆਹ'],
    localizations: {
      en: {
        title: 'Keys to a Happy and Lasting Marriage',
        snippet: 'Timeless guidance from the Creator on strengthening marriage bonds, resolving conflicts peacefully, and showing deep mutual respect.',
        publication: 'Family Happiness',
      },
      hy: {
        title: 'Երջանիկ և Ամուր Ամուսնության Գաղտնիքները',
        snippet: 'Արարչի առաջնորդությունը ամուսնական կապն ամրացնելու, տարաձայնությունները հարթելու և փոխադարձ հարգանք դրսևորելու մասին։',
        publication: 'Ընտանեկան Երջանկություն',
      },
      ru: {
        title: 'Секреты счастливого и крепкого брака',
        snippet: 'Библейские советы о том, как укреплять брачные узы, мирно разрешать конфликты и проявлять глубокое уважение к спутнику жизни.',
        publication: 'Семейное Счастье',
      },
      hi: {
        title: 'एक खुशहाल और स्थायी वैवाहिक जीवन की कुंजी',
        snippet: 'विवाह के बंधन को मजबूत करने, मतभेदों को शांति से सुलझाने और आपसी सम्मान दिखाने के लिए बाइबल की सलाह।',
        publication: 'पारिवारिक सुख',
      },
      pa: {
        title: 'ਇੱਕ ਖ਼ੁਸ਼ਹਾਲ ਵਿਆਹੁਤਾ ਜ਼ਿੰਦਗੀ ਦੀ ਕੁੰਜੀ',
        snippet: 'ਆਪਣੇ ਵਿਆਹ ਨੂੰ ਮਜ਼ਬੂਤ ਕਰਨ ਅਤੇ ਆਪਸੀ ਆਦਰ ਦਿਖਾਉਣ ਲਈ ਪਰਮੇਸ਼ੁਰ ਦੇ ਬਚਨ ਤੋਂ ਬੇਮਿਸਾਲ ਸਲਾਹ।',
        publication: 'ਪਰਿਵਾਰਕ ਖ਼ੁਸ਼ੀ',
      },
    },
  },
  {
    id: 'jw-forgiveness-1',
    url: 'https://www.jw.org/en/bible-teachings/questions/what-does-the-bible-say-about-forgiveness/',
    source: 'JW.ORG',
    bibleVerses: ['Colossians 3:13', 'Matthew 6:14, 15', 'Proverbs 19:11'],
    topicKeywords: ['forgiveness', 'forgive', 'mercy', 'resentment', 'anger', 'offended', 'ներում', 'ներել', 'прощение', 'прощать', 'क्षमा', 'ਮਾਫ਼ੀ'],
    localizations: {
      en: {
        title: 'What Does the Bible Say About Forgiveness?',
        snippet: 'Why is forgiving others so vital for our spiritual health and peace of mind? How Jehovah freely forgives us and how we can let go of resentment.',
        publication: 'Bible Questions Answered',
      },
      hy: {
        title: 'Ինչ է Ասում Աստվածաշունչը Ներողամտության Մասին',
        snippet: 'Ինչու է ներելը կարևոր մեր խաղաղության համար։ Ինչպես է Եհովան մեծահոգաբար ներում մեզ և ինչպես ազատվել վիրավորանքից։',
        publication: 'Աստվածաշնչյան Հարցեր',
      },
      ru: {
        title: 'Что Библия говорит о прощении обид?',
        snippet: 'Почему прощение так важно для нашего духовного здоровья? Как Иегова прощает нас и как научиться отпускать обиды.',
        publication: 'Ответы на Библейские Вопросы',
      },
      hi: {
        title: 'बाइबल क्षमा के बारे में क्या कहती है?',
        snippet: 'दूसरों को माफ करना हमारे मन की शांति के लिए क्यों महत्वपूर्ण है? यहोवा हमें कैसे माफ करता है और हम कड़वाहट कैसे छोड़ सकते हैं।',
        publication: 'बाइबल के प्रश्नों के उत्तर',
      },
      pa: {
        title: 'ਬਾਈਬਲ ਮਾਫ਼ੀ ਬਾਰੇ ਕੀ ਕਹਿੰਦੀ ਹੈ?',
        snippet: 'ਦੂਜਿਆਂ ਨੂੰ ਮਾਫ਼ ਕਰਨਾ ਸਾਡੀ ਸ਼ਾਂਤੀ ਲਈ ਕਿਉਂ ਜ਼ਰੂਰੀ ਹੈ? ਯਹੋਵਾਹ ਸਾਨੂੰ ਕਿਵੇਂ ਮਾਫ਼ ਕਰਦਾ ਹੈ।',
        publication: 'ਬਾਈਬਲ ਦੇ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ',
      },
    },
  },
  {
    id: 'jw-faith-1',
    url: 'https://www.jw.org/en/bible-teachings/questions/what-is-faith/',
    source: 'JW.ORG',
    bibleVerses: ['Hebrews 11:1', 'Romans 10:17', 'James 2:26'],
    topicKeywords: ['faith', 'believe', 'trust in god', 'strengthen faith', 'evidence', 'հավատ', 'вера', 'доверие', 'विश्वास', 'ਨਿਹਚਾ'],
    localizations: {
      en: {
        title: 'What Is True Faith and How to Build It',
        snippet: 'Faith is not blind credulity; it is grounded on convincing evidence. Learn how to build rock-solid confidence in God’s promises.',
        publication: 'Bible Teachings',
      },
      hy: {
        title: 'Ինչ է Իսկական Հավատը և Ինչպես Այն Կառուցել',
        snippet: 'Հավատը կույր վստահություն չէ, այլ հիմնված է անհերքելի ապացույցների վրա։ Ինչպես ամրացնել հավատը Աստծու խոստումների հանդեպ։',
        publication: 'Աստվածաշնչյան Ուսմունքներ',
      },
      ru: {
        title: 'Что такое истинная вера и как ее укрепить?',
        snippet: 'Вера — это не слепая доверчивость, а убежденность, основанная на твердых доказательствах. Как обрести непоколебимую веру в Бога.',
        publication: 'Библейские Учения',
      },
      hi: {
        title: 'सच्चा विश्वास क्या है और इसे कैसे मजबूत करें?',
        snippet: 'विश्वास अंधविश्वास नहीं है, बल्कि ठोस सबूतों पर आधारित है। परमेश्वर के वादों पर अटूट भरोसा कैसे बनाएं।',
        publication: 'बाइबल की शिक्षाएं',
      },
      pa: {
        title: 'ਸੱਚੀ ਨਿਹਚਾ ਕੀ ਹੈ ਅਤੇ ਇਸ ਨੂੰ ਕਿਵੇਂ ਮਜ਼ਬੂਤ ਕਰੀਏ?',
        snippet: 'ਨਿਹਚਾ ਠੋਸ ਸਬੂਤਾਂ ਉੱਤੇ ਆਧਾਰਿਤ ਹੁੰਦੀ ਹੈ। ਪਰਮੇਸ਼ੁਰ ਦੇ ਵਾਅਦਿਆਂ ਉੱਤੇ ਪੱਕਾ ਭਰੋਸਾ ਕਿਵੇਂ ਬਣਾਈਏ।',
        publication: 'ਬਾਈਬਲ ਦੀਆਂ ਸਿੱਖਿਆਵਾਂ',
      },
    },
  },
];

export class JWOrgService {
  /**
   * Calculates a relevance score (0.0 to 1.0) for an article against search terms
   */
  static scoreArticleRelevance(
    article: MultilingualJWArticle,
    cleanQuery: string,
    lang: SupportedLanguage
  ): number {
    const lowerQuery = cleanQuery.toLowerCase().trim();
    if (!lowerQuery) return 0;

    const loc = article.localizations[lang] || article.localizations['en'];
    const title = loc.title.toLowerCase();
    const snippet = loc.snippet.toLowerCase();
    const keywords = (article.topicKeywords || []).map(k => k.toLowerCase());

    let score = 0;

    // 1. Exact phrase match in title (Highest priority)
    if (title.includes(lowerQuery)) {
      score += 0.6;
    }

    // 2. Keyword exact or substring matches
    for (const kw of keywords) {
      if (lowerQuery.includes(kw) || kw.includes(lowerQuery)) {
        score += 0.45;
        break;
      }
    }

    // 3. Word-by-word token and stem overlap
    const queryTokens = lowerQuery.split(/[\s,.-]+/).filter(t => t.length >= 3);
    if (queryTokens.length > 0) {
      let matchedTokens = 0;
      for (const token of queryTokens) {
        // Calculate root stem for inflected languages (Russian, Armenian, Punjabi, Hindi)
        const stem = token.length >= 5 ? token.slice(0, token.length - 2) : (token.length >= 4 ? token.slice(0, token.length - 1) : token);
        const matchesTitle = title.includes(token) || (stem.length >= 3 && title.includes(stem));
        const matchesKw = keywords.some(k => k.includes(token) || token.includes(k) || (stem.length >= 3 && (k.includes(stem) || stem.includes(k))));
        const matchesSnippet = snippet.includes(token) || (stem.length >= 3 && snippet.includes(stem));

        if (matchesTitle) {
          matchedTokens += 1.5;
        } else if (matchesKw) {
          matchedTokens += 1.3;
        } else if (matchesSnippet) {
          matchedTokens += 0.8;
        }
      }
      const tokenScore = Math.min(0.55, (matchedTokens / queryTokens.length) * 0.45);
      score += tokenScore;
    }

    // 4. Bible verse check if query mentions a scripture
    if (article.bibleVerses.some(v => lowerQuery.includes(v.toLowerCase()))) {
      score += 0.3;
    }

    return Math.min(1.0, score);
  }

  /**
   * Searches official JW.ORG articles with live fetching and curated multilingual catalog
   * with strict relevance filtering (irrelevant results are discarded).
   */
  static async searchJWOrg(rawQuery: string, langStr: string = 'en'): Promise<SearchResult[]> {
    const lang = LanguageService.normalizeLanguage(langStr);
    const cleanQuery = LanguageService.cleanSearchQuery(rawQuery, lang);
    const results: SearchResult[] = [];

    // Map language to JW.ORG path and wtlocale
    const langPathMap: Record<SupportedLanguage, { path: string; wtlocale: string }> = {
      en: { path: 'en', wtlocale: 'E' },
      ru: { path: 'ru', wtlocale: 'U' },
      hy: { path: 'hy', wtlocale: 'REA' },
      hi: { path: 'hi', wtlocale: 'HI' },
      pa: { path: 'pa', wtlocale: 'PJ' },
    };

    const { path: jwLang, wtlocale } = langPathMap[lang] || langPathMap['en'];

    // 1. Attempt Live JW.ORG JSON search API
    try {
      const searchUrl = `https://www.jw.org/${jwLang}/search/results/json?q=${encodeURIComponent(cleanQuery)}&wtlocale=${wtlocale}`;
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MinistryTrackerApp/1.0',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(3500),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.results)) {
          for (let i = 0; i < Math.min(5, data.results.length); i++) {
            const item = data.results[i];
            if (item.title && item.url) {
              const fullUrl = item.url.startsWith('http')
                ? item.url
                : `https://www.jw.org${item.url}`;
              
              const titleClean = item.title.replace(/<[^>]+>/g, '').trim();
              const snippetClean = (item.snippet || item.caption || '').replace(/<[^>]+>/g, '').trim();

              // Check basic relevance for live results
              const queryTokens = cleanQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
              const hasOverlap = queryTokens.length === 0 || queryTokens.some(tok =>
                titleClean.toLowerCase().includes(tok) || snippetClean.toLowerCase().includes(tok)
              );

              if (hasOverlap) {
                results.push({
                  id: `jw-live-${i}-${Date.now()}`,
                  title: titleClean,
                  snippet: snippetClean || 'Official JW.ORG published article.',
                  url: fullUrl,
                  source: 'JW.ORG',
                  publication: item.pubName || 'JW.ORG Publication',
                  relevanceScore: 0.85,
                });
              }
            }
          }
        }
      }
    } catch {
      // Live search timeout or blocked; proceeds to verified catalog
    }

    // 2. Verified Curated Multi-Language Catalog with Relevance Scoring
    const scoredCatalog = VERIFIED_JW_ARTICLES_CATALOG.map(article => ({
      article,
      score: this.scoreArticleRelevance(article, cleanQuery, lang),
    }))
      .filter(item => item.score >= 0.25) // Minimum relevance threshold: discard irrelevant articles
      .sort((a, b) => b.score - a.score);

    // Merge and deduplicate by URL
    const existingUrls = new Set(results.map(r => r.url));
    for (const item of scoredCatalog) {
      if (!existingUrls.has(item.article.url)) {
        const loc = item.article.localizations[lang] || item.article.localizations['en'];
        results.push({
          id: item.article.id,
          title: loc.title,
          snippet: loc.snippet,
          url: item.article.url,
          source: item.article.source,
          publication: loc.publication,
          bibleVerses: item.article.bibleVerses,
          topicKeywords: item.article.topicKeywords,
          relevanceScore: Number(item.score.toFixed(2)),
        });
        existingUrls.add(item.article.url);
      }
    }

    // Return the top relevant articles (max 4). If no articles met the relevance threshold, return empty!
    return results.slice(0, 4);
  }
}
