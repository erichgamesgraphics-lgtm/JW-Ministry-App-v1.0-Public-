export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: 'JW.ORG' | 'WOL.JW.ORG';
  publication?: string;
  bibleVerses?: string[];
  topicKeywords?: string[];
}

export interface MinistryAIRequestPayload {
  message: string;
  conversationHistory?: Array<{ role: 'user' | 'model'; text: string }>;
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
