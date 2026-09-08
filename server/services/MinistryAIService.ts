import { GoogleGenAI } from '@google/genai';
import { JWOrgService, JWSourceResult } from './JWOrgService.ts';
import { WOLService } from './WOLService.ts';

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
  language: 'en' | 'hy' | 'ru' | 'hi' | 'pa';
  analytics?: MinistryAnalyticsSummary;
}

export interface MinistryAIResponse {
  answer: string;
  intent: 'MINISTRY_PROGRESS' | 'JW_RESEARCH' | 'HYBRID';
  sources: JWSourceResult[];
  status: 'success' | 'no_sources' | 'error';
  detectedTopic?: string;
}

// Lazy Gemini client initialization with standard aistudio-build header
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY environment variable is missing on server.');
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
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
   * Determine intent from the question
   */
  static determineIntent(question: string): 'MINISTRY_PROGRESS' | 'JW_RESEARCH' | 'HYBRID' {
    const q = question.toLowerCase();

    const progressKeywords = [
      'hour',
      'goal',
      'left',
      'remaining',
      'progress',
      'doing this month',
      'my ministry',
      'my time',
      'my report',
      'my hours',
      'return visit',
      'bible stud',
      'placement',
      'schedule',
      'stats',
      'tracker',
      'doing so far',
      'how am i doing',
      // Russian
      'час',
      'цел',
      'осталось',
      'прогресс',
      'мои часы',
      'повторн',
      'изучен',
      'как мои успехи',
      // Armenian
      'ժամ',
      'նպատակ',
      'մնացել',
      'առաջընթաց',
      'վերայցել',
      'ուսումնասիր',
      // Hindi
      'घंटे',
      'लक्ष्य',
      'बाकी',
      'प्रगति',
      'अध्ययन',
      // Punjabi
      'ਘੰਟੇ',
      'ਟੀਚਾ',
      'ਬਾਕੀ',
      'ਤਰੱਕੀ',
    ];

    const researchKeywords = [
      'jw.org',
      'wol',
      'article',
      'what does the bible say',
      'bible say',
      'scripture',
      'show someone',
      'householder',
      'preach',
      'explain',
      'resurrection',
      'suffering',
      'kingdom',
      'hope',
      'death',
      'prayer',
      'family',
      'peace',
      'jesus',
      'god',
      'creator',
      'faith',
      'find an article',
      // Russian
      'стать',
      'воскресен',
      'страдан',
      'царств',
      'надежд',
      'смерт',
      'библи',
      // Armenian
      'հոդված',
      'հարություն',
      'տառապանք',
      'թագավորություն',
      'հույս',
      'մահ',
      'աստվածաշունչ',
      // Hindi
      'लेख',
      'पुनरुत्थान',
      'दुख',
      'राज्य',
      'आशा',
      'बाइबिल',
      // Punjabi
      'ਲੇਖ',
      'ਜੀ ਉੱਠਣ',
      'ਦੁੱਖ',
      'ਰਾਜ',
      'ਉਮੀਦ',
      'ਬਾਈਬਲ',
    ];

    const matchesProgress = progressKeywords.some((kw) => q.includes(kw));
    const matchesResearch = researchKeywords.some((kw) => q.includes(kw));

    if (matchesProgress && matchesResearch) return 'HYBRID';
    if (matchesProgress) return 'MINISTRY_PROGRESS';
    return 'JW_RESEARCH';
  }

  /**
   * Main handler for user questions
   */
  static async processQuestion(payload: MinistryAIMessagePayload): Promise<MinistryAIResponse> {
    const { question, language, analytics } = payload;
    const intent = this.determineIntent(question);

    if (intent === 'MINISTRY_PROGRESS') {
      return this.handleMinistryProgress(question, language, analytics);
    } else if (intent === 'HYBRID') {
      return this.handleHybrid(question, language, analytics);
    } else {
      return this.handleJWResearch(question, language);
    }
  }

  /**
   * Mode 1: Ministry Progress Analysis
   */
  private static async handleMinistryProgress(
    question: string,
    language: string,
    analytics?: MinistryAnalyticsSummary
  ): Promise<MinistryAIResponse> {
    if (!analytics) {
      return {
        answer: this.getLocalizedFallbackMessage(
          language,
          'No ministry data was provided for analysis. Please record some hours or goals first.'
        ),
        intent: 'MINISTRY_PROGRESS',
        sources: [],
        status: 'success',
      };
    }

    const ai = getGeminiClient();
    if (ai) {
      try {
        const prompt = `
You are "Ministry AI", a warm, encouraging, respectful Christian ministry assistant for Jehovah's Witnesses using the Ministry Tracker app.
The user is asking about their personal ministry progress and hours for the current month.

User Question: "${question}"
User's Language: "${language}" (Respond purely in this language: 'en' for English, 'ru' for Russian, 'hy' for Armenian, 'hi' for Hindi, 'pa' for Punjabi).

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

Instructions:
1. Answer the question directly with clear, exact numbers from the data above.
2. Be warm, kind, realistic, and spiritually uplifting (e.g. mention that Jehovah values whole-souled service).
3. If hours remain, provide practical schedule pacing (e.g. "To reach your goal of ${analytics.goalHours}h with ${analytics.daysRemainingInMonth} days left, aim for approximately ${analytics.hoursPerRemainingDayNeeded.toFixed(1)}h on days you serve").
4. If goal is reached, commend them enthusiastically.
5. Keep the tone friendly, humble, and concise (2-4 paragraphs or crisp bullet points).
6. Do NOT mention internal code, databases, or API keys.
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        const text = response.text;
        if (text && text.trim().length > 0) {
          return {
            answer: text.trim(),
            intent: 'MINISTRY_PROGRESS',
            sources: [],
            status: 'success',
          };
        }
      } catch (err) {
        console.warn('Gemini call failed for ministry progress, using structured fallback:', err);
      }
    }

    // Deterministic fallback if Gemini is offline
    const fallbackAnswer = this.buildStructuredProgressSummary(analytics, language);
    return {
      answer: fallbackAnswer,
      intent: 'MINISTRY_PROGRESS',
      sources: [],
      status: 'success',
    };
  }

  /**
   * Mode 2: JW Research (JW.ORG & WOL.JW.ORG)
   */
  private static async handleJWResearch(
    question: string,
    language: string
  ): Promise<MinistryAIResponse> {
    // Determine if user explicitly asked for WOL or deeper research
    const isWOLRequested =
      question.toLowerCase().includes('wol') ||
      question.toLowerCase().includes('watchtower online library') ||
      question.toLowerCase().includes('insight') ||
      question.toLowerCase().includes('deep');

    let sources: JWSourceResult[] = [];
    try {
      if (isWOLRequested) {
        sources = await WOLService.searchWOL(question, language, 5);
      } else {
        const searchRes = await JWOrgService.search(question, language, 6);
        sources = searchRes.results;
      }
    } catch (searchError) {
      console.error('Failed to search JW.ORG / WOL:', searchError);
      return {
        answer: this.getLocalizedFallbackMessage(
          language,
          'Unable to reach JW.ORG / WOL.JW.ORG at this moment. Please check your internet connection and try again.'
        ),
        intent: 'JW_RESEARCH',
        sources: [],
        status: 'error',
      };
    }

    if (!sources || sources.length === 0) {
      return {
        answer: this.getLocalizedFallbackMessage(
          language,
          `No relevant published articles were found on JW.ORG or WOL.JW.ORG for "${question}". Try searching with different keywords (e.g. "hope", "resurrection", "suffering") or a specific Bible subject.`
        ),
        intent: 'JW_RESEARCH',
        sources: [],
        status: 'no_sources',
      };
    }

    // Now synthesize grounded answer using Gemini with the retrieved articles
    const ai = getGeminiClient();
    if (ai) {
      try {
        const sourcesContext = sources
          .map(
            (s, idx) =>
              `[Source ${idx + 1}] Title: "${s.title}" (${s.source}${s.context ? ' - ' + s.context : ''})\nSummary/Snippet: ${s.summary}\nScriptures Mentioned: ${s.scripture || 'None'}\nURL: ${s.url}`
          )
          .join('\n\n');

        const prompt = `
You are "Ministry AI", an assistant helping a publisher in the Christian ministry prepare to share Bible-based truths with people they meet.
The user asked: "${question}"
User's Language: "${language}" (Respond in this language: 'en' for English, 'ru' for Russian, 'hy' for Armenian, 'hi' for Hindi, 'pa' for Punjabi).

Here are the REAL, verified articles retrieved from JW.ORG and WOL.JW.ORG:
${sourcesContext}

Instructions:
1. Ground your answer strictly in the retrieved source articles above. Prioritize this published information over general knowledge.
2. Provide a concise, practical answer that the user can immediately use at the door or during an informal conversation:
   - What the Bible teaches on this question.
   - 1 to 2 key scriptures to read or reference from the articles.
   - A tactful, kind conversational point to share with the householder.
3. Mention the relevant article titles by name so the user knows which published material to offer or show on JW.ORG / JW Library.
4. Keep the response organized, respectful, clear, and easy to read on a mobile device (use short paragraphs or bullet points).
5. Do NOT invent scriptures, fake article titles, or make up claims not supported by the sources.
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        const text = response.text;
        if (text && text.trim().length > 0) {
          return {
            answer: text.trim(),
            intent: 'JW_RESEARCH',
            sources,
            status: 'success',
          };
        }
      } catch (err) {
        console.warn('Gemini grounded synthesis failed, using structured source fallback:', err);
      }
    }

    // Deterministic fallback if Gemini is offline/quota
    const fallbackAnswer = this.buildStructuredResearchSummary(question, sources, language);
    return {
      answer: fallbackAnswer,
      intent: 'JW_RESEARCH',
      sources,
      status: 'success',
    };
  }

  /**
   * Mode 3: Hybrid (Progress + Research)
   */
  private static async handleHybrid(
    question: string,
    language: string,
    analytics?: MinistryAnalyticsSummary
  ): Promise<MinistryAIResponse> {
    const research = await this.handleJWResearch(question, language);
    let progressNote = '';

    if (analytics) {
      if (language === 'ru') {
        progressNote = `\n\n📊 **Ваш отчет за ${analytics.monthName}:** Вы посвятили **${analytics.completedHours.toFixed(1)} ч** из цели **${analytics.goalHours} ч** (${analytics.progressPercentage}%). До конца месяца осталось ${analytics.daysRemainingInMonth} дн.`;
      } else if (language === 'hy') {
        progressNote = `\n\n📊 **Ձեր հաշվետվությունը ${analytics.monthName}-ի համար.** Դուք ծառայել եք **${analytics.completedHours.toFixed(1)} ժ** նպատակային **${analytics.goalHours} ժ**-ից (${analytics.progressPercentage}%): Ամսվա ավարտին մնացել է ${analytics.daysRemainingInMonth} օր:`;
      } else if (language === 'hi') {
        progressNote = `\n\n📊 **${analytics.monthName} के लिए आपकी प्रगति:** आपने **${analytics.goalHours} घंटे** के लक्ष्य में से **${analytics.completedHours.toFixed(1)} घंटे** पूरे किए हैं (${analytics.progressPercentage}%)।`;
      } else if (language === 'pa') {
        progressNote = `\n\n📊 **${analytics.monthName} ਲਈ ਤੁਹਾਡੀ ਤਰੱਕੀ:** ਤੁਸੀਂ **${analytics.goalHours} ਘੰਟੇ** ਦੇ ਟੀਚੇ ਵਿੱਚੋਂ **${analytics.completedHours.toFixed(1)} ਘੰਟੇ** ਪੂਰੇ ਕੀਤੇ ਹਨ (${analytics.progressPercentage}%)।`;
      } else {
        progressNote = `\n\n📊 **Your Progress for ${analytics.monthName}:** You have recorded **${analytics.completedHours.toFixed(1)} hrs** toward your goal of **${analytics.goalHours} hrs** (${analytics.progressPercentage}%). There are ${analytics.daysRemainingInMonth} days left in the month.`;
      }
    }

    return {
      answer: research.answer + progressNote,
      intent: 'HYBRID',
      sources: research.sources,
      status: research.status,
    };
  }

  /**
   * Helper: Structured Progress Summary (deterministic)
   */
  private static buildStructuredProgressSummary(
    data: MinistryAnalyticsSummary,
    language: string
  ): string {
    if (language === 'ru') {
      return `### 📊 Обзор служебного прогресса (${data.monthName})\n\n` +
        `• **Посвященные часы:** **${data.completedHours.toFixed(1)} ч** (цель: **${data.goalHours} ч**, выполнено **${data.progressPercentage}%**)\n` +
        `• **Осталось часов:** **${data.remainingHours > 0 ? data.remainingHours.toFixed(1) + ' ч' : 'Цель достигнута! 🎉'}**\n` +
        `• **Дней до конца месяца:** ${data.daysRemainingInMonth} дн.\n` +
        (data.remainingHours > 0
          ? `• **Рекомендуемый темп:** около **${data.hoursPerRemainingDayNeeded.toFixed(1)} ч/день**\n`
          : `• **Поздравляем!** Вы успешно достигли своей ежемесячной цели.\n`) +
        `• **Повторные посещения:** ${data.returnVisitsThisMonth}\n` +
        `• **Изучения Библии:** ${data.bibleStudiesThisMonth}\n` +
        `• **Распространения:** ${data.placementsThisMonth + data.videoShowingsThisMonth}\n\n` +
        `*«Ибо не неправеден Бог, чтобы забыть дело ваше и труд любви» (Евреям 6:10).*`;
    }

    if (language === 'hy') {
      return `### 📊 Ծառայության առաջընթացի տվյալներ (${data.monthName})\n\n` +
        `• **Լրացված ժամեր՝** **${data.completedHours.toFixed(1)} ժ** (նպատակ՝ **${data.goalHours} ժ**, կատարված է **${data.progressPercentage}%**)\n` +
        `• **Մնացած ժամեր՝** **${data.remainingHours > 0 ? data.remainingHours.toFixed(1) + ' ժ' : 'Նպատակը իրագործված է: 🎉'}**\n` +
        `• **Մնացած օրեր՝** ${data.daysRemainingInMonth} օր\n` +
        (data.remainingHours > 0
          ? `• **Առաջարկվող տեմպ՝** օրական մոտ **${data.hoursPerRemainingDayNeeded.toFixed(1)} ժ**\n`
          : `• **Շնորհավորում ենք:** Դուք հասել եք ձեր նպատակին:\n`) +
        `• **Վերայցելություններ՝** ${data.returnVisitsThisMonth}\n` +
        `• **Աստվածաշնչի ուսումնասիրություններ՝** ${data.bibleStudiesThisMonth}\n` +
        `• **Տարածումներ՝** ${data.placementsThisMonth + data.videoShowingsThisMonth}\n\n` +
        `*«Աստված անարդար չէ, որ մոռանա ձեր գործը և այն սերը, որ ցույց տվեցիք» (Եբրայեցիներ 6:10):*`;
    }

    if (language === 'hi') {
      return `### 📊 सेवकाई प्रगति सारांश (${data.monthName})\n\n` +
        `• **पूरे किए गए घंटे:** **${data.completedHours.toFixed(1)} घंटे** (लक्ष्य: **${data.goalHours} घंटे**, **${data.progressPercentage}%** पूरा)\n` +
        `• **बाकी घंटे:** **${data.remainingHours > 0 ? data.remainingHours.toFixed(1) + ' घंटे' : 'लक्ष्य पूरा हुआ! 🎉'}**\n` +
        `• **महीने में बाकी दिन:** ${data.daysRemainingInMonth} दिन\n` +
        `• **पुनर्भेंट:** ${data.returnVisitsThisMonth}\n` +
        `• **बाइबल अध्ययन:** ${data.bibleStudiesThisMonth}\n` +
        `• **प्रकाशन:** ${data.placementsThisMonth + data.videoShowingsThisMonth}`;
    }

    if (language === 'pa') {
      return `### 📊 ਸੇਵਕਾਈ ਤਰੱਕੀ ਸਾਰ (${data.monthName})\n\n` +
        `• **ਪੂਰੇ ਕੀਤੇ ਘੰਟੇ:** **${data.completedHours.toFixed(1)} ਘੰਟੇ** (ਟੀਚਾ: **${data.goalHours} ਘੰਟੇ**, **${data.progressPercentage}%** ਪੂਰਾ)\n` +
        `• **ਬਾਕੀ ਘੰਟੇ:** **${data.remainingHours > 0 ? data.remainingHours.toFixed(1) + ' ਘੰਟੇ' : 'ਟੀਚਾ ਪੂਰਾ ਹੋਇਆ! 🎉'}**\n` +
        `• **ਮਹੀਨੇ ਵਿੱਚ ਬਾਕੀ ਦਿਨ:** ${data.daysRemainingInMonth} ਦਿਨ\n` +
        `• **ਮੁੜ-ਮੁਲਾਕਾਤਾਂ:** ${data.returnVisitsThisMonth}\n` +
        `• **ਬਾਈਬਲ ਸਟੱਡੀਆਂ:** ${data.bibleStudiesThisMonth}\n` +
        `• **ਸਾਹਿੱਤ:** ${data.placementsThisMonth + data.videoShowingsThisMonth}`;
    }

    return `### 📊 Ministry Progress Overview (${data.monthName})\n\n` +
      `• **Hours Recorded:** **${data.completedHours.toFixed(1)} hrs** (Goal: **${data.goalHours} hrs**, **${data.progressPercentage}%** achieved)\n` +
      `• **Remaining Hours:** **${data.remainingHours > 0 ? data.remainingHours.toFixed(1) + ' hrs' : 'Goal reached! 🎉'}**\n` +
      `• **Days Left in Month:** ${data.daysRemainingInMonth} days\n` +
      (data.remainingHours > 0
        ? `• **Suggested Pace:** approx. **${data.hoursPerRemainingDayNeeded.toFixed(1)} hrs/day** on service days\n`
        : `• **Warm Commendation!** You have reached your monthly ministry target.\n`) +
      `• **Return Visits:** ${data.returnVisitsThisMonth}\n` +
      `• **Bible Studies:** ${data.bibleStudiesThisMonth}\n` +
      `• **Placements & Videos:** ${data.placementsThisMonth + data.videoShowingsThisMonth}\n\n` +
      `*"For God is not unrighteous so as to forget your work and the love you showed for his name." (Hebrews 6:10)*`;
  }

  /**
   * Helper: Structured Research Summary (deterministic)
   */
  private static buildStructuredResearchSummary(
    question: string,
    sources: JWSourceResult[],
    language: string
  ): string {
    const top = sources[0];
    const scriptureNote = top.scripture ? `\n\n📖 **Key Scripture:** ${top.scripture}` : '';

    if (language === 'ru') {
      return `На основе опубликованных материалов **JW.ORG** и **WOL.JW.ORG**:\n\n` +
        `В статье **«${top.title}»** дается библейский ответ на ваш вопрос:\n\n` +
        `> ${top.summary.slice(0, 280)}...` +
        scriptureNote +
        `\n\nВы можете открыть полный материал ниже, чтобы подготовить конкретные мысли для проповеди.`;
    }

    if (language === 'hy') {
      return `**JW.ORG** և **WOL.JW.ORG** հրատարակությունների հիման վրա.\n\n` +
        `**«${top.title}»** հոդվածում տրվում է Աստվածաշնչյան պատասխանը ձեր հարցին.\n\n` +
        `> ${top.summary.slice(0, 280)}...` +
        scriptureNote +
        `\n\nԿարող եք բացել ամբողջական հոդվածը ստորև՝ ծառայության մեջ կիսվելու համար:`;
    }

    return `Based on published material from **JW.ORG** and **WOL.JW.ORG**:\n\n` +
      `The article **"${top.title}"** provides a clear Bible-based answer:\n\n` +
      `> ${top.summary.slice(0, 280)}...` +
      scriptureNote +
      `\n\nYou can review the complete article and references below to share directly with interested ones.`;
  }

  private static getLocalizedFallbackMessage(language: string, englishText: string): string {
    if (language === 'ru') {
      if (englishText.includes('No relevant published articles')) {
        return 'По вашему запросу на JW.ORG и WOL.JW.ORG не найдено подходящих статей. Попробуйте использовать другие ключевые слова или сформулировать вопрос иначе.';
      }
      if (englishText.includes('Unable to reach')) {
        return 'В данный момент не удалось связаться со службой поиска JW.ORG / WOL. Пожалуйста, проверьте подключение к интернету и повторите попытку.';
      }
    } else if (language === 'hy') {
      if (englishText.includes('No relevant published articles')) {
        return 'JW.ORG կամ WOL.JW.ORG-ում համապատասխան հոդվածներ չգտնվեցին: Փորձեք փոխել հարցի բառերը կամ օգտագործել այլ բանալի բառեր:';
      }
      if (englishText.includes('Unable to reach')) {
        return 'Այս պահին հնարավոր չէ կապ հաստատել JW.ORG / WOL ծառայության հետ: Խնդրում ենք ստուգել ինտերնետ կապը և փորձել կրկին:';
      }
    }
    return englishText;
  }
}
