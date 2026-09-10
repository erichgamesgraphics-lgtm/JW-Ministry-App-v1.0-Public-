import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { MinistryAIService } from './server/services/MinistryAIService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser Middleware
  app.use(express.json({ limit: '10mb' }));

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Native Ministry Assistant API Endpoint
  app.post('/api/ministry-ai', async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const payload = req.body;
      if (!payload || typeof payload.message !== 'string' || !payload.message.trim()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PAYLOAD',
            message: 'Invalid request payload. Message is required.',
          },
        });
      }

      const response = await MinistryAIService.processRequest(payload);
      return res.json({
        success: true,
        answer: response.answer,
        sources: response.sources || [],
        suggestedFollowUps: response.suggestedFollowUps || [],
      });
    } catch (err: any) {
      console.error('API /api/ministry-ai Error:', err);
      const userFriendlyError = err?.message || 'An unexpected error occurred processing your request.';
      return res.status(500).json({
        success: false,
        error: {
          code: 'MINISTRY_ASSISTANT_ERROR',
          message: userFriendlyError,
        },
      });
    }
  });

  // Vite development middleware or production static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ministry Tracker App running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
