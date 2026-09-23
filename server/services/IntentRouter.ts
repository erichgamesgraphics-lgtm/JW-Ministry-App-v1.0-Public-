import { MinistryTrackerDataTools, TrackerToolCategory } from './MinistryTrackerDataTools.js';
import { ResearchOrchestrator, ResearchResult } from './ResearchOrchestrator.js';
import { LanguageService } from './LanguageService.js';
import { SupportedLanguage } from '../../src/types.js';
import type { ChatHistoryMessage, SearchResult } from './types.js';

export type SemanticRouteDestination = 'MINISTRY_TRACKER_DATA_TOOLS' | 'RESEARCH_ORCHESTRATOR' | 'HYBRID';

export interface IntentEvaluationResult {
  route: SemanticRouteDestination;
  trackerCategory?: TrackerToolCategory;
  isPersonalData: boolean;
  isResearch: boolean;
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
   * before dispatching to either Ministry Tracker data tools or the Research Orchestrator.
   *
   * Priority Rule: Requests asking for personal hours, goals, schedule, history, or progress
   * are routed directly to Ministry Tracker Data Tools WITHOUT triggering research.
   */
  static evaluateIntent(
    message: string,
    requestedLanguage: string = 'en',
    conversationHistory: ChatHistoryMessage[] = []
  ): IntentEvaluationResult {
    const cleanMessage = message.trim();
    const detected = LanguageService.detectLanguage(cleanMessage, requestedLanguage);
    const targetLang: SupportedLanguage = detected !== 'en' ? detected : LanguageService.normalizeLanguage(requestedLanguage);

    const lower = cleanMessage.toLowerCase();
    const hasPreviousResults = conversationHistory.some(m => m.sources && m.sources.length > 0);

    // 1. Check if user query matches personal data requests
    // A. Personal Hours Request
    const isHours =
      lower.includes('hour') || lower.includes('left') || lower.includes('remaining') || lower.includes('completed') || lower.includes('how many hours') || lower.includes('logged hours') ||
      lower.includes('часы') || lower.includes('осталось') || lower.includes('сколько часов') || lower.includes('записано') ||
      lower.includes('ժամ') || lower.includes('մնացած') || lower.includes('քանի ժամ') ||
      lower.includes('घंटे') || lower.includes('शेष') || lower.includes('कितने घंटे') ||
      lower.includes('ਘੰਟੇ') || lower.includes('ਬਾਕੀ') || lower.includes('ਕਿੰਨੇ ਘੰਟੇ');

    // B. Personal Goal Request
    const isGoal =
      lower.includes('goal') || lower.includes('target') || lower.includes('pioneer status') || lower.includes('pioneer goal') || lower.includes('monthly goal') ||
      lower.includes('цель') || lower.includes('статус') || lower.includes('пионер') ||
      lower.includes('նպատակ') || lower.includes('ռահվիրա') ||
      lower.includes('लक्ष्य') || lower.includes('पायनियर') ||
      lower.includes('ਨਿਸ਼ਾਨਾ') || lower.includes('ਪਾਇਨੀਅਰ');

    // C. Personal Schedule & Arrangements Request
    const isSchedule =
      lower.includes('schedule') || lower.includes('calendar') || lower.includes('arrangements') || lower.includes('upcoming') || lower.includes('next arrangement') || lower.includes('when is my') || lower.includes('when do i preach') ||
      lower.includes('расписание') || lower.includes('календарь') || lower.includes('график') || lower.includes('запланировано') || lower.includes('следующее') ||
      lower.includes('ժամանակացույց') || lower.includes('օրացույց') || lower.includes('պայմանավորվածություն') || lower.includes('երբ է') ||
      lower.includes('कार्यक्रम') || lower.includes('कैलेंडर') || lower.includes('योजना') ||
      lower.includes('ਸ਼ੈਡਿਊਲ') || lower.includes('ਕੈਲੰਡਰ') || lower.includes('ਪ੍ਰਬੰਧ');

    // D. Personal Progress & Overview Request
    const isProgress =
      lower.includes('progress') || lower.includes('doing this month') || lower.includes('how am i doing') || lower.includes('my summary') || lower.includes('overview') ||
      lower.includes('прогресс') || lower.includes('как мои дела') || lower.includes('итоги') ||
      lower.includes('առաջընթաց') || lower.includes('ինչպես են') ||
      lower.includes('प्रगति') || lower.includes('स्थिति') ||
      lower.includes('ਤਰੱਕੀ') || lower.includes('ਪ੍ਰਗਤੀ');

    // E. Personal History & Activity Records Request
    const isHistory =
      lower.includes('history') || lower.includes('recent entries') || lower.includes('past records') || lower.includes('activity log') ||
      lower.includes('история') || lower.includes('записи') || lower.includes('прошлые') ||
      lower.includes('պատմություն') || lower.includes('գրանցումներ') ||
      lower.includes('इतिहास') || lower.includes('रिकॉर्ड') ||
      lower.includes('ਇਤਿਹਾਸ') || lower.includes('ਰਿਕਾਰਡ');

    // F. Personal Tips Request
    const isTips =
      lower.includes('my pace') || lower.includes('tip for my goal') || lower.includes('behind on my hours') ||
      lower.includes('совет по цели') || lower.includes('мой темп') ||
      lower.includes('խորհուրդ իմ') || lower.includes('पेस');

    // 2. Check if user query explicitly asks for research / articles / publications / scriptures
    const isExplicitSearch =
      lower.includes('search') || lower.includes('find') || lower.includes('article') || lower.includes('publication') || lower.includes('jw.org') || lower.includes('wol') || lower.includes('watchtower') || lower.includes('bible says') || lower.includes('scripture') ||
      lower.includes('поиск') || lower.includes('найди') || lower.includes('статьи') || lower.includes('публикация') || lower.includes('библия говорит') ||
      lower.includes('գտիր') || lower.includes('փնտրիր') || lower.includes('հոդված') || lower.includes('աստվածաշունչ') ||
      lower.includes('खोज') || lower.includes('लेख') || lower.includes('बाइबल') ||
      lower.includes('ਖੋਜ') || lower.includes('ਲੇਖ') || lower.includes('ਬਾਈਬਲ');

    // Topical research topics (suffering, family, youth, anxiety, patience, preaching advice, resurrection, prayer, etc.)
    const isTopicalResearch =
      lower.includes('suffering') || lower.includes('anxiety') || lower.includes('family') || lower.includes('youth') || lower.includes('patience') || lower.includes('prayer') || lower.includes('preaching advice') || lower.includes('resurrection') || lower.includes('paradise') ||
      lower.includes('страдания') || lower.includes('тревога') || lower.includes('семья') || lower.includes('молодежь') || lower.includes('терпение') || lower.includes('молитва') ||
      lower.includes('տառապանք') || lower.includes('ընտանիք') || lower.includes('երիտասարդ') || lower.includes('համբերություն') ||
      lower.includes('दुख') || lower.includes('परिवार') || lower.includes('धैर्य') || lower.includes('प्रार्थना') ||
      lower.includes('ਦੁੱਖ') || lower.includes('ਪਰਿਵਾਰ') || lower.includes('ਧੀਰਜ');

    const scriptureMatch = LanguageService.extractScriptureReference(cleanMessage);
    const isScriptureSearch = Boolean(scriptureMatch && scriptureMatch.isScripture);

    const isResearchIntent = isExplicitSearch || isTopicalResearch || isScriptureSearch;
    const isPersonalIntent = isHours || isGoal || isSchedule || isProgress || isHistory || isTips;

    // High Priority Evaluation Rule 1: Personal Hours, Goals, Schedule without research keywords
    if (isPersonalIntent && !isExplicitSearch) {
      let trackerCategory: TrackerToolCategory = 'PERSONAL_PROGRESS';
      if (isHours) trackerCategory = 'PERSONAL_HOURS';
      else if (isGoal) trackerCategory = 'PERSONAL_GOAL';
      else if (isSchedule) trackerCategory = 'PERSONAL_SCHEDULE';
      else if (isHistory) trackerCategory = 'PERSONAL_HISTORY';
      else if (isTips) trackerCategory = 'PERSONAL_TIPS';

      return {
        route: 'MINISTRY_TRACKER_DATA_TOOLS',
        trackerCategory,
        isPersonalData: true,
        isResearch: false,
        confidence: 0.98,
        reason: `Routed to Ministry Tracker Data Tools (${trackerCategory}) based on personal data intent keywords. Research bypass enforced.`,
      };
    }

    // High Priority Evaluation Rule 2: Explicit hybrid query (asks for both personal data AND research)
    if (isPersonalIntent && isResearchIntent) {
      return {
        route: 'HYBRID',
        trackerCategory: isHours ? 'PERSONAL_HOURS' : isGoal ? 'PERSONAL_GOAL' : isSchedule ? 'PERSONAL_SCHEDULE' : 'PERSONAL_PROGRESS',
        isPersonalData: true,
        isResearch: true,
        confidence: 0.92,
        reason: 'Combined query requesting both personal ministry metrics and research publications.',
      };
    }

    // Evaluation Rule 3: General Informational / Research Inquiries
    if (isResearchIntent || cleanMessage.trim().split(/\s+/).length >= 3) {
      return {
        route: 'RESEARCH_ORCHESTRATOR',
        isPersonalData: false,
        isResearch: true,
        confidence: 0.95,
        reason: 'Routed to Research Orchestrator for JW.ORG / WOL publication search and biblical insights.',
      };
    }

    // Default Fallback
    return {
      route: 'RESEARCH_ORCHESTRATOR',
      isPersonalData: false,
      isResearch: true,
      confidence: 0.8,
      reason: 'General inquiry routed to Research Orchestrator.',
    };
  }

