import { GoogleGenAI } from '@google/genai';
import { JWOrgService, JWSourceResult } from './JWOrgService.ts';
import { WOLService } from './WOLService.ts';
import {
  LanguageIntelligence,
  SupportedLanguage,
  AnalyzedMinistryQuery,
} from './LanguageIntelligence.ts';

export interface MinistryAnalyticsSummary {
  monthName: string;
  publisherStatus: string;
  goalHours: number;
  completedHours: number;
  completedMinutesTotal: number;
  remainingHours: number;
  progressPercentage: number;
  daysRemainingInMonth: number;
  hoursPerRemainingDayNeeded: number;
  returnVisitsThisMonth: number;
  bibleStudiesThisMonth: number;
  placementsThisMonth: number;
  videoShowingsThisMonth: number;
  totalEntriesThisMonth: number;
  recentEntriesSummary?: string;
  scheduledMinistrySummary?: string;
  historicalStreakMonths?: number;
}

export interface MinistryAIMessagePayload {
  question: string;
  language: SupportedLanguage;
  analytics?: MinistryAnalyticsSummary;
}

export interface MinistryAIResponse {
  answer: string;
  intent: 'MINISTRY_PROGRESS' | 'JW_RESEARCH' | 'HYBRID';
  sources: JWSourceResult[];
  status: 'success' | 'no_sources' | 'error';
  detectedTopic?: string;
}

// Lazy Gemini client initialization
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      geminiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return geminiClient;
}

/**
 * Executes a Gemini prompt with automatic model fallback and retries
 * (Handles transient 503 unavailable spikes gracefully)
 */
async function callGeminiWithFallback(
  prompt: string,
  isJson = false
): Promise<{ text: string; model: string } | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: isJson ? { responseMimeType: 'application/json' } : undefined,
        });
        const text = response.text?.trim();
        if (text) {
          return { text, model };
        }
      } catch (err: any) {
        // Retry on 503 or 429
        if (attempt < 2 && (err?.status === 503 || err?.status === 429)) {
          await new Promise((r) => setTimeout(r, 450 * attempt));
          continue;
        }
      }
    }
  }
  return null;
}

export class MinistryAIService {
  /**
   * Main entry point for processing user questions with direct multilingual reasoning
   */
  static async processQuestion(payload: MinistryAIMessagePayload): Promise<MinistryAIResponse> {
    const lang = LanguageIntelligence.normalizeLanguage(payload.language);
    const langMeta = LanguageIntelligence.getMeta(lang);
    const question = payload.question.trim();

    // Step 1: Language-Aware Understanding and Query Generation BEFORE searching
    const analysis = await this.analyzeQuestionInLanguage(question, lang, payload.analytics);

    // Step 2: Route according to detected intention
    if (analysis.intent === 'MINISTRY_PROGRESS') {
      return this.handleMinistryProgress(question, lang, analysis, payload.analytics);
    } else if (analysis.intent === 'HYBRID') {
      return this.handleHybrid(question, lang, analysis, payload.analytics);
    } else {
      return this.handleJWResearch(question, lang, analysis);
    }
  }

