import { ARTICLES } from "../data/articles.js";

const STORAGE_KEY = "lexis_state";

const DEFAULTS = {
  startDate: null,
  completedDays: [],
  articles: {},
  essays: {},
  fiction: {},
  streak: 0,
  streakFreezes: 0,
  freezesUsedWeeks: [],
  freezeEarnedWeeks: [],
  wordMastery: {},
};

let state = { ...DEFAULTS };

// ─── Persistence ─────────────────────────────────────────────────────────────

export function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) state = { ...DEFAULTS, ...JSON.parse(saved) };
  } catch (_) {}

  if (!state.startDate) {
    state.startDate = new Date().toISOString().split("T")[0];
    saveState();
  }
  // Guard against missing keys from old saves
  state.wordMastery ??= {};
  state.fiction ??= {};
}

export function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("lexis_hidden_tips");
}

// ─── Date / Day helpers ───────────────────────────────────────────────────────

export function getDaysSinceStart() {
  const start = new Date(state.startDate);
  const now = new Date();
  return Math.max(0, Math.floor((now - start) / 86_400_000));
}

export function isTodayMarkable() {
  const sm = new Date(state.startDate);
  sm.setHours(0, 0, 0, 0);
  const nm = new Date();
  nm.setHours(0, 0, 0, 0);
  const d = Math.floor((nm - sm) / 86_400_000);
  return nm.getTime() === new Date(sm.getTime() + d * 86_400_000).getTime();
}

export function getCurrentWeek() {
  return Math.floor(getDaysSinceStart() / 7) + 1;
}
export function getCurrentDayOfWeek() {
  return getDaysSinceStart() % 7;
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export function updateStreak() {
  const cw = getCurrentWeek();
  for (let w = 1; w < cw; w++) {
    const ws = (w - 1) * 7;
    const days = Array.from({ length: 7 }, (_, i) => ws + i);
    const done = days.filter((d) => state.completedDays.includes(d)).length;
    if (done >= 5 && !state.freezeEarnedWeeks?.includes(w)) {
      state.freezeEarnedWeeks ??= [];
      state.freezeEarnedWeeks.push(w);
      state.streakFreezes = Math.min((state.streakFreezes || 0) + 1, 3);
    }
  }
  const el = document.getElementById("streak-freeze-count");
  if (el) el.textContent = state.streakFreezes || 0;
}

// ─── Day completion ───────────────────────────────────────────────────────────

export function markDayComplete() {
  const d = getDaysSinceStart();
  if (!state.completedDays.includes(d)) {
    state.completedDays.push(d);
    updateStreak();
    saveState();
  }
}

export function unmarkDayComplete() {
  const d = getDaysSinceStart();
  state.completedDays = state.completedDays.filter((x) => x !== d);
  updateStreak();
  saveState();
}

export function isDayComplete(d) {
  return state.completedDays.includes(d);
}

export function useStreakFreeze() {
  if (!state.streakFreezes || state.streakFreezes <= 0) return false;
  const d = getDaysSinceStart();
  if (state.completedDays.includes(d)) return false;
  state.completedDays.push(d);
  state.streakFreezes--;
  state.freezesUsedWeeks ??= [];
  state.freezesUsedWeeks.push(getCurrentWeek());
  updateStreak();
  saveState();
  return true;
}

// ─── Articles ─────────────────────────────────────────────────────────────────

export function getArticleState(id) {
  return state.articles[id] || { read: false, half: false, words: [] };
}

export function setArticleState(id, patch) {
  state.articles[id] = { ...getArticleState(id), ...patch };
  saveState();
}

export function addWordToArticle(id, word) {
  const a = getArticleState(id);
  if (a.words.includes(word)) return false;
  a.words = [...a.words, word];
  state.articles[id] = a;
  state.wordMastery[word] ??= { state: "new", gotCount: 0 };
  saveState();
  return true;
}

export function removeWordFromArticle(id, word) {
  const a = getArticleState(id);
  a.words = a.words.filter((w) => w !== word);
  state.articles[id] = a;
  saveState();
}

export function countReadArticles() {
  return Object.values(state.articles).filter((a) => a.read).length;
}

// ─── Essays ───────────────────────────────────────────────────────────────────

export function getEssayState(id) {
  return state.essays[id] || { draft: "", corrected: "" };
}

export function setEssayState(id, patch) {
  state.essays[id] = { ...getEssayState(id), ...patch };
  saveState();
}

export function countSubmittedEssays() {
  return Object.values(state.essays).filter((e) => e.draft?.trim().length > 20)
    .length;
}

// ─── Fiction ──────────────────────────────────────────────────────────────────

export function getFictionState(id) {
  state.fiction ??= {};
  return state.fiction[id] || { read: false, progress: false, note: "" };
}

export function setFictionState(id, patch) {
  state.fiction ??= {};
  state.fiction[id] = { ...getFictionState(id), ...patch };
  saveState();
}

export function countFictionRead() {
  return Object.values(state.fiction || {}).filter((f) => f.read).length;
}

// ─── Vocabulary ───────────────────────────────────────────────────────────────

export function getAllWords() {
  const all = Object.values(state.articles).flatMap((a) => a.words || []);
  return [...new Set(all)];
}

export function countAllWords() {
  return getAllWords().length;
}

export function getWordMastery(word) {
  return state.wordMastery[word] || { state: "new", gotCount: 0 };
}

export function setWordMastery(word, patch) {
  state.wordMastery[word] = { ...getWordMastery(word), ...patch };
  saveState();
}

export function countMastered() {
  return Object.values(state.wordMastery || {}).filter(
    (w) => w.state === "mastered"
  ).length;
}

export function getWordSourceArticle(word) {
  for (const [aid, adata] of Object.entries(state.articles)) {
    if ((adata.words || []).includes(word)) {
      return ARTICLES.find((a) => a.id === aid) || null;
    }
  }
  return null;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function changeStartDate(dateStr) {
  state.startDate = dateStr;
  state.completedDays = [];
  state.streak = 0;
  state.streakFreezes = 0;
  state.freezesUsedWeeks = [];
  state.freezeEarnedWeeks = [];
  saveState();
}

// ─── Raw state access (read-only snapshot for views that need it) ─────────────
export function getState() {
  return state;
}
export function getStreakFreezes() {
  return state.streakFreezes || 0;
}
export function getStartDate() {
  return state.startDate;
}
export function getCompletedDays() {
  return [...state.completedDays];
}
