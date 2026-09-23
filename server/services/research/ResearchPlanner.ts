import { GoogleGenAI, Type } from '@google/genai';
import { ContentType, ResearchPlan, ResearchSession } from './types.js';
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

export class ResearchPlanner {
  /**
   * Generates a ResearchPlan by combining Gemini LLM reasoning with semantic fallback
   */
  static async createPlan(
    message: string,
    session?: ResearchSession,
    languageStr: string = 'en'
  ): Promise<ResearchPlan> {
    const lang = LanguageService.normalizeLanguage(languageStr);
    const cleanMsg = message.trim();
    const lowerMsg = cleanMsg.toLowerCase();

    // First attempt Gemini AI planning if available
    const ai = getGeminiClient();
    if (ai) {
      try {
        const sessionContext = session
          ? `Active Research Session State:
- Original Topic: "${session.originalTopic}"
- Current Topic: "${session.currentTopic}"
- Number of Previous Results: ${session.results.length}
- Previous Results List: ${JSON.stringify(
              session.results.map((r, i) => ({
                index: i + 1,
                title: r.title,
                type: r.contentType,
                publication: r.publication,
              }))
            )}
- Active Filters: ${JSON.stringify(session.filters)}`
          : `No Active Research Session`;

        const prompt = `You are the Research Planner for Ministry AI (Jehovah's Witnesses research assistant).
Analyze the user's input and determine the exact research plan.

User Input: "${cleanMsg}"
Requested Language: ${lang}
${sessionContext}

Categorize the intent into one of these actionType values:
- "NEW_SEARCH": User asks a new research question (e.g. "Find me something about patience", "I need something useful for the ministry").
- "OPEN_RESULT": User asks to open or inspect a specific result from the previous research results (e.g. "Open the second one", "Show me the video", "Play the video", "Tell me more about article #1").
- "FILTER_RESULTS": User wants to filter existing research results (e.g. "I don't want an article", "Only show videos").
- "REFINE_SEARCH": User refines research with audience, date, etc. (e.g. "Is there anything specifically for young people?", "Find something newer").
- "CHANGE_TOPIC": User changes topic while preserving context (e.g. "Actually, find me something similar but about courage").
- "TRACKER_DATA": User asks for Ministry Tracker hours/stats (e.g. "How many hours do I have this month?").
- "GENERAL_TALK": Conversational greeting or non-research question.

Identify targetResultIndex (0-based) if user refers to a specific result index (e.g. "second one" -> 1).
Identify targetContentTypeReference ("Video", "Article", "Publication", "Bible") if user refers to a type from previous results (e.g. "show me the video").
Construct an optimized JW.ORG search query representing the core research concept.`;

        const responsePromise = ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                needsResearch: { type: Type.BOOLEAN },
                isAppTrackerQuery: { type: Type.BOOLEAN },
                actionType: { type: Type.STRING },
                topic: { type: Type.STRING },
                contentType: { type: Type.STRING },
                audience: { type: Type.STRING },
                datePreference: { type: Type.STRING },
                excludeTypes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                targetResultIndex: { type: Type.INTEGER },
                targetContentTypeReference: { type: Type.STRING },
                searchQuery: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: ['needsResearch', 'isAppTrackerQuery', 'actionType', 'topic', 'searchQuery', 'reason'],
            },
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Planner timeout')), 3500)
        );

        const aiRes = await Promise.race([responsePromise, timeoutPromise]);
        const text = aiRes.text;

        if (text) {
          const parsed = JSON.parse(text);
          return {
            needsResearch: Boolean(parsed.needsResearch),
            isAppTrackerQuery: Boolean(parsed.isAppTrackerQuery),
            actionType: (parsed.actionType as any) || 'NEW_SEARCH',
            source: parsed.needsResearch ? 'JW_ORG' : 'NONE',
            topic: parsed.topic || session?.currentTopic || cleanMsg,
            contentType: (parsed.contentType as ContentType) || undefined,
            audience: parsed.audience || undefined,
            datePreference: parsed.datePreference || undefined,
            excludeTypes: (parsed.excludeTypes as ContentType[]) || undefined,
            targetResultIndex: typeof parsed.targetResultIndex === 'number' && parsed.targetResultIndex >= 0 ? parsed.targetResultIndex : undefined,
            targetContentTypeReference: (parsed.targetContentTypeReference as ContentType) || undefined,
            language: lang,
            searchQuery: parsed.searchQuery || parsed.topic || cleanMsg,
            reason: parsed.reason || 'AI Gemini Plan',
          };
        }
      } catch (err) {
        console.warn('Gemini planner fallback to deterministic rules:', err);
      }
    }

    // Deterministic Rule-Based Fallback Planner
    return this.createFallbackPlan(cleanMsg, lowerMsg, session, lang);
  }

  /**
   * High-precision semantic rule fallback planner when Gemini is unavailable or times out
   */
  private static createFallbackPlan(
    cleanMsg: string,
    lowerMsg: string,
    session: ResearchSession | undefined,
    lang: SupportedLanguage
  ): ResearchPlan {
    // 1. Check for Ministry Tracker app stats query
    const isTracker =
      lowerMsg.includes('hour') ||
      lowerMsg.includes('goal') ||
      lowerMsg.includes('stats') ||
      lowerMsg.includes('report') ||
      lowerMsg.includes('history') ||
      lowerMsg.includes('часы') ||
      lowerMsg.includes('ժամ') ||
      lowerMsg.includes('घंटे') ||
      lowerMsg.includes('ਘੰਟੇ');

    if (isTracker && !lowerMsg.includes('video') && !lowerMsg.includes('article') && !lowerMsg.includes('find') && !lowerMsg.includes(' search')) {
      return {
        needsResearch: false,
        isAppTrackerQuery: true,
        actionType: 'TRACKER_DATA',
        source: 'NONE',
        topic: 'Ministry Statistics',
        language: lang,
        searchQuery: '',
        reason: 'User requested app tracker data',
      };
    }

    // 2. Check for reference to previous results (e.g. "Open the second one", "Show me the video", "the first article")
    const isAskingSecond = lowerMsg.includes('second') || lowerMsg.includes('2nd') || lowerMsg.includes('втор') || lowerMsg.includes('երկրորդ') || lowerMsg.includes('दूसरा') || lowerMsg.includes('ਦੂਜਾ');
    const isAskingFirst = lowerMsg.includes('first') || lowerMsg.includes('1st') || lowerMsg.includes('перв') || lowerMsg.includes('առաջին') || lowerMsg.includes('पहला') || lowerMsg.includes('ਪਹਿਲਾ');
    const isAskingThird = lowerMsg.includes('third') || lowerMsg.includes('3rd') || lowerMsg.includes('трет') || lowerMsg.includes('երրորդ') || lowerMsg.includes('तीसरा') || lowerMsg.includes('ਤੀਜਾ');

    const isAskingVideoRef = lowerMsg.includes('show me the video') || lowerMsg.includes('play the video') || lowerMsg.includes('the video') || lowerMsg.includes('покажи видео') || lowerMsg.includes('ցույց տու տեսանյութը') || lowerMsg.includes('वीडियो दिखाओ');
    const isAskingArticleRef = lowerMsg.includes('the article') || lowerMsg.includes('show me the article') || lowerMsg.includes('статью') || lowerMsg.includes('հոդվածը');

    if (session && session.results.length > 0) {
      if (isAskingSecond) {
        return {
          needsResearch: true,
          isAppTrackerQuery: false,
          actionType: 'OPEN_RESULT',
          source: 'JW_ORG',
          topic: session.currentTopic,
          targetResultIndex: 1,
          language: lang,
          searchQuery: session.lastSearchQuery || session.currentTopic,
          reason: 'User selected result #2 from research session',
        };
      }
      if (isAskingFirst) {
        return {
          needsResearch: true,
          isAppTrackerQuery: false,
          actionType: 'OPEN_RESULT',
          source: 'JW_ORG',
          topic: session.currentTopic,
          targetResultIndex: 0,
          language: lang,
          searchQuery: session.lastSearchQuery || session.currentTopic,
          reason: 'User selected result #1 from research session',
        };
      }
      if (isAskingThird) {
        return {
          needsResearch: true,
          isAppTrackerQuery: false,
          actionType: 'OPEN_RESULT',
          source: 'JW_ORG',
          topic: session.currentTopic,
          targetResultIndex: 2,
          language: lang,
          searchQuery: session.lastSearchQuery || session.currentTopic,
          reason: 'User selected result #3 from research session',
        };
      }
      if (isAskingVideoRef) {
        return {
          needsResearch: true,
          isAppTrackerQuery: false,
          actionType: 'OPEN_RESULT',
          source: 'JW_ORG',
          topic: session.currentTopic,
          targetContentTypeReference: 'Video',
          language: lang,
          searchQuery: session.lastSearchQuery || session.currentTopic,
          reason: 'User requested the video from research session',
        };
      }
      if (isAskingArticleRef) {
        return {
          needsResearch: true,
          isAppTrackerQuery: false,
          actionType: 'OPEN_RESULT',
          source: 'JW_ORG',
          topic: session.currentTopic,
          targetContentTypeReference: 'Article',
          language: lang,
          searchQuery: session.lastSearchQuery || session.currentTopic,
          reason: 'User requested the article from research session',
        };
      }
    }

    // 3. Check for exclusions or content type filters ("I don't want an article", "Only show videos")
    const excludeArticle = lowerMsg.includes("don't want an article") || lowerMsg.includes('no article') || lowerMsg.includes('без статей') || lowerMsg.includes('не хочу статью');
    const wantVideo = lowerMsg.includes('video') || lowerMsg.includes('видео') || lowerMsg.includes('տեսանյութ') || lowerMsg.includes('वीडियो') || lowerMsg.includes('ਵੀਡੀਓ');

    if (excludeArticle) {
      return {
        needsResearch: true,
        isAppTrackerQuery: false,
        actionType: session ? 'FILTER_RESULTS' : 'NEW_SEARCH',
        source: 'JW_ORG',
        topic: session?.currentTopic || cleanMsg,
        contentType: wantVideo ? 'Video' : undefined,
        excludeTypes: ['Article'],
        language: lang,
        searchQuery: (session?.currentTopic || cleanMsg) + (wantVideo ? ' video' : ''),
        reason: 'User excluded articles and requested non-article or video content',
      };
    }

    // 4. Check for topic shift ("Actually, find me something similar but about courage")
    const isTopicShift = lowerMsg.includes('about') || lowerMsg.includes('similar') || lowerMsg.includes('похожее') || lowerMsg.includes('о чем-то другом') || lowerMsg.includes('մեկ ուրիշ');
    if (session && isTopicShift) {
      const extractedTopic = this.extractTopic(cleanMsg) || cleanMsg;
      return {
        needsResearch: true,
        isAppTrackerQuery: false,
        actionType: 'CHANGE_TOPIC',
        source: 'JW_ORG',
        topic: extractedTopic,
        contentType: wantVideo ? 'Video' : undefined,
        language: lang,
        searchQuery: extractedTopic + (wantVideo ? ' video' : ''),
        reason: `User shifted research topic to "${extractedTopic}"`,
      };
    }

    // 5. Check for audience ("specifically for young people", "for youth")
    const isYouth = lowerMsg.includes('young') || lowerMsg.includes('youth') || lowerMsg.includes('teen') || lowerMsg.includes('молодеж') || lowerMsg.includes('подрост') || lowerMsg.includes('երիտասարդ') || lowerMsg.includes('युवा') || lowerMsg.includes('ਨੌਜਵਾਨ');

    // 6. Check for date preference ("something newer", "recent")
    const isNewer = lowerMsg.includes('newer') || lowerMsg.includes('recent') || lowerMsg.includes('новое') || lowerMsg.includes('свежее') || lowerMsg.includes('նոր');

    const topic = this.extractTopic(cleanMsg) || (session ? session.currentTopic : cleanMsg);

    return {
      needsResearch: true,
      isAppTrackerQuery: false,
      actionType: session ? 'REFINE_SEARCH' : 'NEW_SEARCH',
      source: 'JW_ORG',
      topic,
      contentType: wantVideo ? 'Video' : undefined,
      audience: isYouth ? 'young_people' : undefined,
      datePreference: isNewer ? 'newer' : undefined,
      language: lang,
      searchQuery: `${topic}${isYouth ? ' young people youth' : ''}${wantVideo ? ' video' : ''}`,
      reason: 'Natural conversational research request',
    };
  }

  private static extractTopic(msg: string): string {
    const lower = msg.toLowerCase();
    const patterns = [
      /about\s+([a-z0-9\s]+)/i,
      /о\s+([а-я0-9\s]+)/i,
      /об\s+([а-я0-9\s]+)/i,
      /մասին\s+([ա-ֆ0-9\s]+)/i,
      /կապված\s+([ա-ֆ0-9\s]+)/i,
      /के बारे में\s+([a-z0-9\s]+)/i,
    ];

    for (const pat of patterns) {
      const match = msg.match(pat);
      if (match && match[1]) {
        return match[1].replace(/video|article|show me|find me|can you|please/gi, '').trim();
      }
    }

    return msg.replace(/find me|can you find me|i need|something about|a video about|an article about|show me/gi, '').trim();
  }
}
