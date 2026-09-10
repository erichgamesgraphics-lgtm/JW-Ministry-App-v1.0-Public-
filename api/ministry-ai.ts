import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MinistryAIService } from '../server/services/MinistryAIService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & Content-Type Headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are allowed on this endpoint.',
      },
    });
  }

  try {
    const payload = req.body || {};
    if (!payload || typeof payload.message !== 'string' || !payload.message.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Message parameter is required.',
        },
      });
    }

    const result = await MinistryAIService.processRequest(payload);

    return res.status(200).json({
      success: true,
      answer: result.answer,
      sources: result.sources || [],
      suggestedFollowUps: result.suggestedFollowUps || [],
    });
  } catch (err: any) {
    console.error('Vercel API /api/ministry-ai Error:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'MINISTRY_ASSISTANT_ERROR',
        message: err?.message || 'An error occurred processing the Ministry Assistant request.',
      },
    });
  }
}
