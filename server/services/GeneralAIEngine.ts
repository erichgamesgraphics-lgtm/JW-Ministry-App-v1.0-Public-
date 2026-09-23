import { GoogleGenAI } from '@google/genai';
import { SupportedLanguage } from '../../src/types.js';
import type { ChatHistoryMessage, SearchResult } from './types.js';
import { LanguageService } from './LanguageService.js';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }
  if (!geminiClient) {
    try {
      geminiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch {
      geminiClient = null;
    }
  }
  return geminiClient;
}

export class GeneralAIEngine {
  /**
   * Process a message through General AI Model.
   * Can handle general questions, concept explanations, jokes, greetings, and reasoning.
   */
  static async generateGeneralResponse(
    message: string,
    targetLang: SupportedLanguage,
    conversationHistory: ChatHistoryMessage[] = [],
    contextExtra?: {
      ministryDataSummary?: string;
      sources?: SearchResult[];
    }
  ): Promise<string> {
    const clean = message.trim();
    const lower = clean.toLowerCase();

    // First attempt: Gemini Generative AI Model if accessible
    const ai = getGeminiClient();
    if (ai) {
      try {
        const systemInstruction = `You are Ministry AI, an intelligent, warm, tactful, and helpful assistant in the JW Ministry Tracker application.
You assist Christian ministers and publishers with their ministry planning, explaining ministry concepts, reasoning on goals, and general conversational assistance.
Always respond in language: ${targetLang}.
Guidelines:
- Never expose API keys or raw JSON errors.
- Be warm, encouraging, respectful, and biblically sound.
- Explain ministry concepts accurately (e.g. Return Visit vs Bible Study).
- When personal ministry stats are provided, use them accurately and never fabricate data.
- If answering general questions or greetings, be conversational and natural.`;

        let contextPrompt = `User question: "${clean}"\n`;
        if (contextExtra?.ministryDataSummary) {
          contextPrompt += `User's Actual Ministry Tracker Data:\n${contextExtra.ministryDataSummary}\n`;
        }
        if (contextExtra?.sources && contextExtra.sources.length > 0) {
          contextPrompt += `Retrieved Official JW.ORG Publications:\n` +
            contextExtra.sources.map(s => `- ${s.title}: ${s.snippet} (${s.url})`).join('\n') + '\n';
        }

        if (conversationHistory.length > 0) {
          const recentHistory = conversationHistory.slice(-4).map(h => `${h.role}: ${h.content}`).join('\n');
          contextPrompt += `\nRecent Conversation Context:\n${recentHistory}\n`;
        }

        const responsePromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: contextPrompt,
          config: { systemInstruction },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI generation timeout')), 4000)
        );

        const aiResponse = await Promise.race([responsePromise, timeoutPromise]);
        const text = aiResponse.text;

        if (text && text.trim().length > 10) {
          return text.trim();
        }
      } catch {
        // Fall through to deterministic high-quality response engine
      }
    }

