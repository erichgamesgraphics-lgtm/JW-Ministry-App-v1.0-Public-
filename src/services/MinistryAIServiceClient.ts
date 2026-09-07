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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          language,
          analytics,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with ${res.status}`);
      }

      const data: MinistryAIResponse = await res.json();
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      throw err;
    }
  }
}
