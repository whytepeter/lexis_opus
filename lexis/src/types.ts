export type ReadLevel = "starter" | "building" | "stretch";
export type FictionType = "story" | "novel" | "script";
export type FictionLevel = "beginner" | "intermediate" | "advanced";
export type WordState = "new" | "learning" | "fuzzy" | "mastered";
export type ViewName =
  | "today"
  | "articles"
  | "essays"
  | "fiction"
  | "vocab"
  | "progress";
export type ToastType = "green" | "amber";
export type RatingType = "got" | "fuzzy" | "blank";
export type ArticleFilter =
  | "all"
  | "starter"
  | "building"
  | "stretch"
  | "unread"
  | "read"
  | "short"
  | "broad"
  | "books"
  | "happiness"
  | "health"
  | "productivity"
  | "money"
  | "politics"
  | "culture"
  | "ideas";
export type FictionFilter =
  | "all"
  | "story"
  | "novel"
  | "script"
  | "beginner"
  | "intermediate"
  | "advanced"
  | "reading"
  | "finished";

export interface Article {
  id: string;
  readTime?: number;
  level: ReadLevel;
  topic: string;
  title: string;
  desc: string;
  url: string;
  words_hint: string[];
}

export interface Fiction {
  id: string;
  type: FictionType;
  level: FictionLevel;
  title: string;
  author: string;
  year: number;
  desc: string;
  url: string;
  readTime: number;
  words_hint: string[];
}

export interface Essay {
  id: string;
  week: number;
  title: string;
  type: string;
  prompt: string;
}

export interface WeekDay {
  day: string;
  focus: string;
  color: string;
  task: string;
  action: string;
}

export interface ArticleState {
  read: boolean;
  half?: boolean;
  words: string[];
}

export interface EssayState {
  draft: string;
  corrected: string;
}

export interface FictionState {
  read: boolean;
  progress: boolean;
  note?: string;
}

export interface WordMastery {
  state: WordState;
  gotCount: number;
  lastSeen?: string;
}

export interface AppState {
  startDate: string;
  completedDays: number[];
  articles: Record<string, ArticleState>;
  essays: Record<string, EssayState>;
  fiction: Record<string, FictionState>;
  streak: number;
  streakFreezes: number;
  freezesUsedWeeks: number[];
  freezeEarnedWeeks: number[];
  wordMastery: Record<string, WordMastery>;
}

export interface DictionaryMeaning {
  partOfSpeech: string;
  def: string;
  example: string | null;
  synonyms: string[];
}

export interface DictionaryResult {
  meanings: DictionaryMeaning[];
}