  /**
   * Step 1: Understand question directly in the target language (no English-first assumption)
   */
  private static async analyzeQuestionInLanguage(
    question: string,
    lang: SupportedLanguage,
    analytics?: MinistryAnalyticsSummary
  ): Promise<AnalyzedMinistryQuery> {
    // 1. Run local deterministic language analyzer first for baseline & rapid response
    const localBaseline = LanguageIntelligence.analyzeLocally(question, lang);

    // If tracker data is present and local confidence is high for progress, fast path
    if (analytics && localBaseline.intent === 'MINISTRY_PROGRESS' && localBaseline.confidence >= 0.9) {
      return localBaseline;
    }

    const langMeta = LanguageIntelligence.getMeta(lang);

    // 2. Request Gemini to analyze directly in the target language
    const prompt = `
You are the native language reasoning engine for "Ministry AI", an assistant for Jehovah's Witnesses in Christian ministry.
The active application language is strictly: ${langMeta.name} (${langMeta.code}, script: ${langMeta.scriptDescription}).
User Question: "${question}"

CRITICAL MANDATES:
1. Understand and reason directly in ${langMeta.name}. DO NOT translate the user's question to English before understanding.
2. Context: The user is in Christian ministry (house-to-house, preaching, cart witnessing, return visits, Bible studies) or tracking their ministry progress/hours.
3. Determine Intention:
   - "MINISTRY_PROGRESS": If the user is asking about their own ministry hours, goal, report, remaining hours, pacing, return visits, or Bible studies in the app tracker.
   - "JW_RESEARCH": If the user is asking a Bible topic (e.g. suffering, God's Kingdom, prayer, resurrection/death, hope, who Jehovah is, marriage, starting a Bible study, what to say to a householder) or seeking published material from JW.ORG or WOL.JW.ORG.
   - "HYBRID": If the question involves both their personal tracker hours AND a biblical/preaching research topic.
4. Formulate Search Queries:
   - "primarySearchQuery": 2 to 4 clean, focused keywords written NATIVELY in ${langMeta.name} (NO punctuation, NO question marks). Examples:
     * Armenian: "սկսել Աստվածաշնչի ուսումնասիրություն" or "ինչու է Աստված թույլ տալիս տառապանքը"
     * Russian: "начать изучение Библии" or "почему Бог допускает страдания"
     * Hindi: "बाइबल अध्ययन कैसे शुरू करें" or "परमेश्वर दुख-तकलीफों की अनुमति क्यों देता है"
     * Punjabi: "ਬਾਈਬਲ ਸਟੱਡੀ ਕਿਵੇਂ ਸ਼ੁਰੂ ਕਰੀਏ" or "ਰੱਬ ਦੁੱਖ-ਤਕਲੀਫ਼ਾਂ ਕਿਉਂ ਆਉਣ ਦਿੰਦਾ ਹੈ"
     * English: "how to start Bible study" or "why does God allow suffering"
   - "broaderSearchQuery": 1 to 2 core subject keywords in ${langMeta.name}.
   - "englishFallbackQuery": 2 to 3 English keywords (used ONLY if 0 publications exist in ${langMeta.name}).
   - "topic": A concise 2 to 5 word summary in ${langMeta.name}.
   - "wantsWOL": boolean, true if the user specifically asked for Watchtower Online Library (WOL).

Return STRICT JSON:
{
  "intent": "MINISTRY_PROGRESS" | "JW_RESEARCH" | "HYBRID",
  "topic": "string in ${langMeta.name}",
  "primarySearchQuery": "string in ${langMeta.name}",
  "broaderSearchQuery": "string in ${langMeta.name}",
  "englishFallbackQuery": "string in English",
  "wantsWOL": boolean
}
`;

    try {
      const result = await callGeminiWithFallback(prompt, true);
      if (result && result.text) {
        const parsed = JSON.parse(result.text);
        if (parsed.intent && parsed.primarySearchQuery) {
          return {
            language: lang,
            intent: parsed.intent,
            topic: parsed.topic || localBaseline.topic,
            primarySearchQuery: parsed.primarySearchQuery.trim(),
            broaderSearchQuery: parsed.broaderSearchQuery?.trim() || localBaseline.broaderSearchQuery,
            englishFallbackQuery: parsed.englishFallbackQuery?.trim() || localBaseline.englishFallbackQuery,
            wantsWOL: Boolean(parsed.wantsWOL || localBaseline.wantsWOL),
            confidence: 0.95,
          };
        }
      }
    } catch (err) {
      console.warn('Language reasoning with Gemini skipped, using deterministic language baseline:', err);
    }

    return localBaseline;
  }

