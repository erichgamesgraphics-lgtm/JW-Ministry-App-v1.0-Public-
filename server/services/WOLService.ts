import { SearchResult } from './types.js';
import { LanguageService } from './LanguageService.js';
import { SupportedLanguage } from '../../src/types.js';

export interface MultilingualWOLArticle {
  id: string;
  url: string;
  source: 'WOL.JW.ORG';
  bibleVerses: string[];
  topicKeywords: string[];
  localizations: Record<SupportedLanguage, { title: string; snippet: string; publication: string }>;
}

export const VERIFIED_WOL_ARTICLES_MULTILINGUAL: MultilingualWOLArticle[] = [
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
        title: 'Գիտություն Գրությունների Մասին — Աստծու Թագավորություն',
        snippet: 'Աստծու գերիշխան Թագավորության մանրամասն վերլուծություն, մարգարեությունների կատարումը և երկրային հպատակները։',
        publication: 'Գիտություն Գրությունների Մասին, Հատոր 2',
      },
      ru: {
        title: 'Понимание Писания — Царство Бога',
        snippet: 'Детальный анализ Божьего Царства, его структуры, исполнения пророчеств и благословений для земли.',
        publication: 'Понимание Писания, Том 2',
      },
      hi: {
        title: 'शास्त्रों की अंतर्दृष्टि — परमेश्वर का राज्य',
        snippet: 'परमेश्वर के सार्वभौमिक राज्य, इसके शासन और भविष्यवाणियों की पूर्ति का विस्तृत अध्ययन।',
        publication: 'शास्त्रों की अंतर्दृष्टि, भाग 2',
      },
      pa: {
        title: 'ਪਵਿੱਤਰ ਲਿਖਤਾਂ ਦੀ ਸਮਝ — ਪਰਮੇਸ਼ੁਰ ਦਾ ਰਾਜ',
        snippet: "ਪਰਮੇਸ਼ੁਰ ਦੇ ਰਾਜ, ਇਸ ਦੇ ਪ੍ਰਬੰਧ ਅਤੇ ਭਵਿੱਖਬਾਣੀਆਂ ਦੇ ਪੂਰੇ ਹੋਣ ਦਾ ਵਿਸਥਾਰਪੂਰਵਕ ਅਧਿਐਨ।",
        publication: 'ਪਵਿੱਤਰ ਲਿਖਤਾਂ ਦੀ ਸਮਝ, ਭਾਗ 2',
      },
    },
  },
  {
    id: 'wol-preaching-1',
    url: 'https://wol.jw.org/en/wol/d/r1/lp-e/1200003535',
    source: 'WOL.JW.ORG',
    bibleVerses: ['Matthew 24:14', 'Acts 20:20', 'Romans 10:14'],
    topicKeywords: ['preaching', 'preacher', 'evangelizer', 'good news', 'ministry', 'քարոզչություն', 'проповедь', 'проповедник', 'प्रचार', 'ਪ੍ਰਚਾਰ'],
    localizations: {
      en: {
        title: 'Insight on the Scriptures — Preacher, Preaching',
        snippet: 'The Biblical meaning of public proclamation of the good news, apostolic methods, and modern fulfillment of Christ’s command.',
        publication: 'Insight on the Scriptures, Volume 2',
      },
      hy: {
        title: 'Գիտություն Գրությունների Մասին — Քարոզիչ, Քարոզչություն',
        snippet: 'Բարի լուրի հրապարակային հռչակման աստվածաշնչյան նշանակությունը, առաքելական մեթոդները և ժամանակակից կատարումը։',
        publication: 'Գիտություն Գրությունների Մասին, Հատոր 2',
      },
      ru: {
        title: 'Понимание Писания — Проповедник, Проповедь',
        snippet: 'Библейское значение провозглашения благой вести, пример апостолов и исполнение повеления Христа сегодня.',
        publication: 'Понимание Писания, Том 2',
      },
      hi: {
        title: 'शास्त्रों की अंतर्दृष्टि — प्रचारक, प्रचार करना',
        snippet: 'सुसमाचार के प्रचार का बाइबल आधारित अर्थ, प्रेरितों के तरीके और मसीह की आज्ञा का पालन।',
        publication: 'शास्त्रों की अंतर्दृष्टि, भाग 2',
      },
      pa: {
        title: 'ਪਵਿੱਤਰ ਲਿਖਤਾਂ ਦੀ ਸਮਝ — ਪ੍ਰਚਾਰਕ, ਪ੍ਰਚਾਰ ਕਰਨਾ',
        snippet: "ਖ਼ੁਸ਼ ਖ਼ਬਰੀ ਦੇ ਪ੍ਰਚਾਰ ਦਾ ਬਾਈਬਲ ਆਧਾਰਿਤ ਅਰਥ, ਰਸੂਲਾਂ ਦੇ ਤਰੀਕੇ ਅਤੇ ਮਸੀਹ ਦੇ ਹੁਕਮ ਦੀ ਪਾਲਣਾ।",
        publication: 'ਪਵਿੱਤਰ ਲਿਖਤਾਂ ਦੀ ਸਮਝ, ਭਾਗ 2',
      },
    },
  },
  {
    id: 'wol-patience-1',
    url: 'https://wol.jw.org/en/wol/d/r1/lp-e/1200003399',
    source: 'WOL.JW.ORG',
    bibleVerses: ['Galatians 5:22', 'James 5:7, 8'],
    topicKeywords: ['patience', 'long-suffering', 'endurance', 'համբերություն', 'терпение', 'долготерпение', 'धैर्य', 'ਧੀਰਜ'],
    localizations: {
      en: {
        title: 'Insight on the Scriptures — Patience and Long-Suffering',
        snippet: 'Calm endurance of provocation or misfortune, combined with a refusal to give up hope of improvement. Jehovah’s supreme example of patience.',
        publication: 'Insight on the Scriptures, Volume 2',
      },
      hy: {
        title: 'Գիտություն Գրությունների Մասին — Համբերություն և Երկայնամտություն',
        snippet: 'Փորձությունների հանգիստ տանումը և Եհովայի գերագույն օրինակը համբերության մեջ։',
        publication: 'Գիտություն Գրությունների Մասին, Հատոր 2',
      },
      ru: {
        title: 'Понимание Писания — Терпение и Долготерпение',
        snippet: 'Спокойное перенесение трудностей и пример Иеговы в проявлении непревзойденного терпения.',
        publication: 'Понимание Писания, Том 2',
      },
      hi: {
        title: 'शास्त्रों की अंतर्दृष्टि — धैर्य और सहनशीलता',
        snippet: 'कठिनाइयों को शांत मन से सहना और यहोवा परमेश्वर का बेजोड़ धैर्य का उदाहरण।',
        publication: 'शास्त्रों की अंतर्दृष्टि, भाग 2',
      },
      pa: {
        title: 'ਪਵਿੱਤਰ ਲਿਖਤਾਂ ਦੀ ਸਮਝ — ਧੀਰਜ ਅਤੇ ਸਹਿਣਸ਼ੀਲਤਾ',
        snippet: "ਮੁਸ਼ਕਲਾਂ ਨੂੰ ਸ਼ਾਂਤ ਮਨ ਨਾਲ ਸਹਿਣਾ ਅਤੇ ਯਹੋਵਾਹ ਪਰਮੇਸ਼ੁਰ ਦੀ ਬੇਮਿਸਾਲ ਧੀਰਜ ਦਾ ਨਮੂਨਾ।",
        publication: 'ਪਵਿੱਤਰ ਲਿਖਤਾਂ ਦੀ ਸਮਝ, ਭਾਗ 2',
      },
    },
  },
  {
    id: 'wol-prayer-1',
    url: 'https://wol.jw.org/en/wol/d/r1/lp-e/1200003529',
    source: 'WOL.JW.ORG',
    bibleVerses: ['Psalm 65:2', 'Philippians 4:6, 7'],
    topicKeywords: ['prayer', 'petition', 'supplication', 'աղոթք', 'молитва', 'прошение', 'प्रार्थना', 'ਪ੍ਰਾਰਥਨਾ'],
    localizations: {
      en: {
        title: 'Insight on the Scriptures — Prayer',
        snippet: 'Meaningful communication with the Sovereign Lord Jehovah. Conditions for being heard, posture, content, and the role of Jesus as Mediator.',
        publication: 'Insight on the Scriptures, Volume 2',
      },
      hy: {
        title: 'Գիտություն Գրությունների Մասին — Աղոթք',
        snippet: 'Իմաստալից հաղորդակցություն Եհովա Աստծու հետ։ Լսելի լինելու պայմանները և Հիսուսի դերը որպես Միջնորդ։',
        publication: 'Գիտություն Գրությունների Մասին, Հատոր 2',
      },
      ru: {
        title: 'Понимание Писания — Молитва',
        snippet: 'Искреннее общение со Всевышним Иеговой. Условия услышанных молитв и роль Иисуса как Посредника.',
        publication: 'Понимание Писания, Том 2',
      },
      hi: {
        title: 'शास्त्रों की अंतर्दृष्टि — प्रार्थना',
        snippet: 'यहोवा परमेश्वर से हृदयस्पर्शी बातचीत। प्रार्थनाएं सुने जाने की शर्तें और यीशु की मध्यस्थ भूमिका।',
        publication: 'शास्त्रों की अंतर्दृष्टि, भाग 2',
      },
      pa: {
        title: 'ਪਵਿੱਤਰ ਲਿਖਤਾਂ ਦੀ ਸਮਝ — ਪ੍ਰਾਰਥਨਾ',
        snippet: "ਯਹੋਵਾਹ ਪਰਮੇਸ਼ੁਰ ਨਾਲ ਸੱਚੀ ਗੱਲਬਾਤ। ਪ੍ਰਾਰਥਨਾਵਾਂ ਸੁਣੇ ਜਾਣ ਦੀਆਂ ਸ਼ਰਤਾਂ ਅਤੇ ਵਿਚੋਲੇ ਵਜੋਂ ਯਿਸੂ ਦੀ ਭੂਮਿਕਾ।",
        publication: 'ਪਵਿੱਤਰ ਲਿਖਤਾਂ ਦੀ ਸਮਝ, ਭਾਗ 2',
      },
    },
  },
  {
    id: 'wol-anxiety-1',
    url: 'https://wol.jw.org/en/wol/d/r1/lp-e/1200000318',
    source: 'WOL.JW.ORG',
    bibleVerses: ['Philippians 4:6', 'Proverbs 12:25', '1 Peter 5:7'],
    topicKeywords: ['anxiety', 'care', 'worry', 'stress', 'անհանգստություն', 'тревога', 'беспокойство', 'चिंता', 'ਚਿੰਤਾ'],
    localizations: {
      en: {
        title: 'Insight on the Scriptures — Anxiety and Worry',
        snippet: 'State of distress and unease. How the Scriptures advise casting burdens upon Jehovah and guarding the heart with godly peace.',
        publication: 'Insight on the Scriptures, Volume 1',
      },
      hy: {
        title: 'Գիտություն Գրությունների Մասին — Անհանգստություն և Հոգսեր',
        snippet: 'Ինչպես են Գրությունները հորդորում հանձնել հոգսերը Եհովային և պահպանել սիրտը աստվածային խաղաղությամբ։',
        publication: 'Գիտություն Գրությունների Մասին, Հատոր 1',
      },
      ru: {
        title: 'Понимание Писания — Беспокойство и Тревога',
        snippet: 'Как Библия советует возлагать все заботы на Иегову и защищать сердце Божьим миром.',
        publication: 'Понимание Писания, Том 1',
      },
      hi: {
        title: 'शास्त्रों की अंतर्दृष्टि — चिंता और व्याकुलता',
        snippet: 'बाइबल हमें अपने बोझ यहोवा पर डालने और परमेश्वर की शांति से अपने हृदय की रक्षा करने की सलाह देती है।',
        publication: 'शास्त्रों की अंतर्दृष्टि, भाग 1',
      },
      pa: {
        title: 'ਪਵਿੱਤਰ ਲਿਖਤਾਂ ਦੀ ਸਮਝ — ਚਿੰਤਾ ਅਤੇ ਫ਼ਿਕਰ',
        snippet: "ਬਾਈਬਲ ਸਾਨੂੰ ਆਪਣੇ ਬੋਝ ਯਹੋਵਾਹ ਪਰਮੇਸ਼ੁਰ ਉੱਤੇ ਸੁੱਟਣ ਅਤੇ ਮਨ ਦੀ ਸ਼ਾਂਤੀ ਬਣਾਈ ਰੱਖਣ ਦੀ ਸਲਾਹ ਦਿੰਦੀ ਹੈ।",
        publication: 'ਪਵਿੱਤਰ ਲਿਖਤਾਂ ਦੀ ਸਮਝ, ਭਾਗ 1',
      },
    },
  },
];

