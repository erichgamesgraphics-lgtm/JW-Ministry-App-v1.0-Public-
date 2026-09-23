import { IntentRouter } from './IntentRouter.js';
import { MinistryAIRequestPayload, MinistryAIResponsePayload } from './types.js';

export class MinistryAIService {
  /**
   * Main entry point to process a Ministry Assistant request using top-level IntentRouter.
   * Evaluates user message semantically before deciding to call either Ministry Tracker data tools
   * or the Research Orchestrator.
   */
  static async processRequest(payload: MinistryAIRequestPayload): Promise<MinistryAIResponsePayload> {
    const { message, userContext, language = 'en', conversationHistory = [] } = payload;

    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new Error('Message is required.');
    }

    const cleanMessage = message.trim();

    // Delegate directly to top-level IntentRouter
    const result = await IntentRouter.processMessage(cleanMessage, userContext, language, conversationHistory);

    return {
      answer: result.answer,
      sources: result.sources,
      suggestedFollowUps: result.suggestedFollowUps,
    };
  }
}


