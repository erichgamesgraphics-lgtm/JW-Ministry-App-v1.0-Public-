import { MinistryAssistant } from './MinistryAssistant.js';
import { JWOrgService } from './JWOrgService.js';
import { WOLService } from './WOLService.js';
import { LanguageService } from './LanguageService.js';
import type { CategoryType, ScriptureMatch, SearchResult, ChatHistoryMessage } from './types.js';
import { SupportedLanguage } from '../../src/types.js';

export type { CategoryType };

export class MinistryAssistantRouter {
  /**
   * Classifies user prompt into specific intent categories using centralized LanguageService
   */
  static classifyRequest(
    message: string,
    lang: SupportedLanguage,
    hasPreviousResults: boolean = false
  ): { primaryCategory: CategoryType; isCombined: boolean; searchQuery: string } {
    return LanguageService.getLocalizedIntent(message, lang, hasPreviousResults);
  }

  /**
   * Main router entry point to process requests deterministically in any supported language
   */
  static async handleRequest(
    message: string,
    userContext: any,
    requestedLanguage: string = 'en',
    conversationHistory: ChatHistoryMessage[] = []
  ): Promise<{ answer: string; sources: SearchResult[]; suggestedFollowUps: string[] }> {
    // 1. Centralized language detection & normalization
    const detected = LanguageService.detectLanguage(message, requestedLanguage);
    const targetLang: SupportedLanguage = detected !== 'en' ? detected : LanguageService.normalizeLanguage(requestedLanguage);

    const hasPreviousResults = conversationHistory.some(m => m.sources && m.sources.length > 0);
    const { primaryCategory, isCombined, searchQuery } = this.classifyRequest(message, targetLang, hasPreviousResults);

    let answerParts: string[] = [];
    let sources: SearchResult[] = [];

    // 2. Handle Follow-up questions referencing previous conversation
    if (primaryCategory === 'FOLLOW_UP') {
      const lastAssistantWithSources = [...conversationHistory].reverse().find(m => m.role === 'assistant' && m.sources && m.sources.length > 0);
      const prevSources = lastAssistantWithSources?.sources || [];

      if (prevSources.length > 0) {
        const lower = message.toLowerCase();
        // Check if user is asking about youth / young people
        const isAskingYouth = lower.includes('young') || lower.includes('youth') || lower.includes('teen') || lower.includes('молодеж') || lower.includes('երիտասարդ') || lower.includes('युवा') || lower.includes('ਨੌਜਵਾਨ');
        // Check if asking about the first article
        const isAskingFirst = lower.includes('first') || lower.includes('перв') || lower.includes('առաջին') || lower.includes('पहला') || lower.includes('ਪਹਿਲਾ');

        if (isAskingYouth) {
          const youthArticle = prevSources.find(s =>
            (s.topicKeywords && s.topicKeywords.some(k => k.includes('youth') || k.includes('young'))) ||
            s.title.toLowerCase().includes('young') || s.title.toLowerCase().includes('youth') || s.title.toLowerCase().includes('молодеж')
          ) || prevSources[0];

          sources = [youthArticle];
          const responseHeader =
            targetLang === 'hy'
              ? `Երիտասարդների համար հատկապես օգտակար է հետևյալ հոդվածը՝ **«${youthArticle.title}»**:\n\nԱյն քննարկում է գործնական հարցեր և առաջարկում աստվածաշնչյան առաջնորդություն։`
              : targetLang === 'ru'
              ? `Для молодежи и подростков особенно подойдет материал **«${youthArticle.title}»**:\n\nВ нем рассматриваются практические библейские советы для преодоления трудностей и укрепления веры.`
              : targetLang === 'hi'
              ? `युवाओं के लिए विशेष रूप से यह लेख सबसे उपयुक्त है: **«${youthArticle.title}»**:\n\nयह व्यावहारिक मार्गदर्शन और विश्वास को मजबूत करने वाले बाइबल सिद्धांत प्रस्तुत करता है।`
              : targetLang === 'pa'
              ? `ਨੌਜਵਾਨਾਂ ਲਈ ਵਿਸ਼ੇਸ਼ ਤੌਰ 'ਤੇ ਇਹ ਲੇਖ ਸਭ ਤੋਂ ਵਧੀਆ ਹੈ: **«${youthArticle.title}»**:\n\nਇਹ ਬਾਈਬਲ ਦੇ ਵਿਹਾਰਕ ਅਸੂਲਾਂ ਬਾਰੇ ਦੱਸਦਾ ਹੈ।`
              : `For young people, the article **"${youthArticle.title}"** is especially well-suited:\n\nIt provides practical, Bible-based advice for addressing challenges and building a strong personal relationship with God.`;

          answerParts.push(responseHeader);
        } else if (isAskingFirst) {
          const firstArticle = prevSources[0];
          sources = [firstArticle];
          const explanation =
            targetLang === 'hy'
              ? `Մանրամասներ առաջին հոդվածի մասին՝ **«${firstArticle.title}»**:\n\n${firstArticle.snippet}\n\nՀրատարակություն՝ *${firstArticle.publication || 'JW.ORG'}*`
              : targetLang === 'ru'
              ? `Подробнее о первой статье **«${firstArticle.title}»**:\n\n${firstArticle.snippet}\n\nПубликация: *${firstArticle.publication || 'JW.ORG'}*`
              : targetLang === 'hi'
              ? `पहले लेख के बारे में अधिक जानकारी: **«${firstArticle.title}»**:\n\n${firstArticle.snippet}\n\nप्रकाशन: *${firstArticle.publication || 'JW.ORG'}*`
              : targetLang === 'pa'
              ? `ਪਹਿਲੇ ਲੇਖ ਬਾਰੇ ਹੋਰ ਜਾਣਕਾਰੀ: **«${firstArticle.title}»**:\n\n${firstArticle.snippet}\n\nਪ੍ਰਕਾਸ਼ਨ: *${firstArticle.publication || 'JW.ORG'}*`
              : `Here are more details about the first article, **"${firstArticle.title}"**:\n\n${firstArticle.snippet}\n\nPublished in: *${firstArticle.publication || 'JW.ORG'}*`;

          answerParts.push(explanation);
        } else {
          // General follow-up comparison of previous sources
          sources = prevSources;
          const summary =
            targetLang === 'hy'
              ? `Նախորդ որոնման արդյունքներում ներառված հոդվածները համապարփակ լուսաբանում են այս թեման։ Կարող եք ընտրել այն, որն առավել համապատասխանում է ձեր ներկա կարիքին։`
              : targetLang === 'ru'
              ? `Материалы из предыдущего поиска всесторонне освещают эту тему. Вы можете выбрать наиболее подходящую статью для более глубокого рассмотрения.`
              : targetLang === 'hi'
              ? `पिछली खोज में मिले लेख इस विषय पर व्यापक प्रकाश डालते हैं। आप अपनी आवश्यकता के अनुसार उपयुक्त लेख चुन सकते हैं।`
              : targetLang === 'pa'
              ? `ਪਿਛਲੀ ਖੋਜ ਵਿੱਚ ਮਿਲੇ ਲੇਖ ਇਸ ਵਿਸ਼ੇ 'ਤੇ ਚੰਗੀ ਜਾਣਕਾਰੀ ਦਿੰਦੇ ਹਨ।`
              : `The articles retrieved from your search address this topic thoroughly. You can review each source for deeper meditation and practical application in your personal study.`;

          answerParts.push(summary);
        }
      } else {
        // No previous sources found to follow up on, redirect to search
        const fallbackResults = await JWOrgService.searchJWOrg(searchQuery, targetLang);
        sources = fallbackResults;
        if (sources.length > 0) {
          answerParts.push(`**JW.ORG**:`);
        } else {
          answerParts.push(LanguageService.getNoResultsMessage(searchQuery, targetLang, 'JW.ORG'));
        }
      }
    }

    // 3. Handle Scripture / Bible Search
    else if (primaryCategory === 'BIBLE_SEARCH') {
      const scriptureMatch: ScriptureMatch | null = LanguageService.extractScriptureReference(message);
      const scriptureRef = scriptureMatch ? scriptureMatch.rawReference : searchQuery;

      // Online Bible URL on JW.ORG
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
    }

    // 4. Combined Tracker + Research Request
    else if (isCombined) {
      const progressText = MinistryAssistant.getCurrentMinistryProgress(userContext, targetLang);
      const tipsText = MinistryAssistant.generateMinistryTips(userContext, targetLang);
      answerParts.push(progressText);
      answerParts.push(tipsText);

      const [jwRes, wolRes] = await Promise.all([
        JWOrgService.searchJWOrg(searchQuery, targetLang),
        WOLService.searchWOL(searchQuery, targetLang),
      ]);
      sources = [...jwRes, ...wolRes].slice(0, 4);

      if (sources.length > 0) {
        const researchHeader =
          targetLang === 'hy'
            ? '📚 **Համապատասխան Հոդվածներ JW.ORG / WOL-ից**:'
            : targetLang === 'ru'
            ? '📚 **Рекомендуемые статьи с JW.ORG / WOL**:'
            : targetLang === 'hi'
            ? '📚 **JW.ORG / WOL से अनुशंसित लेख**:'
            : targetLang === 'pa'
            ? '📚 **JW.ORG / WOL ਤੋਂ ਸਿਫ਼ਾਰਸ਼ ਕੀਤੇ ਲੇਖ**:'
            : '📚 **Recommended JW.ORG & Watchtower Library Articles**:';
        answerParts.push(researchHeader);
      }
    }

    // 5. Categorical handling
    else {
      switch (primaryCategory) {
        case 'MINISTRY_PROGRESS':
          answerParts.push(MinistryAssistant.getCurrentMinistryProgress(userContext, targetLang));
          break;

        case 'MINISTRY_HOURS':
          answerParts.push(MinistryAssistant.getRemainingHours(userContext, targetLang));
          break;

        case 'MINISTRY_GOAL':
          answerParts.push(MinistryAssistant.getMinistryGoal(userContext, targetLang));
          break;

        case 'MINISTRY_HISTORY':
          answerParts.push(MinistryAssistant.getActivityHistory(userContext, 5, targetLang));
          break;

        case 'MINISTRY_SCHEDULE':
          answerParts.push(MinistryAssistant.getMinistrySchedule(userContext, targetLang));
          break;

        case 'MINISTRY_TIPS':
          answerParts.push(MinistryAssistant.getCurrentMinistryProgress(userContext, targetLang));
          answerParts.push(MinistryAssistant.generateMinistryTips(userContext, targetLang));
          break;

        case 'JW_SEARCH': {
          const jwResults = await JWOrgService.searchJWOrg(searchQuery, targetLang);
          sources = jwResults;

          if (sources.length > 0) {
            const header =
              targetLang === 'hy'
                ? `Գտնվել են հետևյալ պաշտոնական հոդվածները **JW.ORG** կայքում («**${searchQuery}**» թեմայով):`
                : targetLang === 'ru'
                ? `На официальном сайте **JW.ORG** найдены следующие материалы по теме «**${searchQuery}**»:`
                : targetLang === 'hi'
                ? `**JW.ORG** पर «**${searchQuery}**» से संबंधित निम्नलिखित लेख मिले:`
                : targetLang === 'pa'
                ? `**JW.ORG** 'ਤੇ «**${searchQuery}**» ਸੰਬੰਧੀ ਹੇਠਾਂ ਦਿੱਤੇ ਲੇਖ ਮਿਲੇ:`
                : `Found the following official publications and articles on **JW.ORG** for "**${searchQuery}**":`;

            answerParts.push(header);

            // Add brief key takeaways from the top articles
            const highlights = sources.map(s => {
              const scriptureNote = s.bibleVerses && s.bibleVerses.length > 0 ? ` (📖 ${s.bibleVerses.join(', ')})` : '';
              return `• **[${s.title}](${s.url})**${scriptureNote}\n  ${s.snippet}`;
            }).join('\n\n');

            answerParts.push(highlights);
          } else {
            answerParts.push(LanguageService.getNoResultsMessage(searchQuery, targetLang, 'JW.ORG'));
          }
          break;
        }

        case 'WOL_SEARCH': {
          const wolResults = await WOLService.searchWOL(searchQuery, targetLang);
          sources = wolResults;

          if (sources.length > 0) {
            const header =
              targetLang === 'hy'
                ? `Գտնվել են հետևյալ նյութերը **Դիտարանի Օնլայն Գրադարանում (WOL.JW.ORG)** («**${searchQuery}**» թեմայով):`
                : targetLang === 'ru'
                ? `В **Онлайн-библиотеке Сторожевой Башни (WOL.JW.ORG)** найдены следующие материалы по запросу «**${searchQuery}**»:`
                : targetLang === 'hi'
                ? `**वाचटावर ऑनलाइन लाइब्रेरी (WOL.JW.ORG)** में «**${searchQuery}**» के लिए निम्नलिखित परिणाम मिले:`
                : targetLang === 'pa'
                ? `**ਵਾਚਟਾਵਰ ਆਨਲਾਈਨ ਲਾਇਬ੍ਰੇਰੀ (WOL.JW.ORG)** 'ਤੇ «**${searchQuery}**» ਲਈ ਹੇਠਾਂ ਦਿੱਤੀ ਜਾਣਕਾਰੀ ਮਿਲੀ:`
                : `Watchtower Online Library (WOL.JW.ORG) research results for "**${searchQuery}**":`;

            answerParts.push(header);

            const highlights = sources.map(s => {
              return `• **[${s.title}](${s.url})**\n  ${s.snippet}`;
            }).join('\n\n');

            answerParts.push(highlights);
          } else {
            answerParts.push(LanguageService.getNoResultsMessage(searchQuery, targetLang, 'WOL.JW.ORG'));
          }
          break;
        }

        default:
          answerParts.push(LanguageService.getGeneralGreeting(targetLang));
          break;
      }
    }

    // Dynamic suggestions based on context and language
    const suggestedFollowUps = LanguageService.getLocalizedSuggestions(targetLang, primaryCategory);

    return {
      answer: answerParts.join('\n\n'),
      sources,
      suggestedFollowUps,
    };
  }
}
