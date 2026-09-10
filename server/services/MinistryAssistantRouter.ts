import { MinistryAssistant } from './MinistryAssistant.js';
import { JWOrgService } from './JWOrgService.js';
import { WOLService } from './WOLService.js';
import { SearchResult } from './types.js';

export type CategoryType =
  | 'MINISTRY_PROGRESS'
  | 'MINISTRY_HOURS'
  | 'MINISTRY_GOAL'
  | 'MINISTRY_HISTORY'
  | 'MINISTRY_SCHEDULE'
  | 'MINISTRY_TIPS'
  | 'JW_SEARCH'
  | 'WOL_SEARCH'
  | 'JW_SOURCE'
  | 'COMBINED'
  | 'GENERAL';

export class MinistryAssistantRouter {
  /**
   * Classifies user prompt into specific intent categories
   */
  static classifyRequest(message: string): { primaryCategory: CategoryType; isCombined: boolean } {
    const lower = message.toLowerCase().trim();

    const isProgress =
      lower.includes('progress') ||
      lower.includes('doing') ||
      lower.includes('how am i') ||
      lower.includes('summary') ||
      lower.includes('overview') ||
      lower.includes('month');

    const isHours =
      lower.includes('hour') ||
      lower.includes('left') ||
      lower.includes('remaining') ||
      lower.includes('completed') ||
      lower.includes('how many hours');

    const isGoal =
      lower.includes('goal') ||
      lower.includes('target') ||
      lower.includes('status') ||
      lower.includes('pioneer');

    const isHistory =
      lower.includes('history') ||
      lower.includes('yesterday') ||
      lower.includes('recent') ||
      lower.includes('logged') ||
      lower.includes('entries') ||
      lower.includes('records');

    const isSchedule =
      lower.includes('schedule') ||
      lower.includes('calendar') ||
      lower.includes('tomorrow') ||
      lower.includes('weekend') ||
      lower.includes('arrangement') ||
      lower.includes('upcoming') ||
      lower.includes('meeting for field');

    const isTips =
      lower.includes('tip') ||
      lower.includes('suggestion') ||
      lower.includes('behind') ||
      lower.includes('improve') ||
      lower.includes('pace') ||
      lower.includes('advice');

    const isJWSearch =
      lower.includes('jw.org') ||
      lower.includes('article') ||
      lower.includes('find') ||
      lower.includes('show me') ||
      lower.includes('suffering') ||
      lower.includes('hope') ||
      lower.includes('kingdom') ||
      lower.includes('resurrection') ||
      lower.includes('bible study') ||
      lower.includes('anxiety') ||
      lower.includes('stress') ||
      lower.includes('family') ||
      lower.includes('creation');

    const isWOLSearch =
      lower.includes('wol') ||
      lower.includes('watchtower library') ||
      lower.includes('insight') ||
      lower.includes('research guide');

    const isJWSource = lower.includes('open') && (lower.includes('jw.org') || lower.includes('wol'));

    const researchCount = (isJWSearch ? 1 : 0) + (isWOLSearch ? 1 : 0);
    const progressCount = (isProgress ? 1 : 0) + (isHours ? 1 : 0) + (isGoal ? 1 : 0) + (isHistory ? 1 : 0) + (isSchedule ? 1 : 0) + (isTips ? 1 : 0);

    const isCombined = researchCount > 0 && progressCount > 0;

    if (isCombined) return { primaryCategory: 'COMBINED', isCombined: true };
    if (isJWSource) return { primaryCategory: 'JW_SOURCE', isCombined: false };
    if (isWOLSearch) return { primaryCategory: 'WOL_SEARCH', isCombined: false };
    if (isJWSearch) return { primaryCategory: 'JW_SEARCH', isCombined: false };
    if (isHours) return { primaryCategory: 'MINISTRY_HOURS', isCombined: false };
    if (isGoal) return { primaryCategory: 'MINISTRY_GOAL', isCombined: false };
    if (isHistory) return { primaryCategory: 'MINISTRY_HISTORY', isCombined: false };
    if (isSchedule) return { primaryCategory: 'MINISTRY_SCHEDULE', isCombined: false };
    if (isTips) return { primaryCategory: 'MINISTRY_TIPS', isCombined: false };
    if (isProgress) return { primaryCategory: 'MINISTRY_PROGRESS', isCombined: false };

    return { primaryCategory: 'GENERAL', isCombined: false };
  }