  /**
   * Mode 1: Ministry Progress Analysis in Target Language
   */
  private static async handleMinistryProgress(
    question: string,
    lang: SupportedLanguage,
    analysis: AnalyzedMinistryQuery,
    analytics?: MinistryAnalyticsSummary
  ): Promise<MinistryAIResponse> {
    if (!analytics) {
      return {
        answer: LanguageIntelligence.getNoSourcesMessage(
          lang,
          analysis.topic || 'Ministry Analytics'
        ),
        intent: 'MINISTRY_PROGRESS',
        sources: [],
        status: 'success',
        detectedTopic: analysis.topic,
      };
    }

    const langMeta = LanguageIntelligence.getMeta(lang);
    const encouragement = LanguageIntelligence.getEncouragementScripture(lang);

    const prompt = `
You are "Ministry AI", a warm, encouraging, respectful Christian ministry assistant for Jehovah's Witnesses using the Ministry Tracker app.
The user is asking about their personal ministry progress and hours for the current month.

ACTIVE APP LANGUAGE: ${langMeta.name} (${langMeta.code}).
YOU MUST RESPOND 100% IN ${langMeta.name}. DO NOT MIX LANGUAGES. NEVER RESPOND IN ENGLISH UNLESS THE APP IS IN ENGLISH.

User Question: "${question}"

Actual Stored Tracker Data for this month (${analytics.monthName}):
- Publisher Status: ${analytics.publisherStatus}
- Monthly Goal: ${analytics.goalHours} hours
- Completed Hours: ${analytics.completedHours.toFixed(1)} hours (${analytics.completedMinutesTotal} minutes)
- Remaining Hours to Goal: ${analytics.remainingHours.toFixed(1)} hours
- Progress: ${analytics.progressPercentage}%
- Days Remaining in Month: ${analytics.daysRemainingInMonth} days
- Daily Pacing Needed: ${analytics.hoursPerRemainingDayNeeded > 0 ? analytics.hoursPerRemainingDayNeeded.toFixed(1) + ' hours/day' : 'Goal reached!'}
- Return Visits: ${analytics.returnVisitsThisMonth}
- Bible Studies: ${analytics.bibleStudiesThisMonth}
- Placements (literature/videos): ${analytics.placementsThisMonth + analytics.videoShowingsThisMonth}
- Total Recorded Sessions: ${analytics.totalEntriesThisMonth}
${analytics.scheduledMinistrySummary ? `- Scheduled Ministry Ahead: ${analytics.scheduledMinistrySummary}` : ''}
${analytics.recentEntriesSummary ? `- Recent Activity: ${analytics.recentEntriesSummary}` : ''}
${analytics.historicalStreakMonths ? `- Consistent Service Streak: ${analytics.historicalStreakMonths} months` : ''}

INSTRUCTIONS:
1. Formulate your entire answer directly in ${langMeta.name}.
2. Answer the question directly with clear, exact numbers from the data above.
3. Be warm, kind, realistic, and spiritually uplifting (commend them for whole-souled service).
4. If hours remain, provide practical schedule pacing for the remaining days.
5. If goal is reached, commend them enthusiastically.
6. Include the encouragement scripture: "${encouragement.text}" (${encouragement.reference}).
7. Keep the tone friendly, humble, and concise (2-4 paragraphs or crisp bullet points).
8. Do NOT mention internal code, databases, or API keys.
`;

    const geminiRes = await callGeminiWithFallback(prompt, false);
    if (geminiRes && geminiRes.text) {
      return {
        answer: geminiRes.text,
        intent: 'MINISTRY_PROGRESS',
        sources: [],
        status: 'success',
        detectedTopic: analysis.topic,
      };
    }

    // Deterministic localized fallback
    const fallbackAnswer = this.buildStructuredProgressSummary(analytics, lang);
    return {
      answer: fallbackAnswer,
      intent: 'MINISTRY_PROGRESS',
      sources: [],
      status: 'success',
      detectedTopic: analysis.topic,
    };
  }

