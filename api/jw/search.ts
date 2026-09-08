import { JWOrgService } from '../../server/services/JWOrgService.ts';
import { WOLService } from '../../server/services/WOLService.ts';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const q = (req.query?.q as string) || '';
    const lang = (req.query?.lang as string) || 'en';
    const wolOnly = req.query?.wol === 'true';

    if (!q.trim()) {
      return res.status(200).json({ results: [], total: 0 });
    }

    if (wolOnly) {
      const results = await WOLService.searchWOL(q, lang, 8);
      return res.status(200).json({ results, total: results.length });
    } else {
      const searchRes = await JWOrgService.search(q, lang, 8);
      return res.status(200).json({ results: searchRes.results, total: searchRes.totalResults });
    }
  } catch (error: any) {
    console.error('Error in Vercel serverless function /api/jw/search:', error);
    return res.status(500).json({
      error: 'Search failed',
      message: error?.message || 'Internal server error',
    });
  }
}
