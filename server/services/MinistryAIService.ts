import { GoogleGenAI } from '@google/genai';
import { MinistryAssistantRouter } from './MinistryAssistantRouter.js';
import { LanguageService } from './LanguageService.js';
import { MinistryAIRequestPayload, MinistryAIResponsePayload } from './types.js';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

export class MinistryAIService {
  /**
   * Main entry point to process a Ministry Assistant request
   * Combines open-ended Gemini AI reasoning with deterministic publisher data
   * and verified JW.ORG / WOL publication search results.
   */
  static async processRequest(payload: MinistryAIRequestPayload): Promise<MinistryAIResponsePayload> {
    const { message, userContext, language = 'en', conversationHistory = [] } = payload;

    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new Error('Message is required.');
    }

    const cleanMessage = message.trim();

    // 1. Always retrieve deterministic routing, publisher stats, and verified JW.ORG/WOL sources
    const routerResult = await MinistryAssistantRouter.handleRequest(
      cleanMessage,
      userContext,
      language,
      conversationHistory
    );

    const { primaryCategory, searchQuery } = MinistryAssistantRouter.classifyRequest(
      cleanMessage,
      LanguageService.normalizeLanguage(language),
      conversationHistory.some(m => m.sources && m.sources.length > 0)
    );

    // If request is purely for exact tracker statistics, return deterministic result immediately
    const isPureTrackerStat =
      primaryCategory === 'MINISTRY_HOURS' ||
      primaryCategory === 'MINISTRY_GOAL' ||
      primaryCategory === 'MINISTRY_HISTORY' ||
      primaryCategory === 'MINISTRY_SCHEDULE';

    if (isPureTrackerStat) {
      return routerResult;
    }

    // 2. For open-ended inquiries, research, encouragement, and topics:
    // Attempt to enhance response with Gemini if API key is configured
    const ai = getGeminiClient();
    if (ai) {
      try {
        const detectedLang = LanguageService.detectLanguage(cleanMessage, language);
        const targetLang = detectedLang !== 'en' ? detectedLang : LanguageService.normalizeLanguage(language);

        const systemInstruction = `You are the Ministry Assistant for Jehovah's Witnesses using the Ministry Tracker app.
Your role: Provide warm, faith-strengthening, biblically sound encouragement and practical assistance for Christian ministry, personal study, family worship, youth, handling anxiety/stress, developing patience, and improving preaching skills.
Guidelines:
- Ground your advice in principles from the Holy Scriptures (New World Translation).
- Reflect the sound teachings, publications, and practical ministry guidelines found on JW.ORG (such as Our Christian Life and Ministry Meeting Workbook, Watchtower, Awake!, and "Enjoy Life Forever!").
- Maintain a warm, humble, encouraging, and respectful tone.
- When answering questions about ministry, family worship, or spiritual topics, give clear, actionable, and comforting insights with relevant scriptures (e.g., Philippians 4:6, 7; Matthew 28:19, 20; Galatians 5:22, 23).
- If official articles are provided in the context, refer to their titles and core points naturally.
- Always respond in the requested language: ${targetLang} (English for 'en', Russian for 'ru', Armenian for 'hy', Hindi for 'hi', Punjabi for 'pa').
- Keep the formatting neat with markdown bullet points and clear paragraphs.`;

        // Prepare context about retrieved sources
        let sourcesSummary = '';
        if (routerResult.sources && routerResult.sources.length > 0) {
          sourcesSummary = `\n\nVerified JW.ORG / WOL Publications found for this query:\n` +
            routerResult.sources.map(s => `- Title: "${s.title}" (${s.publication || s.source}). Summary: ${s.snippet}${s.bibleVerses ? ` Key Verses: ${s.bibleVerses.join(', ')}` : ''}`).join('\n');
        }

        // Publisher context summary
        let publisherInfo = '';
        if (userContext) {
          publisherInfo = `\nPublisher context: Status: ${userContext.publisherStatus || 'publisher'}, Current Month Hours: ${userContext.currentMonthHours || 0}, Monthly Goal: ${userContext.goalHours || 0} hrs.`;
        }

        const prompt = `User query: "${cleanMessage}"${sourcesSummary}${publisherInfo}\n\nPlease provide a helpful, spiritually uplifting, and complete response.`;

        // Call Gemini with a timeout safeguard
        const responsePromise = ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction,
          },
        });

        // Set a 6-second timeout so app never hangs
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini timeout')), 6000)
        );

        const aiResponse = await Promise.race([responsePromise, timeoutPromise]);
        const candidateText = aiResponse.text?.();

        if (candidateText && candidateText.trim().length > 20) {
          return {
            answer: candidateText.trim(),
            sources: routerResult.sources,
            suggestedFollowUps: routerResult.suggestedFollowUps,
          };
        }
      } catch {
        // If Gemini call fails or times out, smoothly fall back to deterministic answer
      }
    }

    return routerResult;
  }
}