  /**
   * Mode 2: JW Research (JW.ORG & WOL.JW.ORG) with Native Language Search & Grounded Synthesis
   */
  private static async handleJWResearch(
    question: string,
    lang: SupportedLanguage,
    analysis: AnalyzedMinistryQuery
  ): Promise<MinistryAIResponse> {
    const langMeta = LanguageIntelligence.getMeta(lang);

    // 1. Search JW.ORG / WOL.JW.ORG in the target language
    let sources: JWSourceResult[] = [];
    try {
      if (analysis.wantsWOL) {
        sources = await WOLService.searchWOL(
          analysis.primarySearchQuery,
          lang,
          6,
          analysis.englishFallbackQuery
        );
      } else {
        const searchRes = await JWOrgService.search(
          analysis.primarySearchQuery,
          lang,
          6,
          analysis.englishFallbackQuery
        );
        sources = searchRes.results;
      }

      // If primary query had 0 results, retry with broader query in that language
      if (sources.length === 0 && analysis.broaderSearchQuery && analysis.broaderSearchQuery !== analysis.primarySearchQuery) {
        const retryRes = await JWOrgService.search(
          analysis.broaderSearchQuery,
          lang,
          6,
          analysis.englishFallbackQuery
        );
        sources = retryRes.results;
      }
    } catch (searchError) {
      console.error('Search error for language:', lang, searchError);
      return {
        answer: LanguageIntelligence.getServiceErrorMessage(lang),
        intent: 'JW_RESEARCH',
        sources: [],
        status: 'error',
        detectedTopic: analysis.topic,
      };
    }

    // If still 0 sources found
    if (!sources || sources.length === 0) {
      return {
        answer: LanguageIntelligence.getNoSourcesMessage(lang, analysis.topic || question),
        intent: 'JW_RESEARCH',
        sources: [],
        status: 'no_sources',
        detectedTopic: analysis.topic,
      };
    }

    // 2. Synthesize Grounded Answer in User's Selected Language
    const sourcesContext = sources
      .map(
        (s, idx) =>
          `[Source ${idx + 1}] Title: "${s.title}" (${s.source}${s.context ? ' - ' + s.context : ''})\nSummary/Snippet: ${s.summary}\nScriptures Mentioned: ${s.scripture || 'None'}\nURL: ${s.url}`
      )
      .join('\n\n');

    const prompt = `
You are "Ministry AI", an assistant helping a publisher in the Christian ministry prepare to share Bible-based truths in field service, cart witnessing, return visits, or Bible studies.
The user asked: "${question}"
Identified Ministry Topic: "${analysis.topic}"

ACTIVE APP LANGUAGE: ${langMeta.name} (${langMeta.code}).
YOU MUST RESPOND 100% IN ${langMeta.name}. DO NOT MIX LANGUAGES. NEVER RESPOND IN ENGLISH UNLESS THE APP IS IN ENGLISH.

Here are the REAL, verified articles retrieved from JW.ORG and WOL.JW.ORG:
${sourcesContext}

INSTRUCTIONS:
1. Ground your answer strictly in the retrieved source articles above.
2. Provide a concise, practical answer that the user can immediately use at the door or during a conversation:
   - What the Bible and published articles teach on this question.
   - 1 to 2 key scriptures to read or reference from the articles.
   - A tactful, kind conversational question or thought to share with a householder.
3. Mention the relevant article titles by name in quotes (e.g. «${sources[0].title}») so the publisher knows which published material to offer or show on JW.ORG / JW Library.
4. Keep the response organized, respectful, clear, and easy to read on a mobile device (use short paragraphs or bullet points).
5. NEVER invent scriptures, fake article titles, or make up claims not supported by the sources.
6. Provide a 1-sentence relevance explanation for why each article is valuable for this question.
`;

    const geminiRes = await callGeminiWithFallback(prompt, false);
    if (geminiRes && geminiRes.text) {
      // Enrich top sources with relevance explanation in target language
      const enrichedSources = this.enrichSourcesWithRelevance(sources, analysis.topic, lang);
      return {
        answer: geminiRes.text,
        intent: 'JW_RESEARCH',
        sources: enrichedSources,
        status: 'success',
        detectedTopic: analysis.topic,
      };
    }

    // Deterministic fallback if Gemini is offline/quota
    const fallbackAnswer = this.buildStructuredResearchSummary(analysis.topic || question, sources, lang);
    const enrichedSources = this.enrichSourcesWithRelevance(sources, analysis.topic, lang);
    return {
      answer: fallbackAnswer,
      intent: 'JW_RESEARCH',
      sources: enrichedSources,
      status: 'success',
      detectedTopic: analysis.topic,
    };
  }

