export type CategoryType =
  | 'MINISTRY_PROGRESS'
  | 'MINISTRY_HOURS'
  | 'MINISTRY_GOAL'
  | 'MINISTRY_HISTORY'
  | 'MINISTRY_SCHEDULE'
  | 'MINISTRY_TIPS'
  | 'JW_SEARCH'
  | 'WOL_SEARCH'
  | 'BIBLE_SEARCH'
  | 'FOLLOW_UP'
  | 'GENERAL_MINISTRY'
  | 'COMBINED'
  | 'GENERAL';

export interface ScriptureMatch {
  isScripture: boolean;
  rawReference: string;
  book: string;
  chapter?: number;
  verses?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: 'JW.ORG' | 'WOL.JW.ORG';
  publication?: string;
  bibleVerses?: string[];
  topicKeywords?: string[];
  relevanceScore?: number;
  matchReason?: string;
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant' | 'model';
  content: string;
  sources?: SearchResult[];
  timestamp?: number;
}

export interface MinistryAIRequestPayload {
  message: string;
  conversationHistory?: ChatHistoryMessage[];
  userContext?: {
    stats?: any;
    entries?: any[];
    events?: any[];
    settings?: any;
  };
  language?: string;
}

export interface MinistryAIResponsePayload {
  answer: string;
  sources: SearchResult[];
  suggestedFollowUps?: string[];
}
