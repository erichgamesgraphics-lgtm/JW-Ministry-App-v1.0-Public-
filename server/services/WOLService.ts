import { JWOrgService, JWSourceResult, JW_LANG_MAP } from './JWOrgService.ts';

export class WOLService {
  /**
   * Specifically query WOL.JW.ORG (Watchtower Online Library)
   * Prioritizes study publications (Insight on the Scriptures, Reasoning, Research Guides, etc.)
   */
  static async searchWOL(query: string, lang = 'en', limit = 6): Promise<JWSourceResult[]> {
    const langInfo = JW_LANG_MAP[lang] || JW_LANG_MAP.en;

    // Use OmniSearch with deeper research keywords or direct filtering
    const searchRes = await JWOrgService.search(query, lang, limit * 2);

    // Transform and prioritize WOL links
    const wolResults: JWSourceResult[] = [];

    for (const item of searchRes.results) {
      if (item.wolUrl || item.source === 'WOL.JW.ORG') {
        wolResults.push({
          ...item,
          source: 'WOL.JW.ORG',
          url: item.wolUrl || item.url,
        });
      }
    }

    // If no direct wol-tagged items, convert available items into their WOL finder links
    if (wolResults.length === 0) {
      for (const item of searchRes.results) {
        const wolUrl =
          item.wolUrl ||
          `https://wol.jw.org/wol/finder?wtlocale=${langInfo.wtLocale}&q=${encodeURIComponent(query)}`;
        wolResults.push({
          ...item,
          source: 'WOL.JW.ORG',
          url: wolUrl,
          wolUrl,
        });
      }
    }

    return wolResults.slice(0, limit);
  }
}
