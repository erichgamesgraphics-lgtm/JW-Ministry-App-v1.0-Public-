import { SearchResult } from './types.js';
import { LanguageService } from './LanguageService.js';
import { SupportedLanguage } from '../../src/types.js';

interface MultilingualArticle {
  id: string;
  url: string;
  source: 'JW.ORG';
  bibleVerses: string[];
  topicKeywords: string[];
  localizations: Record<SupportedLanguage, { title: string; snippet: string; publication: string }>;
}

const VERIFIED_JW_ARTICLES_MULTILINGUAL: MultilingualArticle[] = [
  {
    id: 'jw-suffering-1',
    url: 'https://www.jw.org/en/library/series/more-topics/what-does-bible-say-about-suffering/',
    source: 'JW.ORG',
    bibleVerses: ['Revelation 21:4', 'James 1:13', '1 John 5:19'],
    topicKeywords: ['suffering', 'pain', 'suffer', 'hardship', 'tragedy', 'why god allows', 'grief', 'տառապանք', 'ցավ', 'страдания', 'боль', 'दुख', 'तकलीफ', 'ਦੁੱਖ'],
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
    topicKeywords: ['kingdom', 'gods kingdom', 'government', 'paradise', 'rule', 'jesus king', 'թագավորություն', 'цаրство', 'राज्य', 'ਰਾਜ'],
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
    bibleVerses: ['John 5:28, 29', 'Acts 24:15', 'John 11:25'],
    topicKeywords: ['resurrection', 'death', 'dead', 'life after death', 'mourning', 'հարություն', 'воскресение', 'पुनरुत्थान', 'ਮੁੜ-ਜੀਉਂਦਾ'],
    localizations: {
      en: {
        title: 'What Is the Resurrection?',
        snippet: 'The Bible teaches that billions who have died will be brought back to life on a paradise earth. Learn who will be resurrected and when.',
        publication: 'Bible Questions Answered',
      },
      hy: {
        title: 'Ինչ է Հարությունը',
        snippet: 'Աստվածաշունչը սովորեցնում է, որ միլիարդավոր մահացած մարդիկ կվերակենդանանան երկրային դրախտում։',
        publication: 'Աստվածաշնչյան Հարցեր',
      },
      ru: {
        title: 'Что такое воскресение мертвых?',
        snippet: 'Библия учит, что миллиарды умерших вернутся к жизни на райской земле.',
        publication: 'Ответы на Библейские Вопросы',
      },
      hi: {
        title: 'पुनरुत्थान क्या है?',
        snippet: 'बाइबल सिखाती है कि करोड़ों मृत लोग फिर से सुंदर पृथ्वी पर जीवित होंगे।',
        publication: 'बाइबल के प्रश्नों के उत्तर',
      },
      pa: {
        title: 'ਮੁੜ-ਜੀਉਂਦਾ ਹੋਣਾ (ਪੁਨਰ-ਉਥਾਨ) ਕੀ ਹੈ?',
        snippet: "ਬਾਈਬਲ ਸਿਖਾਉਂਦੀ ਹੈ ਕਿ ਮਰੇ ਹੋਏ ਕਰੋੜਾਂ ਲੋਕ ਦੁਬਾਰਾ ਧਰਤੀ 'ਤੇ ਜਿਉਂਦੇ ਕੀਤੇ ਜਾਣਗੇ।",
        publication: 'ਬਾਈਬਲ ਦੇ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ',
      },
    },
  },
  {
    id: 'jw-prayer-1',
    url: 'https://www.jw.org/en/bible-teachings/questions/how-to-pray/',
    source: 'JW.ORG',
    bibleVerses: ['Psalm 65:2', '1 John 5:14', 'Philippians 4:6, 7'],
    topicKeywords: ['pray', 'prayer', 'prayers', 'god answer', 'how to pray', 'աղոթք', 'молитва', 'प्रार्थना', 'ਪ੍ਰਾਰਥਨਾ'],
    localizations: {
      en: {
        title: 'How to Pray and Be Heard by God',
        snippet: 'Does God answer all prayers? How should we pray, and what can we pray for? Practical Bible guidelines on acceptable prayer.',
        publication: 'Bible Questions Answered',
      },
      hy: {
        title: 'Ինչպես Աղոթել, որ Աստված Լսի',
        snippet: 'Արդյոք Աստված լսում է բոլոր աղոթքները։ Ինչպես պետք է աղոթել և ինչի մասին կարող ենք խնդրել։',
        publication: 'Աստվածաշնչյան Հարցեր',
      },
      ru: {
        title: 'Как молиться, чтобы Бог услышал?',
        snippet: 'Слушает ли Бог все молитвы? Как правильном молиться и о чем можно просить в молитве?',
        publication: 'Ответы на Библейские Вопросы',
      },
      hi: {
        title: 'प्रार्थना कैसे करें कि ईश्वर सुने?',
        snippet: 'क्या ईश्वर सभी प्रार्थनाएं सुनता है? हमें कैसे प्रार्थना करनी चाहिए और हम किस बात के लिए प्रार्थना कर सकते हैं?',
        publication: 'बाइबल के प्रश्नों के उत्तर',
      },
      pa: {
        title: 'ਪ੍ਰਾਰਥਨਾ ਕਿਵੇਂ ਕਰੀਏ ਕਿ ਪਰਮੇਸ਼ੁਰ ਸੁਣੇ?',
        snippet: 'ਕੀ ਪਰਮੇਸ਼ੁਰ ਸਾਰੀਆਂ ਪ੍ਰਾਰਥਨਾਵਾਂ ਸੁਣਦਾ ਹੈ? ਸਾਨੂੰ ਕਿਵੇਂ ਪ੍ਰਾਰਥਨਾ ਕਰਨੀ ਚਾਹੀਦੀ ਹੈ?',
        publication: 'ਬਾਈਬਲ ਦੇ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ',
      },
    },
  },
];

