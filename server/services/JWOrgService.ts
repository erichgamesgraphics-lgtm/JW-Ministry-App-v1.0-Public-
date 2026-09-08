export interface JWSourceResult {
  id: string;
  title: string;
  source: 'JW.ORG' | 'WOL.JW.ORG';
  url: string;
  jwUrl?: string;
  wolUrl?: string;
  summary: string;
  context?: string;
  scripture?: string;
  date?: string;
  imageUrl?: string;
}

export interface JWSearchResponse {
  query: string;
  langCode: string;
  results: JWSourceResult[];
  totalResults: number;
}

// Map supported language codes to JW.org language symbols
export const JW_LANG_MAP: Record<string, { langCode: string; wtLocale: string; label: string }> = {
  en: { langCode: 'E', wtLocale: 'E', label: 'English' },
  ru: { langCode: 'U', wtLocale: 'U', label: 'Russian' },
  hy: { langCode: 'REA', wtLocale: 'REA', label: 'Armenian' },
  hi: { langCode: 'HI', wtLocale: 'HI', label: 'Hindi' },
  pa: { langCode: 'PJ', wtLocale: 'PJ', label: 'Punjabi' },
};

// Cached token
let cachedJwtToken: string | null = null;
let tokenExpiresAt = 0;

async function fetchJson(url: string, headers: Record<string, string> = {}): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        ...headers,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    return await res.json();
  } catch (err: any) {
    clearTimeout(timeout);
    throw err;
  }
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = await res.text();
    return data.trim();
  } catch (err: any) {
    clearTimeout(timeout);
    throw err;
  }
}

async function getJwtToken(): Promise<string> {
  const now = Date.now();
  if (cachedJwtToken && now < tokenExpiresAt - 60000) {
    return cachedJwtToken;
  }

  try {
    const token = await fetchText('https://b.jw-cdn.org/tokens/jworg.jwt');
    cachedJwtToken = token;
    // Tokens are usually valid for 24+ hours; set safe refresh at 12 hours
    tokenExpiresAt = now + 12 * 60 * 60 * 1000;
    return token;
  } catch (error) {
    console.error('Failed to fetch JW JWT token:', error);
    throw new Error('Unable to authenticate with JW search services');
  }
}

function cleanHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<mark[^>]*>/gi, '')
    .replace(/<\/mark>/gi, '')
    .replace(/<strong[^>]*>/gi, '')
    .replace(/<\/strong>/gi, '')
    .replace(/<em[^>]*>/gi, '')
    .replace(/<\/em>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

const SCRIPTURE_REGEX =
  /(?:[123]\s+[A-Za-z]+|[A-Za-z]+)\s+\d+(?::\d+(?:[–\-—]\d+)?)?(?:,\s*\d+(?:[–\-—]\d+)?)*/g;

function extractScriptures(text: string): string | undefined {
  if (!text) return undefined;
  const matches = text.match(SCRIPTURE_REGEX);
  if (matches && matches.length > 0) {
    // Filter out common false positives
    const valid = matches.filter((m) => {
      const lower = m.toLowerCase();
      return (
        !lower.includes('page') &&
        !lower.includes('vol') &&
        !lower.includes('paragraph') &&
        !lower.includes('year') &&
        !lower.includes('january') &&
        !lower.includes('december')
      );
    });
    if (valid.length > 0) {
      return valid.slice(0, 2).join('; ');
    }
  }
  return undefined;
}

export class JWOrgService {
  /**
   * Search JW.ORG and WOL publications using the official OmniSearch API
   */
  static async search(query: string, lang = 'en', limit = 6): Promise<JWSearchResponse> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { query: '', langCode: 'E', results: [], totalResults: 0 };
    }

    const langInfo = JW_LANG_MAP[lang] || JW_LANG_MAP.en;
    const token = await getJwtToken();

    let results = await this.executeSearch(trimmed, langInfo.langCode, token, limit);

    // Fallback: If 0 results in non-English, try English to ensure the user gets helpful content
    if (results.length === 0 && langInfo.langCode !== 'E') {
      try {
        const enResults = await this.executeSearch(trimmed, 'E', token, limit);
        if (enResults.length > 0) {
          results = enResults;
        }
      } catch (err) {
        console.warn('English fallback search failed:', err);
      }
    }

    return {
      query: trimmed,
      langCode: langInfo.langCode,
      results,
      totalResults: results.length,
    };
  }

  private static async executeSearch(
    query: string,
    langCode: string,
    token: string,
    limit: number
  ): Promise<JWSourceResult[]> {
    const searchUrl = `https://b.jw-cdn.org/apis/search/results/${langCode}/all?q=${encodeURIComponent(
      query
    )}&limit=${limit}`;

    const data = await fetchJson(searchUrl, {
      Authorization: `Bearer ${token}`,
    });

    const items: JWSourceResult[] = [];

    if (data && Array.isArray(data.results)) {
      for (const group of data.results) {
        // Results can be direct items or grouped
        const groupResults = Array.isArray(group.results) ? group.results : [group];

        for (const item of groupResults) {
          if (!item || !item.title) continue;

          const jwLink = item.links?.['jw.org'] || undefined;
          const wolLink = item.links?.wol || undefined;

          // Determine primary source and URL
          let source: 'JW.ORG' | 'WOL.JW.ORG' = 'JW.ORG';
          let primaryUrl = jwLink || wolLink;

          const contextLower = (item.context || '').toLowerCase();
          const titleLower = (item.title || '').toLowerCase();

          if (
            !jwLink ||
            wolLink && (contextLower.includes('insight') || contextLower.includes('reasoning') || contextLower.includes('aid'))
          ) {
            source = 'WOL.JW.ORG';
            primaryUrl = wolLink || jwLink;
          }

          if (!primaryUrl) continue;

          const rawSnippet = item.snippet || item.body || '';
          const summary = cleanHtml(rawSnippet);
          const rawContext = item.context ? cleanHtml(item.context) : undefined;
          const scripture = extractScriptures(rawSnippet) || extractScriptures(item.title);

          const imageUrl =
            item.image?.url ||
            (item.image?.type === 'sqs' && item.lank
              ? `https://cms-imgp.jw-cdn.org/img/p/${item.lank.replace('pa-', '')}/univ/art/${item.lank.replace('pa-', '')}_univ_sqs_lg.jpg`
              : undefined);

          items.push({
            id: item.lank || `jw-${items.length}-${Date.now()}`,
            title: cleanHtml(item.title),
            source,
            url: primaryUrl,
            jwUrl: jwLink,
            wolUrl: wolLink,
            summary,
            context: rawContext,
            scripture,
            date: item.date || item.publicationYear || undefined,
            imageUrl,
          });

          if (items.length >= limit) break;
        }

        if (items.length >= limit) break;
      }
    }

    return items;
  }
}
