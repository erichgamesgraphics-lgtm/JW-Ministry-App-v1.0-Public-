import {
  MinistryEntry,
  ScheduledEvent,
  UserSettings,
  PublisherStatusType,
  SupportedLanguage,
} from '../types.ts';

export interface DeviceInstallationMeta {
  installationId: string;
  recoveryKey: string;
  deviceName: string;
  platform: string;
  appVersion: string;
  createdAt: number;
  lastBackupAt: number;
  entriesCount: number;
  eventsCount: number;
  totalHours: string;
  publisherStatus: PublisherStatusType;
  language: SupportedLanguage;
}

export interface MTBackupEnvelope {
  format: 'MTBACKUP';
  backupVersion: number;
  app: 'Ministry Tracker';
  createdAt: number;
  metadata: DeviceInstallationMeta;
  salt: string;
  iv: string;
  ciphertext: string;
  checksum: string;
}

export interface DecryptedBackupPayload {
  backupVersion: number;
  exportedAt: number;
  settings: UserSettings;
  entries: MinistryEntry[];
  events: ScheduledEvent[];
  metadata: DeviceInstallationMeta;
}

const STORAGE_INSTALLATION_ID_KEY = 'ministry_tracker_install_id';
const STORAGE_RECOVERY_KEY = 'ministry_tracker_recovery_key';
const STORAGE_DEVICE_NAME_KEY = 'ministry_tracker_device_name';
const STORAGE_DEVICE_CREATED_KEY = 'ministry_tracker_device_created';

/**
 * Generate a clean, human-friendly recovery key (e.g. MT-8392-4105)
 */
export function generateRecoveryKey(): string {
  const chars = '0123456789';
  let p1 = '';
  let p2 = '';
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : null;
  if (cryptoObj && cryptoObj.getRandomValues) {
    const bytes = new Uint8Array(8);
    cryptoObj.getRandomValues(bytes);
    for (let i = 0; i < 4; i++) p1 += chars[bytes[i] % chars.length];
    for (let i = 4; i < 8; i++) p2 += chars[bytes[i] % chars.length];
  } else {
    for (let i = 0; i < 4; i++) p1 += chars[Math.floor(Math.random() * chars.length)];
    for (let i = 4; i < 8; i++) p2 += chars[Math.floor(Math.random() * chars.length)];
  }
  return `MT-${p1}-${p2}`;
}

/**
 * Detect human-readable device name safely without invasive hardware probing
 */
export function detectDeviceName(): string {
  if (typeof navigator === 'undefined') return 'Web Browser';
  const ua = navigator.userAgent || '';
  let os = 'Device';
  if (/iPhone/i.test(ua)) os = 'iPhone';
  else if (/iPad/i.test(ua)) os = 'iPad';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'Mac';
  else if (/Windows/i.test(ua)) os = 'Windows PC';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Browser';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  return `${os} (${browser})`;
}

/**
 * Detect platform
 */
export function detectPlatform(): string {
  if (typeof navigator === 'undefined') return 'web';
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  if (/Macintosh|Windows|Linux/i.test(ua)) return 'desktop';
  return 'web';
}

/**
 * Get or initialize persistent installation identity
 */
export function getOrCreateInstallationIdentity(): { installationId: string; recoveryKey: string; deviceName: string; createdAt: number } {
  try {
    let installationId = localStorage.getItem(STORAGE_INSTALLATION_ID_KEY);
    let recoveryKey = localStorage.getItem(STORAGE_RECOVERY_KEY);
    let deviceName = localStorage.getItem(STORAGE_DEVICE_NAME_KEY);
    let createdAtStr = localStorage.getItem(STORAGE_DEVICE_CREATED_KEY);

    let createdAt = createdAtStr ? parseInt(createdAtStr, 10) : 0;

    if (!installationId) {
      installationId = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'mt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(STORAGE_INSTALLATION_ID_KEY, installationId);
    }

    if (!recoveryKey) {
      recoveryKey = generateRecoveryKey();
      localStorage.setItem(STORAGE_RECOVERY_KEY, recoveryKey);
    }

    if (!deviceName) {
      deviceName = detectDeviceName();
      localStorage.setItem(STORAGE_DEVICE_NAME_KEY, deviceName);
    }

    if (!createdAt) {
      createdAt = Date.now();
      localStorage.setItem(STORAGE_DEVICE_CREATED_KEY, createdAt.toString());
    }

    return { installationId, recoveryKey, deviceName, createdAt };
  } catch {
    return {
      installationId: 'fallback-id',
      recoveryKey: 'MT-0000-0000',
      deviceName: 'Web Device',
      createdAt: Date.now(),
    };
  }
}

