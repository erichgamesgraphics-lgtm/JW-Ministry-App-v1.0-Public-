import { MinistryAssistant } from './MinistryAssistant.js';
import { JWOrgService } from './JWOrgService.js';
import { WOLService } from './WOLService.js';
import { LanguageService } from './LanguageService.js';
import { SearchResult } from './types.js';
import { SupportedLanguage } from '../../src/types.js';

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
   * Classifies user prompt into specific intent categories using centralized LanguageService
   */
  static classifyRequest(message: string, lang: SupportedLanguage): { primaryCategory: CategoryType; isCombined: boolean } {
    return LanguageService.getLocalizedIntent(message, lang);
  }

  /**
   * Main router entry point to process requests deterministically in any supported language
   */
  static async handleRequest(
    message: string,
    userContext: any,
    requestedLanguage: string = 'en'
  ): Promise<{ answer: string; sources: SearchResult[]; suggestedFollowUps: string[] }> {
    // 1. Centralized language detection & normalization
    const detected = LanguageService.detectLanguage(message, requestedLanguage);
    const targetLang: SupportedLanguage = detected !== 'en' ? detected : LanguageService.normalizeLanguage(requestedLanguage);

    const { primaryCategory, isCombined } = this.classifyRequest(message, targetLang);
    const cleanMsg = message.trim();

    let answerParts: string[] = [];
    let sources: SearchResult[] = [];

    // Execute combined or category-specific logic
    if (isCombined) {
      const progressText = MinistryAssistant.getCurrentMinistryProgress(userContext, targetLang);
      const tipsText = MinistryAssistant.generateMinistryTips(userContext, targetLang);
      answerParts.push(progressText);
      answerParts.push(tipsText);

      // Perform research search
      const [jwRes, wolRes] = await Promise.all([
        JWOrgService.searchJWOrg(cleanMsg, targetLang),
        WOLService.searchWOL(cleanMsg, targetLang),
      ]);
      sources = [...jwRes, ...wolRes].slice(0, 4);

      if (sources.length > 0) {
        const researchHeader =
          targetLang === 'hy'
            ? '📚 **Առաջարկվող Հոդվածներ JW.ORG / WOL-ից**:'
            : targetLang === 'ru'
            ? '📚 **Рекомендуемые статьи с JW.ORG / WOL**:'
            : targetLang === 'hi'
            ? '📚 **JW.ORG / WOL से अनुशंसित लेख**:'
            : targetLang === 'pa'
            ? '📚 **JW.ORG / WOL ਤੋਂ ਸਿਫ਼ਾਰਸ਼ ਕੀਤੇ ਲੇਖ**:'
            : '📚 **Recommended JW.ORG & Watchtower Library Articles**:';
        answerParts.push(researchHeader);
      }
    } else {
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
          const jwResults = await JWOrgService.searchJWOrg(cleanMsg, targetLang);
          sources = jwResults;
          if (sources.length > 0) {
            const header =
              targetLang === 'hy'
                ? `Գտնվել է **${sources.length}** հոդված JW.ORG-ում.`
                : targetLang === 'ru'
                ? `Найдено **${sources.length}** материалов на JW.ORG:`
                : targetLang === 'hi'
                ? `JW.ORG पर **${sources.length}** लेख मिले:`
                : targetLang === 'pa'
                ? `JW.ORG 'ਤੇ **${sources.length}** ਲੇਖ ਮਿਲੇ:`
                : `Found **${sources.length}** relevant articles on official JW.ORG:`;
            answerParts.push(header);
          } else {
            answerParts.push(
              targetLang === 'hy'
                ? 'JW.ORG-ում համապատասխան հոդվածներ չեն գտնվել:'
                : targetLang === 'ru'
                ? 'На JW.ORG не найдено соответствующих статей.'
                : targetLang === 'hi'
                ? 'JW.ORG पर कोई संबंधित लेख नहीं मिला।'
                : targetLang === 'pa'
                ? "JW.ORG 'ਤੇ ਕੋਈ ਲեխ ਨਹੀਂ ਮਿਲਿਆ।"
                : 'No relevant JW.ORG results were found for this query.'
            );
          }
          break;
        }

        case 'WOL_SEARCH': {
          const wolResults = await WOLService.searchWOL(cleanMsg, targetLang);
          sources = wolResults;
          if (sources.length > 0) {
            const header =
              targetLang === 'hy'
                ? `Գտնվել է **${sources.length}** նյութ Դիտարանի Օնլայն Գրադարանում (WOL.JW.ORG):`
                : targetLang === 'ru'
                ? `Найдено **${sources.length}** материалов в Онлайн-библиотеке Сторожевой Башни (WOL.JW.ORG):`
                : targetLang === 'hi'
                ? `वाचटावर ऑनलाइन लाइब्रेरी (WOL.JW.ORG) में **${sources.length}** परिणाम मिले:`
                : targetLang === 'pa'
                ? `ਵਾਚਟਾਵਰ ਆਨਲਾਈਨ ਲਾਇਬ੍ਰੇਰੀ (WOL.JW.ORG) 'ਤੇ **${sources.length}** ਨਤੀਜੇ ਮਿਲੇ:`
                : `Found **${sources.length}** research entries on Watchtower Online Library (WOL.JW.ORG):`;
            answerParts.push(header);
          } else {
            answerParts.push(
              targetLang === 'hy'
                ? 'WOL.JW.ORG-ում համապատասխան նյութեր չեն գտնվել:'
                : targetLang === 'ru'
                ? 'В Онлайн-библиотеке WOL.JW.ORG ничего не найдено.'
                : targetLang === 'hi'
                ? 'वाचटावर ऑनलाइन लाइब्रेरी (WOL.JW.ORG) में कोई परिणाम नहीं मिला।'
                : targetLang === 'pa'
                ? "WOL.JW.ORG 'ਤੇ ਕੋਈ ਨਤੀਜੇ ਨਹੀਂ ਮਿਲੇ।"
                : 'No relevant Watchtower Online Library (WOL.JW.ORG) results were found for this query.'
            );
          }
          break;
        }

        case 'JW_SOURCE':
          answerParts.push(
            targetLang === 'hy'
              ? 'Բացվում է JW.ORG պաշտոնական էջը։'
              : targetLang === 'ru'
              ? 'Открывается официальная страница публикаций JW.ORG.'
              : targetLang === 'hi'
              ? 'आधिकारिक JW.ORG पृष्ठ खोला जा रहा है।'
              : targetLang === 'pa'
              ? 'ਅਧਿਕਾਰਤ JW.ORG ਪੰਨਾ ਖੋਲ੍ਹਿਆ ਜਾ ਰਿਹਾ ਹੈ।'
              : 'Opening official JW publication source page.'
          );
          break;

        default:
          answerParts.push(LanguageService.getGeneralGreeting(targetLang));
          break;
      }
    }

    // Dynamic suggestions based on LanguageService
    const suggestedFollowUps = LanguageService.getLocalizedSuggestions(targetLang, primaryCategory);

    return {
      answer: answerParts.join('\n\n'),
      sources,
      suggestedFollowUps,
    };
  }
}
