import { MinistryAIResponse, MinistryAnalyticsSummary } from '../types.ts';
import { SupportedLanguage } from '../translations/index.ts';
import { normalizeAIError } from '../utils/errorUtils.ts';

export class MinistryAIServiceClient {
  /**
   * Send a question to Ministry AI backend
   */
  static async ask(
    question: string,
    language: SupportedLanguage,
    analytics?: MinistryAnalyticsSummary
  ): Promise<MinistryAIResponse> {
    // 1. Check offline state
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new Error(
        'No internet connection detected. Please check your Wi-Fi or mobile data and try again.'
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000); // 35 second timeout

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          question,
          language,
          analytics,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if server returned HTML (static routing fallback)
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        console.error('Ministry AI Client Error: Server returned HTML page instead of JSON API response.');
        throw new Error(
          'Ministry AI server route was not reached. Please verify that the API backend is deployed.'
        );
      }

      if (!res.ok) {
        let errorData: any = {};
        try {
          errorData = await res.json();
        } catch {
          // Ignore JSON parse failure on raw error responses
        }

        const normalizedServerMsg = normalizeAIError(errorData);

        // Safe console diagnostic log during debugging
        console.error('[Ministry AI Client Debug]', {
          status: res.status,
          statusText: res.statusText,
          errorData,
          normalizedMessage: normalizedServerMsg,
        });

        if (res.status === 401 || res.status === 403) {
          throw new Error(
            normalizedServerMsg.includes('GEMINI_API_KEY')
              ? normalizedServerMsg
              : `Ministry AI server authentication failed (HTTP ${res.status}): ${normalizedServerMsg}`
          );
        }

        if (res.status === 429) {
          throw new Error(
            `AI service rate limit or quota exceeded: ${normalizedServerMsg}`
          );
        }

        if (res.status === 502 || res.status === 503 || res.status === 504) {
          throw new Error(
            `Backend server temporarily unavailable (HTTP ${res.status}): ${normalizedServerMsg}`
          );
        }

        if (res.status === 404) {
          throw new Error(
            'Ministry AI API endpoint not found (/api/ai/chat). Ensure production serverless API routes are active.'
          );
        }

        throw new Error(normalizedServerMsg || `Server responded with HTTP status ${res.status}`);
      }

      const data: MinistryAIResponse = await res.json();
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);

      // Detailed console error logging
      console.error('[Ministry AI Client Error Caught]', err);

      if (err.name === 'AbortError') {
        throw new Error('Request timed out after 35 seconds. The server took too long to respond. Please tap Retry.');
      }

      const rawMsg = err?.message || String(err);
      if (rawMsg.includes('Failed to fetch') || rawMsg.includes('NetworkError') || rawMsg.includes('Load failed')) {
        throw new Error(
          'Unable to reach Ministry AI server. Please check your network connection or server availability.'
        );
      }

      throw new Error(normalizeAIError(err));
    }
  }
}

