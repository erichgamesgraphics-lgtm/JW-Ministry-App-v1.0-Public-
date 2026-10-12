import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, collection, setDoc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { MinistryEntry, ScheduledEvent, MinistryNote, UserSettings } from '../types.ts';

// Initialize Firebase App safely (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID if provided
export const db = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
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

// Google Calendar scope for reading and managing arrangement events
export const CALENDAR_EVENTS_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

/**
 * Standard Google Auth Provider for basic login and account identity.
 * Requests ONLY standard profile & email scopes, avoiding restricted scopes
 * that cause Google OAuth 403 Forbidden / Access Denied blocks on unverified clients.
 */
export function createGoogleLoginProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account',
  });
  return provider;
}

/**
 * Google Auth Provider specifically for Calendar integration.
 * Requests ONLY the necessary calendar events scope.
 */
export function createGoogleCalendarProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.addScope(CALENDAR_EVENTS_SCOPE);
  provider.setCustomParameters({
    prompt: 'select_account',
  });
  return provider;
}

// Device & environment detector: popups are frequently blocked on mobile and inside PWAs
export function isMobileOrWebView(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
  const isStandalone = Boolean((window.navigator as any).standalone) ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  return isMobile || isStandalone;
}

// In-memory access token cache (strictly in-memory per security guidelines)
let cachedAccessToken: string | null = null;

export const getAccessToken = (): string | null => cachedAccessToken;
export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

// Global error listener for visible diagnostics (e.g. unauthorized domains, 403 blocks)
export interface AuthErrorInfo {
  code: string;
  message: string;
  domain: string;
  timestamp: number;
}

type AuthErrorListener = (info: AuthErrorInfo) => void;
const authErrorListeners = new Set<AuthErrorListener>();

export function subscribeToAuthError(listener: AuthErrorListener): () => void {
  authErrorListeners.add(listener);
  return () => authErrorListeners.delete(listener);
}

export function notifyAuthError(error: any) {
  const rawCode = error?.code || '';
  const rawMessage = error?.message || 'Authentication operation failed.';
  const domain = typeof window !== 'undefined' ? window.location.hostname : '';

  let code = rawCode || 'auth/unknown';
  let message = rawMessage;

  if (rawCode === 'auth/unauthorized-domain' || rawMessage.includes('unauthorized-domain')) {
    code = 'auth/unauthorized-domain';
    message = `Domain "${domain}" is not authorized in Firebase Authentication settings.`;
  } else if (
    rawCode === 'auth/admin-restricted-operation' ||
    rawMessage.includes('403') ||
    rawMessage.includes('access_denied') ||
    rawMessage.includes('PERMISSION_DENIED')
  ) {
    code = 'auth/access-denied-403';
    message = 'Google OAuth returned HTTP 403 Forbidden. Access was denied for this operation or client configuration.';
  }

  const info: AuthErrorInfo = {
    code,
    message,
    domain,
    timestamp: Date.now(),
  };

  authErrorListeners.forEach((listener) => {
    try {
      listener(info);
    } catch (e) {
      console.warn('Auth error listener threw:', e);
    }
  });
}

/**
 * Initializes Firebase Auth state with safe redirect processing before listening to state changes.
 * Avoids race conditions where anonymous sign-in could cancel a pending redirect credential.
 */
export function initAuth(
  onUserChange: (user: User | null) => void,
  onTokenChange?: (token: string | null) => void,
  onError?: (error: any) => void
) {
  // Check redirect result first (for mobile/PWA redirect returns)
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          cachedAccessToken = credential.accessToken;
          if (onTokenChange) onTokenChange(cachedAccessToken);
        }
        if (result.user) {
          onUserChange(result.user);
        }
      }
    })
    .catch((err) => {
      console.warn('Redirect auth result notice:', err?.code || err?.message || err);
      if (
        err?.code === 'auth/unauthorized-domain' ||
        err?.code === 'auth/admin-restricted-operation' ||
        err?.message?.includes('403')
      ) {
        notifyAuthError(err);
      }
      if (onError) onError(err);
    })
    .finally(() => {
      // Subscribe to onAuthStateChanged once redirect handling is finished
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          onUserChange(user);
        } else {
          try {
            const cred = await signInAnonymously(auth);
            onUserChange(cred.user);
          } catch (err) {
            // Anonymous sign-in may be disabled on this Firebase project; app continues seamlessly in local mode
            console.info('Anonymous sign-in not active; app operating in guest local storage mode.');
            onUserChange(null);
          }
        }
      });
    });

  return () => {
    // Unsubscribe cleanup if needed
  };
}

/**
 * Sign in with Google with automatic mobile detection and popup fallback.
 * Uses redirect directly on mobile/PWA to avoid blocked popup windows.
 * @param withCalendar If true, requests Google Calendar events scope (for calendar sync). If false, standard account login.
 * @param preferRedirect If true, forces redirect flow instead of popup.
 */
