import { MinistryAIService } from '../../server/services/MinistryAIService.ts';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, language = 'en', analytics } = req.body || {};

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const response = await MinistryAIService.processQuestion({
      question: question.trim(),
      language,
      analytics,
    });

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('Error in Vercel serverless function /api/ai/chat:', error);
    return res.status(500).json({
      error: 'Failed to process AI request',
      message: error?.message || 'Internal server error',
    });
  }
}
