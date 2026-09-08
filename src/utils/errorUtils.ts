/**
 * Utility functions for safe error handling, normalization, and secret sanitization.
 */

/**
 * Removes private API keys, secrets, or tokens from error strings before display or logging.
 */
export function sanitizeSecrets(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/AIzaSy[A-Za-z0-9_-]{33}/g, 'AIza...[REDACTED]');
}

/**
 * Converts any error shape (object, string, HTTP response, Error instance, Gemini API error)
 * into a clean, human-readable string. Guarantees that "[object Object]" is NEVER returned.
 */
export function normalizeAIError(error: any): string {
  if (!error) {
    return 'An unexpected error occurred while processing the request.';
  }

  // 1. If error is a string
  if (typeof error === 'string') {
    const trimmed = error.trim();
    if (trimmed === '[object Object]' || trimmed === '') {
      return 'An unknown object error was returned. Please try again.';
    }
    return sanitizeSecrets(trimmed);
  }

  // 2. If error is an Error instance
  if (error instanceof Error) {
    const msg = error.message;
    if (msg && typeof msg === 'string' && msg.trim() !== '[object Object]' && msg.trim() !== '') {
      return sanitizeSecrets(msg.trim());
    }
  }

  // 3. If error is an object
  if (typeof error === 'object') {
    // Check error.message property
    if (error.message) {
      if (typeof error.message === 'string' && error.message.trim() !== '[object Object]' && error.message.trim() !== '') {
        return sanitizeSecrets(error.message.trim());
      }
      if (typeof error.message === 'object') {
        return normalizeAIError(error.message);
      }
    }

    // Check error.error property
    if (error.error) {
      if (typeof error.error === 'string' && error.error.trim() !== '[object Object]' && error.error.trim() !== '') {
        return sanitizeSecrets(error.error.trim());
      }
      if (typeof error.error === 'object') {
        return normalizeAIError(error.error);
      }
    }

    // Check Gemini / GoogleGenAI status or errorDetails
    if (error.statusText && typeof error.statusText === 'string') {
      return sanitizeSecrets(`HTTP ${error.status || ''}: ${error.statusText}`);
    }

    if (error.details && typeof error.details === 'string') {
      return sanitizeSecrets(error.details);
    }

    if (error.detail && typeof error.detail === 'string') {
      return sanitizeSecrets(error.detail);
    }

    // Try JSON serialization if object contains properties
    try {
      const stringified = JSON.stringify(error, (key, value) => {
        if (key === 'apiKey' || key === 'authorization' || key === 'key') return '[REDACTED]';
        return value;
      });
      if (stringified && stringified !== '{}' && stringified !== '[]') {
        return sanitizeSecrets(stringified);
      }
    } catch {
      // Fallback
    }
  }

  return 'Ministry AI encountered an error. Please verify server configuration and network connection.';
}
