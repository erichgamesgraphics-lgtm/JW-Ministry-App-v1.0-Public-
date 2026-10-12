import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, collection, setDoc, getDocs, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { MinistryEntry, ScheduledEvent, MinistryNote, NoteFolder, UserSettings } from '../types.ts';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID if provided
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Validate connection per skill directives
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or unreachable.');
    }
  }
}

// Auto sign-in anonymously if not signed in so user data is isolated & persistent
export function initAuth(onUserChange: (user: User | null) => void) {
  // Check redirect result on load
  getRedirectResult(auth).then((result) => {
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
      }
    }
  }).catch((err) => {
    console.warn('Redirect auth result warning:', err?.message || err);
  });

  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      onUserChange(user);
    } else {
      try {
        const cred = await signInAnonymously(auth);
        onUserChange(cred.user);
      } catch (err) {
        console.warn('Anonymous auth failed, continuing offline', err);
        onUserChange(null);
      }
    }
  });
}

export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

// In-memory access token cache (NOT persisted in localStorage per security guidelines)
let cachedAccessToken: string | null = null;

export const getAccessToken = (): string | null => cachedAccessToken;
export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export async function signInWithGoogle(): Promise<{ user: User; accessToken: string | null }> {
  const provider = new GoogleAuthProvider();
  CALENDAR_SCOPES.forEach(scope => provider.addScope(scope));

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (popupError: any) {
    console.warn('Popup sign-in failed or blocked, falling back to redirect auth:', popupError?.code || popupError?.message);
    if (popupError?.code === 'auth/unauthorized-domain') {
      console.error('CRITICAL: This deployment domain is not authorized in Firebase Console -> Authentication -> Settings -> Authorized domains.');
    }
    // Fallback to redirect for mobile webviews / PWAs / strict popup blockers
    try {
      await signInWithRedirect(auth, provider);
    } catch (redirectError) {
      console.error('Redirect sign-in error:', redirectError);
      throw redirectError;
    }
    return { user: auth.currentUser!, accessToken: cachedAccessToken };
  }
}

export async function logOut() {
  cachedAccessToken = null;
  return signOut(auth);
}

// Firestore persistence helpers for Ministry data
export const firestoreSync = {
  // Entries
  async saveEntry(userId: string, entry: MinistryEntry) {
    if (!userId) return;
    const ref = doc(db, 'users', userId, 'entries', String(entry.id));
    await setDoc(ref, entry, { merge: true });
  },

  async deleteEntry(userId: string, entryId: number) {
    if (!userId) return;
    const ref = doc(db, 'users', userId, 'entries', String(entryId));
    await deleteDoc(ref);
  },

  async loadEntries(userId: string): Promise<MinistryEntry[]> {
    if (!userId) return [];
    const ref = collection(db, 'users', userId, 'entries');
    const snap = await getDocs(ref);
    return snap.docs.map(d => d.data() as MinistryEntry);
  },

  // Events
  async saveEvent(userId: string, event: ScheduledEvent) {
    if (!userId) return;
    const ref = doc(db, 'users', userId, 'events', String(event.id));
    await setDoc(ref, event, { merge: true });
  },

  async deleteEvent(userId: string, eventId: number) {
    if (!userId) return;
    const ref = doc(db, 'users', userId, 'events', String(eventId));
    await deleteDoc(ref);
  },

  async loadEvents(userId: string): Promise<ScheduledEvent[]> {
    if (!userId) return [];
    const ref = collection(db, 'users', userId, 'events');
    const snap = await getDocs(ref);
    return snap.docs.map(d => d.data() as ScheduledEvent);
  },

  // Notes
  async saveNote(userId: string, note: MinistryNote) {
    if (!userId) return;
    const ref = doc(db, 'users', userId, 'notes', String(note.id));
    await setDoc(ref, note, { merge: true });
  },

  async deleteNote(userId: string, noteId: string) {
    if (!userId) return;
    const ref = doc(db, 'users', userId, 'notes', String(noteId));
    await deleteDoc(ref);
  },

  async loadNotes(userId: string): Promise<MinistryNote[]> {
    if (!userId) return [];
    const ref = collection(db, 'users', userId, 'notes');
    const snap = await getDocs(ref);
    return snap.docs.map(d => d.data() as MinistryNote);
  },

  // Settings
  async saveSettings(userId: string, settings: UserSettings) {
    if (!userId) return;
    const ref = doc(db, 'users', userId, 'settings', 'current');
    await setDoc(ref, settings, { merge: true });
  },

  async loadSettings(userId: string): Promise<UserSettings | null> {
    if (!userId) return null;
    const ref = doc(db, 'users', userId, 'settings', 'current');
    const snap = await getDocFromServer(ref).catch(() => null);
    return snap && snap.exists() ? (snap.data() as UserSettings) : null;
  },

  // Batch sync all local data to cloud
  async syncAllToCloud(
    userId: string,
    entries: MinistryEntry[],
    events: ScheduledEvent[],
    notes: MinistryNote[],
    settings: UserSettings
  ) {
    if (!userId) return;
    const batch = writeBatch(db);

    for (const entry of entries) {
      batch.set(doc(db, 'users', userId, 'entries', String(entry.id)), entry, { merge: true });
    }
    for (const ev of events) {
      batch.set(doc(db, 'users', userId, 'events', String(ev.id)), ev, { merge: true });
    }
    for (const note of notes) {
      batch.set(doc(db, 'users', userId, 'notes', String(note.id)), note, { merge: true });
    }
    batch.set(doc(db, 'users', userId, 'settings', 'current'), settings, { merge: true });

    await batch.commit();
  }
};
