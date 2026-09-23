import { MinistryTrackerDataTools, TrackerToolCategory } from './MinistryTrackerDataTools.js';
import { ResearchOrchestrator, ResearchResult } from './ResearchOrchestrator.js';
import { GeneralAIEngine } from './GeneralAIEngine.js';
import { LanguageService } from './LanguageService.js';
import { JWOrgService } from './JWOrgService.js';
import { SupportedLanguage } from '../../src/types.js';
import type { ChatHistoryMessage, SearchResult } from './types.js';

export type OrchestrationType =
  | 'MINISTRY_DATA_TOOLS'
  | 'JW_ORG_RESEARCH_TOOLS'
  | 'GENERAL_AI_MODEL'
  | 'MINISTRY_DATA_AND_GENERAL_AI'
  | 'HYBRID_ALL';

export interface OrchestrationEvaluation {
  orchestrationType: OrchestrationType;
  trackerCategory?: TrackerToolCategory;
  isPersonalData: boolean;
  isResearch: boolean;
  isGeneralAI: boolean;
  confidence: number;
  reason: string;
}

export interface OrchestratorResponse {
  answer: string;
  sources: SearchResult[];
  suggestedFollowUps: string[];
  routeUsed: string;
  orchestrationType: OrchestrationType;
}

export class AIOrchestrator {
  /**
   * Top-level semantic evaluator that categorizes user requests into:
   * 1. Ministry Data Tools (Personal tracker records, hours, goals, Bible studies count, schedule)
   * 2. JW.ORG Research Tools (Official publications, articles, videos, scriptures)
   * 3. General AI Model (Concept explanations, conversational chitchat, greetings, jokes)
   * 4. Ministry Data + General AI (Reasoning on user's goal/progress without searching JW.ORG)
   * 5. Hybrid All (Ministry Data + JW.ORG Research + General AI synthesis)
   */
  static evaluateMessage(
    message: string,
    requestedLanguage: string = 'en',
    conversationHistory: ChatHistoryMessage[] = []
  ): OrchestrationEvaluation {
    const clean = message.trim();
    const detected = LanguageService.detectLanguage(clean, requestedLanguage);
    const targetLang: SupportedLanguage = detected !== 'en' ? detected : LanguageService.normalizeLanguage(requestedLanguage);

    const lower = clean.toLowerCase();

    // 1. Check for Jokes
    const isJoke =
      lower.includes('joke') || lower.includes('шутк') || lower.includes('анекдот') ||
      lower.includes('կատակ') || lower.includes('चुटकुल') || lower.includes('ਚੁਟਕਲਾ');

    if (isJoke) {
      return {
        orchestrationType: 'GENERAL_AI_MODEL',
        isPersonalData: false,
        isResearch: false,
        isGeneralAI: true,
        confidence: 0.99,
        reason: 'Joke request routed to General AI Model. No JW.ORG search.',
      };
    }

    // 2. Check for Greetings & Chitchat ("How are you?", "Hi", etc.)
    const isGreeting =
      lower.includes('how are you') || lower.includes('как дела') || lower.includes('ինչպես ես') ||
      lower.includes('आप कैसे हैं') || lower.includes('ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ') || lower.includes('how r u') ||
      lower.includes("how's it going") || lower === 'hi' || lower === 'hello' || lower === 'hey' ||
      lower === 'привет' || lower === 'здравствуйте' || lower === 'բարև' || lower === 'नमस्ते' ||
      lower === 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ';

    if (isGreeting) {
      return {
        orchestrationType: 'GENERAL_AI_MODEL',
        isPersonalData: false,
        isResearch: false,
        isGeneralAI: true,
        confidence: 0.99,
        reason: 'Greeting / conversational inquiry routed to General AI Model. No JW.ORG search.',
      };
    }

    // 3. Check for Conceptual Explanations (e.g. "What's the difference between a return visit and a Bible study?")
    const isDifferenceOrConcept =
      lower.includes('difference') || lower.includes('what is') || lower.includes("what's") ||
      lower.includes('explain') || lower.includes('разниц') || lower.includes('в чем разниц') ||
      lower.includes('что такое') || lower.includes('объясни') || lower.includes('տարբերություն') ||
      lower.includes('ինչ է') || lower.includes('բացատրիր') || lower.includes('अंतर') ||
      lower.includes('क्या है') || lower.includes('ਫ਼ਰਕ') || lower.includes('ਕੀ ਹੈ');

    const mentionsMinistryConcepts =
      (lower.includes('return visit') && lower.includes('bible study')) ||
      (lower.includes('повторн') && lower.includes('изучени')) ||
      (lower.includes('վերայցելություն') && lower.includes('ուսումնասիրություն')) ||
      (lower.includes('पुनः भेंट') && lower.includes('बाइबल अध्ययन')) ||
      (lower.includes('ਮੁੜ-ਮੁਲਾਕਾਤ') && lower.includes('ਬਾਈਬਲ ਸਟੱਡੀ'));

    if (isDifferenceOrConcept && mentionsMinistryConcepts) {
      return {
        orchestrationType: 'GENERAL_AI_MODEL',
        isPersonalData: false,
        isResearch: false,
        isGeneralAI: true,
        confidence: 0.99,
        reason: 'Concept explanation request routed to General AI Model. App data used only if asked for personal activities.',
      };
    }

    // 4. Check for Explicit JW.ORG Research Requests (e.g. "Find me something about...", "Find me a video...", scripture search)
    const isExplicitSearch =
      lower.includes('search') || lower.includes('find') || lower.includes('article') ||
      lower.includes('publication') || lower.includes('jw.org') || lower.includes('wol') ||
      lower.includes('watchtower') || lower.includes('video') || lower.includes('видео') ||
      lower.includes('տեսանյութ') || lower.includes('поиск') || lower.includes('найди') ||
      lower.includes('статьи') || lower.includes('публикация') || lower.includes('գտիր') ||
      lower.includes('փնտրիր') || lower.includes('հոդված') || lower.includes('खोज') ||
      lower.includes('लेख') || lower.includes('ਵੀਡੀਓ') || lower.includes('ਖੋਜ');

    const isTopicalSpiritualQuery =
      lower.includes('patience') || lower.includes('терпение') || lower.includes('համբերություն') ||
      lower.includes('धैर्य') || lower.includes('ਧੀਰਜ') ||
      lower.includes('courage') || lower.includes('мужество') || lower.includes('քաջություն') ||
      lower.includes('साहस') || lower.includes('ਦਲੇਰੀ') ||
      lower.includes('suffering') || lower.includes('страдания') || lower.includes('տառապանք') ||
      lower.includes('resurrection') || lower.includes('воскресение') || lower.includes('հարություն');

    const scriptureMatch = LanguageService.extractScriptureReference(clean);
    const isScripture = Boolean(scriptureMatch && scriptureMatch.isScripture);

    // 5. Check for Personal Data Requests
    // A. Specific Bible Studies Count request: "How many Bible studies do I have?"
    const isMyBibleStudies =
      (lower.includes('how many') || lower.includes('сколько') || lower.includes('քանի') || lower.includes('कितने') || lower.includes('ਕਿੰਨੇ') || lower.includes('do i have') || lower.includes('у меня') || lower.includes('իմ') || lower.includes('मेरे') || lower.includes('ਮੇਰੇ')) &&
      (lower.includes('bible study') || lower.includes('bible studies') || lower.includes('изучени') || lower.includes('ուսումնասիրություն') || lower.includes('बाइबल अध्ययन') || lower.includes('ਬਾਈਬਲ ਅਧਿਐਨ'));

    if (isMyBibleStudies) {
      return {
        orchestrationType: 'MINISTRY_DATA_TOOLS',
        trackerCategory: 'PERSONAL_STUDIES',
        isPersonalData: true,
        isResearch: false,
        isGeneralAI: false,
        confidence: 0.99,
        reason: 'Specific request for personal Bible studies count routed to Ministry Tracker Data Tools. No JW.ORG search.',
      };
    }

    // B. Specific Return Visits Count request: "How many return visits do I have?"
    const isMyReturnVisits =
      (lower.includes('how many') || lower.includes('сколько') || lower.includes('քանի') || lower.includes('कितने') || lower.includes('ਕਿੰਨੇ') || lower.includes('do i have') || lower.includes('у меня') || lower.includes('իմ') || lower.includes('मेरे') || lower.includes('ਮੇਰੇ')) &&
      (lower.includes('return visit') || lower.includes('return visits') || lower.includes('повторн') || lower.includes('վերայցելություն') || lower.includes('पुनः भेंट') || lower.includes('ਮੁੜ-ਮੁਲਾਕਾਤ'));

    if (isMyReturnVisits) {
      return {
        orchestrationType: 'MINISTRY_DATA_TOOLS',
        trackerCategory: 'PERSONAL_VISITS',
        isPersonalData: true,
        isResearch: false,
        isGeneralAI: false,
        confidence: 0.99,
        reason: 'Specific request for personal return visits count routed to Ministry Tracker Data Tools. No JW.ORG search.',
      };
    }

    // C. Goal Help Request (e.g. "I'm behind on my ministry goal. Can you help me?")
    const isBehindOnGoal =
      (lower.includes('behind') || lower.includes('help me') || lower.includes('reach my goal') || lower.includes('struggling') || lower.includes('отстаю') || lower.includes('помоги') || lower.includes('достичь цели') || lower.includes('հետ եմ մնում') || lower.includes('օգնիր') || lower.includes('पीछे') || lower.includes('मदद') || lower.includes('ਪਿੱਛੇ') || lower.includes('ਮਦਦ')) &&
      (lower.includes('goal') || lower.includes('hours') || lower.includes('ministry') || lower.includes('цел') || lower.includes('часов') || lower.includes('նպատակ') || lower.includes('ժամ') || lower.includes('लक्ष्य') || lower.includes('ਘੰਟੇ') || lower.includes('ਟੀਚਾ'));

    if (isBehindOnGoal) {
      // Check if user specifically requested JW.ORG material: "Find me something encouraging from JW.ORG"
      const asksForJWOrgMaterial = lower.includes('jw.org') || lower.includes('encouraging') || lower.includes('article') || lower.includes('ободрение') || lower.includes('стать') || lower.includes('քաջալերող') || lower.includes('प्रोत्साहन') || lower.includes('ਹੌਸਲਾ');

      if (asksForJWOrgMaterial) {
        return {
          orchestrationType: 'HYBRID_ALL',
          trackerCategory: 'PERSONAL_GOAL',
          isPersonalData: true,
          isResearch: true,
          isGeneralAI: true,
          confidence: 0.98,
          reason: 'Goal assistance request with explicit JW.ORG encouragement request. Routes to Hybrid All (Ministry Data + JW.ORG Research + General AI).',
        };
      }

      return {
        orchestrationType: 'MINISTRY_DATA_AND_GENERAL_AI',
        trackerCategory: 'PERSONAL_GOAL',
        isPersonalData: true,
        isResearch: false,
        isGeneralAI: true,
        confidence: 0.98,
        reason: 'Goal assistance request routed to Ministry Data + General AI reasoning. No JW.ORG search.',
      };
    }

    // D. General Hours Request
    const isHours =
      lower.includes('how many hours') || lower.includes('logged hours') || lower.includes('hours left') || lower.includes('remaining hours') ||
      lower.includes('сколько часов') || lower.includes('записано часов') || lower.includes('осталось часов') ||
      lower.includes('քանի ժամ') || lower.includes('մնացած ժամ') ||
      lower.includes('कितने घंटे') || lower.includes('शेष घंटे') ||
      lower.includes('ਕਿੰਨੇ ਘੰਟੇ') || lower.includes('ਬਾਕੀ ਘੰਟੇ');

    if (isHours && !isExplicitSearch) {
      return {
        orchestrationType: 'MINISTRY_DATA_TOOLS',
        trackerCategory: 'PERSONAL_HOURS',
        isPersonalData: true,
        isResearch: false,
        isGeneralAI: false,
        confidence: 0.98,
        reason: 'Personal hours request routed to Ministry Tracker Data Tools. No JW.ORG search.',
      };
    }

    // E. General Goal Request
    const isGoal =
      (lower.includes('my goal') || lower.includes('monthly goal') || lower.includes('pioneer status') || lower.includes('моя цель') || lower.includes('цель на месяц') || lower.includes('իմ նպատակը') || lower.includes('मेरा लक्ष्य') || lower.includes('ਮੇਰਾ ਟੀਚਾ')) &&
      !isExplicitSearch;

    if (isGoal) {
      return {
        orchestrationType: 'MINISTRY_DATA_TOOLS',
        trackerCategory: 'PERSONAL_GOAL',
        isPersonalData: true,
        isResearch: false,
        isGeneralAI: false,
        confidence: 0.98,
        reason: 'Personal goal status request routed to Ministry Tracker Data Tools. No JW.ORG search.',
      };
    }

    // F. Schedule & Arrangements Request
    const isSchedule =
      (lower.includes('schedule') || lower.includes('calendar') || lower.includes('arrangements') || lower.includes('upcoming service') || lower.includes('расписание') || lower.includes('график') || lower.includes('ժամանակացույց') || lower.includes('օրացույց') || lower.includes('कैलेंडर') || lower.includes('ਕੈਲੰਡਰ')) &&
      !isExplicitSearch;

    if (isSchedule) {
      return {
        orchestrationType: 'MINISTRY_DATA_TOOLS',
        trackerCategory: 'PERSONAL_SCHEDULE',
        isPersonalData: true,
        isResearch: false,
        isGeneralAI: false,
        confidence: 0.98,
        reason: 'Personal schedule request routed to Ministry Tracker Data Tools. No JW.ORG search.',
      };
    }

    // G. History / Activity Log Request
    const isHistory =
      (lower.includes('history') || lower.includes('recent entries') || lower.includes('activity log') || lower.includes('история') || lower.includes('прошлые записи') || lower.includes('պատմություն') || lower.includes('գրանցումներ') || lower.includes('इतिहास') || lower.includes('ਇਤਿਹਾਸ')) &&
      !isExplicitSearch;

    if (isHistory) {
      return {
        orchestrationType: 'MINISTRY_DATA_TOOLS',
        trackerCategory: 'PERSONAL_HISTORY',
        isPersonalData: true,
        isResearch: false,
        isGeneralAI: false,
        confidence: 0.98,
        reason: 'Personal activity history routed to Ministry Tracker Data Tools. No JW.ORG search.',
      };
    }

    // 6. JW.ORG Research Engine (For explicit research, articles, videos, topical research, scriptures)
    if (isExplicitSearch || isTopicalSpiritualQuery || isScripture) {
      return {
        orchestrationType: 'JW_ORG_RESEARCH_TOOLS',
        isPersonalData: false,
        isResearch: true,
        isGeneralAI: false,
        confidence: 0.96,
        reason: 'Spiritual topic or research request routed to JW.ORG Research Engine.',
      };
    }

    // 7. General Questions & Conversational fallback
    return {
      orchestrationType: 'GENERAL_AI_MODEL',
      isPersonalData: false,
      isResearch: false,
      isGeneralAI: true,
      confidence: 0.85,
      reason: 'General inquiry routed to General AI Model.',
    };
  }

