import { MinistryAIResponse, MinistryAnalyticsSummary } from '../types.ts';
import { SupportedLanguage } from '../translations/index.ts';

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
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

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
        console.error('Ministry AI Client Error: Server returned HTML instead of JSON. Check serverless/API routing.');
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

        const serverMsg = errorData.message || errorData.error;

        if (res.status === 401 || res.status === 403) {
          throw new Error(
            serverMsg || 'Ministry AI server authentication failed. Please verify GEMINI_API_KEY environment variable.'
          );
        }

        if (res.status === 429) {
          throw new Error(
            serverMsg || 'AI service quota or rate limit exceeded. Please wait a moment before trying again.'
          );
        }

        if (res.status === 502 || res.status === 503 || res.status === 504) {
          throw new Error(
            serverMsg || `Backend server temporarily unavailable (HTTP ${res.status}). Please try again shortly.`
          );
        }

        if (res.status === 404) {
          throw new Error(
            'Ministry AI API endpoint not found (/api/ai/chat). Ensure production serverless API routes are active.'
          );
        }

        throw new Error(serverMsg || `Server responded with HTTP status ${res.status}`);
      }

      const data: MinistryAIResponse = await res.json();
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        throw new Error('Request timed out. The server took too long to respond. Please tap Retry.');
      }

      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        throw new Error(
          'Unable to reach Ministry AI server. Please check your network connection or server availability.'
        );
      }

      throw err;
    }
  }
}
