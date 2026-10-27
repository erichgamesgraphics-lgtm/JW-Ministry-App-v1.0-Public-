import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, collection, setDoc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import {
  getAuth,
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

// Operation types and typed error handling per firebase-integration-rpc skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
export const CALENDAR_SCOPES = CALENDAR_EVENTS_SCOPE;

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

// Device & environment detector
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
  detailedCause?: string;
  resolutionSteps?: string[];
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
  let detailedCause = 'An error occurred during authentication.';
  let resolutionSteps: string[] = [];

  if (rawCode === 'auth/unauthorized-domain' || rawMessage.includes('unauthorized-domain')) {
    code = 'auth/unauthorized-domain';
    message = `Domain "${domain}" is not authorized in Firebase Authentication settings.`;
    detailedCause = `Firebase Authentication requires that all hostnames making OAuth requests be added to the Authorized Domains list in your Firebase project.`;
    resolutionSteps = [
      `Open Firebase Console at https://console.firebase.google.com/project/ministry-tracker-5ffae/authentication/settings`,
      `Scroll down to the "Authorized domains" section and click "Add domain"`,
      `Add "${domain}" (and your Vercel production domain, e.g. your-app.vercel.app)`,
      `Click "Done" to save`,
    ];
  } else if (
    rawCode === 'auth/admin-restricted-operation' ||
    rawCode === 'auth/operation-not-allowed' ||
    rawMessage.includes('403') ||
    rawMessage.includes('access_denied') ||
    rawMessage.includes('PERMISSION_DENIED') ||
    rawMessage.includes('restricted-operation')
  ) {
    code = 'auth/access-denied-403';
    message = 'Google OAuth / Firebase returned HTTP 403 Forbidden.';
    detailedCause = `A 403 Forbidden during sign-in is typically caused by: 1) The current domain "${domain}" not being in Firebase Authorized Domains, 2) Google Cloud OAuth Consent Screen is in "Testing" mode without your account added as a Test User, or 3) Google Sign-in provider is disabled in Firebase Console.`;
    resolutionSteps = [
      `1. Authorized Domain: Go to Firebase Console > Authentication > Settings > Authorized Domains, and add "${domain}".`,
      `2. Google Sign-In Provider: Go to Firebase Console > Authentication > Sign-in method, ensure "Google" is enabled and Project Support Email is selected.`,
      `3. OAuth Test Users: If your Google Cloud project is in "Testing" mode, go to Google Cloud Console > APIs & Services > OAuth consent screen > Test users, and add your email.`,
      `4. API Key Restrictions: Go to Google Cloud Console > APIs & Services > Credentials, verify API key "AIzaSy..." allows Identity Toolkit API and does not restrict the referrer domain "${domain}".`,
    ];
  }

  const info: AuthErrorInfo = {
    code,
    message,
    domain,
    detailedCause,
    resolutionSteps,
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
 * Initializes Firebase Auth state without unsolicited anonymous sign-ins.
 * Inspects redirect credentials first for seamless returning navigation.
 */
export function initAuth(
  onUserChange: (user: User | null) => void,
  onTokenChange?: (token: string | null) => void,
  onError?: (error: any) => void
) {
  // Check redirect result first (if user returned from a redirect flow)
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
      // Subscribe to onAuthStateChanged once redirect inspection completes
      onAuthStateChanged(auth, (user) => {
        if (user) {
          onUserChange(user);
        } else {
          // Do NOT call signInAnonymously: anonymous provider may be disabled,
          // which causes HTTP 403 Forbidden errors on identitytoolkit.googleapis.com.
          // The application functions completely with guest local storage mode until user clicks Sign In.
          onUserChange(null);
        }
      });
    });

  return () => {
    // Unsubscribe cleanup if needed
  };
}

