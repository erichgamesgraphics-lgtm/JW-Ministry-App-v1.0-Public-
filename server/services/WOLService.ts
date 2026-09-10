import { SearchResult } from './types.js';
import { LanguageService } from './LanguageService.js';
import { SupportedLanguage } from '../../src/types.js';

interface MultilingualWOLArticle {
  id: string;
  url: string;
  source: 'WOL.JW.ORG';
  bibleVerses: string[];
  topicKeywords: string[];
  localizations: Record<SupportedLanguage, { title: string; snippet: string; publication: string }>;
}

const VERIFIED_WOL_ARTICLES_MULTILINGUAL: MultilingualWOLArticle[] = [
  {
    id: 'wol-suffering-1',
    url: 'https://wol.jw.org/en/wol/d/r1/lp-e/1200004278',
    source: 'WOL.JW.ORG',
    bibleVerses: ['Romans 8:18-22', '2 Corinthians 1:3, 4'],
    topicKeywords: ['suffering', 'insight', 'hardship', 'pain', 'persecution', 'տառապանք', 'страдания', 'दुख', 'ਦੁੱਖ'],
    localizations: {
      en: {
        title: 'Insight on the Scriptures — Suffering',
        snippet: 'Comprehensive Scriptural study on the causes of suffering, Jehovah’s purpose in permitting hardship, and his ultimate provision for relief.',
        publication: 'Insight on the Scriptures, Volume 2',
      },
      hy: {
        title: 'Գիտություն Գրությունների Մասին — Տառապանք',
        snippet: 'Աստվածաշնչյան խոր ուսումնասիրություն տառապանքի պատճառների, Եհովայի նպատակի և մխիթարության մասին։',
        publication: 'Գիտություն Գրությունների Մասին, Հատոր 2',
      },
      ru: {
        title: 'Понимание Писания — Страдания',
        snippet: 'Подробное исследование причин страданий, замысла Иеговы и надежды на полное избавление.',
        publication: 'Понимание Писания, Том 2',
      },
      hi: {
        title: 'शास्त्रों की अंतर्दृष्टि — दुख-तकलीफें',
        snippet: 'दुख-तकलीफों के कारणों और यहोवा के परमेश्वर के प्रेमपूर्ण वादों पर बाइबल का गहन अध्ययन।',
        publication: 'शास्त्रों की अंतर्दृष्टि, भाग 2',
      },
      pa: {
        title: 'ਪਵਿੱਤਰ ਲਿਖਤਾਂ ਦੀ ਸਮਝ — ਦੁੱਖ-ਤਕਲੀਫ਼ਾਂ',
        snippet: "ਦੁੱਖਾਂ ਦੇ ਕਾਰਨਾਂ ਅਤੇ ਯਹੋਵਾਹ ਪਰਮੇਸ਼ੁਰ ਦੇ ਵਾਅਦਿਆਂ 'ਤੇ ਬਾਈਬਲ ਦਾ ਡੂੰਘਾ ਅਧਿਐਨ।",
        publication: 'ਪਵਿੱਤਰ ਲਿਖਤਾਂ ਦੀ ਸਮਝ, ਭਾਗ 2',
      },
    },
  },
  {
    id: 'wol-kingdom-1',
    url: 'https://wol.jw.org/en/wol/d/r1/lp-e/1200002623',
    source: 'WOL.JW.ORG',
    bibleVerses: ['Daniel 2:44', 'Matthew 6:10'],
    topicKeywords: ['kingdom', 'gods kingdom', 'insight', 'government', 'թագավորություն', 'царство', 'राज्य', 'ਰਾਜ'],
    localizations: {
      en: {
        title: 'Insight on the Scriptures — Kingdom of God',
        snippet: 'Detailed theological analysis of God’s sovereign Kingdom, its royal administration, prophecy fulfillment, and earthly subjects.',
        publication: 'Insight on the Scriptures, Volume 2',
      },
      hy: {
        title: 'Գիտություն Գրությունների Մասին — Աստծու Թագավորությունը',
        snippet: 'Աստծու Թագավորության, նրա Ղեկավարի և մարգարեությունների կատարման մասին։',
        publication: 'Գիտություն Գրությունների Մասին, Հատոր 2',
      },
      ru: {
        title: 'Понимание Писания — Царство Бога',
        snippet: 'Детальный анализ небесного правительственного устройства Бога и исполнения пророчеств.',
        publication: 'Понимание Писания, Том 2',
      },
      hi: {
        title: 'शास्त्रों की अंतर्दृष्टि — ईश्वर का राज्य',
        snippet: 'ईश्वर के राज्य और उसके शासन के बारे में बाइबल का विस्तृत अध्ययन।',
        publication: 'शास्त्रों की अंतर्दृष्टि, भाग 2',
      },
      pa: {
        title: 'ਪਵਿੱਤਰ ਲਿਖਤਾਂ ਦੀ ਸਮਝ — ਪਰਮੇਸ਼ੁਰ ਦਾ ਰਾਜ',
        snippet: 'ਪਰਮੇਸ਼ੁਰ ਦੇ ਰਾਜ ਅਤੇ ਇਸ ਦੇ ਰਾਜੇ ਬਾਰੇ ਬਾਈਬਲ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ।',
        publication: 'ਪਵਿੱਤਰ ਲਿਖਤਾਂ ਦੀ ਸਮਝ, ਭਾਗ 2',
      },
    },
  },
  {
    id: 'wol-prayer-1',
    url: 'https://wol.jw.org/en/wol/d/r1/lp-e/1200003531',
    source: 'WOL.JW.ORG',
    bibleVerses: ['Psalm 65:2', '1 John 5:14'],
    topicKeywords: ['pray', 'prayer', 'prayers', 'supplication', 'աղոթք', 'молитва', 'प्रार्थना', 'ਪ੍ਰਾਰਥਨਾ'],
    localizations: {
      en: {
        title: 'Insight on the Scriptures — Prayer',
        snippet: 'Deep study into prayer requirements, Jehovah as the Hearer of prayer, acceptable approaches through Jesus, and perseverance in prayer.',
        publication: 'Insight on the Scriptures, Volume 2',
      },
      hy: {
        title: 'Գիտություն Գրությունների Մասին — Աղոթք',
        snippet: 'Խոր ուսումնասիրություն Եհովային մոտենալու և ընդունելի աղոթքներ անելու մասին։',
        publication: 'Գիտություն Գրությունների Մասին, Հատոր 2',
      },
      ru: {
        title: 'Понимание Писания — Молитва',
        snippet: 'Глубокое исследование условий для того, чтобы Иегова Слушатель молитв принимал наши обращения.',
        publication: 'Понимание Писания, Том 2',
      },
      hi: {
        title: 'शास्त्रों की अंतर्दृष्टि — प्रार्थना',
        snippet: 'प्रार्थना के बारे में और यहोवा परमेश्वर द्वारा प्रार्थनाएं सुनने के बारे में गहन अध्ययन।',
        publication: 'शास्त्रों की अंतर्दृष्टि, भाग 2',
      },
      pa: {
        title: 'ਪਵਿੱਤਰ ਲਿਖਤਾਂ ਦੀ ਸਮਝ — ਪ੍ਰਾਰਥਨਾ',
        snippet: 'ਪ੍ਰਾਰਥਨਾ ਕਰਨ ਦੇ ਤਰੀਕਿਆਂ ਅਤੇ ਪਰਮੇਸ਼ੁਰ ਦੇ ਵਾਅਦਿਆਂ ਬਾਰੇ ਅਧਿਐਨ।',
        publication: 'ਪਵਿੱਤਰ ਲਿਖਤਾਂ ਦੀ ਸਮਝ, ਭਾਗ 2',
      },
    },
  },
];