  /**
   * Mode 3: Hybrid (Progress + Research)
   */
  private static async handleHybrid(
    question: string,
    lang: SupportedLanguage,
    analysis: AnalyzedMinistryQuery,
    analytics?: MinistryAnalyticsSummary
  ): Promise<MinistryAIResponse> {
    const research = await this.handleJWResearch(question, lang, analysis);
    let progressNote = '';

    if (analytics) {
      if (lang === 'ru') {
        progressNote = `\n\n📊 **Ваш отчет за ${analytics.monthName}:** Вы посвятили **${analytics.completedHours.toFixed(1)} ч** из цели **${analytics.goalHours} ч** (${analytics.progressPercentage}%). До конца месяца осталось ${analytics.daysRemainingInMonth} дн.`;
      } else if (lang === 'hy') {
        progressNote = `\n\n📊 **Ձեր հաշվետվությունը ${analytics.monthName}-ի համար.** Դուք ծառայել եք **${analytics.completedHours.toFixed(1)} ժ** նպատակային **${analytics.goalHours} ժ**-ից (${analytics.progressPercentage}%): Ամսվա ավարտին մնացել է ${analytics.daysRemainingInMonth} օր:`;
      } else if (lang === 'hi') {
        progressNote = `\n\n📊 **${analytics.monthName} के लिए आपकी प्रगति:** आपने **${analytics.goalHours} घंटे** के लक्ष्य में से **${analytics.completedHours.toFixed(1)} घंटे** पूरे किए हैं (${analytics.progressPercentage}%)। महीने में ${analytics.daysRemainingInMonth} दिन बाकी हैं।`;
      } else if (lang === 'pa') {
        progressNote = `\n\n📊 **${analytics.monthName} ਲਈ ਤੁਹਾਡੀ ਤਰੱਕੀ:** ਤੁਸੀਂ **${analytics.goalHours} ਘੰਟੇ** ਦੇ ਟੀਚੇ ਵਿੱਚੋਂ **${analytics.completedHours.toFixed(1)} ਘੰਟੇ** ਪੂਰੇ ਕੀਤੇ ਹਨ (${analytics.progressPercentage}%)। ਮਹੀਨੇ ਵਿੱਚ ${analytics.daysRemainingInMonth} ਦਿਨ ਬਾਕੀ ਹਨ।`;
      } else {
        progressNote = `\n\n📊 **Your Progress for ${analytics.monthName}:** You have recorded **${analytics.completedHours.toFixed(1)} hrs** toward your goal of **${analytics.goalHours} hrs** (${analytics.progressPercentage}%). There are ${analytics.daysRemainingInMonth} days left in the month.`;
      }
    }

    return {
      answer: research.answer + progressNote,
      intent: 'HYBRID',
      sources: research.sources,
      status: research.status,
      detectedTopic: analysis.topic,
    };
  }

