import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { MinistryAIService } from './server/services/MinistryAIService.js';
import { BackupService } from './server/services/BackupService.js';

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

  // Helper to parse cookies from headers
  function parseCookies(cookieHeader?: string): Record<string, string> {
    const list: Record<string, string> = {};
    if (!cookieHeader) return list;
    cookieHeader.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      const name = parts.shift()?.trim();
      if (name) {
        list[name] = decodeURIComponent(parts.join('='));
      }
    });
    return list;
  }

  // Check for previous backup (for automatic discovery on reinstallation)
  app.get('/api/backup/check', async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const cookies = parseCookies(req.headers.cookie);
      const cookieKey = cookies['mt_device_recovery'];
      const queryKey = typeof req.query.key === 'string' ? req.query.key.trim() : undefined;
      const installationId = typeof req.headers['x-installation-id'] === 'string' ? req.headers['x-installation-id'].trim() : undefined;

      const targetKey = queryKey || cookieKey;
      const meta = await BackupService.check(targetKey, installationId);

      if (meta) {
        return res.json({
          found: true,
          backupMeta: meta,
        });
      }

      return res.json({
        found: false,
      });
    } catch (err: any) {
      console.error('API /api/backup/check Error:', err);
      return res.status(500).json({ found: false, error: err?.message || 'Check failed' });
    }
  });

  // Save automatic or manual backup
  app.post('/api/backup/save', async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const { recoveryKey, installationId, backupPackage, metadata } = req.body;
      if (!recoveryKey || !backupPackage) {
        return res.status(400).json({
          success: false,
          error: 'recoveryKey and backupPackage are required',
        });
      }

      const result = await BackupService.save(
        recoveryKey,
        installationId || 'unknown',
        typeof backupPackage === 'string' ? backupPackage : JSON.stringify(backupPackage),
        metadata || {
          recoveryKey,
          installationId: installationId || '',
          deviceName: 'Web Device',
          platform: 'web',
          appVersion: '2.0.0',
          createdAt: Date.now(),
          lastBackupAt: Date.now(),
          entriesCount: 0,
          eventsCount: 0,
          totalHours: '0',
          publisherStatus: 'PUBLISHER',
          language: 'en',
        }
      );

      // Set long-lived cookie so re-opening or reinstalling on this device can recognize the backup
      res.setHeader(
        'Set-Cookie',
        `mt_device_recovery=${encodeURIComponent(recoveryKey)}; Path=/; Max-Age=63072000; SameSite=Lax`
      );

      return res.json({
        success: true,
        lastBackupAt: result.lastBackupAt,
      });
    } catch (err: any) {
      console.error('API /api/backup/save Error:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Failed to save backup',
      });
    }
  });

  // Restore backup by recoveryKey
  app.post('/api/backup/restore', async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const cookies = parseCookies(req.headers.cookie);
      const recoveryKey = (req.body?.recoveryKey || cookies['mt_device_recovery'] || '').trim();

      if (!recoveryKey) {
        return res.status(400).json({
          success: false,
          error: 'Recovery key is required',
        });
      }

      const result = await BackupService.get(recoveryKey);
      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'No backup found for this recovery key',
        });
      }

      // Re-issue cookie to keep installation identity linked
      res.setHeader(
        'Set-Cookie',
        `mt_device_recovery=${encodeURIComponent(recoveryKey)}; Path=/; Max-Age=63072000; SameSite=Lax`
      );

      return res.json({
        success: true,
        backupPackage: result.backupPackageStr,
        metadata: result.metadata,
      });
    } catch (err: any) {
      console.error('API /api/backup/restore Error:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Failed to restore backup',
      });
    }
  });

  // Direct download of .mtbackup file
  app.get('/api/backup/download/:recoveryKey', async (req: Request, res: Response) => {
    try {
      const recoveryKey = req.params.recoveryKey;
      const result = await BackupService.get(recoveryKey);
      if (!result) {
        return res.status(404).send('Backup not found');
      }

      const dateStr = new Date(result.metadata.lastBackupAt || Date.now()).toISOString().split('T')[0];
      const filename = `Ministry_Tracker_Backup_${dateStr}.mtbackup`;

      res.setHeader('Content-Type', 'application/x-ministry-tracker-backup');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(result.backupPackageStr);
    } catch (err: any) {
      console.error('API /api/backup/download Error:', err);
      return res.status(500).send('Failed to download backup');
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
