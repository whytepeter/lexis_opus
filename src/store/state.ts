import type {
  AppState,
  ArticleState,
  EssayState,
  FictionState,
  WordMastery,
  WordState,
} from "../types";
import { ARTICLES } from "../data/articles";

const STORAGE_KEY = "lexis_state";

const defaultState = (): AppState => ({
  startDate: new Date().toISOString().split("T")[0],
  completedDays: [],
  articles: {},
  essays: {},
  fiction: {},
  streak: 0,
  streakFreezes: 0,
  freezesUsedWeeks: [],
  freezeEarnedWeeks: [],
  wordMastery: {},
});

export let state: AppState = defaultState();

export function loadState(): void {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      state = { ...defaultState(), ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }
  }
  if (!state.startDate)
    state.startDate = new Date().toISOString().split("T")[0];
  if (!state.wordMastery) state.wordMastery = {};
  if (!state.fiction) state.fiction = {};
  saveState();
}

export function saveState(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("lexis_hidden_tips");
  location.reload();
}

// ── Date helpers ──────────────────────────────────────────────────────────────

export function getDaysSinceStart(): number {
  const s = new Date(state.startDate),
    n = new Date();
  return Math.max(0, Math.floor((n.getTime() - s.getTime()) / 86400000));
}

export function isTodayMarkable(): boolean {
  const s = new Date(state.startDate);
  const sm = new Date(s.getFullYear(), s.getMonth(), s.getDate());
  const nm = new Date();
  nm.setHours(0, 0, 0, 0);
  const d = Math.floor((nm.getTime() - sm.getTime()) / 86400000);
  return nm.getTime() === new Date(sm.getTime() + d * 86400000).getTime();
}

export const getCurrentWeek = (): number =>
  Math.floor(getDaysSinceStart() / 7) + 1;
export const getCurrentDayOfWeek = (): number => getDaysSinceStart() % 7;

// ── Article helpers ───────────────────────────────────────────────────────────

export function getArticleState(id: string): ArticleState {
  return state.articles[id] ?? { read: false, words: [] };
}

export function countReadArticles(): number {
  return Object.values(state.articles).filter((a) => a.read).length;
}

// ── Essay helpers ─────────────────────────────────────────────────────────────

export function getEssayState(id: string): EssayState {
  return state.essays[id] ?? { draft: "", corrected: "" };
}

export function countSubmittedEssays(): number {
  return Object.values(state.essays).filter(
    (e) => e.draft && e.draft.trim().length > 20
  ).length;
}

// ── Fiction helpers ───────────────────────────────────────────────────────────

export function getFictionState(id: string): FictionState {
  if (!state.fiction) state.fiction = {};
  return state.fiction[id] ?? { read: false, progress: false };
}

export function countFictionRead(): number {
  return Object.values(state.fiction ?? {}).filter((f) => f.read).length;
}

// ── Vocab helpers ─────────────────────────────────────────────────────────────

export function getAllWords(): string[] {
  const all: string[] = [];
  Object.values(state.articles).forEach((a) => all.push(...(a.words ?? [])));
  return [...new Set(all)];
}

export function countAllWords(): number {
  return getAllWords().length;
}

export function getWordMastery(word: string): WordMastery {
  if (!state.wordMastery) state.wordMastery = {};
  return state.wordMastery[word] ?? { state: "new", gotCount: 0 };
}

export function countMastered(): number {
  return Object.values(state.wordMastery ?? {}).filter(
    (w) => w.state === "mastered"
  ).length;
}

// ── Streak logic ──────────────────────────────────────────────────────────────

export function updateStreak(): void {
  const cw = getCurrentWeek();
  for (let w = 1; w < cw; w++) {
    const ws = (w - 1) * 7;
    const days = Array.from({ length: 7 }, (_, i) => ws + i);
    const done = days.filter((d) => state.completedDays.includes(d)).length;
    if (done >= 5 && !state.freezeEarnedWeeks?.includes(w)) {
      if (!state.freezeEarnedWeeks) state.freezeEarnedWeeks = [];
      state.freezeEarnedWeeks.push(w);
      state.streakFreezes = Math.min((state.streakFreezes ?? 0) + 1, 3);
    }
  }
}

export function markDayComplete(): boolean {
  const d = getDaysSinceStart();
  if (state.completedDays.includes(d)) return false;
  state.completedDays.push(d);
  updateStreak();
  saveState();
  return true;
}

export function unmarkDayComplete(): void {
  const d = getDaysSinceStart();
  state.completedDays = state.completedDays.filter((x) => x !== d);
  updateStreak();
  saveState();
}

export function useStreakFreeze(): "no-freezes" | "already-done" | "ok" {
  if (!state.streakFreezes || state.streakFreezes <= 0) return "no-freezes";
  const d = getDaysSinceStart();
  if (state.completedDays.includes(d)) return "already-done";
  state.completedDays.push(d);
  state.streakFreezes--;
  if (!state.freezesUsedWeeks) state.freezesUsedWeeks = [];
  state.freezesUsedWeeks.push(getCurrentWeek());
  updateStreak();
  saveState();
  return "ok";
}
