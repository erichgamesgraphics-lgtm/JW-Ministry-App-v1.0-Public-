import { MinistryTrackerDataTools, TrackerToolCategory } from './MinistryTrackerDataTools.js';
import { AIOrchestrator, OrchestrationEvaluation, OrchestrationType } from './AIOrchestrator.js';
import { LanguageService } from './LanguageService.js';
import { SupportedLanguage } from '../../src/types.js';
import type { ChatHistoryMessage, SearchResult } from './types.js';

export type SemanticRouteDestination =
  | 'MINISTRY_TRACKER_DATA_TOOLS'
  | 'RESEARCH_ORCHESTRATOR'
  | 'GENERAL_AI_MODEL'
  | 'MINISTRY_DATA_AND_GENERAL_AI'
  | 'HYBRID';

export interface IntentEvaluationResult {
  route: SemanticRouteDestination;
  trackerCategory?: TrackerToolCategory;
  isPersonalData: boolean;
  isResearch: boolean;
  isGeneralAI: boolean;
  confidence: number;
  reason: string;
}

export interface RouterExecutionResponse {
  answer: string;
  sources: SearchResult[];
  suggestedFollowUps: string[];
  routeUsed: string;
  isPersonalData: boolean;
  isResearch: boolean;
}

export class IntentRouter {
  /**
   * Top-level semantic evaluator that analyzes the user's message intent
   * before dispatching across Ministry Data Tools, JW.ORG Research Tools, or General AI Model.
   */
  static evaluateIntent(
    message: string,
    requestedLanguage: string = 'en',
    conversationHistory: ChatHistoryMessage[] = []
  ): IntentEvaluationResult {
    const rawEval = AIOrchestrator.evaluateMessage(message, requestedLanguage, conversationHistory);

    let route: SemanticRouteDestination = 'RESEARCH_ORCHESTRATOR';
    switch (rawEval.orchestrationType) {
      case 'MINISTRY_DATA_TOOLS':
        route = 'MINISTRY_TRACKER_DATA_TOOLS';
        break;
      case 'JW_ORG_RESEARCH_TOOLS':
        route = 'RESEARCH_ORCHESTRATOR';
        break;
      case 'GENERAL_AI_MODEL':
        route = 'GENERAL_AI_MODEL';
        break;
      case 'MINISTRY_DATA_AND_GENERAL_AI':
        route = 'MINISTRY_DATA_AND_GENERAL_AI';
        break;
      case 'HYBRID_ALL':
        route = 'HYBRID';
        break;
    }

    return {
      route,
      trackerCategory: rawEval.trackerCategory,
      isPersonalData: rawEval.isPersonalData,
      isResearch: rawEval.isResearch,
      isGeneralAI: rawEval.isGeneralAI,
      confidence: rawEval.confidence,
      reason: rawEval.reason,
    };
  }

  /**
   * Top-level execution router: Evaluates message semantically and dispatches
   * through the unified AI Orchestrator.
   */
  static async processMessage(
    message: string,
    userContext: any,
    requestedLanguage: string = 'en',
    conversationHistory: ChatHistoryMessage[] = []
  ): Promise<RouterExecutionResponse> {
    const result = await AIOrchestrator.processMessage(
      message,
      userContext,
      requestedLanguage,
      conversationHistory
    );

    const isPersonalData =
      result.orchestrationType === 'MINISTRY_DATA_TOOLS' ||
      result.orchestrationType === 'MINISTRY_DATA_AND_GENERAL_AI' ||
      result.orchestrationType === 'HYBRID_ALL';

    const isResearch =
      result.orchestrationType === 'JW_ORG_RESEARCH_TOOLS' ||
      result.orchestrationType === 'HYBRID_ALL';

    return {
      answer: result.answer,
      sources: result.sources,
      suggestedFollowUps: result.suggestedFollowUps,
      routeUsed: result.routeUsed,
      isPersonalData,
      isResearch,
    };
  }
}