  /**
   * Main router entry point to process requests deterministically
   */
  static async handleRequest(
    message: string,
    userContext: any,
    language: string = 'en'
  ): Promise<{ answer: string; sources: SearchResult[]; suggestedFollowUps: string[] }> {
    const { primaryCategory, isCombined } = this.classifyRequest(message);
    const cleanMsg = message.trim();

    let answerParts: string[] = [];
    let sources: SearchResult[] = [];
    let suggestedFollowUps: string[] = [];

    // Execute combined or category-specific logic
    if (isCombined) {
      const progressText = MinistryAssistant.getCurrentMinistryProgress(userContext, language);
      const tipsText = MinistryAssistant.generateMinistryTips(userContext, language);
      answerParts.push(progressText);
      answerParts.push(tipsText);

      // Perform research search
      const [jwRes, wolRes] = await Promise.all([
        JWOrgService.searchJWOrg(cleanMsg, language),
        WOLService.searchWOL(cleanMsg, language),
      ]);
      sources = [...jwRes, ...wolRes].slice(0, 4);

      if (sources.length > 0) {
        const researchHeader = language === 'hy' ? '📚 **Առաջարկվող Հոդվածներ JW.ORG / WOL-ից**:'
          : language === 'ru' ? '📚 **Рекомендуемые статьи с JW.ORG / WOL**:'
          : language === 'hi' ? '📚 **JW.ORG / WOL से अनुशंसित लेख**:'
          : language === 'pa' ? '📚 **JW.ORG / WOL ਤੋਂ ਸਿਫ਼ਾਰਸ਼ ਕੀਤੇ ਲੇਖ**:'
          : '📚 **Recommended JW.ORG & Watchtower Library Articles**:';
        answerParts.push(researchHeader);
      }
    } else {
      switch (primaryCategory) {
        case 'MINISTRY_PROGRESS':
          answerParts.push(MinistryAssistant.getCurrentMinistryProgress(userContext, language));
          break;

        case 'MINISTRY_HOURS':
          answerParts.push(MinistryAssistant.getRemainingHours(userContext, language));
          break;

        case 'MINISTRY_GOAL':
          answerParts.push(MinistryAssistant.getMinistryGoal(userContext, language));
          break;

        case 'MINISTRY_HISTORY':
          answerParts.push(MinistryAssistant.getActivityHistory(userContext, 5, language));
          break;

        case 'MINISTRY_SCHEDULE':
          answerParts.push(MinistryAssistant.getMinistrySchedule(userContext, language));
          break;

        case 'MINISTRY_TIPS':
          answerParts.push(MinistryAssistant.getCurrentMinistryProgress(userContext, language));
          answerParts.push(MinistryAssistant.generateMinistryTips(userContext, language));
          break;

        case 'JW_SEARCH': {
          const jwResults = await JWOrgService.searchJWOrg(cleanMsg, language);
          sources = jwResults;
          if (sources.length > 0) {
            const header = language === 'hy' ? `Գտնվել է **${sources.length}** հոդված JW.ORG-ում.`
              : language === 'ru' ? `Найдено **${sources.length}** материалов на JW.ORG:`
              : language === 'hi' ? `JW.ORG पर **${sources.length}** लेख मिले:`
              : language === 'pa' ? `JW.ORG 'ਤੇ **${sources.length}** ਲੇਖ ਮਿਲੇ:`
              : `Found **${sources.length}** relevant articles on official JW.ORG:`;
            answerParts.push(header);
          } else {
            answerParts.push(language === 'hy' ? 'JW.ORG-ում համապատասխան հոդվածներ չեն գտնվել:' : 'No relevant JW.ORG results were found for this query.');
          }
          break;
        }

        case 'WOL_SEARCH': {
          const wolResults = await WOLService.searchWOL(cleanMsg, language);
          sources = wolResults;
          if (sources.length > 0) {
            const header = language === 'hy' ? `Գտնվել է **${sources.length}** նյութ Դիտարանի Օնլայն Գրադարանում (WOL.JW.ORG):`
              : language === 'ru' ? `Найдено **${sources.length}** материалов в Онлайн-библиотеке Сторожевой Башни (WOL.JW.ORG):`
              : language === 'hi' ? `वाचटावर ऑनलाइन लाइब्रेरी (WOL.JW.ORG) में **${sources.length}** परिणाम मिले:`
              : language === 'pa' ? `ਵਾਚਟਾਵਰ ਆਨਲਾਈਨ ਲਾਇਬ੍ਰੇਰੀ (WOL.JW.ORG) 'ਤੇ **${sources.length}** ਨਤੀਜੇ ਮਿਲੇ:`
              : `Found **${sources.length}** research entries on Watchtower Online Library (WOL.JW.ORG):`;
            answerParts.push(header);
          } else {
            answerParts.push('No relevant Watchtower Online Library (WOL.JW.ORG) results were found for this query.');
          }
          break;
        }

        case 'JW_SOURCE':
          answerParts.push('Opening official JW publication source page.');
          break;

        default:
          answerParts.push(this.getGeneralGreeting(language));
          break;
      }
    }

    // Set dynamic suggested questions based on intent category
    if (primaryCategory.startsWith('MINISTRY')) {
      suggestedFollowUps = [
        'How many hours do I have left?',
        'Give me some tips.',
        'Find an article about encouraging Bible students on JW.ORG.',
      ];
    } else {
      suggestedFollowUps = [
        'How am I doing this month?',
        'How many hours do I have left?',
        'Search WOL for prayer.',
      ];
    }

    return {
      answer: answerParts.join('\n\n'),
      sources,
      suggestedFollowUps,
    };
  }