  /**
   * Enriches sources with localized relevance explanations
   */
  private static enrichSourcesWithRelevance(
    sources: JWSourceResult[],
    topic: string,
    lang: SupportedLanguage
  ): JWSourceResult[] {
    return sources.map((s) => {
      if (s.relevanceExplanation) return s;

      let explanation = '';
      switch (lang) {
        case 'hy':
          explanation = `Աստվածաշնչյան հիմնավորված պատասխան և գործնական մտքեր «${topic}» թեմայով:`;
          break;
        case 'ru':
          explanation = `Библейские доводы и практические мысли по теме «${topic}».`;
          break;
        case 'hi':
          explanation = `"${topic}" विषय पर बाइबल आधारित उत्तर और व्यावहारिक विचार।`;
          break;
        case 'pa':
          explanation = `"${topic}" ਵਿਸ਼ੇ 'ਤੇ ਬਾਈਬਲ ਆਧਾਰਿਤ ਜਵਾਬ ਅਤੇ ਵਿਹਾਰਕ ਵਿਚਾਰ।`;
          break;
        case 'en':
        default:
          explanation = `Direct Bible-based counsel and practical thoughts on "${topic}".`;
          break;
      }

      return {
        ...s,
        relevanceExplanation: explanation,
      };
    });
  }