export class WOLService {
  /**
   * Calculates relevance score for a WOL article
   */
  static scoreArticleRelevance(
    article: MultilingualWOLArticle,
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

    if (title.includes(lowerQuery)) {
      score += 0.6;
    }

    for (const kw of keywords) {
      if (lowerQuery.includes(kw) || kw.includes(lowerQuery)) {
        score += 0.4;
        break;
      }
    }

    const queryTokens = lowerQuery.split(/[\s,.-]+/).filter(t => t.length > 2);
    if (queryTokens.length > 0) {
      let matchedTokens = 0;
      for (const token of queryTokens) {
        if (title.includes(token)) {
          matchedTokens += 1.5;
        } else if (keywords.some(k => k.includes(token))) {
          matchedTokens += 1.2;
        } else if (snippet.includes(token)) {
          matchedTokens += 0.8;
        }
      }
      const tokenScore = Math.min(0.5, (matchedTokens / queryTokens.length) * 0.4);
      score += tokenScore;
    }

    if (article.bibleVerses.some(v => lowerQuery.includes(v.toLowerCase()))) {
      score += 0.3;
    }

    return Math.min(1.0, score);
  }

  /**
   * Searches Watchtower Online Library (WOL.JW.ORG)
   * Discards results below relevance threshold. NEVER returns unrelated fallbacks.
   */
  static async searchWOL(rawQuery: string, langStr: string = 'en'): Promise<SearchResult[]> {
    const lang = LanguageService.normalizeLanguage(langStr);
    const cleanQuery = LanguageService.cleanSearchQuery(rawQuery, lang);
    const results: SearchResult[] = [];

    const wolLangMap: Record<SupportedLanguage, { path: string; lp: string }> = {
      en: { path: 'en', lp: 'e' },
      ru: { path: 'ru', lp: 'u' },
      hy: { path: 'hy', lp: 'rea' },
      hi: { path: 'hi', lp: 'hi' },
      pa: { path: 'pa', lp: 'pj' },
    };

    const { path: wolPath, lp: wolLp } = wolLangMap[lang] || wolLangMap['en'];

    // 1. Live WOL Search
    try {
      const searchUrl = `https://wol.jw.org/${wolPath}/wol/s/r1/lp-${wolLp}/?q=${encodeURIComponent(cleanQuery)}`;
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MinistryTrackerApp/1.0',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(3500),
      });

