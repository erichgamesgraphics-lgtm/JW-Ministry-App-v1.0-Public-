import {
  createEncryptedMTBackup,
  unpackMTBackup,
  getOrCreateInstallationIdentity,
  mergeMinistryData,
  DeviceInstallationMeta,
  DecryptedBackupPayload,
} from './backupPackage.ts';
import { MinistryEntry, ScheduledEvent, UserSettings } from '../types.ts';

export type BackupSyncStatus = 'idle' | 'backing_up' | 'synced' | 'pending_offline' | 'error';

export interface DiscoveredBackupInfo {
  found: boolean;
  recoveryKey?: string;
  deviceName?: string;
  platform?: string;
  lastBackupAt?: number;
  entriesCount?: number;
  eventsCount?: number;
  totalHours?: string;
  publisherStatus?: string;
}

export interface BackupManagerListeners {
  onStatusChange?: (status: BackupSyncStatus, lastBackupAt: number, error?: string) => void;
}

class BackupManagerService {
  private syncStatus: BackupSyncStatus = 'idle';
  private lastBackupTime: number = 0;
  private debounceTimer: any = null;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<(status: BackupSyncStatus, lastBackupAt: number, error?: string) => void> = new Set();
  private pendingBackupPayload: { entries: MinistryEntry[]; events: ScheduledEvent[]; settings: UserSettings } | null = null;
  private isBackingUp: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        if (this.pendingBackupPayload) {
          this.triggerDebouncedBackup(
            this.pendingBackupPayload.entries,
            this.pendingBackupPayload.events,
            this.pendingBackupPayload.settings,
            500
          );
        }
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        if (this.syncStatus === 'backing_up') {
          this.updateStatus('pending_offline');
        }
      });

      // Load last known backup time from localStorage
      try {
        const saved = localStorage.getItem('ministry_tracker_last_backup_at');
        if (saved) {
          this.lastBackupTime = parseInt(saved, 10) || 0;
        }
      } catch {}
    }
  }

  public subscribe(fn: (status: BackupSyncStatus, lastBackupAt: number, error?: string) => void): () => void {
    this.listeners.add(fn);
    fn(this.syncStatus, this.lastBackupTime);
    return () => this.listeners.delete(fn);
  }

  private updateStatus(status: BackupSyncStatus, error?: string) {
    this.syncStatus = status;
    this.listeners.forEach(fn => fn(status, this.lastBackupTime, error));
  }

  public getStatus(): { status: BackupSyncStatus; lastBackupTime: number } {
    return { status: this.syncStatus, lastBackupTime: this.lastBackupTime };
  }

  /**
   * Check if the server has an existing backup from a previous installation
   * (survives app reinstallation via cookie / recovery key)
   */
  public async checkForExistingBackup(keyOverride?: string): Promise<DiscoveredBackupInfo> {
    try {
      const identity = getOrCreateInstallationIdentity();
      const targetKey = keyOverride || identity.recoveryKey;
      let url = '/api/backup/check';
      if (targetKey) {
        url += `?key=${encodeURIComponent(targetKey)}`;
      }

      const res = await fetch(url, {
        headers: {
          'x-installation-id': identity.installationId,
        },
      });

      if (!res.ok) return { found: false };
      const data = await res.json();
      if (data.found && data.backupMeta) {
        return {
          found: true,
          recoveryKey: data.backupMeta.recoveryKey,
          deviceName: data.backupMeta.deviceName,
          platform: data.backupMeta.platform,
          lastBackupAt: data.backupMeta.lastBackupAt,
          entriesCount: data.backupMeta.entriesCount,
          eventsCount: data.backupMeta.eventsCount,
          totalHours: data.backupMeta.totalHours,
          publisherStatus: data.backupMeta.publisherStatus,
        };
      }
      return { found: false };
    } catch (err) {
      console.warn('Could not check for existing backup:', err);
      return { found: false };
    }
  }

  /**
   * Debounced automatic backup whenever user data changes.
   * Debounce of 2.5s avoids overhead while keeping data immediately protected.
   */
  public triggerDebouncedBackup(
    entries: MinistryEntry[],
    events: ScheduledEvent[],
    settings: UserSettings,
    delayMs = 2500
  ): void {
    this.pendingBackupPayload = { entries, events, settings };

    if (!this.isOnline) {
      this.updateStatus('pending_offline');
      return;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.executeBackupNow(entries, events, settings).catch(err => {
        console.warn('Background auto backup failed:', err);
      });
    }, delayMs);
  }

  /**
   * Execute backup immediately to cloud and local archive
   */
  public async executeBackupNow(
    entries: MinistryEntry[],
    events: ScheduledEvent[],
    settings: UserSettings
  ): Promise<{ success: boolean; lastBackupAt: number }> {
    if (this.isBackingUp) return { success: false, lastBackupAt: this.lastBackupTime };
    this.isBackingUp = true;
    this.updateStatus('backing_up');

    try {
      const identity = getOrCreateInstallationIdentity();
      const totalMinutes = entries.reduce((acc, e) => acc + (e.durationMinutes || 0), 0);
      const totalHours = (totalMinutes / 60).toFixed(1);

      const metadata: DeviceInstallationMeta = {
        installationId: identity.installationId,
        recoveryKey: identity.recoveryKey,
        deviceName: identity.deviceName,
        platform: 'web',
        appVersion: '2.0.0',
        createdAt: identity.createdAt,
        lastBackupAt: Date.now(),
        entriesCount: entries.length,
        eventsCount: events.length,
        totalHours,
        publisherStatus: settings.publisherStatus,
        language: settings.language,
      };

      // Create encrypted package
      const backupPackageStr = await createEncryptedMTBackup(entries, events, settings, metadata);

      // Save local backup snapshot (survives minor crashes)
      try {
        localStorage.setItem('ministry_tracker_local_backup_snapshot', backupPackageStr);
      } catch {}

      // Upload to server backup endpoint
      const res = await fetch('/api/backup/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recoveryKey: identity.recoveryKey,
          installationId: identity.installationId,
          backupPackage: backupPackageStr,
          metadata,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const resData = await res.json();
      const timestamp = resData.lastBackupAt || Date.now();
      this.lastBackupTime = timestamp;
      try {
        localStorage.setItem('ministry_tracker_last_backup_at', timestamp.toString());
      } catch {}

      this.pendingBackupPayload = null;
      this.updateStatus('synced');
      return { success: true, lastBackupAt: timestamp };
    } catch (err: any) {
      console.warn('Backup error:', err);
      if (!this.isOnline) {
        this.updateStatus('pending_offline');
      } else {
        this.updateStatus('error', err?.message || 'Backup failed');
      }
      return { success: false, lastBackupAt: this.lastBackupTime };
    } finally {
      this.isBackingUp = false;
    }
  }

  /**
   * Restore data from remote cloud backup
   */
  public async restoreFromCloud(
    recoveryKeyOverride?: string
  ): Promise<DecryptedBackupPayload | null> {
    const identity = getOrCreateInstallationIdentity();
    const recoveryKey = (recoveryKeyOverride || identity.recoveryKey).trim().toUpperCase();

    const res = await fetch('/api/backup/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recoveryKey }),
    });

    if (!res.ok) {
      throw new Error('Backup not found or unable to restore.');
    }

    const data = await res.json();
    if (!data.success || !data.backupPackage) {
      throw new Error(data.error || 'Failed to retrieve backup.');
    }

    const decrypted = await unpackMTBackup(data.backupPackage, recoveryKey);
    return decrypted;
  }

  /**
   * Restore data from a selected .mtbackup file
   */
  public async restoreFromFile(
    fileContent: string,
    recoveryKeyOverride?: string
  ): Promise<DecryptedBackupPayload> {
    const decrypted = await unpackMTBackup(fileContent, recoveryKeyOverride);
    return decrypted;
  }

  /**
   * Download the user's encrypted .mtbackup file directly
   */
  public async downloadMTBackupFile(
    entries: MinistryEntry[],
    events: ScheduledEvent[],
    settings: UserSettings
  ): Promise<boolean> {
    try {
      const encryptedStr = await createEncryptedMTBackup(entries, events, settings);
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `MinistryTracker_Backup_${dateStr}.mtbackup`;

      const blob = new Blob([encryptedStr], { type: 'application/x-ministry-tracker-backup;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 300);
      return true;
    } catch (err) {
      console.error('Failed to download .mtbackup file:', err);
      return false;
    }
  }
}

export const BackupManager = new BackupManagerService();
