import { GoogleGenAI } from '@google/genai';
import { ResearchPlan, ResearchResult, ResearchSession } from './types.js';
import { ResearchPlanner } from './ResearchPlanner.js';
import { ResearchTools } from './ResearchTools.js';
import { MinistryAssistant } from '../MinistryAssistant.js';
import { LanguageService } from '../LanguageService.js';
import { SupportedLanguage } from '../../src/types.js';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

export interface OrchestrationResult {
  answer: string;
  sources: ResearchResult[];
  suggestedFollowUps: string[];
  session: ResearchSession;
  plan: ResearchPlan;
}

export class ResearchOrchestrator {
  /**
   * Main Orchestrator entry point executing the end-to-end research lifecycle
   */
  static async processMessage(
    message: string,
    userContext: any,
    requestedLanguage: string = 'en',
    existingSession?: ResearchSession,
    conversationHistory: any[] = []
  ): Promise<OrchestrationResult> {
    const lang: SupportedLanguage = LanguageService.normalizeLanguage(requestedLanguage);

    // 1. INTENT UNDERSTANDING & RESEARCH PLANNER
    const plan = await ResearchPlanner.createPlan(message, existingSession, lang);

    // Initialize or re-use ResearchSession
    let currentSession: ResearchSession = existingSession || {
      sessionId: `session-${Date.now()}`,
      originalTopic: plan.topic || message,
      currentTopic: plan.topic || message,
      results: [],
      filters: {
        contentType: plan.contentType,
        audience: plan.audience,
        datePreference: plan.datePreference,
        excludeTypes: plan.excludeTypes,
      },
      lastSearchQuery: plan.searchQuery,
      lastPlan: plan,
      updatedAt: Date.now(),
    };

    // 2. DECIDE IF APP TRACKER DATA IS NEEDED
    if (plan.isAppTrackerQuery && !plan.needsResearch) {
      const progressAnswer = MinistryAssistant.getCurrentMinistryProgress(userContext, lang);
      return {
        answer: progressAnswer,
        sources: [],
        suggestedFollowUps: LanguageService.getLocalizedSuggestions(lang, 'MINISTRY_HOURS'),
        session: currentSession,
        plan,
      };
    }

    // 3. DECIDE IF OPENING / SELECTION FROM EXISTING RESEARCH RESULTS
    if (plan.actionType === 'OPEN_RESULT' && currentSession.results.length > 0) {
      let targetResult: ResearchResult | undefined;

      if (plan.targetResultIndex !== undefined && currentSession.results[plan.targetResultIndex]) {
        targetResult = currentSession.results[plan.targetResultIndex];
      } else if (plan.targetContentTypeReference === 'Video') {
        targetResult = ResearchTools.getVideo(currentSession.results);
      } else if (plan.targetContentTypeReference === 'Article') {
        targetResult = ResearchTools.getArticle(currentSession.results);
      } else if (plan.targetContentTypeReference === 'Publication') {
        targetResult = ResearchTools.getPublication(currentSession.results);
      } else {
        targetResult = currentSession.results[0];
      }

      if (targetResult) {
        // Verify source URL belongs to official JW domains
        const verifiedSource = ResearchTools.openJWSource(targetResult);

        currentSession = {
          ...currentSession,
          selectedResult: targetResult,
          updatedAt: Date.now(),
        };

        const responseText = await this.composeSelectionResponse(targetResult, lang);

        return {
          answer: responseText,
          sources: [targetResult],
          suggestedFollowUps: this.generateFollowUpQuestions(lang, targetResult, currentSession),
          session: currentSession,
          plan,
        };
      }
    }

    // 4. EXECUTE RESEARCH / REFINEMENT / SEARCH TOOLS
    let rawResults: ResearchResult[] = [];

    if (
      (plan.actionType === 'FILTER_RESULTS' || plan.actionType === 'REFINE_SEARCH') &&
      currentSession.results.length > 0 &&
      plan.topic === currentSession.currentTopic
    ) {
      // Filter & re-rank existing session results first
      const ranked = ResearchTools.rankResearchResults(currentSession.results, plan);
      const filtered = ResearchTools.filterResearchResults(ranked, {
        contentType: plan.contentType,
        excludeTypes: plan.excludeTypes,
      });

      if (filtered.length > 0) {
        rawResults = filtered;
      } else {
        // If filtered set was empty, perform a new JW.ORG search with modified query
        rawResults = await ResearchTools.searchJWOrg(plan.searchQuery, lang, 1, plan.secondaryQueries);
      }
    } else {
      // NEW_SEARCH or CHANGE_TOPIC -> Execute fresh JW.ORG search
      rawResults = await ResearchTools.searchJWOrg(plan.searchQuery, lang, 1, plan.secondaryQueries);
    }

    // 5. RELEVANCE RANKING & CONTENT TYPE FILTERING
    const rankedResults = ResearchTools.rankResearchResults(rawResults, plan);
    const finalFilteredResults = ResearchTools.filterResearchResults(rankedResults, {
      contentType: plan.contentType,
      excludeTypes: plan.excludeTypes,
    });

    const displayResults = finalFilteredResults.slice(0, 5);

    // Update Session state
    currentSession = {
      ...currentSession,
      currentTopic: plan.topic,
      results: displayResults,
      filters: {
        contentType: plan.contentType,
        audience: plan.audience,
        datePreference: plan.datePreference,
        excludeTypes: plan.excludeTypes,
      },
      lastSearchQuery: plan.searchQuery,
      lastPlan: plan,
      updatedAt: Date.now(),
    };

    // 6. CONVERSATIONAL RESPONSE GENERATION
    const conversationalAnswer = await this.composeResearchResponse(
      plan,
      displayResults,
      lang,
      message
    );

    const followUps = this.generateResearchFollowUps(lang, plan, displayResults);

    return {
      answer: conversationalAnswer,
      sources: displayResults,
      suggestedFollowUps: followUps,
      session: currentSession,
      plan,
    };
  }