  /**
   * Structured Progress Summary for all 5 languages
   */
  private static buildStructuredProgressSummary(
    data: MinistryAnalyticsSummary,
    language: SupportedLanguage
  ): string {
    const encouragement = LanguageIntelligence.getEncouragementScripture(language);

    if (language === 'ru') {
      return (
        `### 📊 Обзор служебного прогресса (${data.monthName})\n\n` +
        `• **Посвященные часы:** **${data.completedHours.toFixed(1)} ч** (цель: **${data.goalHours} ч**, выполнено **${data.progressPercentage}%**)\n` +
        `• **Осталось часов:** **${data.remainingHours > 0 ? data.remainingHours.toFixed(1) + ' ч' : 'Цель достигнута! 🎉'}**\n` +
        `• **Дней до конца месяца:** ${data.daysRemainingInMonth} дн.\n` +
        (data.remainingHours > 0
          ? `• **Рекомендуемый темп:** около **${data.hoursPerRemainingDayNeeded.toFixed(1)} ч/день**\n`
          : `• **Поздравляем!** Вы успешно достигли своей ежемесячной цели.\n`) +
        `• **Повторные посещения:** ${data.returnVisitsThisMonth}\n` +
        `• **Изучения Библии:** ${data.bibleStudiesThisMonth}\n` +
        `• **Распространения:** ${data.placementsThisMonth + data.videoShowingsThisMonth}\n\n` +
        `*«${encouragement.text}» (${encouragement.reference})*`
      );
    }

    if (language === 'hy') {
      return (
        `### 📊 Ծառայության առաջընթացի տվյալներ (${data.monthName})\n\n` +
        `• **Լրացված ժամեր՝** **${data.completedHours.toFixed(1)} ժ** (նպատակ՝ **${data.goalHours} ժ**, կատարված է **${data.progressPercentage}%**)\n` +
        `• **Մնացած ժամեր՝** **${data.remainingHours > 0 ? data.remainingHours.toFixed(1) + ' ժ' : 'Նպատակը իրագործված է: 🎉'}**\n` +
        `• **Մնացած օրեր՝** ${data.daysRemainingInMonth} օր\n` +
        (data.remainingHours > 0
          ? `• **Առաջարկվող տեմպ՝** օրական մոտ **${data.hoursPerRemainingDayNeeded.toFixed(1)} ժ**\n`
          : `• **Շնորհավորում ենք:** Դուք հասել եք ձեր նպատակին:\n`) +
        `• **Վերայցելություններ՝** ${data.returnVisitsThisMonth}\n` +
        `• **Աստվածաշնչի ուսումնասիրություններ՝** ${data.bibleStudiesThisMonth}\n` +
        `• **Տարածումներ՝** ${data.placementsThisMonth + data.videoShowingsThisMonth}\n\n` +
        `*«${encouragement.text}» (${encouragement.reference})*`
      );
    }

    if (language === 'hi') {
      return (
        `### 📊 सेवकाई प्रगति सारांश (${data.monthName})\n\n` +
        `• **पूरे किए गए घंटे:** **${data.completedHours.toFixed(1)} घंटे** (लक्ष्य: **${data.goalHours} घंटे**, **${data.progressPercentage}%** पूरा)\n` +
        `• **बाकी घंटे:** **${data.remainingHours > 0 ? data.remainingHours.toFixed(1) + ' घंटे' : 'लक्ष्य पूरा हुआ! 🎉'}**\n` +
        `• **महीने में बाकी दिन:** ${data.daysRemainingInMonth} दिन\n` +
        (data.remainingHours > 0
          ? `• **अनुशंसित गति:** लगभग **${data.hoursPerRemainingDayNeeded.toFixed(1)} घंटे/दिन**\n`
          : `• **बधाई हो!** आपने अपना मासिक लक्ष्य प्राप्त कर लिया है।\n`) +
        `• **पुनर्भेंट:** ${data.returnVisitsThisMonth}\n` +
        `• **बाइबल अध्ययन:** ${data.bibleStudiesThisMonth}\n` +
        `• **प्रकाशन:** ${data.placementsThisMonth + data.videoShowingsThisMonth}\n\n` +
        `*«${encouragement.text}» (${encouragement.reference})*`
      );
    }

    if (language === 'pa') {
      return (
        `### 📊 ਸੇਵਕਾਈ ਤਰੱਕੀ ਸਾਰ (${data.monthName})\n\n` +
        `• **ਪੂਰੇ ਕੀਤੇ ਘੰਟੇ:** **${data.completedHours.toFixed(1)} ਘੰਟੇ** (ਟੀਚਾ: **${data.goalHours} ਘੰਟੇ**, **${data.progressPercentage}%** ਪੂਰਾ)\n` +
        `• **ਬਾਕੀ ਘੰਟੇ:** **${data.remainingHours > 0 ? data.remainingHours.toFixed(1) + ' ਘੰਟੇ' : 'ਟੀਚਾ ਪੂਰਾ ਹੋਇਆ! 🎉'}**\n` +
        `• **ਮਹੀਨੇ ਵਿੱਚ ਬਾਕੀ ਦਿਨ:** ${data.daysRemainingInMonth} ਦਿਨ\n` +
        (data.remainingHours > 0
          ? `• **ਸਿਫ਼ਾਰਸ਼ ਕੀਤੀ ਰਫ਼ਤਾਰ:** ਲਗਭਗ **${data.hoursPerRemainingDayNeeded.toFixed(1)} ਘੰਟੇ/ਦਿਨ**\n`
          : `• **ਮੁਬਾਰਕਾਂ!** ਤੁਸੀਂ ਆਪਣਾ ਮਹੀਨਾਵਾਰ ਟੀਚਾ ਹਾਸਲ ਕਰ ਲਿਆ ਹੈ।\n`) +
        `• **ਮੁੜ-ਮੁਲਾਕਾਤਾਂ:** ${data.returnVisitsThisMonth}\n` +
        `• **ਬਾਈਬਲ ਸਟੱਡੀਆਂ:** ${data.bibleStudiesThisMonth}\n` +
        `• **ਸਾਹਿੱਤ:** ${data.placementsThisMonth + data.videoShowingsThisMonth}\n\n` +
        `*«${encouragement.text}» (${encouragement.reference})*`
      );
    }

    return (
      `### 📊 Ministry Progress Overview (${data.monthName})\n\n` +
      `• **Hours Recorded:** **${data.completedHours.toFixed(1)} hrs** (Goal: **${data.goalHours} hrs**, **${data.progressPercentage}%** achieved)\n` +
      `• **Remaining Hours:** **${data.remainingHours > 0 ? data.remainingHours.toFixed(1) + ' hrs' : 'Goal reached! 🎉'}**\n` +
      `• **Days Left in Month:** ${data.daysRemainingInMonth} days\n` +
      (data.remainingHours > 0
        ? `• **Suggested Pace:** approx. **${data.hoursPerRemainingDayNeeded.toFixed(1)} hrs/day** on service days\n`
        : `• **Warm Commendation!** You have reached your monthly ministry target.\n`) +
      `• **Return Visits:** ${data.returnVisitsThisMonth}\n` +
      `• **Bible Studies:** ${data.bibleStudiesThisMonth}\n` +
      `• **Placements & Videos:** ${data.placementsThisMonth + data.videoShowingsThisMonth}\n\n` +
      `*"${encouragement.text}" (${encouragement.reference})*`
    );
  }