  /**
   * Top-level execution router: Evaluates message semantically, then dispatches to either
   * MinistryTrackerDataTools or ResearchOrchestrator.
   */
  static async processMessage(
    message: string,
    userContext: any,
    requestedLanguage: string = 'en',
    conversationHistory: ChatHistoryMessage[] = []
  ): Promise<RouterExecutionResponse> {
    const detected = LanguageService.detectLanguage(message, requestedLanguage);
    const targetLang: SupportedLanguage = detected !== 'en' ? detected : LanguageService.normalizeLanguage(requestedLanguage);

    // 1. Top-Level Semantic Evaluation
    const evalResult = this.evaluateIntent(message, targetLang, conversationHistory);

    // 2. Dispatch Option A: Ministry Tracker Data Tools (Prioritized Personal Data Request)
    if (evalResult.route === 'MINISTRY_TRACKER_DATA_TOOLS' && evalResult.trackerCategory) {
      const toolOutput = MinistryTrackerDataTools.executeTool(evalResult.trackerCategory, userContext, targetLang);
      const suggestedFollowUps = LanguageService.getLocalizedSuggestions(targetLang, 'MINISTRY_HOURS');

      return {
        answer: toolOutput.answer,
        sources: [],
        suggestedFollowUps,
        routeUsed: toolOutput.toolUsed,
        isPersonalData: true,
        isResearch: false,
      };
    }

    // 3. Dispatch Option B: Research Orchestrator (General Informational Inquiry)
    if (evalResult.route === 'RESEARCH_ORCHESTRATOR') {
      const researchOutput: ResearchResult = await ResearchOrchestrator.orchestrateResearch(
        message,
        userContext,
        targetLang,
        conversationHistory
      );

      return {
        answer: researchOutput.answer,
        sources: researchOutput.sources,
        suggestedFollowUps: researchOutput.suggestedFollowUps,
        routeUsed: researchOutput.orchestratorUsed,
        isPersonalData: false,
        isResearch: true,
      };
    }

    // 4. Dispatch Option C: Hybrid Route (Personal Tracker Tool + Research Orchestrator)
    if (evalResult.route === 'HYBRID' && evalResult.trackerCategory) {
      const toolOutput = MinistryTrackerDataTools.executeTool(evalResult.trackerCategory, userContext, targetLang);
      const researchOutput = await ResearchOrchestrator.orchestrateResearch(
        message,
        userContext,
        targetLang,
        conversationHistory
      );

      const combinedAnswer = `${toolOutput.answer}\n\n---\n\n${researchOutput.answer}`;

      return {
        answer: combinedAnswer,
        sources: researchOutput.sources,
        suggestedFollowUps: researchOutput.suggestedFollowUps,
        routeUsed: `Hybrid: ${toolOutput.toolUsed} + ${researchOutput.orchestratorUsed}`,
        isPersonalData: true,
        isResearch: true,
      };
    }

    // Default Fallback to Research Orchestrator
    const fallbackResearch = await ResearchOrchestrator.orchestrateResearch(
      message,
      userContext,
      targetLang,
      conversationHistory
    );

    return {
      answer: fallbackResearch.answer,
      sources: fallbackResearch.sources,
      suggestedFollowUps: fallbackResearch.suggestedFollowUps,
      routeUsed: 'Research Orchestrator',
      isPersonalData: false,
      isResearch: true,
    };
  }
}