  /**
   * Generates a warm, natural conversational summary when opening or selecting a specific source
   */
  private static async composeSelectionResponse(result: ResearchResult, lang: SupportedLanguage): Promise<string> {
    const ai = getGeminiClient();
    const typeLabel = result.contentType || 'Resource';

    if (ai) {
      try {
        const prompt = `You are Ministry AI, a warm and encouraging research assistant for Jehovah's Witnesses.
The user selected this official ${typeLabel} from JW.ORG:
Title: "${result.title}"
Publication: "${result.publication || 'JW.ORG'}"
Type: ${typeLabel}
Snippet: "${result.snippet}"
Verified Link: ${result.url}

Write a helpful, inspiring, and clear response in ${lang} introducing this source in detail. Explain why it is valuable for personal study, family worship, or field ministry. Mention key takeaways based on the snippet. Keep formatting neat with markdown.`;

        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        if (res.text && res.text.trim().length > 20) {
          return res.text.trim();
        }
      } catch (err) {
        console.warn('Gemini selection composition fallback:', err);
      }
    }

    // Localized fallback response
    if (lang === 'ru') {
      return `Вот подробности о выбранном материале **«${result.title}»** (${result.publication || 'JW.ORG'}):\n\n${result.snippet}\n\nВы можете открыть полный материал на официальном сайте **JW.ORG**.`;
    }
    if (lang === 'hy') {
      return `Ահա մանրամասներ ընտրված **«${result.title}»** նյութի մասին (${result.publication || 'JW.ORG'}):\n\n${result.snippet}\n\nԴուք կարող եք բացել ամբողջական նյութը **JW.ORG** պաշտոնական կայքում։`;
    }
    if (lang === 'hi') {
      return `चयनित सामग्री **«${result.title}»** (${result.publication || 'JW.ORG'}) के बारे में विवरण:\n\n${result.snippet}\n\nआप पूरी सामग्री आधिकारिक **JW.ORG** वेबसाइट पर पढ़/देख सकते हैं।`;
    }
    if (lang === 'pa') {
      return `ਚੁਣੇ ਗਏ ਲੇਖ/ਵੀਡੀਓ **«${result.title}»** (${result.publication || 'JW.ORG'}) ਬਾਰੇ ਜਾਣਕਾਰੀ:\n\n${result.snippet}\n\nਤੁਸੀਂ ਪੂਰੀ ਜਾਣਕਾਰੀ **JW.ORG** ਵੈੱਬਸਾਈਟ 'ਤੇ ਦੇਖ ਸਕਦੇ ਹੋ।`;
    }

    return `Here are the details for **"${result.title}"** (${result.publication || 'JW.ORG'}):\n\n${result.snippet}\n\nYou can access the full ${typeLabel.toLowerCase()} on the official **JW.ORG** website.`;
  }

