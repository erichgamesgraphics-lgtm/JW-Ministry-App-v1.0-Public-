import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { MinistryAIService } from './server/services/MinistryAIService.ts';
import { JWOrgService } from './server/services/JWOrgService.ts';
import { WOLService } from './server/services/WOLService.ts';

const currentFilename = typeof __filename !== 'undefined' ? __filename : (typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : '');
const currentDirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(currentFilename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json({ limit: '5mb' }));

  // CORS Middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'JW Ministry Tracker & Ministry AI',
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Ministry AI Chat endpoint
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { question, language = 'en', analytics } = req.body;

      if (!question || typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({ error: 'Question is required' });
      }

      const response = await MinistryAIService.processQuestion({
        question: question.trim(),
        language,
        analytics,
      });

      return res.json(response);
    } catch (error: any) {
      console.error('Error in /api/ai/chat:', error);
      return res.status(500).json({
        error: 'Failed to process AI request',
        message: error?.message || 'Internal error',
      });
    }
  });

  // 3. Isolated JW.ORG / WOL search endpoint
  app.get('/api/jw/search', async (req, res) => {
    try {
      const q = (req.query.q as string) || '';
      const lang = (req.query.lang as string) || 'en';
      const wolOnly = req.query.wol === 'true';

      if (!q.trim()) {
        return res.json({ results: [], total: 0 });
      }

      if (wolOnly) {
        const results = await WOLService.searchWOL(q, lang, 8);
        return res.json({ results, total: results.length });
      } else {
        const searchRes = await JWOrgService.search(q, lang, 8);
        return res.json({ results: searchRes.results, total: searchRes.totalResults });
      }
    } catch (error: any) {
      console.error('Error in /api/jw/search:', error);
      return res.status(500).json({
        error: 'Search failed',
        message: error?.message || 'Internal error',
      });
    }
  });

  // 4. Vite middleware for development vs Static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JW Ministry Tracker server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
