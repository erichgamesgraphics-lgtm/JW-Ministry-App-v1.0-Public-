import { MinistryAssistantRouter } from './MinistryAssistantRouter.js';
import { MinistryAIRequestPayload, MinistryAIResponsePayload } from './types.js';

export class MinistryAIService {
  /**
   * Main entry point to process a Ministry Assistant request deterministically
   */
  static async processRequest(payload: MinistryAIRequestPayload): Promise<MinistryAIResponsePayload> {
    const { message, userContext, language = 'en', conversationHistory = [] } = payload;

    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new Error('Message is required.');
    }

    const cleanMessage = message.trim();

    // Route request through deterministic Ministry Assistant Engine
    const { answer, sources, suggestedFollowUps } = await MinistryAssistantRouter.handleRequest(
      cleanMessage,
      userContext,
      language,
      conversationHistory
    );

    return {
      answer,
      sources,
      suggestedFollowUps,
    };
  }
}