  /**
   * Generates a conversational research summary presenting returned results naturally
   */
  private static async composeResearchResponse(
    plan: ResearchPlan,
    results: ResearchResult[],
    lang: SupportedLanguage,
    userQuery: string
  ): Promise<string> {
    if (results.length === 0) {
      return LanguageService.getNoResultsMessage(plan.topic, lang, 'JW.ORG');
    }

    const ai = getGeminiClient();
    if (ai) {
      try {
        const resultsSummary = results
          .map((r, i) => `${i + 1}. [${r.contentType}] "${r.title}" (${r.publication || 'JW.ORG'}): ${r.snippet}`)
          .join('\n');

        const prompt = `You are Ministry AI, a warm, faith-strengthening, and helpful AI research assistant for Jehovah's Witnesses.
The user asked: "${userQuery}"
Topic: "${plan.topic}"
Requested Language: ${lang}

Here are the top official search results retrieved from JW.ORG:
${resultsSummary}

Instructions:
1. Speak naturally and warmly in ${lang}.
2. Introduce the results encouragingly without mentioning technical commands or JSON.
3. Present the options clearly by numbering them or categorizing them (e.g. Article, Video, Publication).
4. Briefly highlight what each result offers.
5. End with a warm conversational invitation such as "Would you like to open the article, watch the video, or explore one of these?"`;

        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        if (res.text && res.text.trim().length > 20) {
          return res.text.trim();
        }
      } catch (err) {
        console.warn('Gemini research composition fallback:', err);
      }
    }

    // Localized Fallback Presentation
    return this.composeLocalizedFallbackPresentation(plan.topic, results, lang);
  }

  private static composeLocalizedFallbackPresentation(topic: string, results: ResearchResult[], lang: SupportedLanguage): string {
    const listItems = results
      .map((r, i) => `${i + 1}. **${r.contentType}** — [${r.title}](${r.url})\n   ${r.snippet}`)
      .join('\n\n');

    if (lang === 'ru') {
      return `Я нашел несколько полезных материалов на **JW.ORG** по теме «**${topic}**»:\n\n${listItems}\n\nКакой из этих материалов вы хотите открыть? Вы можете просто сказать, например: *«Покажи видео»* или *«Открой второй»*.`;
    }
    if (lang === 'hy') {
      return `Ես գտա մի քանի օգտակար նյութեր **JW.ORG** կայքում «**${topic}**» թեմայով:\n\n${listItems}\n\nՈ՞ր նյութն եք ցանկանում բացել: Կարող եք պարզապես ասել, օրինակ՝ *«Ցույց տու տեսանյութը»* կամ *«Բացիր երկրորդը»*:`;
    }
    if (lang === 'hi') {
      return `मुझे **JW.ORG** पर «**${topic}**» के बारे में कुछ उपयोगी सामग्री मिली है:\n\n${listItems}\n\nआप कौन सा लेख या वीडियो देखना चाहते हैं? आप बस कह सकते हैं: *«वीडियो दिखाओ»* या *«दूसरा खोलें»*।`;
    }
    if (lang === 'pa') {
      return `ਮੈਨੂੰ **JW.ORG** 'ਤੇ «**${topic}**» ਬਾਰੇ ਇਹ ਜਾਣਕਾਰੀ ਮਿਲੀ ਹੈ:\n\n${listItems}\n\nਤੁਸੀਂ ਕਿਹੜਾ ਲੇਖ ਜਾਂ ਵੀਡੀਓ ਦੇਖਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਤੁਸੀਂ ਆਖ ਸਕਦੇ ਹੋ: *«ਵੀਡੀਓ ਦਿਖਾਓ»* ਜਾਂ *«ਦੂਜਾ ਖੋਲ੍ਹੋ»*।`;
    }

    return `I found a few relevant resources on **JW.ORG** regarding "**${topic}**":\n\n${listItems}\n\nWhich one would you like to explore? You can simply say, for example, *"Show me the video"* or *"Open the second one"*!`;
  }

