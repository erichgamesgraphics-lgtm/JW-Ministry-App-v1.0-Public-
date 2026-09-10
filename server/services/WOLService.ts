import { SearchResult } from './types.js';

// Curated verified WOL.JW.ORG articles and Research Guide entries for deeper research
const VERIFIED_WOL_ARTICLES: SearchResult[] = [
  {
    id: 'wol-suffering-1',
    title: 'Insight on the Scriptures — Suffering',
    snippet: 'Comprehensive Scriptural study on the causes of suffering, Jehovah’s purpose in permitting hardship, and his ultimate provision for relief.',
    url: 'https://wol.jw.org/en/wol/d/r1/lp-e/1200004278',
    source: 'WOL.JW.ORG',
    publication: 'Insight on the Scriptures, Volume 2',
    bibleVerses: ['Romans 8:18-22', '2 Corinthians 1:3, 4', 'Hebrews 2:10'],
    topicKeywords: ['suffering', 'insight', 'hardship', 'pain', 'persecution', 'trial'],
  },
  {
    id: 'wol-kingdom-1',
    title: 'Insight on the Scriptures — Kingdom of God',
    snippet: 'Detailed theological analysis of God’s sovereign Kingdom, its royal administration, prophecy fulfillment, and earthly subjects.',
    url: 'https://wol.jw.org/en/wol/d/r1/lp-e/1200002623',
    source: 'WOL.JW.ORG',
    publication: 'Insight on the Scriptures, Volume 2',
    bibleVerses: ['Daniel 2:44', 'Matthew 6:10', 'Revelation 11:15'],
    topicKeywords: ['kingdom', 'gods kingdom', 'insight', 'government', 'messianic kingdom'],
  },
  {
    id: 'wol-resurrection-1',
    title: 'Insight on the Scriptures — Resurrection',
    snippet: 'In-depth reference on the heavenly and earthly resurrections, Scriptural resurrection accounts, and the guarantee provided by Christ’s resurrection.',
    url: 'https://wol.jw.org/en/wol/d/r1/lp-e/1200003708',
    source: 'WOL.JW.ORG',
    publication: 'Insight on the Scriptures, Volume 2',
    bibleVerses: ['1 Corinthians 15:12-22', 'John 11:23-26', 'Acts 24:15'],
    topicKeywords: ['resurrection', 'death', 'insight', 'recreation', 'grave', 'sheol'],
  },
  {
    id: 'wol-hope-1',
    title: 'Insight on the Scriptures — Hope',
    snippet: 'Definition and Biblical foundation of Christian hope, distinguishing Scriptural expectation from mere wishful thinking.',
    url: 'https://wol.jw.org/en/wol/d/r1/lp-e/1200002068',
    source: 'WOL.JW.ORG',
    publication: 'Insight on the Scriptures, Volume 1',
    bibleVerses: ['Hebrews 6:19', 'Romans 5:3-5', 'Titus 1:2'],
    topicKeywords: ['hope', 'insight', 'expectation', 'anchor', 'promises'],
  },
  {
    id: 'wol-ministry-1',
    title: 'Research Guide for Jehovah’s Witnesses — Field Ministry',
    snippet: 'Reference tool gathering Watchtower publications, preaching presentations, tactful answers to objections, and house-to-house efficiency guidelines.',
    url: 'https://wol.jw.org/en/wol/d/r1/lp-e/1200201633',
    source: 'WOL.JW.ORG',
    publication: 'Research Guide for Jehovah’s Witnesses',
    bibleVerses: ['Matthew 24:14', 'Matthew 28:19, 20', 'Acts 20:20'],
    topicKeywords: ['ministry', 'preaching', 'field service', 'return visits', 'bible study', 'conversations'],
  },
  {
    id: 'wol-prayer-1',
    title: 'Insight on the Scriptures — Prayer',
    snippet: 'Deep study into prayer requirements, Jehovah as the Hearer of prayer, acceptable approaches through Jesus, and perseverance in prayer.',
    url: 'https://wol.jw.org/en/wol/d/r1/lp-e/1200003531',
    source: 'WOL.JW.ORG',
    publication: 'Insight on the Scriptures, Volume 2',
    bibleVerses: ['Psalm 65:2', '1 John 5:14', 'Luke 11:9-13'],
    topicKeywords: ['pray', 'prayer', 'prayers', 'supplication', 'petition'],
  },
];

export class WOLService {
  /**
   * Search Watchtower Online Library (WOL.JW.ORG) for deeper research material
   */
  static async searchWOL(query: string, language: string = 'en'): Promise<SearchResult[]> {
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
        // Parse simple result links from HTML if available
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
    const matchedCurated = VERIFIED_WOL_ARTICLES.filter(article => {
      const titleMatch = article.title.toLowerCase().includes(cleanQuery);
      const keywordMatch = article.topicKeywords?.some(k => cleanQuery.includes(k) || k.includes(cleanQuery));
      const wordMatch = queryWords.some(word =>
        article.title.toLowerCase().includes(word) ||
        article.snippet.toLowerCase().includes(word) ||
        article.topicKeywords?.some(k => k.includes(word))
      );
      return titleMatch || keywordMatch || wordMatch;
    });

    const existingUrls = new Set(results.map(r => r.url));
    for (const curated of matchedCurated) {
      if (!existingUrls.has(curated.url)) {
        results.push(curated);
        existingUrls.add(curated.url);
      }
    }

    return results.slice(0, 4);
  }
}
