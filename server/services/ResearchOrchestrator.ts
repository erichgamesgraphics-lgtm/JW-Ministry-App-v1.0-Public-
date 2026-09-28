import { JWOrgService } from './JWOrgService.js';
import { WOLService } from './WOLService.js';
import { LanguageService } from './LanguageService.js';
import { GoogleGenAI } from '@google/genai';
import type { SearchResult, ChatHistoryMessage } from './types.js';
import { SupportedLanguage } from '../../src/types.js';

export interface ResearchResult {
  answer: string;
  sources: SearchResult[];
  suggestedFollowUps: string[];
  orchestratorUsed: string;
}

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

export class ResearchOrchestrator {
  /**
   * Main entry point to orchestrate deep research across JW.ORG, WOL, Scriptures, and Gemini AI.
   */
  static async orchestrateResearch(
    message: string,
    _userContext: any,
    requestedLanguage: string = 'en',
    _conversationHistory: ChatHistoryMessage[] = []
  ): Promise<ResearchResult> {
    const detectedLang = LanguageService.detectLanguage(message, requestedLanguage);
    const targetLang: SupportedLanguage = detectedLang !== 'en' ? detectedLang : LanguageService.normalizeLanguage(requestedLanguage);

    const cleanQuery = LanguageService.cleanSearchQuery(message, targetLang);
    const scriptureMatch = LanguageService.extractScriptureReference(message);

    let sources: SearchResult[] = [];
    let answerParts: string[] = [];

    // 1. Scripture Reference Research
    if (scriptureMatch && scriptureMatch.isScripture) {
      const scriptureRef = scriptureMatch.rawReference;
      const langPath = targetLang === 'hy' ? 'hy' : targetLang === 'ru' ? 'ru' : targetLang === 'hi' ? 'hi' : targetLang === 'pa' ? 'pa' : 'en';
      const jwBibleUrl = `https://www.jw.org/${langPath}/library/bible/`;

      const relatedArticles = await JWOrgService.searchJWOrg(scriptureRef, targetLang);
      sources = [...relatedArticles];

      if (sources.length === 0) {
        const bibleTitle =
          targetLang === 'ru'
            ? `Священное Писание — Перевод нового мира (${scriptureRef})`
            : targetLang === 'hy'
            ? `Սուրբ Գրություններ. Նոր աշխարհ թարգմանություն (${scriptureRef})`
            : targetLang === 'hi'
            ? `पवित्र शास्त्र — नई दुनिया अनुवाद (${scriptureRef})`
            : targetLang === 'pa'
            ? `ਪਵਿੱਤਰ ਲਿਖਤਾਂ — ਨਵੀਂ ਦੁਨੀਆਂ ਅਨੁਵਾਦ (${scriptureRef})`
            : `New World Translation of the Holy Scriptures (${scriptureRef})`;

        sources.push({
          id: `jw-bible-${Date.now()}`,
          title: bibleTitle,
          snippet: `Read ${scriptureRef} online with cross-references, study notes, and parallel Bible translations on JW.ORG.`,
          url: jwBibleUrl,
          source: 'JW.ORG',
          publication: 'New World Translation',
          relevanceScore: 1.0,
        });
      }

      const bibleHeader =
        targetLang === 'hy'
          ? `📖 **Աստվածաշնչյան Համար՝ ${scriptureRef}**\n\nԴուք կարող եք կարդալ այս համարը և ուսումնասիրել դրա համատեքստը [JW.ORG Օնլայն Աստվածաշնչում](${jwBibleUrl})։`
          : targetLang === 'ru'
          ? `📖 **Стих из Библии: ${scriptureRef}**\n\nВы можете прочитать этот стих и контекст в [Онлайн-Библии на JW.ORG](${jwBibleUrl}), а также найти перекрестные ссылки и комментарии.`
          : targetLang === 'hi'
          ? `📖 **बाइबल वचन: ${scriptureRef}**\n\nआप इस वचन और इसके संदर्भ को [JW.ORG ऑनलाइन बाइबल](${jwBibleUrl}) में पढ़ सकते हैं।`
          : targetLang === 'pa'
          ? `📖 **ਬਾਈਬਲ ਹਵਾਲਾ: ${scriptureRef}**\n\nਤੁਸੀਂ ਇਸ ਹਵਾਲੇ ਨੂੰ [JW.ORG ਆਨਲਾਈਨ ਬਾਈਬਲ](${jwBibleUrl}) 'ਤੇ ਪੜ੍ਹ ਸਕਦੇ ਹੋ।`
          : `📖 **Bible Scripture: ${scriptureRef}**\n\nYou can read this scripture and its surrounding context in the [JW.ORG Online Bible (New World Translation)](${jwBibleUrl}), along with cross-references and study notes.`;

      answerParts.push(bibleHeader);
    } else {
      // 2. Parallel Search across JW.ORG and Watchtower Online Library (WOL)
      const [jwResults, wolResults] = await Promise.all([
        JWOrgService.searchJWOrg(cleanQuery, targetLang),
        WOLService.searchWOL(cleanQuery, targetLang),
      ]);

      sources = [...jwResults, ...wolResults].slice(0, 5);

      if (sources.length > 0) {
        const header =
          targetLang === 'hy'
            ? `Գտնվել են հետևյալ պաշտոնական հոդվածները **JW.ORG** և **WOL** կայքերում («**${cleanQuery}**» թեմայով):`
            : targetLang === 'ru'
            ? `На **JW.ORG** и в **Онлайн-библиотеке Сторожевой Башни** найдены следующие материалы по теме «**${cleanQuery}**»:`
            : targetLang === 'hi'
            ? `**JW.ORG** और **WOL** पर «**${cleanQuery}**» से संबंधित निम्नलिखित लेख मिले:`
            : targetLang === 'pa'
            ? `**JW.ORG** ਅਤੇ **WOL** 'ਤੇ «**${cleanQuery}**» ਸੰਬੰਧੀ ਹੇਠਾਂ ਦਿੱਤੇ ਲੇਖ ਮਿਲੇ:`
            : `Research results retrieved from **JW.ORG** and **Watchtower Online Library** for "**${cleanQuery}**":`;

        answerParts.push(header);

        const highlights = sources.map(s => {
          const scriptureNote = s.bibleVerses && s.bibleVerses.length > 0 ? ` (📖 ${s.bibleVerses.join(', ')})` : '';
          return `• **[${s.title}](${s.url})** *(${s.publication || s.source})*${scriptureNote}\n  ${s.snippet}`;
        }).join('\n\n');

        answerParts.push(highlights);
      } else {
        answerParts.push(LanguageService.getNoResultsMessage(cleanQuery, targetLang, 'JW.ORG'));
      }
    }

    // 3. Optional Gemini AI Synthesis for deep open-ended research queries
    const ai = getGeminiClient();
    if (ai) {
      try {
        const systemInstruction = `You are the Research Orchestrator for Jehovah's Witnesses Ministry Assistant.
Provide warm, biblically sound, encouraging, and informative research summaries based on Jehovah's Witnesses official publications, JW.ORG, Watchtower Online Library, and scripture teachings.
Keep formatting clean with clear markdown headings and bullet points. Always respond in language: ${targetLang}.`;

        let sourcesContext = '';
        if (sources.length > 0) {
          sourcesContext = '\nRetrieved Official Publications:\n' + sources.map(s => `- ${s.title}: ${s.snippet}`).join('\n');
        }

        const prompt = `User Research Query: "${message}"${sourcesContext}\nProvide a concise, encouraging, and well-structured answer.`;

        const responsePromise = ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { systemInstruction },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );

        const aiResponse = await Promise.race([responsePromise, timeoutPromise]);
        const rawText = (aiResponse as any)?.text;
        const text = typeof rawText === 'function' ? rawText() : (typeof rawText === 'string' ? rawText : '');

        if (text && text.trim().length > 30) {
          answerParts = [text.trim()];
        }
      } catch {
        // Fallback to retrieved publication search summary
      }
    }

    const suggestedFollowUps = LanguageService.getLocalizedSuggestions(targetLang, 'JW_SEARCH');

    return {
      answer: answerParts.join('\n\n'),
      sources,
      suggestedFollowUps,
      orchestratorUsed: 'Research Orchestrator (JW.ORG / WOL / Gemini)',
    };
  }
}