  /**
   * Main dispatch method: Executes the requested orchestration type and returns a unified payload.
   */
  static async processMessage(
    message: string,
    userContext: any,
    requestedLanguage: string = 'en',
    conversationHistory: ChatHistoryMessage[] = []
  ): Promise<OrchestratorResponse> {
    const cleanMessage = message.trim();
    const detected = LanguageService.detectLanguage(cleanMessage, requestedLanguage);
    const targetLang: SupportedLanguage = detected !== 'en' ? detected : LanguageService.normalizeLanguage(requestedLanguage);

    const evaluation = this.evaluateMessage(cleanMessage, targetLang, conversationHistory);

    // ─────────────────────────────────────────────────────────────
    // Route 1: Ministry Data Tools (Pure Personal Data)
    // ─────────────────────────────────────────────────────────────
    if (evaluation.orchestrationType === 'MINISTRY_DATA_TOOLS' && evaluation.trackerCategory) {
      const toolOutput = MinistryTrackerDataTools.executeTool(evaluation.trackerCategory, userContext, targetLang);
      const suggestedFollowUps = LanguageService.getLocalizedSuggestions(targetLang, 'MINISTRY_HOURS');

      return {
        answer: toolOutput.answer,
        sources: [],
        suggestedFollowUps,
        routeUsed: toolOutput.toolUsed,
        orchestrationType: evaluation.orchestrationType,
      };
    }

    // ─────────────────────────────────────────────────────────────
    // Route 2: JW.ORG Research Tools (Official Publications, Videos, Scriptures)
    // ─────────────────────────────────────────────────────────────
    if (evaluation.orchestrationType === 'JW_ORG_RESEARCH_TOOLS') {
      const researchOutput: ResearchResult = await ResearchOrchestrator.orchestrateResearch(
        cleanMessage,
        userContext,
        targetLang,
        conversationHistory
      );

      return {
        answer: researchOutput.answer,
        sources: researchOutput.sources || [],
        suggestedFollowUps: researchOutput.suggestedFollowUps || [],
        routeUsed: researchOutput.orchestratorUsed || 'JW.ORG Research Engine',
        orchestrationType: evaluation.orchestrationType,
      };
    }

    // ─────────────────────────────────────────────────────────────
    // Route 3: General AI Model (Concepts, Jokes, Greetings, Explanations)
    // MUST NOT search JW.ORG!
    // ─────────────────────────────────────────────────────────────
    if (evaluation.orchestrationType === 'GENERAL_AI_MODEL') {
      const aiResponse = await GeneralAIEngine.generateGeneralResponse(
        cleanMessage,
        targetLang,
        conversationHistory
      );

      const suggestedFollowUps = LanguageService.getLocalizedSuggestions(targetLang, 'DEFAULT');

      return {
        answer: aiResponse,
        sources: [],
        suggestedFollowUps,
        routeUsed: 'General AI Model',
        orchestrationType: evaluation.orchestrationType,
      };
    }

    // ─────────────────────────────────────────────────────────────
    // Route 4: Ministry Data + General AI Reasoning
    // E.g. "I'm behind on my ministry goal. Can you help me?"
    // Uses actual app data + General AI reasoning. MUST NOT search JW.ORG!
    // ─────────────────────────────────────────────────────────────
    if (evaluation.orchestrationType === 'MINISTRY_DATA_AND_GENERAL_AI') {
      const actualDataProgress = MinistryTrackerDataTools.getProgress(userContext, targetLang);
      const reasoningAnswer = await GeneralAIEngine.generateGeneralResponse(
        cleanMessage,
        targetLang,
        conversationHistory,
        {
          ministryDataSummary: actualDataProgress,
        }
      );

      const suggestedFollowUps = LanguageService.getLocalizedSuggestions(targetLang, 'MINISTRY_HOURS');

      return {
        answer: reasoningAnswer,
        sources: [],
        suggestedFollowUps,
        routeUsed: 'Ministry Data Tools + General AI Reasoning',
        orchestrationType: evaluation.orchestrationType,
      };
    }

    // ─────────────────────────────────────────────────────────────
    // Route 5: Hybrid All (Ministry Data + JW.ORG Research + General AI)
    // E.g. "I'm behind on my ministry goal. Find me something encouraging from JW.ORG."
    // ─────────────────────────────────────────────────────────────
    if (evaluation.orchestrationType === 'HYBRID_ALL') {
      // 1. Fetch real user data
      const actualDataProgress = MinistryTrackerDataTools.getProgress(userContext, targetLang);

      // 2. Fetch real JW.ORG research for ministry encouragement
      const researchSources = await JWOrgService.searchJWOrg('encouragement preaching', targetLang);

      // 3. General AI synthesizes response
      const synthesizedAnswer = await GeneralAIEngine.generateGeneralResponse(
        cleanMessage,
        targetLang,
        conversationHistory,
        {
          ministryDataSummary: actualDataProgress,
          sources: researchSources,
        }
      );

      const suggestedFollowUps = LanguageService.getLocalizedSuggestions(targetLang, 'MINISTRY_HOURS');

      return {
        answer: synthesizedAnswer,
        sources: researchSources,
        suggestedFollowUps,
        routeUsed: 'Ministry Data + JW.ORG Research + General AI',
        orchestrationType: evaluation.orchestrationType,
      };
    }

    // Fallback Default
    const defaultResponse = await GeneralAIEngine.generateGeneralResponse(
      cleanMessage,
      targetLang,
      conversationHistory
    );

    return {
      answer: defaultResponse,
      sources: [],
      suggestedFollowUps: LanguageService.getLocalizedSuggestions(targetLang, 'DEFAULT'),
      routeUsed: 'General AI Model (Default)',
      orchestrationType: 'GENERAL_AI_MODEL',
    };
  }
}
