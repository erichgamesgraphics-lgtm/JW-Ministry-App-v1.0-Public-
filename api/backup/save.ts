import type { VercelRequest, VercelResponse } from '@vercel/node';
import { BackupService } from '../../server/services/BackupService.js';

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
    const { recoveryKey, installationId, backupPackage, metadata } = req.body || {};
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

    res.setHeader(
      'Set-Cookie',
      `mt_device_recovery=${encodeURIComponent(recoveryKey)}; Path=/; Max-Age=63072000; SameSite=Lax`
    );

    return res.status(200).json({
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
}
