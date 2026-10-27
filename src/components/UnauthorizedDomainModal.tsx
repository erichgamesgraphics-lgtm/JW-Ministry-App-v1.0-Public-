import React, { useState, useEffect } from 'react';
import { AlertTriangle, Copy, Check, ExternalLink, X, ShieldAlert, RefreshCw } from 'lucide-react';
import { subscribeToAuthError, signInWithGoogle, AuthErrorInfo } from '../services/firebase.ts';

interface UnauthorizedDomainModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  domain?: string;
}

export const UnauthorizedDomainModal: React.FC<UnauthorizedDomainModalProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  domain: initialDomain,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [errorInfo, setErrorInfo] = useState<AuthErrorInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Subscribe to automatic auth errors
  useEffect(() => {
    const unsubscribe = subscribeToAuthError((info) => {
      if (info.code === 'auth/unauthorized-domain' || info.code === 'auth/access-denied-403') {
        setErrorInfo(info);
        setInternalIsOpen(true);
      }
    });
    return unsubscribe;
  }, []);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const currentDomain =
    initialDomain ||
    errorInfo?.domain ||
    (typeof window !== 'undefined' ? window.location.hostname : 'your-domain.vercel.app');

  const is403 = errorInfo?.code === 'auth/access-denied-403';

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Failed to copy to clipboard', e);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await signInWithGoogle();
      handleClose();
    } catch (err: any) {
      console.warn('Retry result:', err?.message || err);
    } finally {
      setIsRetrying(false);
    }
  };

  if (!isOpen) return null;

  const firebaseAuthSettingsUrl =
    'https://console.firebase.google.com/project/ministry-tracker-5ffae/authentication/settings';
  const gcpCredentialsUrl =
    'https://console.cloud.google.com/apis/credentials?project=ministry-tracker-5ffae';
  const gcpOAuthConsentUrl =
    'https://console.cloud.google.com/apis/credentials/consent?project=ministry-tracker-5ffae';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-amber-200/50 dark:border-amber-900/50 bg-white/95 dark:bg-[#131D31]/95 p-6 shadow-2xl backdrop-blur-xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${is403 ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'}`}>
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {is403 ? 'Firebase Login: 403 Forbidden Diagnostic' : 'Firebase Domain Authorization Required'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {is403 ? 'Authentication blocked by Google Identity or Firebase settings' : 'Action required for Vercel & Production deployment'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Notice Body */}
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <p>
            {errorInfo?.detailedCause ||
              'Firebase Authentication restricts Google Sign-In to authorized domains and configured OAuth consent settings.'}
          </p>

          {/* Domain Box */}
          <div className="flex items-center justify-between rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/30 p-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wider">
                Current Hostname to Authorize
              </span>
              <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white select-all break-all">
                {currentDomain}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 shrink-0 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Domain</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Steps */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3.5 space-y-2.5">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Resolution Checklist in Console</span>
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              <li>
                <strong className="text-slate-900 dark:text-white">1. Authorized Domains:</strong> Open{' '}
                <a
                  href={firebaseAuthSettingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 underline inline-flex items-center gap-0.5"
                >
                  Firebase Auth Settings <ExternalLink className="h-3 w-3 inline" />
                </a>
                , scroll to <em>Authorized domains</em>, click <em>Add domain</em>, and add <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">{currentDomain}</code>.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">2. Enable Google Provider:</strong> In Firebase Console &gt; Authentication &gt; Sign-in method, ensure <em>Google</em> is enabled and a project support email is saved.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">3. OAuth Test Users:</strong> If OAuth consent screen is in &quot;Testing&quot; mode, add your email to{' '}
                <a
                  href={gcpOAuthConsentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 underline inline-flex items-center gap-0.5"
                >
                  OAuth Consent Screen &gt; Test Users <ExternalLink className="h-3 w-3 inline" />
                </a>.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">4. API Key Restrictions:</strong> In{' '}
                <a
                  href={gcpCredentialsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 underline inline-flex items-center gap-0.5"
                >
                  GCP Credentials <ExternalLink className="h-3 w-3 inline" />
                </a>
                , verify the Web API Key does not have HTTP referrer restrictions that block <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">{currentDomain}</code>.
              </li>
            </ol>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <a
            href={firebaseAuthSettingsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <span>Open Firebase Settings</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <div className="flex w-full sm:w-auto items-center gap-2">
            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Retrying…' : 'Retry Sign In'}</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
