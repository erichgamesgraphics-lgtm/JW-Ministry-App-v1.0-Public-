import { MinistryAssistant } from './MinistryAssistant.js';
import { JWOrgService } from './JWOrgService.js';
import { WOLService } from './WOLService.js';
import { LanguageService } from './LanguageService.js';
import { ResearchOrchestrator } from './research/ResearchOrchestrator.js';
import type { ResearchSession } from './research/types.js';
import type { CategoryType, ScriptureMatch, SearchResult, ChatHistoryMessage } from './types.js';
import { SupportedLanguage } from '../../src/types.js';

export type { CategoryType };

export class MinistryAssistantRouter {
  /**
   * Classifies user prompt into specific intent categories using centralized LanguageService
   */
  static classifyRequest(
    message: string,
    lang: SupportedLanguage,
    hasPreviousResults: boolean = false
  ): { primaryCategory: CategoryType; isCombined: boolean; searchQuery: string } {
    return LanguageService.getLocalizedIntent(message, lang, hasPreviousResults);
  }

  /**
   * Main router entry point to process requests deterministically in any supported language
   */
  static async handleRequest(
    message: string,
    userContext: any,
    requestedLanguage: string = 'en',
    conversationHistory: ChatHistoryMessage[] = [],
    researchSession?: ResearchSession
  ): Promise<{ answer: string; sources: SearchResult[]; suggestedFollowUps: string[]; researchSession?: ResearchSession }> {
    try {
      const orchestration = await ResearchOrchestrator.processMessage(
        message,
        userContext,
        requestedLanguage,
        researchSession,
        conversationHistory
      );

      return {
        answer: orchestration.answer,
        sources: orchestration.sources as SearchResult[],
        suggestedFollowUps: orchestration.suggestedFollowUps,
        researchSession: orchestration.session,
      };
    } catch (err) {
      console.warn('Research Orchestrator error in Router, using direct fallback:', err);
      // Fallback
      const detected = LanguageService.detectLanguage(message, requestedLanguage);
      const targetLang: SupportedLanguage = detected !== 'en' ? detected : LanguageService.normalizeLanguage(requestedLanguage);
      const results = await JWOrgService.searchJWOrg(message, targetLang);
      return {
        answer: LanguageService.getGeneralGreeting(targetLang),
        sources: results as SearchResult[],
        suggestedFollowUps: LanguageService.getLocalizedSuggestions(targetLang),
      };
    }
  }
}