export class WOLService {
  /**
   * Search Watchtower Online Library (WOL.JW.ORG) for deeper research material
   */
  static async searchWOL(query: string, langStr: string = 'en'): Promise<SearchResult[]> {
    const lang = LanguageService.normalizeLanguage(langStr);
    const cleanQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // 1. Try Live WOL Search Endpoint
    try {
      const searchUrl = `https://wol.jw.org/en/wol/s/r1/lp-e?q=${encodeURIComponent(query)}`;
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MinistryTrackerApp/1.0',
        },
        signal: AbortSignal.timeout(3500),
      });

      if (response.ok) {
        const htmlText = await response.text();
        const linkMatches = htmlText.matchAll(/<a class="[^"]*docResultLink[^"]*" href="([^"]+)">([^<]+)<\/a>/g);
        let count = 0;
        for (const match of linkMatches) {
          if (count >= 3) break;
          const href = match[1];
          const title = match[2];
          if (href && title) {
            results.push({
              id: `wol-live-${count}-${Date.now()}`,
              title: title.trim(),
              snippet: 'Watchtower Online Library reference material.',
              url: href.startsWith('http') ? href : `https://wol.jw.org${href}`,
              source: 'WOL.JW.ORG',
              publication: 'Watchtower Online Library',
            });
            count++;
          }
        }
      }
    } catch {
      // Fallback to local curated WOL references
    }

    // 2. Local curated search
    const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 2);
    const matchedCurated = VERIFIED_WOL_ARTICLES_MULTILINGUAL.filter(article => {
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

    if (results.length === 0) {
      for (const curated of VERIFIED_WOL_ARTICLES_MULTILINGUAL.slice(0, 2)) {
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

    return results.slice(0, 4);
  }
}