  private static generateFollowUpQuestions(lang: SupportedLanguage, result: ResearchResult, session: ResearchSession): string[] {
    if (lang === 'ru') {
      return ['Найди что-то похожее о мужестве', 'Есть ли видео на эту тему?', 'Найди статьи для молодежи'];
    }
    if (lang === 'hy') {
      return ['Գտիր նմանատիպ նյութ քաջության մասին', 'Կա՞ արդյոք տեսանյութ այս թեմայով', 'Գտիր նյութեր երիտասարդների համար'];
    }
    if (lang === 'hi') {
      return ['साहस के बारे में कुछ और खोजें', 'क्या इस विषय पर कोई वीडियो है?', 'युवाओं के लिए लेख खोजें'];
    }
    if (lang === 'pa') {
      return ['ਦਲੇਰੀ ਬਾਰੇ ਹੋਰ ਜਾਣਕਾਰੀ ਲੱਭੋ', 'ਕੀ ਇਸ ਵਿਸ਼ੇ \'ਤੇ ਕੋਈ ਵੀਡੀਓ ਹੈ?', 'ਨੌਜਵਾਨਾਂ ਲਈ ਲੇਖ ਲੱਭੋ'];
    }
    return ['Find something similar about courage', 'Can you find me a video about this?', 'Is there anything specifically for young people?'];
  }

  private static generateResearchFollowUps(lang: SupportedLanguage, plan: ResearchPlan, results: ResearchResult[]): string[] {
    const hasVideo = results.some((r) => r.contentType === 'Video');

    if (lang === 'ru') {
      const suggestions = ['Открой второй результат'];
      if (hasVideo) suggestions.unshift('Покажи видео');
      suggestions.push(`Найди материалы для молодежи о ${plan.topic}`);
      return suggestions;
    }
    if (lang === 'hy') {
      const suggestions = ['Բացիր երկրորդ արդյունքը'];
      if (hasVideo) suggestions.unshift('Ցույց տու տեսանյութը');
      suggestions.push(`Գտիր նյութեր երիտասարդների համար ${plan.topic} թեմայով`);
      return suggestions;
    }
    if (lang === 'hi') {
      const suggestions = ['दूसरा परिणाम खोलें'];
      if (hasVideo) suggestions.unshift('वीडियो दिखाओ');
      suggestions.push(`युवाओं के लिए ${plan.topic} के बारे में खोजें`);
      return suggestions;
    }
    if (lang === 'pa') {
      const suggestions = ['ਦੂਜਾ ਨਤੀਜਾ ਖੋਲ੍ਹੋ'];
      if (hasVideo) suggestions.unshift('ਵੀਡੀਓ ਦਿਖਾਓ');
      suggestions.push(`ਨੌਜਵਾਨਾਂ ਲਈ ${plan.topic} ਬਾਰੇ ਖੋਜੋ`);
      return suggestions;
    }

    const suggestions = ['Open the second one'];
    if (hasVideo) suggestions.unshift('Show me the video');
    suggestions.push(`Find something similar but about courage`);
    return suggestions;
  }
}