export class JWOrgService {
  /**
   * Search JW.ORG for real articles matching the user's query topic
   */
  static async searchJWOrg(query: string, langStr: string = 'en'): Promise<SearchResult[]> {
    const lang = LanguageService.normalizeLanguage(langStr);
    const cleanQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // 1. Try Live JW.ORG JSON Search API endpoint first
    try {
      const searchUrl = `https://www.jw.org/en/search/results/json?q=${encodeURIComponent(query)}&wtlocale=E`;
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
          for (let i = 0; i < Math.min(4, data.results.length); i++) {
            const item = data.results[i];
            if (item.title && item.url) {
              const fullUrl = item.url.startsWith('http')
                ? item.url
                : `https://www.jw.org${item.url}`;
              results.push({
                id: `jw-live-${i}-${Date.now()}`,
                title: item.title.replace(/<[^>]+>/g, ''),
                snippet: (item.snippet || item.caption || 'Official JW.ORG publication').replace(/<[^>]+>/g, ''),
                url: fullUrl,
                source: 'JW.ORG',
                publication: item.pubName || 'JW.ORG Publication',
              });
            }
          }
        }
      }
    } catch {
      // Live search timeout or blocked; fallback to verified curated collection
    }

    // 2. Local curated search matching keywords
    const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 2);
    const matchedCurated = VERIFIED_JW_ARTICLES_MULTILINGUAL.filter(article => {
      const loc = article.localizations[lang] || article.localizations['en'];
      const titleMatch = loc.title.toLowerCase().includes(cleanQuery);
      const keywordMatch = article.topicKeywords?.some(k => cleanQuery.includes(k) || k.includes(cleanQuery));
      const wordMatch = queryWords.some(word =>
        loc.title.toLowerCase().includes(word) ||
        loc.snippet.toLowerCase().includes(word) ||
        article.topicKeywords?.some(k => k.includes(word))
      );
      return titleMatch || keywordMatch || wordMatch;
    });

    // Merge and deduplicate by URL
    const existingUrls = new Set(results.map(r => r.url));
    for (const curated of matchedCurated) {
      if (!existingUrls.has(curated.url)) {
        const loc = curated.localizations[lang] || curated.localizations['en'];
        results.push({
          id: curated.id,
          title: loc.title,
          snippet: loc.snippet,
          url: curated.url,
          source: curated.source,
          publication: loc.publication,
          bibleVerses: curated.bibleVerses,
        });
        existingUrls.add(curated.url);
      }
    }

    // If no specific keyword match, return top curated articles localized in the user's language
    if (results.length === 0) {
      for (const curated of VERIFIED_JW_ARTICLES_MULTILINGUAL.slice(0, 3)) {
        const loc = curated.localizations[lang] || curated.localizations['en'];
        results.push({
          id: curated.id,
          title: loc.title,
          snippet: loc.snippet,
          url: curated.url,
          source: curated.source,
          publication: loc.publication,
          bibleVerses: curated.bibleVerses,
        });
      }
    }

    return results.slice(0, 5);
  }
}