    // Deterministic High-Quality Fallback Reasoning Engine
    return this.generateDeterministicResponse(clean, lower, targetLang, conversationHistory, contextExtra);
  }

  /**
   * Deterministic semantic handler for general conversational queries, concepts, and jokes.
   */
  private static generateDeterministicResponse(
    clean: string,
    lower: string,
    targetLang: SupportedLanguage,
    conversationHistory: ChatHistoryMessage[],
    contextExtra?: { ministryDataSummary?: string; sources?: SearchResult[] }
  ): string {
    // 1. Concept: Return Visit vs Bible Study
    if (
      (lower.includes('difference') || lower.includes('what is') || lower.includes("what's") || lower.includes('разница') || lower.includes('различие') || lower.includes('տարբերություն') || lower.includes('अंतर') || lower.includes('ਫਰਕ')) &&
      (lower.includes('return visit') || lower.includes('bible study') || lower.includes('повторн') || lower.includes('изучени') || lower.includes('վերայցելություն') || lower.includes('ուսումնասիրություն') || lower.includes('पुनः भेंट') || lower.includes('बाइबल अध्ययन') || lower.includes('ਮੁੜ-ਮੁਲਾਕਾਤ') || lower.includes('ਬਾਈਬਲ ਸਟੱਡੀ'))
    ) {
      return this.explainReturnVisitVsBibleStudy(targetLang);
    }

    // 2. Joke request
    if (
      lower.includes('joke') || lower.includes('шутк') || lower.includes('анекдот') ||
      lower.includes('կատակ') || lower.includes('чутка') || lower.includes('चुटकुल') || lower.includes('ਚੁਟਕਲਾ')
    ) {
      return this.getWholesomeJoke(targetLang);
    }

    // 3. Greetings & "How are you?"
    if (
      lower.includes('how are you') || lower.includes('как дела') || lower.includes('ինչպես ես') ||
      lower.includes('आप कैसे हैं') || lower.includes('ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ') || lower.includes('how r u') ||
      lower.includes("how's it going") || lower === 'hi' || lower === 'hello' || lower === 'привет' ||
      lower === 'բարև' || lower === 'नमस्ते' || lower === 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ'
    ) {
      return this.getConversationalGreeting(targetLang);
    }

    // 4. Who are you / What can you do?
    if (
      lower.includes('who are you') || lower.includes('what can you do') || lower.includes('кто ты') ||
      lower.includes('что ты умеешь') || lower.includes('ով ես դու') || lower.includes('तुम कौन हो') ||
      lower.includes('ਤੁਸੀਂ ਕੌਣ ਹੋ')
    ) {
      return this.getSelfIntroduction(targetLang);
    }

    // 5. Ministry Goal Help & Reasoning (if data is provided)
    if (contextExtra?.ministryDataSummary) {
      return this.synthesizeMinistryHelp(contextExtra.ministryDataSummary, contextExtra.sources, targetLang);
    }

    // 6. General Encouraging / Informative Response
    return this.getDefaultHelpfulResponse(clean, targetLang);
  }

  /**
   * Concept Explanation: Return Visit vs Bible Study
   */
  static explainReturnVisitVsBibleStudy(lang: SupportedLanguage): string {
    switch (lang) {
      case 'hy':
        return `**Ի՞նչ տարբերություն կա վերայցելության և Աստվածաշնչի ուսումնասիրության միջև**

• **Վերայցելություն (Return Visit)**.
  Սա այցելություն է այն անձնավորությանը, ով նախկինում հետաքրքրություն է ցուցաբերել կամ ընդունել է գրականություն։ Նպատակն է շարունակել աստվածաշնչյան զրույցը, պատասխանել նրա հարցերին և զարգացնել հոգևոր հետաքրքրությունը։

• **Աստվածաշնչի ուսումնասիրություն (Bible Study)**.
  Երբ հետաքրքրվող անձի հետ պարբերաբար և համակարգված կերպով քննարկվում է Աստվածաշունչը՝ օգտագործելով հատուկ հրատարակություն (օրինակ՝ *«Վայելիր կյանքը հավիտյան»* գիրքը կամ գրքույկը)։ Ուսումնասիրության ժամանակ քննարկվում են պարբերությունները, կարդացվում են աստվածաշնչյան համարները և դիտվում են տեսանյութեր։

💡 *Եթե ցանկանում եք իմանալ ձեր ընթացիկ գրանցված վերայցելությունների կամ ուսումնասիրությունների թիվը, պարզապես հարցրեք «Քանի՞ ուսումնասիրություն ունեմ»։*`;

      case 'ru':
        return `**В чем разница между повторным посещением и изучением Библии?**

• **Повторное посещение**:
  Это посещение человека, проявившего интерес к библейской вести или взявшего литературу при первой встрече. Цель — продолжить беседу на духовную тему, ответить на оставленный вопрос и развивать интерес.

• **Изучение Библии**:
  Это регулярное и последовательное обсуждение библейских истин с интересующимся человеком по специальному пособию (например, по интерактивному курсу *«Радуйтесь жизни сейчас и вечно!»*). Изучение включает разбор абзацев, чтение стихов из Библии и обсуждение вопросов.

💡 *Если вы хотите узнать, сколько повторных посещений или изучений Библии записано у вас в этом месяце, просто спросите меня: «Сколько у меня изучений Библии?»*`;

      case 'hi':
        return `**पुनः भेंट (Return Visit) और बाइबल अध्ययन (Bible Study) में क्या अंतर है?**

• **पुनः भेंट (Return Visit)**:
  यह उस व्यक्ति से दोबारा मिलने जाना है जिसने पहले प्रचार में रुचि दिखाई थी या कोई पत्रिका ली थी। इसका उद्देश्य किसी प्रश्न का उत्तर देना, बातचीत को आगे बढ़ाना और उनकी रुचि को बढ़ाना है।

• **बाइबल अध्ययन (Bible Study)**:
  जब किसी व्यक्ति के साथ नियमित और क्रमबद्ध तरीके से बाइबल पर चर्चा की जाती है—खास तौर पर किसी अध्ययन प्रकाशन जैसे *«सदा के लिए ज़िंदगी का आनंद लें!»* का उपयोग करके। इसमें पैराग्राफ पढ़ना, बाइबल वचन देखना और सवालों पर विचार करना शामिल है।

💡 *यदि आप इस महीने के अपने दर्ज किए गए बाइबल अध्ययन या पुनः भेंटें देखना चाहते हैं, तो बस पूछें: «मेरे पास कितने बाइबल अध्ययन हैं?»*`;

      case 'pa':
        return `**ਮੁੜ-ਮੁਲਾਕਾਤ (Return Visit) ਅਤੇ ਬਾਈਬਲ ਅਧਿਐਨ (Bible Study) ਵਿੱਚ ਕੀ ਫ਼ਰਕ ਹੈ?**

• **ਮੁੜ-ਮੁਲਾਕਾਤ (Return Visit)**:
  ਜਦੋਂ ਅਸੀਂ ਕਿਸੇ ਅਜਿਹੇ ਵਿਅਕਤੀ ਨੂੰ ਦੁਬਾਰਾ ਮਿਲਣ ਜਾਂਦੇ ਹਾਂ ਜਿਸ ਨੇ ਪ੍ਰਚਾਰ ਵਿੱਚ ਦਿਲਚਸਪੀ ਦਿਖਾਈ ਸੀ ਜਾਂ ਸਾਹਿਤ ਲਿਆ ਸੀ। ਇਸ ਦਾ ਮਕਸਦ ਬਾਈਬਲ ਸੰਬੰਧੀ ਗੱਲਬਾਤ ਜਾਰੀ ਰੱਖਣਾ ਅਤੇ ਉਸ ਦੀ ਰੁਚੀ ਵਧਾਉਣਾ ਹੈ।

• **ਬਾਈਬਲ ਅਧਿਐਨ (Bible Study)**:
  ਜਦੋਂ ਕਿਸੇ ਵਿਅਕਤੀ ਨਾਲ ਕਿਸੇ ਕਿਤਾਬ (ਜਿਵੇਂ ਕਿ *«ਹਮੇਸ਼ਾ ਲਈ ਜ਼ਿੰਦਗੀ ਦਾ ਆਨੰਦ ਮਾਣੋ!»*) ਦੀ ਮਦਦ ਨਾਲ ਨਿਯਮਿਤ ਅਤੇ ਤਰਤੀਬਵਾਰ ਢੰਗ ਨਾਲ ਬਾਈਬਲ ਸਿੱਖੀ ਜਾਂਦੀ ਹੈ।

💡 *ਜੇ ਤੁਸੀਂ ਇਸ ਮਹੀਨੇ ਦੀਆਂ ਆਪਣੀਆਂ ਦਰਜ ਕੀਤੀਆਂ ਸਟੱਡੀਆਂ ਜਾਣਨਾ ਚਾਹੁੰਦੇ ਹੋ, ਤਾਂ ਪੁੱਛੋ: «ਮੇਰੇ ਕੋਲ ਕਿੰਨੇ ਬਾਈਬਲ ਅਧਿਐਨ ਹਨ?»*`;

      default:
        return `**What is the difference between a Return Visit and a Bible Study?**

• **Return Visit (RV)**:
  A visit made to someone who previously expressed interest or accepted literature. The objective is to cultivate that interest, answer a question raised during the previous visit, and build a friendly, spiritual relationship.

• **Bible Study (BS)**:
  A regular, structured, and progressive discussion of the Bible using an approved study publication (such as the interactive course *Enjoy Life Forever!*). A Bible study involves discussing paragraphs, reading scriptures, and helping the student apply Bible principles in their life.

💡 *Note: If you'd like to check your own recorded Bible studies or return visits for this month, simply ask: "How many Bible studies do I have?"*`;
    }
  }

  /**
   * Wholesome, friendly jokes
   */
  static getWholesomeJoke(lang: SupportedLanguage): string {
    switch (lang) {
      case 'hy':
        return `😄 Ահա մի բարի կատակ.

– Ո՞վ էր Աստվածաշնչում ամենամեծ ֆինանսիստը։
– Նոյը, որովհետև նա կարողացավ պահպանել իր ակտիվները, մինչդեռ ողջ աշխարհը գտնվում էր լիկվիդացիայի տակ։`;

      case 'ru':
        return `😄 Вот добрая и улыбчивая шутка:

— Кто в Библии был самым успешным мореплавателем и строителем?
— Ной! Он построил надежный корабль задолго до того, как пошел дождь, и сохранил всю команду в целости!`;

      case 'hi':
        return `😄 यहाँ एक छोटा और प्यारा चुटकुला है:

— बाइबल में सबसे बड़ा वित्तीय प्रबंधक कौन था?
— नूह! क्योंकि जब पूरी दुनिया पानी में डूब रही थी, तब भी उनकी नाव तैर रही थी और सब सुरक्षित थे!`;

      case 'pa':
        return `😄 ਇਹ ਰਿਹਾ ਇੱਕ ਪਿਆਰਾ ਚੁਟਕਲਾ:

— ਬਾਈਬਲ ਵਿੱਚ ਸਭ ਤੋਂ ਵੱਡਾ ਯੋਜਨਾਕਾਰ ਕੌਣ ਸੀ?
— ਨੂਹ! ਕਿਉਂਕਿ ਮੀਂਹ ਪੈਣ ਤੋਂ ਪਹਿਲਾਂ ਹੀ ਉਸ ਨੇ ਸਭ ਤੋਂ ਮਜ਼ਬੂਤ ਕਿਸ਼ਤੀ ਤਿਆਰ ਕਰ ਲਈ ਸੀ!`;

      default:
        return `😄 Here is a wholesome little joke for you:

— Who was the greatest financier in the Bible?
— Noah! He managed to float his stock while the rest of the world was in liquidation!`;
    }
  }

  /**
   * Conversational Greeting ("How are you?")
   */
  static getConversationalGreeting(lang: SupportedLanguage): string {
    switch (lang) {
      case 'hy':
        return `Ողջույն։ Ես ինձ շատ լավ եմ զգում, շնորհակալություն հարցնելու համար։ 😊

Ես այստեղ եմ՝ օգնելու ձեզ ձեր քարոզչական ծառայության գրանցումների, նպատակների հաշվարկի կամ JW.ORG-ում հոգևոր նյութեր գտնելու հարցում։ Ինչպե՞ս է ընթանում ձեր ծառայությունն այս ամիս։`;

      case 'ru':
        return `Здравствуйте! У меня все отлично, большое спасибо, что спросили! 😊

Я готов помочь вам с учетом часов служения, расчетом целей, расписанием или поиском публикаций на JW.ORG. Как ваши успехи в служении в этом месяце?`;

      case 'hi':
        return `नमस्ते! मैं बिल्कुल ठीक हूँ, पूछने के लिए धन्यवाद! 😊

मैं आपकी सेवकाई के रिकॉर्ड, घंटों के लक्ष्य और JW.ORG पर सामग्री खोजने में मदद करने के लिए तैयार हूँ। इस महीने आपका प्रचार कैसा चल रहा है?`;

      case 'pa':
        return `ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ! ਮੈਂ ਬਿਲਕੁਲ ਠੀਕ ਹਾਂ, ਪੁੱਛਣ ਲਈ ਧੰਨਵਾਦ! 😊

ਮੈਂ ਤੁਹਾਡੇ ਪ੍ਰਚਾਰ ਦੇ ਘੰਟਿਆਂ ਦੇ ਟੀਚੇ ਅਤੇ JW.ORG ਤੋਂ ਜਾਣਕਾਰੀ ਲੱਭਣ ਵਿੱਚ ਮਦਦ ਲਈ ਤਿਆਰ ਹਾਂ। ਇਸ ਮਹੀਨੇ ਤੁਹਾਡੀ ਸੇਵਾ ਕਿਵੇਂ ਚੱਲ ਰਹੀ ਹੈ?`;

      default:
        return `Hello! I'm doing well, thank you for asking! 😊

I'm here and ready to help you with your ministry tracking, hours and goals, scheduling, or researching biblical topics and publications from JW.ORG. How is your field service going this month?`;
    }
  }

  /**
   * Self Introduction
   */
  static getSelfIntroduction(lang: SupportedLanguage): string {
    switch (lang) {
      case 'hy':
        return `Ես ձեր **Ministry AI** օգնականն եմ։ Ես կարող եմ.
• Հաշվարկել ձեր ծառայության ժամերը, նպատակները և մնացած ժամանակը
• Պատասխանել ձեր գրանցումների վերաբերյալ հարցերին (օրինակ՝ «Քանի՞ ուսումնասիրություն ունեմ»)
• Օգնել կազմել պլան, եթե հետ եք մնում ձեր նպատակից
• Գտնել պաշտոնական հոդվածներ, տեսանյութեր և սուրբգրային համարներ JW.ORG-ից`;

      case 'ru':
        return `Я ваш помощник **Ministry AI**. Я могу:
• Рассчитывать часы служения, оставшееся время до цели и темп
• Отвечать на вопросы по вашим записям (например: «Сколько у меня изучений Библии?»)
• Помогать составить график, если вы отстаете от цели на месяц
• Находить официальные статьи, видео и библейские стихи на JW.ORG`;

      case 'hi':
        return `मैं आपका **Ministry AI** सहायक हूँ। मैं कर सकता हूँ:
• आपके सेवकाई के घंटों, लक्ष्य और शेष समय की गणना करना
• आपके रिकॉर्ड के बारे में सवालों के जवाब देना (जैसे: «मेरे पास कितने बाइबल अध्ययन हैं?»)
• लक्ष्य से पीछे होने पर व्यावहारिक योजना बनाना
• JW.ORG से आधिकारिक लेख, वीडियो और वचन खोजना`;

      case 'pa':
        return `ਮੈਂ ਤੁਹਾਡਾ **Ministry AI** ਸਹਾਇਕ ਹਾਂ। ਮੈਂ ਕਰ ਸਕਦਾ ਹਾਂ:
• ਤੁਹਾਡੇ ਪ੍ਰਚਾਰ ਦੇ ਘੰਟੇ ਅਤੇ ਬਾਕੀ ਸਮੇਂ ਦਾ ਹਿਸਾਬ ਲਗਾਉਣਾ
• ਤੁਹਾਡੇ ਰਿਕਾਰਡ ਸੰਬੰਧੀ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ ਦੇਣਾ
• ਟੀਚਾ ਪੂਰਾ ਕਰਨ ਲਈ ਯੋਜਨਾ ਬਣਾਉਣਾ
• JW.ORG ਤੋਂ ਲੇਖ, ਵੀਡੀਓ ਅਤੇ ਬਾਈਬਲ ਹਵਾਲੇ ਲੱਭਣਾ`;

      default:
        return `I am your **Ministry AI** assistant. I can help you:
• Track and calculate your ministry hours, goals, and monthly progress
• Check your personal tracker records (e.g. "How many Bible studies do I have?")
• Provide realistic planning advice if you are behind on your ministry goal
• Research biblical topics, articles, and videos from JW.ORG`;
    }
  }

  /**
   * Synthesize Ministry Help reasoning with actual data & optional JW.ORG sources
   */
  static synthesizeMinistryHelp(
    dataSummary: string,
    sources: SearchResult[] | undefined,
    lang: SupportedLanguage
  ): string {
    const hasSources = sources && sources.length > 0;

    let response = '';
    switch (lang) {
      case 'hy':
        response = `Ես սիրով կօգնեմ ձեզ հասնել ձեր նպատակին։ Ահա ձեր ընթացիկ տվյալների վերլուծությունը.\n\n${dataSummary}\n\n**Գործնական Խորհուրդներ.**\n1. **Պլանավորեք ծառայությունը նախապես**՝ օրացույցում ավելացնելով կոնկրետ օրեր:\n2. **Օգտագործեք տարբեր ձևաչափեր**՝ առավոտյան քարոզչություն, վերայցելություններ կամ երեկոյան վկայություն:\n3. **Համագործակցեք այլ քարոզիչների հետ**՝ համատեղ ծառայությունը միշտ քաջալերող է:`;
        if (hasSources) {
          response += `\n\n---\n\n**Քաջալերանք JW.ORG-ից.**\n` +
            sources.map(s => `• **[${s.title}](${s.url})**\n  ${s.snippet}`).join('\n\n');
        }
        break;

      case 'ru':
        response = `Я с радостью помогу вам спланировать служение и достичь поставленной цели! Вот анализ ваших текущих данных:\n\n${dataSummary}\n\n**Практические шаги для выполнения цели:**\n1. **Запланируйте служение в календаре**: распределите оставшиеся часы на конкретные дни недели.\n2. **Совмещайте разные виды служения**: проповедь по домам, повторные посещения, неформальное свидетельствование или вечернее служение.\n3. **Договоритесь с напарником**: совместное служение с пионерами или возвещателями всегда придает сил и радости.\n4. **Помните об уравновешенности**: Иегова ценит наше искреннее служение от всей души (Кол. 3:23).`;
        if (hasSources) {
          response += `\n\n---\n\n**Ободрение с JW.ORG:**\n` +
            sources.map(s => `• **[${s.title}](${s.url})**\n  ${s.snippet}`).join('\n\n');
        }
        break;

      case 'hi':
        response = `मैं आपके प्रचार लक्ष्य को पूरा करने के लिए व्यावहारिक योजना बनाने में मदद करूँगा! यहाँ आपकी वर्तमान स्थिति का विश्लेषण है:\n\n${dataSummary}\n\n**व्यावहारिक सुझाव:**\n1. **कैलेंडर में योजना बनाएं**: शेष घंटों को सप्ताह के दिनों में विभाजित करें।\n2. **विभिन्न प्रकार की सेवा करें**: घर-घर का प्रचार, पुनः भेंट और शाम की गवाही।\n3. **अन्य प्रचारकों के साथ समय तय करें**: मिलकर सेवा करने से उत्साह बढ़ता है।`;
        if (hasSources) {
          response += `\n\n---\n\n**JW.ORG से प्रोत्साहन:**\n` +
            sources.map(s => `• **[${s.title}](${s.url})**\n  ${s.snippet}`).join('\n\n');
        }
        break;

      case 'pa':
        response = `ਮੈਂ ਤੁਹਾਡੇ ਪ੍ਰਚਾਰ ਦੇ ਟੀਚੇ ਨੂੰ ਪੂਰਾ ਕਰਨ ਲਈ ਯੋਜਨਾ ਬਣਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰਾਂਗਾ! ਇਹ ਰਿਹਾ ਤੁਹਾਡੇ ਰਿਕਾਰਡ ਦਾ ਵੇਰਵਾ:\n\n${dataSummary}\n\n**ਵਿਹਾਰਕ ਸੁਝਾਅ:**\n1. **ਕੈਲੰਡਰ ਵਿੱਚ ਸਮਾਂ ਤੈਅ ਕਰੋ**: ਬਾਕੀ ਘੰਟਿਆਂ ਨੂੰ ਦਿਨਾਂ ਵਿੱਚ ਵੰਡੋ।\n2. **ਵੱਖ-ਵੱਖ ਤਰੀਕਿਆਂ ਨਾਲ ਪ੍ਰਚਾਰ ਕਰੋ**: ਘਰ-ਘਰ ਪ੍ਰਚਾਰ ਅਤੇ ਮੁੜ-ਮੁਲਾਕਾਤਾਂ।\n3. **ਸਾਥੀਆਂ ਨਾਲ ਮਿਲ ਕੇ ਪ੍ਰਚਾਰ ਕਰੋ**: ਇਕੱਠੇ ਸੇਵਾ ਕਰਨ ਨਾਲ ਹੌਸਲਾ ਵਧਦਾ ਹੈ।`;
        if (hasSources) {
          response += `\n\n---\n\n**JW.ORG ਤੋਂ ਹੌਸਲਾ:**\n` +
            sources.map(s => `• **[${s.title}](${s.url})**\n  ${s.snippet}`).join('\n\n');
        }
        break;

      default:
        response = `I would be happy to help you with practical planning to reach your ministry goal! Here is a summary of your current progress:\n\n${dataSummary}\n\n**Practical Suggestions to Catch Up:**\n1. **Schedule Specific Service Blocks**: Add planned arrangements in your Calendar tab for mornings, afternoons, or weekends.\n2. **Vary Your Ministry**: Combine door-to-door witnessing with return visits, informal witnessing, and evening cart or phone witnessing.\n3. **Partner Up**: Arrange to work with another pioneer or publisher to keep each other encouraged and motivated.\n4. **Maintain Balance**: Remember that Jehovah values whole-souled service (Colossians 3:23). Do what you reasonably can within your personal circumstances!`;
        if (hasSources) {
          response += `\n\n---\n\n**Encouraging Thoughts from JW.ORG:**\n` +
            sources.map(s => `• **[${s.title}](${s.url})**\n  ${s.snippet}`).join('\n\n');
        }
        break;
    }

    return response;
  }

  /**
   * Default helpful response for other inquiries
   */
  static getDefaultHelpfulResponse(query: string, lang: SupportedLanguage): string {
    switch (lang) {
      case 'hy':
        return `Շնորհակալություն ձեր հարցի համար։ Ես կարող եմ օգնել ձեզ ստուգել ձեր ծառայության գրանցումները, հաշվարկել նպատակները կամ փնտրել հոգևոր նյութեր JW.ORG-ում։ Ինչպե՞ս կարող եմ օգտակար լինել։`;
      case 'ru':
        return `Спасибо за ваш вопрос! Я могу помочь вам проверить записи служения, рассчитать часы и цели, или найти библейские статьи на JW.ORG. Чем я могу вам помочь?`;
      case 'hi':
        return `आपके प्रश्न के लिए धन्यवाद! मैं आपकी सेवकाई के रिकॉर्ड की जांच करने, घंटों की गणना करने या JW.ORG पर सामग्री खोजने में मदद कर सकता हूँ।`;
      case 'pa':
        return `ਤੁਹਾਡੇ ਸਵਾਲ ਲਈ ਧੰਨਵਾਦ! ਮੈਂ ਤੁਹਾਡੇ ਪ੍ਰਚਾਰ ਦੇ ਰਿਕਾਰਡ ਦੀ ਜਾਂਚ ਕਰਨ ਜਾਂ JW.ORG ਤੋਂ ਜਾਣਕਾਰੀ ਲੱਭਣ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ।`;
      default:
        return `Thank you for your question! I can help you check your ministry records, calculate remaining goal hours, or research publications and scriptures from JW.ORG. How can I assist you today?`;
    }
  }
}