/**
 * Set custom recovery key (e.g. after restoring from another device)
 */
export function setDeviceRecoveryKey(recoveryKey: string): void {
  try {
    localStorage.setItem(STORAGE_RECOVERY_KEY, recoveryKey.trim().toUpperCase());
  } catch {}
}

// ---------------------------------------------------------------------------
// Cryptographic Helpers (AES-GCM-256 with PBKDF2)
// ---------------------------------------------------------------------------

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derive AES key from recoveryKey and salt
 */
async function deriveKey(recoveryKey: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(recoveryKey),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a data object into an MTBackupEnvelope
 */
export async function createEncryptedMTBackup(
  entries: MinistryEntry[],
  events: ScheduledEvent[],
  settings: UserSettings,
  deviceMeta?: Partial<DeviceInstallationMeta>
): Promise<string> {
  const identity = getOrCreateInstallationIdentity();
  const totalMinutes = entries.reduce((acc, e) => acc + (e.durationMinutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const metadata: DeviceInstallationMeta = {
    installationId: identity.installationId,
    recoveryKey: identity.recoveryKey,
    deviceName: identity.deviceName,
    platform: detectPlatform(),
    appVersion: '2.0.0',
    createdAt: identity.createdAt,
    lastBackupAt: Date.now(),
    entriesCount: entries.length,
    eventsCount: events.length,
    totalHours,
    publisherStatus: settings.publisherStatus,
    language: settings.language,
    ...deviceMeta,
  };

  const payload: DecryptedBackupPayload = {
    backupVersion: 1,
    exportedAt: Date.now(),
    settings,
    entries,
    events,
    metadata,
  };

  const jsonStr = JSON.stringify(payload);

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const enc = new TextEncoder();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(metadata.recoveryKey, salt);

      const ciphertextBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        enc.encode(jsonStr)
      );

      // Compute SHA-256 checksum of ciphertext
      const checksumBuffer = await crypto.subtle.digest('SHA-256', ciphertextBuffer);

      const envelope: MTBackupEnvelope = {
        format: 'MTBACKUP',
        backupVersion: 1,
        app: 'Ministry Tracker',
        createdAt: Date.now(),
        metadata,
        salt: arrayBufferToBase64(salt.buffer),
        iv: arrayBufferToBase64(iv.buffer),
        ciphertext: arrayBufferToBase64(ciphertextBuffer),
        checksum: arrayBufferToBase64(checksumBuffer),
      };

      // Wrap in structured format header
      return 'MTBACKUP:v1:' + btoa(JSON.stringify(envelope));
    } catch (err) {
      console.warn('WebCrypto encryption failed, falling back to safe payload package', err);
    }
  }

  // Fallback if WebCrypto is unavailable in certain environments
  const fallbackEnvelope = {
    format: 'MTBACKUP',
    backupVersion: 1,
    app: 'Ministry Tracker',
    createdAt: Date.now(),
    metadata,
    raw: btoa(encodeURIComponent(jsonStr)),
  };
  return 'MTBACKUP:v1:' + btoa(JSON.stringify(fallbackEnvelope));
}

/**
 * Decrypt and unpack an MTBackup file string or parse legacy JSON
 */
