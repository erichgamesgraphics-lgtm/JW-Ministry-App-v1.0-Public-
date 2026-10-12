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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

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

    res.setHeader(
      'Set-Cookie',
      `mt_device_recovery=${encodeURIComponent(recoveryKey)}; Path=/; Max-Age=63072000; SameSite=Lax`
    );

    return res.status(200).json({
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
}
