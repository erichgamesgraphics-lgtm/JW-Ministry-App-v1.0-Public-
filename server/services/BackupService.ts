import fs from 'fs';
import path from 'path';

export interface BackupMetadata {
  recoveryKey: string;
  installationId: string;
  deviceName: string;
  platform: string;
  appVersion: string;
  createdAt: number;
  lastBackupAt: number;
  entriesCount: number;
  eventsCount: number;
  totalHours: string;
  publisherStatus: string;
  language: string;
}

export interface StoredBackupRecord {
  recoveryKey: string;
  installationId: string;
  metadata: BackupMetadata;
  rawPackage: string; // The .mtbackup serialized string/base64
  updatedAt: number;
}

let activeBackupDir = (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.K_SERVICE)
  ? path.join('/tmp', 'backups')
  : path.join(process.cwd(), 'data', 'backups');

function getIndexFile() {
  return path.join(activeBackupDir, 'index.json');
}

function ensureDir() {
  try {
    if (!fs.existsSync(activeBackupDir)) {
      fs.mkdirSync(activeBackupDir, { recursive: true });
    }
  } catch (err) {
    // If standard data directory is read-only in container, fall back to /tmp
    console.warn('Could not write to primary backup dir, falling back to /tmp/backups:', err);
    activeBackupDir = path.join('/tmp', 'backups');
    if (!fs.existsSync(activeBackupDir)) {
      try {
        fs.mkdirSync(activeBackupDir, { recursive: true });
      } catch (innerErr) {
        console.error('Failed to create /tmp/backups:', innerErr);
      }
    }
  }
}

function loadIndex(): Record<string, BackupMetadata> {
  ensureDir();
  try {
    const indexFile = getIndexFile();
    if (fs.existsSync(indexFile)) {
      const data = fs.readFileSync(indexFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Could not read backup index file, starting fresh', err);
  }
  return {};
}

function saveIndex(index: Record<string, BackupMetadata>) {
  ensureDir();
  try {
    const indexFile = getIndexFile();
    fs.writeFileSync(indexFile, JSON.stringify(index, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save backup index:', err);
  }
}

export const BackupService = {
  /**
   * Save an encrypted .mtbackup package
   */
  async save(
    recoveryKey: string,
    installationId: string,
    backupPackageStr: string,
    metadata: BackupMetadata
  ): Promise<{ success: boolean; lastBackupAt: number }> {
    ensureDir();
    const sanitizedKey = recoveryKey.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!sanitizedKey) {
      throw new Error('Invalid recovery key');
    }

    const filePath = path.join(activeBackupDir, `${sanitizedKey}.mtbackup`);
    const now = Date.now();
    metadata.lastBackupAt = now;

    // Write file atomically
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, backupPackageStr, 'utf-8');
    fs.renameSync(tempPath, filePath);

    // Update index
    const index = loadIndex();
    index[sanitizedKey] = metadata;
    saveIndex(index);

    return { success: true, lastBackupAt: now };
  },

  /**
   * Retrieve a backup package by recoveryKey
   */
  async get(recoveryKey: string): Promise<{ backupPackageStr: string; metadata: BackupMetadata } | null> {
    ensureDir();
    const sanitizedKey = recoveryKey.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!sanitizedKey) return null;

    const filePath = path.join(activeBackupDir, `${sanitizedKey}.mtbackup`);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const backupPackageStr = fs.readFileSync(filePath, 'utf-8');
    const index = loadIndex();
    const metadata = index[sanitizedKey] || {
      recoveryKey: sanitizedKey,
      installationId: '',
      deviceName: 'Unknown',
      platform: 'web',
      appVersion: '2.0.0',
      createdAt: Date.now(),
      lastBackupAt: Date.now(),
      entriesCount: 0,
      eventsCount: 0,
      totalHours: '0',
      publisherStatus: 'PUBLISHER',
      language: 'en',
    };

    return { backupPackageStr, metadata };
  },

  /**
   * Check if a backup exists for a recoveryKey or installationId
   */
  async check(recoveryKey?: string, installationId?: string): Promise<BackupMetadata | null> {
    ensureDir();
    const index = loadIndex();

    if (recoveryKey) {
      const sanitizedKey = recoveryKey.replace(/[^a-zA-Z0-9_-]/g, '');
      if (index[sanitizedKey]) {
        return index[sanitizedKey];
      }
      // Also verify if file exists on disk
      const filePath = path.join(activeBackupDir, `${sanitizedKey}.mtbackup`);
      if (fs.existsSync(filePath)) {
        return {
          recoveryKey: sanitizedKey,
          installationId: installationId || '',
          deviceName: 'Saved Device',
          platform: 'web',
          appVersion: '2.0.0',
          createdAt: Date.now(),
          lastBackupAt: fs.statSync(filePath).mtimeMs,
          entriesCount: 0,
          eventsCount: 0,
          totalHours: '0',
          publisherStatus: 'PUBLISHER',
          language: 'en',
        };
      }
    }

    if (installationId) {
      for (const key of Object.keys(index)) {
        if (index[key]?.installationId === installationId) {
          return index[key];
        }
      }
    }

    return null;
  },

  /**
   * Delete a backup if requested
   */
  async delete(recoveryKey: string): Promise<boolean> {
    ensureDir();
    const sanitizedKey = recoveryKey.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!sanitizedKey) return false;

    const filePath = path.join(activeBackupDir, `${sanitizedKey}.mtbackup`);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error deleting backup file:', err);
      }
    }

    const index = loadIndex();
    delete index[sanitizedKey];
    saveIndex(index);
    return true;
  },
};