  private static getGeneralGreeting(lang: string = 'en'): string {
    switch (lang) {
      case 'hy':
        return `Ողջույն։ Ես **JW Ministry Assistant**-ն եմ։
Ես պատրաստ եմ օգնել ձեզ՝
- **Ծառայության Առաջընթաց**՝ Վերլուծել ձեր ժամերը, նպատակները, վերայցելությունները և ուսումնասիրությունները։
- **JW.ORG և WOL Որոնում**՝ Գտնել հոդվածներ և նյութեր **JW.ORG** և **WOL.JW.ORG** կայքերում։

Ինչպե՞ս կարող եմ օգնել ձեզ այսօր։`;

      case 'ru':
        return `Здравствуйте! Я **JW Ministry Assistant**.
Я готов помочь вам:
- **Прогресс в Служении**: Анализ ваших часов, целей, повторных посещений и изучений Библии.
- **Поиск на JW.ORG и WOL**: Поиск статей и исследований на **JW.ORG** и **WOL.JW.ORG**.

Чем я могу помочь вам сегодня?`;

      case 'hi':
        return `नमस्ते! मैं **JW Ministry Assistant** हूँ।
मैं आपकी सहायता के लिए तैयार हूँ:
- **प्रचार प्रगति**: अपने घंटों, लक्ष्यों, पुनः भेटों और बाइबल अध्ययनों का विश्लेषण करें।
- **JW.ORG और WOL खोज**: **JW.ORG** और **WOL.JW.ORG** पर लेख खोजें।

आज मैं आपकी क्या सहायता कर सकता हूँ?`;

      case 'pa':
        return `ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ! ਮੈਂ **JW Ministry Assistant** ਹਾਂ।
ਮੈਂ ਤੁਹਾਡੀ ਮਦਦ ਕਰਨ ਲਈ ਤਿਆਰ ਹਾਂ:
- **ਪ੍ਰਚਾਰ ਦੀ ਤਰੱਕੀ**: ਆਪਣੇ ਘੰਟੇ, ਨਿਸ਼ਾਨੇ, ਮੁੜ-ਮੁਲਾਕਾਤਾਂ ਅਤੇ ਬਾਈਬਲ ਸਟੱਡੀਆਂ ਵੇਖੋ।
- **JW.ORG ਅਤੇ WOL ਖੋਜ**: **JW.ORG** ਅਤੇ **WOL.JW.ORG** 'ਤੇ ਲੇਖ ਖੋਜੋ।

ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?`;

      default:
        return `Hello! I am **JW Ministry Assistant**.
I am here to assist you with:
- **Ministry Tracker Progress**: Analyzing your monthly hours, goals, return visits, Bible studies, and placements.
- **JW.ORG & WOL Research**: Locating official articles and study materials on **JW.ORG** and **WOL.JW.ORG**.

How can I assist your ministry today?`;
    }
  }
}