export async function unpackMTBackup(
  backupStr: string,
  recoveryKeyOverride?: string
): Promise<DecryptedBackupPayload> {
  const trimmed = backupStr.trim();

  // Check if it starts with the MTBACKUP signature
  if (trimmed.startsWith('MTBACKUP:v1:')) {
    const base64Data = trimmed.substring('MTBACKUP:v1:'.length);
    const jsonEnvelope = atob(base64Data);
    const envelope = JSON.parse(jsonEnvelope);

    if (envelope.raw) {
      // Fallback format
      const decodedJson = decodeURIComponent(atob(envelope.raw));
      return JSON.parse(decodedJson);
    }

    if (envelope.ciphertext && envelope.salt && envelope.iv) {
      const recoveryKey = (recoveryKeyOverride || envelope.metadata?.recoveryKey || getOrCreateInstallationIdentity().recoveryKey).trim();
      const salt = new Uint8Array(base64ToArrayBuffer(envelope.salt));
      const iv = new Uint8Array(base64ToArrayBuffer(envelope.iv));
      const ciphertext = base64ToArrayBuffer(envelope.ciphertext);

      const key = await deriveKey(recoveryKey, salt);
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );

      const dec = new TextDecoder();
      const decryptedJson = dec.decode(decryptedBuffer);
      return JSON.parse(decryptedJson);
    }
  }

  // Legacy JSON Support: Never crash if a user imports a legacy .json file
  try {
    const parsed = JSON.parse(trimmed);
    const hasEntries = Array.isArray(parsed.ministryEntries) || Array.isArray(parsed.entries);
    const hasEvents = Array.isArray(parsed.scheduledEvents) || Array.isArray(parsed.events);
    const hasSettings = typeof parsed.settings === 'object' && parsed.settings !== null;
    const hasPublisherStatus = typeof parsed.publisherStatus === 'string';
    const isMTJson = parsed.app === 'Ministry Tracker' || parsed.format === 'MTBACKUP';

    if (!hasEntries && !hasEvents && !hasSettings && !hasPublisherStatus && !isMTJson) {
      throw new Error('Unrecognized or corrupted Ministry Tracker backup format.');
    }

    let entries: MinistryEntry[] = [];
    if (Array.isArray(parsed.ministryEntries)) entries = parsed.ministryEntries;
    else if (Array.isArray(parsed.entries)) entries = parsed.entries;

    let events: ScheduledEvent[] = [];
    if (Array.isArray(parsed.scheduledEvents)) events = parsed.scheduledEvents;
    else if (Array.isArray(parsed.events)) events = parsed.events;

    const settings: any = parsed.settings || {};
    if (parsed.publisherStatus) settings.publisherStatus = parsed.publisherStatus;
    if (parsed.customGoalHours) settings.customGoalHours = parsed.customGoalHours;

    const identity = getOrCreateInstallationIdentity();
    return {
      backupVersion: 1,
      exportedAt: parsed.createdAtMillis || Date.now(),
      entries,
      events,
      settings,
      metadata: {
        installationId: identity.installationId,
        recoveryKey: identity.recoveryKey,
        deviceName: 'Legacy Import',
        platform: 'web',
        appVersion: '1.0.0',
        createdAt: Date.now(),
        lastBackupAt: Date.now(),
        entriesCount: entries.length,
        eventsCount: events.length,
        totalHours: '0',
        publisherStatus: settings.publisherStatus || 'PUBLISHER',
        language: settings.language || 'en',
      },
    };
  } catch (err) {
    throw new Error('Unrecognized or corrupted Ministry Tracker backup format.');
  }
}

/**
 * Safe Merge Strategy:
 * Combines existing entries and restored entries without losing data or creating duplicates
 */
export function mergeMinistryData(
  currentEntries: MinistryEntry[] = [],
  currentEvents: ScheduledEvent[] = [],
  currentSettings: UserSettings,
  restoredData: DecryptedBackupPayload
): { entries: MinistryEntry[]; events: ScheduledEvent[]; settings: UserSettings } {
  // Merge Entries: deduplicate by entry ID or by exact dateMillis + ministryType + duration
  const entryMap = new Map<string, MinistryEntry>();

  (currentEntries || []).forEach(entry => {
    const key = entry.id ? `id_${entry.id}` : `dt_${entry.dateMillis}_${entry.ministryType}`;
    entryMap.set(key, entry);
  });

  (restoredData?.entries || []).forEach(entry => {
    const key = entry.id ? `id_${entry.id}` : `dt_${entry.dateMillis}_${entry.ministryType}`;
    if (!entryMap.has(key)) {
      entryMap.set(key, entry);
    } else {
      // Keep entry with more recent updatedAt or higher duration
      const existing = entryMap.get(key)!;
      if ((entry.updatedAt || 0) > (existing.updatedAt || 0)) {
        entryMap.set(key, entry);
      }
    }
  });

  const mergedEntries = Array.from(entryMap.values()).sort((a, b) => b.dateMillis - a.dateMillis);

  // Merge Events: deduplicate by event ID or title+dateMillis
  const eventMap = new Map<string, ScheduledEvent>();
  (currentEvents || []).forEach(evt => {
    const key = evt.id ? `id_${evt.id}` : `t_${evt.title}_${evt.dateMillis}`;
    eventMap.set(key, evt);
  });

  (restoredData?.events || []).forEach(evt => {
    const key = evt.id ? `id_${evt.id}` : `t_${evt.title}_${evt.dateMillis}`;
    if (!eventMap.has(key)) {
      eventMap.set(key, evt);
    }
  });

  const mergedEvents = Array.from(eventMap.values()).sort((a, b) => a.dateMillis - b.dateMillis);

  // Merge Settings: keep non-empty properties
  const mergedSettings: UserSettings = {
    ...currentSettings,
    ...restoredData.settings,
    // Preserve active onboarding status
    onboardingCompleted: true,
    isFirstLaunch: false,
    lastBackupDate: Date.now(),
  };

  return {
    entries: mergedEntries,
    events: mergedEvents,
    settings: mergedSettings,
  };
}