/**
 * Sign in with Google using signInWithPopup by default.
 * Popup is standard for web, iframe previews, and prevents the iframe 403/redirect issues.
 * @param withCalendar If true, requests Google Calendar events scope. If false, basic login only.
 * @param preferRedirect If explicitly true, uses redirect instead of popup.
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

  // Try popup first (recommended by Firebase for web, iframe, and PWA apps)
  if (!preferRedirect) {
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      cachedAccessToken = credential?.accessToken || null;
      return { user: result.user, accessToken: cachedAccessToken, redirectInitiated: false };
    } catch (popupError: any) {
      console.warn('Popup sign-in encounter:', popupError?.code || popupError?.message);

      // Handle specific blocking errors directly
      if (
        popupError?.code === 'auth/unauthorized-domain' ||
        popupError?.code === 'auth/admin-restricted-operation' ||
        popupError?.code === 'auth/operation-not-allowed' ||
        popupError?.message?.includes('403') ||
        popupError?.message?.includes('access_denied')
      ) {
        notifyAuthError(popupError);
        throw popupError;
      }

      // If user deliberately closed the popup window, don't fall back to redirect
      if (
        popupError?.code === 'auth/popup-closed-by-user' ||
        popupError?.code === 'auth/cancelled-popup-request'
      ) {
        throw popupError;
      }

      // Check if running in an iframe (e.g. AI Studio preview)
      const inIframe = typeof window !== 'undefined' && window.self !== window.top;

      // Only attempt redirect fallback if popup was strictly blocked AND not inside an iframe
      if (!inIframe && popupError?.code === 'auth/popup-blocked') {
        try {
          console.info('Popup blocked on standalone browser; attempting fallback redirect...');
          await signInWithRedirect(auth, provider);
          return { user: auth.currentUser, accessToken: cachedAccessToken, redirectInitiated: true };
        } catch (redirectError: any) {
          notifyAuthError(redirectError);
          throw redirectError;
        }
      }

      notifyAuthError(popupError);
      throw popupError;
    }
  }

  // Explicit redirect requested
  try {
    await signInWithRedirect(auth, provider);
    return { user: auth.currentUser, accessToken: cachedAccessToken, redirectInitiated: true };
  } catch (err: any) {
    notifyAuthError(err);
    throw err;
  }
}

export async function logOut() {
  cachedAccessToken = null;
  return signOut(auth);
}

// Firestore persistence helpers for Ministry data with typed error handling
export const firestoreSync = {
  // Entries
  async saveEntry(userId: string, entry: MinistryEntry) {
    if (!userId) return;
    const path = `users/${userId}/entries/${entry.id}`;
    try {
      const ref = doc(db, 'users', userId, 'entries', String(entry.id));
      await setDoc(ref, entry, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async deleteEntry(userId: string, entryId: number) {
    if (!userId) return;
    const path = `users/${userId}/entries/${entryId}`;
    try {
      const ref = doc(db, 'users', userId, 'entries', String(entryId));
      await deleteDoc(ref);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  async loadEntries(userId: string): Promise<MinistryEntry[]> {
    if (!userId) return [];
    const path = `users/${userId}/entries`;
    try {
      const ref = collection(db, 'users', userId, 'entries');
      const snap = await getDocs(ref);
      return snap.docs.map((d) => d.data() as MinistryEntry);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      return [];
    }
  },

  // Events
  async saveEvent(userId: string, event: ScheduledEvent) {
    if (!userId) return;
    const path = `users/${userId}/events/${event.id}`;
    try {
      const ref = doc(db, 'users', userId, 'events', String(event.id));
      await setDoc(ref, event, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async deleteEvent(userId: string, eventId: number) {
    if (!userId) return;
    const path = `users/${userId}/events/${eventId}`;
    try {
      const ref = doc(db, 'users', userId, 'events', String(eventId));
      await deleteDoc(ref);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  async loadEvents(userId: string): Promise<ScheduledEvent[]> {
    if (!userId) return [];
    const path = `users/${userId}/events`;
    try {
      const ref = collection(db, 'users', userId, 'events');
      const snap = await getDocs(ref);
      return snap.docs.map((d) => d.data() as ScheduledEvent);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      return [];
    }
  },

  // Notes
  async saveNote(userId: string, note: MinistryNote) {
    if (!userId) return;
    const path = `users/${userId}/notes/${note.id}`;
    try {
      const ref = doc(db, 'users', userId, 'notes', String(note.id));
      await setDoc(ref, note, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async deleteNote(userId: string, noteId: string) {
    if (!userId) return;
    const path = `users/${userId}/notes/${noteId}`;
    try {
      const ref = doc(db, 'users', userId, 'notes', String(noteId));
      await deleteDoc(ref);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  async loadNotes(userId: string): Promise<MinistryNote[]> {
    if (!userId) return [];
    const path = `users/${userId}/notes`;
    try {
      const ref = collection(db, 'users', userId, 'notes');
      const snap = await getDocs(ref);
      return snap.docs.map((d) => d.data() as MinistryNote);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      return [];
    }
  },

  // Settings
  async saveSettings(userId: string, settings: UserSettings) {
    if (!userId) return;
    const path = `users/${userId}/settings/current`;
    try {
      const ref = doc(db, 'users', userId, 'settings', 'current');
      await setDoc(ref, settings, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async loadSettings(userId: string): Promise<UserSettings | null> {
    if (!userId) return null;
    const path = `users/${userId}/settings/current`;
    try {
      const ref = doc(db, 'users', userId, 'settings', 'current');
      const snap = await getDocFromServer(ref).catch(() => null);
      return snap && snap.exists() ? (snap.data() as UserSettings) : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
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
    const path = `users/${userId}`;
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
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },
};
