// Unified Google Auth exports re-exported from canonical firebase service
export {
  auth,
  initAuth,
  signInWithGoogle as googleSignIn,
  logOut as googleSignOut,
  getAccessToken,
  setAccessToken,
  CALENDAR_SCOPES as SCOPES,
  isMobileOrWebView,
  subscribeToAuthError,
  notifyAuthError
} from './firebase.ts';

export const hasValidAccessToken = (): boolean => {
  // Imported dynamically to inspect in-memory cache
  return Boolean((window as any).__cachedAccessToken || false);
};
