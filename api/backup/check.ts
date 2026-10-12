import type { VercelRequest, VercelResponse } from '@vercel/node';
import { BackupService } from '../../server/services/BackupService.js';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-installation-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const cookies = parseCookies(req.headers.cookie);
    const cookieKey = cookies['mt_device_recovery'];
    const queryKey = typeof req.query.key === 'string' ? req.query.key.trim() : undefined;
    const installationId = typeof req.headers['x-installation-id'] === 'string' ? req.headers['x-installation-id'].trim() : undefined;

    const targetKey = queryKey || cookieKey;
    const meta = await BackupService.check(targetKey, installationId);

    if (meta) {
      return res.status(200).json({
        found: true,
        backupMeta: meta,
      });
    }

    return res.status(200).json({
      found: false,
    });
  } catch (err: any) {
    console.error('API /api/backup/check Error:', err);
    return res.status(500).json({ found: false, error: err?.message || 'Check failed' });
  }
}
