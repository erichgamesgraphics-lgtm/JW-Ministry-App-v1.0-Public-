import { MinistryAssistant } from './MinistryAssistant.js';
import { SupportedLanguage } from '../../src/types.js';

export type TrackerToolCategory =
  | 'PERSONAL_HOURS'
  | 'PERSONAL_GOAL'
  | 'PERSONAL_SCHEDULE'
  | 'PERSONAL_PROGRESS'
  | 'PERSONAL_HISTORY'
  | 'PERSONAL_TIPS'
  | 'PERSONAL_STUDIES'
  | 'PERSONAL_VISITS';

export class MinistryTrackerDataTools {
  /**
   * Tool 1: Get Personal Hours Data
   * Retrieves logged hours, remaining target hours, and pace.
   */
  static getHours(userContext: any, lang: SupportedLanguage): string {
    return MinistryAssistant.getRemainingHours(userContext, lang);
  }

  /**
   * Tool 2: Get Personal Goal Settings & Status
   * Retrieves publisher status, monthly hours goal, and target status.
   */
  static getGoal(userContext: any, lang: SupportedLanguage): string {
    return MinistryAssistant.getMinistryGoal(userContext, lang);
  }

  /**
   * Tool 3: Get Personal Ministry Schedule
   * Retrieves upcoming arrangements, calendar events, and scheduled ministry.
   */
  static getSchedule(userContext: any, lang: SupportedLanguage): string {
    return MinistryAssistant.getMinistrySchedule(userContext, lang);
  }

  /**
   * Tool 4: Get Monthly Progress Overview
   * Retrieves full breakdown: hours, return visits, Bible studies, placements, streak.
   */
  static getProgress(userContext: any, lang: SupportedLanguage): string {
    return MinistryAssistant.getCurrentMinistryProgress(userContext, lang);
  }

  /**
   * Tool 5: Get Personal Activity History
   * Retrieves recent logged ministry entries with duration, dates, and notes.
   */
  static getHistory(userContext: any, lang: SupportedLanguage, limit: number = 5): string {
    return MinistryAssistant.getActivityHistory(userContext, limit, lang);
  }

  /**
   * Tool 6: Get Practical Ministry Tips
   * Provides personalized advice based on pace and goal.
   */
  static getTips(userContext: any, lang: SupportedLanguage): string {
    return MinistryAssistant.generateMinistryTips(userContext, lang);
  }

  /**
   * Tool 7: Get Actual Bible Studies Count & Info
   */
  static getBibleStudies(userContext: any, lang: SupportedLanguage): string {
    return MinistryAssistant.getBibleStudiesReport(userContext, lang);
  }

  /**
   * Tool 8: Get Actual Return Visits Count & Info
   */
  static getReturnVisits(userContext: any, lang: SupportedLanguage): string {
    return MinistryAssistant.getReturnVisitsReport(userContext, lang);
  }

  /**
   * Get Raw Metrics for reasoning
   */
  static getRawMetrics(userContext: any, lang: SupportedLanguage) {
    return MinistryAssistant.getParsedStats(userContext, lang);
  }

  /**
   * Dispatcher method to execute requested Ministry Tracker data tool
   */
  static executeTool(
    category: TrackerToolCategory,
    userContext: any,
    lang: SupportedLanguage
  ): { answer: string; toolUsed: string } {
    switch (category) {
      case 'PERSONAL_HOURS':
        return {
          answer: this.getHours(userContext, lang),
          toolUsed: 'Ministry Tracker: Hours Calculator',
        };
      case 'PERSONAL_GOAL':
        return {
          answer: this.getGoal(userContext, lang),
          toolUsed: 'Ministry Tracker: Goal Manager',
        };
      case 'PERSONAL_SCHEDULE':
        return {
          answer: this.getSchedule(userContext, lang),
          toolUsed: 'Ministry Tracker: Schedule & Arrangements',
        };
      case 'PERSONAL_PROGRESS':
        return {
          answer: this.getProgress(userContext, lang),
          toolUsed: 'Ministry Tracker: Progress Analytics',
        };
      case 'PERSONAL_HISTORY':
        return {
          answer: this.getHistory(userContext, lang),
          toolUsed: 'Ministry Tracker: Activity Logs',
        };
      case 'PERSONAL_TIPS':
        return {
          answer: this.getTips(userContext, lang),
          toolUsed: 'Ministry Tracker: Practical Tips',
        };
      case 'PERSONAL_STUDIES':
        return {
          answer: this.getBibleStudies(userContext, lang),
          toolUsed: 'Ministry Tracker: Bible Studies Counter',
        };
      case 'PERSONAL_VISITS':
        return {
          answer: this.getReturnVisits(userContext, lang),
          toolUsed: 'Ministry Tracker: Return Visits Counter',
        };
      default:
        return {
          answer: this.getProgress(userContext, lang),
          toolUsed: 'Ministry Tracker: General Stats',
        };
    }
  }
}