      if (response.ok) {
        const html = await response.text();
        const linkRegex = /<a[^>]+href="(\/[^"]+\/wol\/d\/r1\/lp-[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        let match;
        let count = 0;

        while ((match = linkRegex.exec(html)) !== null && count < 3) {
          const href = match[1];
          const rawTitle = match[2].replace(/<[^>]+>/g, '').trim();

          const queryTokens = cleanQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
          const hasOverlap = queryTokens.length === 0 || queryTokens.some(tok => rawTitle.toLowerCase().includes(tok));

          if (rawTitle && rawTitle.length > 3 && hasOverlap) {
            results.push({
              id: `wol-live-${count}-${Date.now()}`,
              title: rawTitle,
              snippet: 'Watchtower Online Library reference material.',
              url: href.startsWith('http') ? href : `https://wol.jw.org${href}`,
              source: 'WOL.JW.ORG',
              publication: 'Watchtower Online Library',
              relevanceScore: 0.85,
            });
            count++;
          }
        }
      }
    } catch {
      // Live search timeout
    }

    // 2. Scored Curated Search
    const scoredCatalog = VERIFIED_WOL_ARTICLES_MULTILINGUAL.map(article => ({
      article,
      score: this.scoreArticleRelevance(article, cleanQuery, lang),
    }))
      .filter(item => item.score >= 0.25)
      .sort((a, b) => b.score - a.score);

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

    // Return max 4 relevant items. If 0 items pass the threshold, return [] (no unrelated fallbacks)!
    return results.slice(0, 4);
  }
}