export async function signInWithGoogle(
  withCalendar = false,
  preferRedirect = false
): Promise<{
  user: User | null;
  accessToken: string | null;
  redirectInitiated?: boolean;
}> {
  const provider = withCalendar ? createGoogleCalendarProvider() : createGoogleLoginProvider();
  const shouldUseRedirect = preferRedirect || isMobileOrWebView();

  if (shouldUseRedirect) {
    try {
      console.info(`Initiating signInWithRedirect (${withCalendar ? 'Calendar' : 'Standard Login'})`);
      await signInWithRedirect(auth, provider);
      return { user: auth.currentUser, accessToken: cachedAccessToken, redirectInitiated: true };
    } catch (redirectError: any) {
      console.error('Redirect sign-in error:', redirectError);
      notifyAuthError(redirectError);
      throw redirectError;
    }
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken, redirectInitiated: false };
  } catch (popupError: any) {
    console.warn('Popup sign-in encounter:', popupError?.code || popupError?.message);

    if (
      popupError?.code === 'auth/unauthorized-domain' ||
      popupError?.code === 'auth/admin-restricted-operation' ||
      popupError?.message?.includes('403')
    ) {
      notifyAuthError(popupError);
      throw popupError;
    }

    const isPopupIssue = [
      'auth/popup-blocked',
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/operation-not-supported-in-this-environment',
      'auth/internal-error',
    ].includes(popupError?.code);

    if (isPopupIssue) {
      console.info('Popup issue encountered, falling back to signInWithRedirect:', popupError?.code);
      try {
        await signInWithRedirect(auth, provider);
        return { user: auth.currentUser, accessToken: cachedAccessToken, redirectInitiated: true };
      } catch (fallbackError: any) {
        notifyAuthError(fallbackError);
        throw fallbackError;
      }
    }

    notifyAuthError(popupError);
    throw popupError;
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
    try {
      const ref = doc(db, 'users', userId, 'entries', String(entry.id));
      await setDoc(ref, entry, { merge: true });
    } catch (e) {
      console.warn('Firestore saveEntry notice:', e);
    }
  },

  async deleteEntry(userId: string, entryId: number) {
    if (!userId) return;
    try {
      const ref = doc(db, 'users', userId, 'entries', String(entryId));
      await deleteDoc(ref);
    } catch (e) {
      console.warn('Firestore deleteEntry notice:', e);
    }
  },

  async loadEntries(userId: string): Promise<MinistryEntry[]> {
    if (!userId) return [];
    try {
      const ref = collection(db, 'users', userId, 'entries');
      const snap = await getDocs(ref);
      return snap.docs.map(d => d.data() as MinistryEntry);
    } catch (e) {
      console.warn('Firestore loadEntries notice:', e);
      return [];
    }
  },

  // Events
  async saveEvent(userId: string, event: ScheduledEvent) {
    if (!userId) return;
    try {
      const ref = doc(db, 'users', userId, 'events', String(event.id));
      await setDoc(ref, event, { merge: true });
    } catch (e) {
      console.warn('Firestore saveEvent notice:', e);
    }
  },

  async deleteEvent(userId: string, eventId: number) {
    if (!userId) return;
    try {
      const ref = doc(db, 'users', userId, 'events', String(eventId));
      await deleteDoc(ref);
    } catch (e) {
      console.warn('Firestore deleteEvent notice:', e);
    }
  },

  async loadEvents(userId: string): Promise<ScheduledEvent[]> {
    if (!userId) return [];
    try {
      const ref = collection(db, 'users', userId, 'events');
      const snap = await getDocs(ref);
      return snap.docs.map(d => d.data() as ScheduledEvent);
    } catch (e) {
      console.warn('Firestore loadEvents notice:', e);
      return [];
    }
  },

  // Notes
  async saveNote(userId: string, note: MinistryNote) {
    if (!userId) return;
    try {
      const ref = doc(db, 'users', userId, 'notes', String(note.id));
      await setDoc(ref, note, { merge: true });
    } catch (e) {
      console.warn('Firestore saveNote notice:', e);
    }
  },

  async deleteNote(userId: string, noteId: string) {
    if (!userId) return;
    try {
      const ref = doc(db, 'users', userId, 'notes', String(noteId));
      await deleteDoc(ref);
    } catch (e) {
      console.warn('Firestore deleteNote notice:', e);
    }
  },

  async loadNotes(userId: string): Promise<MinistryNote[]> {
    if (!userId) return [];
    try {
      const ref = collection(db, 'users', userId, 'notes');
      const snap = await getDocs(ref);
      return snap.docs.map(d => d.data() as MinistryNote);
    } catch (e) {
      console.warn('Firestore loadNotes notice:', e);
      return [];
    }
  },

  // Settings
  async saveSettings(userId: string, settings: UserSettings) {
    if (!userId) return;
    try {
      const ref = doc(db, 'users', userId, 'settings', 'current');
      await setDoc(ref, settings, { merge: true });
    } catch (e) {
      console.warn('Firestore saveSettings notice:', e);
    }
  },

  async loadSettings(userId: string): Promise<UserSettings | null> {
    if (!userId) return null;
    try {
      const ref = doc(db, 'users', userId, 'settings', 'current');
      const snap = await getDocFromServer(ref).catch(() => null);
      return snap && snap.exists() ? (snap.data() as UserSettings) : null;
    } catch (e) {
      console.warn('Firestore loadSettings notice:', e);
      return null;
    }
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
    try {
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
    } catch (e) {
      console.warn('Firestore syncAllToCloud notice:', e);
    }
  }
};
