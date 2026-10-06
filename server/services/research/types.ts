export type ContentType = 'Article' | 'Video' | 'Publication' | 'Bible' | 'News' | 'Other';
export type ResearchSource = 'JW.ORG' | 'WOL.JW.ORG';

export interface ResearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  contentType: ContentType;
  language: string;
  date?: string;
  thumbnail?: string;
  source: ResearchSource;
  publication?: string;
  bibleVerses?: string[];
  topicKeywords?: string[];
  relevanceScore?: number;
  matchReason?: string;
}

export interface ResearchFilters {
  contentType?: ContentType | 'All';
  language?: string;
  audience?: 'young_people' | 'children' | 'parents' | 'marriage' | 'all' | string;
  datePreference?: 'newer' | 'older' | 'any';
  excludeTypes?: ContentType[];
}

export interface ResearchPlan {
  needsResearch: boolean;
  isAppTrackerQuery: boolean;
  actionType:
    | 'NEW_SEARCH'
    | 'REFINE_SEARCH'
    | 'OPEN_RESULT'
    | 'FILTER_RESULTS'
    | 'CHANGE_TOPIC'
    | 'TRACKER_DATA'
    | 'GENERAL_TALK';
  source: 'JW_ORG' | 'WOL_JW_ORG' | 'NONE';
  topic: string;
  contentType?: ContentType | 'All';
  audience?: string;
  datePreference?: string;
  excludeTypes?: ContentType[];
  targetResultIndex?: number;
  targetContentTypeReference?: ContentType;
  language: string;
  searchQuery: string;
  secondaryQueries?: string[];
  reason: string;
}

export interface ResearchSession {
  sessionId: string;
  originalTopic: string;
  currentTopic: string;
  results: ResearchResult[];
  selectedResult?: ResearchResult;
  filters: ResearchFilters;
  lastSearchQuery?: string;
  lastPlan?: ResearchPlan;
  updatedAt: number;
}