  /**
   * Structured Research Summary for all 5 languages
   */
  private static buildStructuredResearchSummary(
    topic: string,
    sources: JWSourceResult[],
    language: SupportedLanguage
  ): string {
    const top = sources[0];
    const scriptureNote = top.scripture ? `\n\n📖 **${top.scripture}**` : '';

    if (language === 'ru') {
      return (
        `На основе опубликованных материалов **JW.ORG** и **WOL.JW.ORG**:\n\n` +
        `В статье **«${top.title}»** дается ясный библейский ответ на вопрос по теме «${topic}»:\n\n` +
        `> ${top.summary.slice(0, 280)}...` +
        scriptureNote +
        `\n\nВы можете открыть полный материал ниже, чтобы подготовить конкретные мысли для служения или поделиться ссылкой с интересующимся человеком.`
      );
    }

    if (language === 'hy') {
      return (
        `**JW.ORG** և **WOL.JW.ORG** հրատարակված նյութերի հիման վրա.\n\n` +
        `**«${top.title}»** հոդվածում տրվում է հստակ Աստվածաշնչյան պատասխան «${topic}» թեմայով.\n\n` +
        `> ${top.summary.slice(0, 280)}...` +
        scriptureNote +
        `\n\nԿարող եք բացել ամբողջական հոդվածը ստորև՝ ծառայության մեջ մարդկանց հետ կիսվելու կամ վերայցելության ժամանակ քննարկելու համար:`
      );
    }

    if (language === 'hi') {
      return (
        `**JW.ORG** और **WOL.JW.ORG** पर प्रकाशित सामग्री के आधार पर:\n\n` +
        `लेख **«${top.title}»** में "${topic}" पर स्पष्ट बाइबल आधारित उत्तर दिया गया है:\n\n` +
        `> ${top.summary.slice(0, 280)}...` +
        scriptureNote +
        `\n\nआप प्रचार में रुचि रखने वाले व्यक्ति के साथ चर्चा करने के लिए नीचे दिए गए लेख को सीधे खोल सकते हैं।`
      );
    }

    if (language === 'pa') {
      return (
        `**JW.ORG** ਅਤੇ **WOL.JW.ORG** 'ਤੇ ਪ੍ਰਕਾਸ਼ਿਤ ਜਾਣਕਾਰੀ ਦੇ ਆਧਾਰ 'ਤੇ:\n\n` +
        `ਲੇਖ **«${top.title}»** ਵਿੱਚ "${topic}" ਸੰਬੰਧੀ ਸਪੱਸ਼ਟ ਬਾਈਬਲ ਆਧਾਰਿਤ ਜਵਾਬ ਦਿੱਤਾ ਗਿਆ ਹੈ:\n\n` +
        `> ${top.summary.slice(0, 280)}...` +
        scriptureNote +
        `\n\nਤੁਸੀਂ ਪ੍ਰਚਾਰ ਵਿੱਚ ਦਿਲਚਸਪੀ ਰੱਖਣ ਵਾਲੇ ਵਿਅਕਤੀ ਨਾਲ ਸਾਂਝਾ ਕਰਨ ਲਈ ਹੇਠਾਂ ਦਿੱਤਾ ਲੇਖ ਖੋਲ੍ਹ ਸਕਦੇ ਹੋ।`
      );
    }

    return (
      `Based on published material from **JW.ORG** and **WOL.JW.ORG**:\n\n` +
      `The article **"${top.title}"** provides a clear Bible-based answer regarding "${topic}":\n\n` +
      `> ${top.summary.slice(0, 280)}...` +
      scriptureNote +
      `\n\nYou can review the complete official publication below to share directly at the door or during return visits.`
    );
  }
}
