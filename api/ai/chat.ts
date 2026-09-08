import { MinistryAIService } from '../../server/services/MinistryAIService.ts';
import { normalizeAIError } from '../../src/utils/errorUtils.ts';

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

    const cleanMsg = normalizeAIError(error);

    let statusCode = 500;
    if (
      cleanMsg.includes('GEMINI_API_KEY') ||
      cleanMsg.includes('API key') ||
      cleanMsg.includes('authentication') ||
      cleanMsg.includes('401') ||
      cleanMsg.includes('403')
    ) {
      statusCode = 401;
    } else if (cleanMsg.includes('quota') || cleanMsg.includes('rate limit') || cleanMsg.includes('429')) {
      statusCode = 429;
    }

    return res.status(statusCode).json({
      error: 'Ministry AI Server Error',
      message: cleanMsg,
      status: statusCode,
    });
  }
}
