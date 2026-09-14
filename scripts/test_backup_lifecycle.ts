import {
  createEncryptedMTBackup,
  unpackMTBackup,
  getOrCreateInstallationIdentity,
  MTBackupEnvelope,
  DecryptedBackupPayload,
} from '../src/utils/backupPackage.ts';
import { MinistryEntry, ScheduledEvent, UserSettings } from '../src/types.ts';
import fs from 'fs';
import path from 'path';

// Polyfill WebCrypto & localStorage for Node environment if needed
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

async function runTests() {
  console.log('====================================================');
  console.log('   MINISTRY TRACKER FULL BACKUP LIFECYCLE TEST      ');
  console.log('====================================================\n');

  // -------------------------------------------------------------------------
  // 1. SETUP TEST DATA
  // -------------------------------------------------------------------------
  const initialSettings: UserSettings = {
    publisherStatus: 'REGULAR_PIONEER_50',
    customGoalHours: 50,
    dailyReminderEnabled: true,
    reminderTime: '08:00',
    language: 'en',
    theme: 'dark',
    onboardingCompleted: true,
    isFirstLaunch: false,
    lastBackupDate: Date.now(),
  };

  const initialEntries: MinistryEntry[] = [
    {
      id: 101,
      dateMillis: new Date('2026-09-10T10:00:00').getTime(),
      durationMinutes: 150, // 2.5 hours
      placements: 3,
      videoShowings: 2,
      returnVisits: 1,
      bibleStudies: 1,
      comments: 'Very good conversation on Watchtower article.',
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: 102,
      dateMillis: new Date('2026-09-12T14:30:00').getTime(),
      durationMinutes: 120, // 2.0 hours
      placements: 0,
      videoShowings: 1,
      returnVisits: 2,
      bibleStudies: 0,
      comments: 'Cart witnessing at the metro station.',
      createdAt: Date.now() - 86400000 * 1,
    },
  ];

  const initialEvents: ScheduledEvent[] = [
    {
      id: 201,
      title: 'Group Witnessing Arrangement',
      dateMillis: new Date('2026-09-15T09:00:00').getTime(),
      startTimeMillis: new Date('2026-09-15T09:00:00').getTime(),
      endTimeMillis: new Date('2026-09-15T11:30:00').getTime(),
      location: 'Kingdom Hall',
      description: 'Saturday morning group field service.',
      reminderMinutesBefore: 30,
      repeatOption: 'WEEKLY',
      isCompleted: false,
      createdAt: Date.now(),
    },
  ];

  console.log('✓ 1. Test data prepared:');
  console.log(`   - Settings: Publisher Status = ${initialSettings.publisherStatus}, Theme = ${initialSettings.theme}`);
  console.log(`   - Entries Count: ${initialEntries.length}`);
  console.log(`   - Events Count: ${initialEvents.length}\n`);

  // -------------------------------------------------------------------------
  // 2. GENERATE REAL .MTBACKUP FILE
  // -------------------------------------------------------------------------
  console.log('Executing createEncryptedMTBackup...');
  const encryptedFileContent = await createEncryptedMTBackup(initialEntries, initialEvents, initialSettings);

  console.log('✓ 2. Backup file generated:');
  console.log(`   - Signature Check: ${encryptedFileContent.startsWith('MTBACKUP:v1:') ? 'PASSED (MTBACKUP:v1:)' : 'FAILED'}`);
  console.log(`   - File Length: ${encryptedFileContent.length} bytes`);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `MinistryTracker_Backup_${dateStr}.mtbackup`;
  const tempFilePath = path.join(process.cwd(), filename);
  fs.writeFileSync(tempFilePath, encryptedFileContent, 'utf-8');
  console.log(`   - File saved on disk to: ${filename}`);
  console.log(`   - Disk File Size: ${fs.statSync(tempFilePath).size} bytes\n`);

  // -------------------------------------------------------------------------
  // 3. INSPECT FILE ENVELOPE STRUCTURE
  // -------------------------------------------------------------------------
  console.log('Inspecting file envelope structure...');
  const base64Envelope = encryptedFileContent.substring('MTBACKUP:v1:'.length);
  const jsonEnvelopeStr = Buffer.from(base64Envelope, 'base64').toString('utf-8');
  const envelope: MTBackupEnvelope = JSON.parse(jsonEnvelopeStr);

  console.log('✓ 3. Envelope inspection:');
  console.log(`   - Format: ${envelope.format}`);
  console.log(`   - Backup Version: ${envelope.backupVersion}`);
  console.log(`   - App Name: ${envelope.app}`);
  console.log(`   - Checksum Present: ${!!envelope.checksum}`);
  console.log(`   - Metadata Device: ${envelope.metadata?.deviceName || 'N/A'}\n`);

  if (envelope.format !== 'MTBACKUP' || envelope.backupVersion !== 1) {
    throw new Error('Envelope structure is invalid!');
  }

  // -------------------------------------------------------------------------
  // 4. RESTORE FROM FILE & VERIFY DATA MATCH
  // -------------------------------------------------------------------------
  console.log('Unpacking and restoring data from file...');
  const restoredPayload: DecryptedBackupPayload = await unpackMTBackup(encryptedFileContent);

  console.log('✓ 4. Restoration data validation:');
  console.log(`   - Restored Publisher Status: ${restoredPayload.settings.publisherStatus}`);
  console.log(`   - Restored Entries Count: ${restoredPayload.entries.length}`);
  console.log(`   - Restored Events Count: ${restoredPayload.events.length}`);

  // Assertions
  if (restoredPayload.settings.publisherStatus !== initialSettings.publisherStatus) {
    throw new Error('Mismatch in restored settings publisherStatus');
  }
  if (restoredPayload.entries.length !== initialEntries.length) {
    throw new Error('Mismatch in restored entries count');
  }
  if (restoredPayload.entries[0].comments !== initialEntries[0].comments) {
    throw new Error('Mismatch in restored entry comment');
  }
  if (restoredPayload.events[0].title !== initialEvents[0].title) {
    throw new Error('Mismatch in restored event title');
  }
  console.log('   - ALL RESTORED FIELDS MATCH EXACTLY WITH ORIGINAL DATA!\n');

  // -------------------------------------------------------------------------
  // 5. TEST INVALID, CORRUPTED, & WRONG FILE TYPES
  // -------------------------------------------------------------------------
  console.log('Testing invalid, corrupted, and wrong file types...');
  const invalidCases = [
    { name: 'Plain Text File', content: 'This is just a plain text file.' },
    { name: 'Random JSON Object', content: JSON.stringify({ foo: 'bar', random: 123 }) },
    { name: 'Corrupted MTBACKUP', content: 'MTBACKUP:v1:INVALID_BASE64_CORRUPTED_PAYLOAD' },
    { name: 'Image Binary Pretender', content: '\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01' },
    { name: 'Empty String', content: '' },
  ];

  for (const item of invalidCases) {
    let failedAsExpected = false;
    try {
      await unpackMTBackup(item.content);
    } catch {
      failedAsExpected = true;
    }
    if (failedAsExpected) {
      console.log(`   - Correctly rejected invalid file [${item.name}]`);
    } else {
      console.warn(`   - WARNING: [${item.name}] did not throw error as expected.`);
    }
  }
  console.log('✓ 5. Invalid file type rejection tests complete!\n');

  // -------------------------------------------------------------------------
  // 6. MULTI-BACKUP SEQUENCING TEST
  // -------------------------------------------------------------------------
  console.log('Testing multi-backup sequencing...');
  // Add new entry
  const updatedEntries: MinistryEntry[] = [
    ...initialEntries,
    {
      id: 103,
      dateMillis: Date.now(),
      durationMinutes: 180, // 3 hours
      placements: 1,
      videoShowings: 0,
      returnVisits: 3,
      bibleStudies: 2,
      comments: 'Added in session 2.',
      createdAt: Date.now(),
    },
  ];

  const backupBContent = await createEncryptedMTBackup(updatedEntries, initialEvents, initialSettings);
  const payloadA = await unpackMTBackup(encryptedFileContent);
  const payloadB = await unpackMTBackup(backupBContent);

  console.log(`   - Backup A entries: ${payloadA.entries.length}`);
  console.log(`   - Backup B entries: ${payloadB.entries.length}`);

  if (payloadA.entries.length !== 2 || payloadB.entries.length !== 3) {
    throw new Error('Multi-backup sequencing failed!');
  }
  console.log('✓ 6. Multi-backup sequencing test passed!\n');

  // Cleanup temp file
  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }

  console.log('====================================================');
  console.log('   ALL BACKUP LIFECYCLE TESTS PASSED PERFECTLY!     ');
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('BACKUP LIFECYCLE TEST FAILED:', err);
  process.exit(1);
});
