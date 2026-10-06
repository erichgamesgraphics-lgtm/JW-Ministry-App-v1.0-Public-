import { ContentType, ResearchFilters, ResearchPlan, ResearchResult, ResearchSession } from './types.js';
import { VERIFIED_JW_ARTICLES_CATALOG, MultilingualJWArticle } from '../JWOrgService.js';
import { LanguageService } from '../LanguageService.js';
import { SupportedLanguage } from '../../src/types.js';

let cachedJWT: { token: string; expiresAt: number } | null = null;
const searchCache = new Map<string, { timestamp: number; results: ResearchResult[] }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getJWOrgJWT(): Promise<string | null> {
  const now = Date.now();
  if (cachedJWT && cachedJWT.expiresAt > now) {
    return cachedJWT.token;
  }
  try {
    const res = await fetch('https://b.jw-cdn.org/tokens/jworg.jwt', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MinistryTrackerApp/2.0',
      },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const token = (await res.text()).trim();
      if (token) {
        cachedJWT = { token, expiresAt: now + 3600000 };
        return token;
      }
    }
  } catch (err) {
    console.warn('JW.ORG JWT retrieval warning:', err);
  }
  return null;
}

function cleanHTMLText(str: string): string {
  if (!str) return '';
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function mapSubtypeToContentType(subtype?: string, title?: string, url?: string): ContentType {
  const sub = (subtype || '').toLowerCase();
  const t = (title || '').toLowerCase();
  const u = (url || '').toLowerCase();

  if (sub.includes('video') || t.includes('video') || t.includes('фильм') || t.includes('видео') || t.includes('տեսանյութ') || u.includes('video')) {
    return 'Video';
  }
  if (sub.includes('bible') || sub.includes('scripture') || t.includes('bible') || t.includes('библия') || t.includes('աստվածաշունչ') || u.includes('/bible/')) {
    return 'Bible';
  }
  if (sub.includes('pub') || sub.includes('book') || sub.includes('brochure') || sub.includes('magazine') || t.includes('watchtower') || t.includes('awake') || t.includes('դիտարան') || t.includes('сторожевая башня')) {
    return 'Publication';
  }
  if (sub.includes('news') || sub.includes('release') || t.includes('news')) {
    return 'News';
  }
  if (sub.includes('article') || sub.includes('topic') || sub.includes('question')) {
    return 'Article';
  }
  return 'Article';
}

export class ResearchTools {
  /**
   * Tool: searchJWOrg()
   * Primary official search against JW.ORG API & catalog
   */
  static async searchJWOrg(
    rawQuery: string,
    langStr: string = 'en',
    page: number = 1,
    secondaryQueries?: string[]
  ): Promise<ResearchResult[]> {
    const lang = LanguageService.normalizeLanguage(langStr);
    const cleanQuery = LanguageService.cleanSearchQuery(rawQuery, lang);
    if (!cleanQuery) return [];

    const cacheKey = `${lang}:${page}:${cleanQuery.toLowerCase()}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.results;
    }

    const langPathMap: Record<SupportedLanguage, { path: string; wtlocale: string }> = {
      en: { path: 'en', wtlocale: 'E' },
      ru: { path: 'ru', wtlocale: 'U' },
      hy: { path: 'hy', wtlocale: 'REA' },
      hi: { path: 'hi', wtlocale: 'HI' },
      pa: { path: 'pa', wtlocale: 'PJ' },
    };

    const { path: jwLang, wtlocale } = langPathMap[lang] || langPathMap['en'];
    const results: ResearchResult[] = [];
    const seenUrls = new Set<string>();

    const queriesToExecute = [cleanQuery];
    if (Array.isArray(secondaryQueries)) {
      for (const sq of secondaryQueries) {
        const cleanedSq = LanguageService.cleanSearchQuery(sq, lang);
        if (cleanedSq && !queriesToExecute.includes(cleanedSq)) {
          queriesToExecute.push(cleanedSq);
        }
      }
    }

    try {
      const jwt = await getJWOrgJWT();
      if (jwt) {
        for (const q of queriesToExecute) {
          if (results.length >= 8) break; // Sufficient quality results collected
          const offset = (page - 1) * 20;
          const searchUrl = `https://b.jw-cdn.org/apis/search/results/${wtlocale}/all?q=${encodeURIComponent(q)}&limit=20&offset=${offset}`;

          const response = await fetch(searchUrl, {
            headers: {
              Authorization: `Bearer ${jwt}`,
              Accept: 'application/json; charset=utf-8',
              'X-Client-ID': 'jworg-web',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MinistryTrackerApp/2.0',
            },
            signal: AbortSignal.timeout(5000),
          });

          if (response.ok) {
            const contentTypeHeader = response.headers.get('content-type') || '';
            if (contentTypeHeader.includes('application/json')) {
              const data = await response.json();
              const extracted = this.extractJWSearchResults(data.results || [], lang, jwLang);
              for (const item of extracted) {
                if (!seenUrls.has(item.url)) {
                  seenUrls.add(item.url);
                  results.push(item);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Live JW.ORG search API error:', err);
    }

    // Fallback: Use verified catalog if API produced no items
    if (results.length === 0) {
      for (const q of queriesToExecute) {
        const scoredCatalog = VERIFIED_JW_ARTICLES_CATALOG.map((article) => ({
          article,
          score: this.scoreCatalogArticle(article, q, lang),
        }))
          .filter((item) => item.score >= 0.2)
          .sort((a, b) => b.score - a.score);

        for (const item of scoredCatalog) {
          if (!seenUrls.has(item.article.url)) {
            seenUrls.add(item.article.url);
            const loc = item.article.localizations[lang] || item.article.localizations['en'];
            results.push({
              id: item.article.id,
              title: loc.title,
              snippet: loc.snippet,
              url: item.article.url,
              source: 'JW.ORG',
              publication: loc.publication,
              contentType: 'Article',
              language: lang,
              bibleVerses: item.article.bibleVerses,
              topicKeywords: item.article.topicKeywords,
              relevanceScore: Number(item.score.toFixed(2)),
            });
          }
        }
      }
    }

    if (results.length > 0) {
      searchCache.set(cacheKey, { timestamp: Date.now(), results });
    }

    return results;
  }

  /**
   * Tool: extractJWSearchResults()
   * Extracts clean, structured ResearchResult items from raw API response payload
   */
  static extractJWSearchResults(rawResultsArr: any[], lang: string, jwLang: string): ResearchResult[] {
    const items: any[] = [];

    const findItems = (arr: any[]) => {
      if (!Array.isArray(arr)) return;
      for (const item of arr) {
        if (item.type === 'item') items.push(item);
        if (item.type === 'group' && Array.isArray(item.results)) findItems(item.results);
      }
    };

    findItems(rawResultsArr);

    const extracted: ResearchResult[] = [];
    const seenUrls = new Set<string>();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const titleClean = cleanHTMLText(item.title || '');
      const snippetClean = cleanHTMLText(item.snippet || item.context || item.caption || '');

      if (!titleClean) continue;

      let url = item.links?.['jw.org'] || item.links?.wol || item.url;
      if (!url) {
        url = `https://www.jw.org/${jwLang}/open?docid=${item.docid || ''}`;
      } else if (url.startsWith('/')) {
        url = `https://www.jw.org${url}`;
      }

      if (seenUrls.has(url)) continue;
      seenUrls.add(url);

      const isWol = url.includes('wol.jw.org');
      const source = isWol ? 'WOL.JW.ORG' : 'JW.ORG';
      const pubName = item.context || item.pubName || item.publicationName || (isWol ? 'Watchtower Online Library' : 'JW.ORG');
      const thumbnail = item.image?.url || undefined;
      const contentType = mapSubtypeToContentType(item.subtype, titleClean, url);

      extracted.push({
        id: `jw-res-${i}-${Date.now()}`,
        title: titleClean,
        snippet: snippetClean || `${contentType} from official JW.ORG`,
        url,
        source,
        publication: pubName,
        contentType,
        language: lang,
        thumbnail,
        relevanceScore: Math.max(0.5, 1.0 - i * 0.04),
      });
    }

    return extracted;
  }

  /**
   * Tool: scoreCatalogArticle()
   */
  private static scoreCatalogArticle(article: MultilingualJWArticle, cleanQuery: string, lang: SupportedLanguage): number {
    const lowerQuery = cleanQuery.toLowerCase().trim();
    if (!lowerQuery) return 0;

    const loc = article.localizations[lang] || article.localizations['en'];
    const title = loc.title.toLowerCase();
    const snippet = loc.snippet.toLowerCase();
    const keywords = (article.topicKeywords || []).map((k) => k.toLowerCase());

    let score = 0;
    if (title.includes(lowerQuery)) score += 0.6;
    for (const kw of keywords) {
      if (lowerQuery.includes(kw) || kw.includes(lowerQuery)) {
        score += 0.45;
        break;
      }
    }

    const tokens = lowerQuery.split(/[\s,.-]+/).filter((t) => t.length >= 3);
    for (const token of tokens) {
      if (title.includes(token)) score += 0.2;
      else if (snippet.includes(token)) score += 0.1;
    }

    return Math.min(1.0, score);
  }

  /**
   * Tool: rankResearchResults()
   * Multi-factor relevance ranking considering topic, requested content type, audience, and context
   */
  static rankResearchResults(results: ResearchResult[], plan: ResearchPlan): ResearchResult[] {
    const topicTokens = (plan.topic || plan.searchQuery || '')
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length >= 3);

    const targetType = plan.contentType;
    const audience = (plan.audience || '').toLowerCase();
    const datePref = plan.datePreference;

    return [...results].map((res) => {
      let score = res.relevanceScore || 0.5;
      const titleLower = res.title.toLowerCase();
      const snippetLower = res.snippet.toLowerCase();

      // Content Type boost
      if (targetType && targetType !== 'All') {
        if (res.contentType === targetType) {
          score += 0.4;
        } else {
          score -= 0.2;
        }
      }

      // Audience boost
      if (audience.includes('young') || audience.includes('youth') || audience.includes('teen')) {
        if (titleLower.includes('young') || titleLower.includes('youth') || titleLower.includes('teen') || titleLower.includes('подросток') || titleLower.includes('молодеж') || titleLower.includes('երիտասարդ')) {
          score += 0.35;
        }
      }

      // Date Preference boost
      if (datePref === 'newer') {
        if (titleLower.includes('202') || titleLower.includes('recent') || titleLower.includes('convention')) {
          score += 0.2;
        }
      }

      // Topic Keyword match boost
      for (const token of topicTokens) {
        if (titleLower.includes(token)) score += 0.15;
        else if (snippetLower.includes(token)) score += 0.08;
      }

      return {
        ...res,
        relevanceScore: Math.min(1.0, Math.max(0.1, Number(score.toFixed(2)))),
      };
    }).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  /**
   * Tool: filterResearchResults()
   * Excludes unwanted types or keeps specific content types
   */
  static filterResearchResults(results: ResearchResult[], filters: ResearchFilters): ResearchResult[] {
    return results.filter((res) => {
      // Exclude check
      if (filters.excludeTypes && filters.excludeTypes.includes(res.contentType)) {
        return false;
      }

      // Specific content type check
      if (filters.contentType && filters.contentType !== 'All' && res.contentType !== filters.contentType) {
        return false;
      }

      return true;
    });
  }

  /**
   * Tool: openJWSource()
   * Verifies domain and returns clean source info for opening
   */
  static openJWSource(result: ResearchResult): { url: string; title: string; verified: boolean; contentType: ContentType } {
    const rawUrl = result.url || '';
    let isAllowedDomain = false;

    try {
      const parsed = new URL(rawUrl);
      const host = parsed.hostname.toLowerCase();
      if (
        host === 'www.jw.org' ||
        host === 'jw.org' ||
        host === 'wol.jw.org' ||
        host.endsWith('.jw.org') ||
        host.endsWith('.jw-cdn.org')
      ) {
        isAllowedDomain = true;
      }
    } catch {
      isAllowedDomain = false;
    }

    if (!isAllowedDomain) {
      throw new Error(`Security validation failed: Domain of "${rawUrl}" is not an official JW.ORG domain.`);
    }

    return {
      url: rawUrl,
      title: result.title,
      verified: true,
      contentType: result.contentType,
    };
  }

  /**
   * Tool: getArticle()
   */
  static getArticle(results: ResearchResult[], indexOrQuery?: number | string): ResearchResult | undefined {
    const articles = results.filter((r) => r.contentType === 'Article');
    if (articles.length === 0) return results[0];
    if (typeof indexOrQuery === 'number' && articles[indexOrQuery]) {
      return articles[indexOrQuery];
    }
    return articles[0];
  }

  /**
   * Tool: getVideo()
   */
  static getVideo(results: ResearchResult[], indexOrQuery?: number | string): ResearchResult | undefined {
    const videos = results.filter((r) => r.contentType === 'Video');
    if (videos.length === 0) {
      // Find any item with "video" in title
      return results.find((r) => r.title.toLowerCase().includes('video') || r.title.toLowerCase().includes('видео') || r.title.toLowerCase().includes('տեսանյութ'));
    }
    if (typeof indexOrQuery === 'number' && videos[indexOrQuery]) {
      return videos[indexOrQuery];
    }
    return videos[0];
  }

  /**
   * Tool: getPublication()
   */
  static getPublication(results: ResearchResult[], indexOrQuery?: number | string): ResearchResult | undefined {
    const pubs = results.filter((r) => r.contentType === 'Publication');
    if (pubs.length === 0) return results[0];
    if (typeof indexOrQuery === 'number' && pubs[indexOrQuery]) {
      return pubs[indexOrQuery];
    }
    return pubs[0];
  }

  /**
   * Tool: refineResearch()
   */
  static async refineResearch(session: ResearchSession, newPlan: ResearchPlan): Promise<ResearchSession> {
    const newTopic = newPlan.topic || session.currentTopic;
    let updatedResults = session.results;

    // Check if topic changed or new search needed
    if (newPlan.actionType === 'CHANGE_TOPIC' || newPlan.actionType === 'NEW_SEARCH' || newTopic !== session.currentTopic) {
      const searchRes = await this.searchJWOrg(newPlan.searchQuery || newTopic, newPlan.language);
      updatedResults = this.rankResearchResults(searchRes, newPlan);
    } else {
      // Apply filters to existing results
      updatedResults = this.rankResearchResults(session.results, newPlan);
      updatedResults = this.filterResearchResults(updatedResults, {
        contentType: newPlan.contentType,
        excludeTypes: newPlan.excludeTypes,
      });
    }

    return {
      ...session,
      currentTopic: newTopic,
      results: updatedResults,
      filters: {
        contentType: newPlan.contentType,
        audience: newPlan.audience,
        datePreference: newPlan.datePreference,
        excludeTypes: newPlan.excludeTypes,
      },
      lastSearchQuery: newPlan.searchQuery || newTopic,
      lastPlan: newPlan,
      updatedAt: Date.now(),
    };
  }

  /**
   * Tool: summarizeJWSource()
   */
  static summarizeJWSource(result: ResearchResult, lang: string): string {
    const targetLang = LanguageService.normalizeLanguage(lang);
    const pub = result.publication ? ` (*${result.publication}*)` : '';

    if (targetLang === 'ru') {
      return `**${result.title}**${pub}\n${result.snippet}`;
    }
    if (targetLang === 'hy') {
      return `**${result.title}**${pub}\n${result.snippet}`;
    }
    if (targetLang === 'hi') {
      return `**${result.title}**${pub}\n${result.snippet}`;
    }
    if (targetLang === 'pa') {
      return `**${result.title}**${pub}\n${result.snippet}`;
    }
    return `**${result.title}**${pub}\n${result.snippet}`;
  }
}
