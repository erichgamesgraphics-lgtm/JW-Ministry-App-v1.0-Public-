import { GoogleGenAI } from '@google/genai';
import { MinistryAssistantRouter } from './MinistryAssistantRouter.js';
import { LanguageService } from './LanguageService.js';
import { JWOrgService } from './JWOrgService.js';
import { WOLService } from './WOLService.js';
import { MinistryAIRequestPayload, MinistryAIResponsePayload, SearchResult } from './types.js';
import { SupportedLanguage } from '../../src/types.js';

export type AIRequestCategory = 'APP_DATA' | 'JW_RESEARCH' | 'COMBINED' | 'GENERAL';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export class MinistryAIService {
  /**
   * Main entry point to process a Ministry Assistant request
   * Implements the Hybrid Ministry AI Architecture:
   * - Native AI = Authoritative Source for Ministry Tracker App Data
   * - Gemini AI = Research Engine for JW.ORG / WOL.JW.ORG Publications
   * - AI Orchestrator routes to APP_DATA, JW_RESEARCH, COMBINED, or GENERAL
   */
  static async processRequest(payload: MinistryAIRequestPayload): Promise<MinistryAIResponsePayload> {
    const startTime = Date.now();
    const { message, userContext, language = 'en', conversationHistory = [] } = payload;

    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new Error('Message is required.');
    }

    const cleanMessage = message.trim();

    // 1. Language Detection & Normalization
    const detectedLang = LanguageService.detectLanguage(cleanMessage, language);
    const targetLang: SupportedLanguage = detectedLang !== 'en' ? detectedLang : LanguageService.normalizeLanguage(language);

    console.log(`[Ministry AI] Request received: "${cleanMessage.slice(0, 60)}${cleanMessage.length > 60 ? '...' : ''}"`);
    console.log(`[Ministry AI] Language detected: ${targetLang} (requested: ${language})`);

    // 2. Classify intent via router classification
    const hasPreviousResults = conversationHistory.some(m => m.sources && m.sources.length > 0);
    const { primaryCategory, isCombined, searchQuery } = MinistryAssistantRouter.classifyRequest(
      cleanMessage,
      targetLang,
      hasPreviousResults
    );

    // Map primaryCategory to AIRequestCategory
    let category: AIRequestCategory = 'GENERAL';

    const isPureTrackerStat =
      primaryCategory === 'MINISTRY_HOURS' ||
      primaryCategory === 'MINISTRY_GOAL' ||
      primaryCategory === 'MINISTRY_HISTORY' ||
      primaryCategory === 'MINISTRY_SCHEDULE' ||
      primaryCategory === 'MINISTRY_PROGRESS';

    if (isCombined) {
      category = 'COMBINED';
    } else if (isPureTrackerStat) {
      category = 'APP_DATA';
    } else if (
      primaryCategory === 'JW_SEARCH' ||
      primaryCategory === 'WOL_SEARCH' ||
      primaryCategory === 'BIBLE_SEARCH' ||
      primaryCategory === 'MINISTRY_TIPS' ||
      primaryCategory === 'FOLLOW_UP'
    ) {
      category = 'JW_RESEARCH';
    } else {
      category = 'GENERAL';
    }

    console.log(`[Ministry AI] Request classification: ${category} (Primary category: ${primaryCategory})`);

    // 3. EXECUTION PATHS

    // PATH A: Pure App Data Request -> Native Ministry AI only (Gemini is NEVER invoked)
    if (category === 'APP_DATA') {
      console.log(`[Ministry AI] Execution path: NATIVE_ONLY (Pure App Data query)`);
      const routerResult = await MinistryAssistantRouter.handleRequest(
        cleanMessage,
        userContext,
        targetLang,
        conversationHistory
      );
      console.log(`[Ministry AI] Request completed in ${Date.now() - startTime}ms`);
      return routerResult;
    }

    // PATH B: JW Research / Combined / General -> Perform JW.ORG & WOL search
    console.log(`[Ministry AI] Execution path: HYBRID_RESEARCH (Searching JW.ORG & WOL.JW.ORG)...`);
    let sources: SearchResult[] = [];

    if (primaryCategory === 'BIBLE_SEARCH') {
      const scriptureMatch = LanguageService.extractScriptureReference(cleanMessage);
      const scriptureRef = scriptureMatch ? scriptureMatch.rawReference : searchQuery;
      const related = await JWOrgService.searchJWOrg(scriptureRef, targetLang);
      sources = [...related];
    } else if (primaryCategory === 'WOL_SEARCH') {
      sources = await WOLService.searchWOL(searchQuery, targetLang);
    } else {
      const [jwRes, wolRes] = await Promise.all([
        JWOrgService.searchJWOrg(searchQuery, targetLang),
        WOLService.searchWOL(searchQuery, targetLang),
      ]);
      sources = [...jwRes, ...wolRes].slice(0, 4);
    }

    console.log(`[Ministry AI] Found ${sources.length} sources from JW.ORG / WOL.JW.ORG for query "${searchQuery}"`);

    // Retrieve Native AI router response as base/fallback
    const nativeResult = await MinistryAssistantRouter.handleRequest(
      cleanMessage,
      userContext,
      targetLang,
      conversationHistory
    );

    // 4. Gemini AI Enhancement (if key available)
    const ai = getGeminiClient();

    if (!ai) {
      console.log(`[Ministry AI] GEMINI_API_KEY not set. Returning Native AI response with retrieved sources.`);
      return {
        answer: nativeResult.answer,
        sources: sources.length > 0 ? sources : nativeResult.sources,
        suggestedFollowUps: nativeResult.suggestedFollowUps,
      };
    }

    // Prepare Gemini Prompt & Constraints
    try {
      console.log(`[Ministry AI] Invoking Gemini API with model gemini-3.8-flash...`);

      const systemInstruction = `You are the specialized Ministry Assistant for Jehovah's Witnesses using the Ministry Tracker application.

CRITICAL RULES & SAFETY BOUNDARIES:
1. SOURCE RESTRICTION: You MUST ONLY refer to and synthesize official Jehovah's Witnesses publications, articles, and scriptures from JW.ORG (https://www.jw.org/) and Watchtower Online Library (https://wol.jw.org/). Do NOT use general web sources, external blogs, forums, or non-JW commentary.
2. NO APP DATA FABRICATION: You MUST NEVER invent or fabricate app tracker statistics (such as hours, goals, return visits, or Bible study counts). Use ONLY the exact publisher context numbers provided in the prompt.
3. FAITHFUL & ENCOURAGING TONE: Maintain a warm, encouraging, humble, and biblically sound tone based on the New World Translation of the Holy Scriptures.
4. CITATIONS & TRANSPARENCY: Mention official article titles, publications, and scriptures naturally (e.g., The Watchtower, Awake!, Enjoy Life Forever!, Our Christian Life and Ministry Meeting Workbook).
5. NO RELEVANT SOURCES FOUND: If no relevant official publications are found in the provided search context, state politely in ${targetLang} that no specific official publication was found on JW.ORG/WOL.JW.ORG. Do NOT invent unverified answers.
6. TARGET LANGUAGE: Respond strictly in language code: ${targetLang} (en = English, ru = Russian, hy = Armenian, hi = Hindi, pa = Punjabi).
7. NEAT FORMATTING: Format your response clearly with markdown bullet points and short paragraphs.`;

      // Extract MINIMAL user context for privacy guard (never send raw notes or personal addresses)
      let minimalContextInfo = '';
      if (userContext && (category === 'COMBINED' || category === 'APP_DATA')) {
        const stats = userContext.stats || {};
        const settings = userContext.settings || {};
        const goal = stats.goalHours || settings.monthlyGoal || 0;
        const current = stats.currentMonthHours || 0;
        const remaining = Math.max(0, goal - current);
        minimalContextInfo = `\n\nPublisher Tracker Context:\n- Status: ${stats.publisherStatus || settings.publisherStatus || 'Publisher'}\n- Current Month Hours: ${current}h\n- Monthly Goal: ${goal}h\n- Remaining Hours to Goal: ${remaining}h`;
      }

      // Format retrieved JW sources for Gemini prompt
      let sourcesPromptContext = '';
      if (sources.length > 0) {
        sourcesPromptContext = `\n\nVerified JW.ORG & WOL.JW.ORG Articles retrieved for this query:\n` +
          sources.map(s => `- Title: "${s.title}" (${s.publication || s.source})\n  URL: ${s.url}\n  Summary: ${s.snippet}${s.bibleVerses ? `\n  Key Verses: ${s.bibleVerses.join(', ')}` : ''}`).join('\n');
      }

      const fullPrompt = `User Message: "${cleanMessage}"${minimalContextInfo}${sourcesPromptContext}\n\nPlease provide a warm, spiritually uplifting, and complete response in ${targetLang}.`;

      // Attempt Gemini API call with 1 retry on failure & timeout safeguard
      let candidateText: string | null = null;
      let attempts = 0;

      while (attempts < 2 && !candidateText) {
        attempts++;
        try {
          console.log(`[Ministry AI] Gemini API Call Attempt #${attempts}...`);

          const generatePromise = ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: fullPrompt,
            config: {
              systemInstruction,
              temperature: 0.4,
            },
          });

          // 7-second timeout safeguard
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Gemini API timeout after 7000ms')), 7000)
          );

          const aiResponse = await Promise.race([generatePromise, timeoutPromise]);
          const responseText = aiResponse.text; // Note: getter property

          if (typeof responseText === 'string' && responseText.trim().length > 15) {
            candidateText = responseText.trim();
          }
        } catch (callErr: any) {
          console.warn(`[Ministry AI] Gemini API call attempt #${attempts} failed: ${callErr?.message || callErr}`);
          if (attempts < 2) {
            await new Promise(res => setTimeout(res, 500)); // Wait 500ms before retry
          }
        }
      }

      if (candidateText) {
        console.log(`[Ministry AI] Gemini response successfully generated! (${candidateText.length} chars)`);
        console.log(`[Ministry AI] Request completed in ${Date.now() - startTime}ms`);

        return {
          answer: candidateText,
          sources: sources.length > 0 ? sources : nativeResult.sources,
          suggestedFollowUps: nativeResult.suggestedFollowUps,
        };
      } else {
        console.warn(`[Ministry AI] Gemini failed after ${attempts} attempts. Falling back to Native AI.`);
      }
    } catch (err: any) {
      console.warn(`[Ministry AI] Exception during Gemini processing: ${err?.message || err}. Falling back to Native AI.`);
    }

    // 5. Fallback Response (Native AI + Retrieved Sources)
    console.log(`[Ministry AI] Returning Native AI response fallback. Duration: ${Date.now() - startTime}ms`);
    return {
      answer: nativeResult.answer,
      sources: sources.length > 0 ? sources : nativeResult.sources,
      suggestedFollowUps: nativeResult.suggestedFollowUps,
    };
  }
}


