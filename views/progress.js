// ─── views/progress.js ────────────────────────────────────────────────────────

import { ARTICLES } from "../data/articles.js";
import { ESSAYS } from "../data/essays.js";
import { FICTION } from "../data/fiction.js";
import {
  getDaysSinceStart,
  getCurrentWeek,
  isDayComplete,
  countReadArticles,
  countSubmittedEssays,
  countAllWords,
  countFictionRead,
  countMastered,
  getAllWords,
  getWordMastery,
  getStreakFreezes,
  updateStreak,
} from "../state/store.js";
import { openStudySetup } from "../study/session.js";

export function renderProgress() {
  updateStreak();

  const days = getDaysSinceStart();
  const articles = countReadArticles();
  const words = countAllWords();
  const essays = countSubmittedEssays();
  const fiction = countFictionRead();
  const mastered = countMastered();

  document.getElementById("stat-days").textContent = days;
  document.getElementById("stat-articles").textContent = articles;
  document.getElementById("stat-words").textContent = words;
  document.getElementById("stat-essays").textContent = essays;
  document.getElementById("stat-fiction").textContent = fiction;
  document.getElementById("stat-mastered").textContent = mastered;

  const overall = Math.min(
    Math.round(
      (days / 84) * 35 +
        (articles / ARTICLES.length) * 25 +
        (essays / 12) * 25 +
        (fiction / Math.max(FICTION.length, 1)) * 15
    ),
    100
  );

  document.getElementById("prog-pct").textContent = `${overall}%`;
  document.getElementById("prog-fill").style.width = `${overall}%`;
  document.getElementById(
    "art-pct"
  ).textContent = `${articles} / ${ARTICLES.length}`;
  document.getElementById("art-fill").style.width = `${Math.round(
    (articles / ARTICLES.length) * 100
  )}%`;
  document.getElementById("ess-pct").textContent = `${essays} / 12`;
  document.getElementById("ess-fill").style.width = `${Math.round(
    (essays / 12) * 100
  )}%`;
  document.getElementById(
    "fic-pct"
  ).textContent = `${fiction} / ${FICTION.length}`;
  document.getElementById("fic-fill").style.width = `${Math.round(
    (fiction / FICTION.length) * 100
  )}%`;

  _renderActivityMap();
  _renderWeekMap();
  _renderVocabCloud();

  document.getElementById("prog-freezes").textContent = getStreakFreezes();
}

function _renderActivityMap() {
  const map = document.getElementById("activity-map");
  const cd = getDaysSinceStart();
  map.innerHTML = "";
  for (let i = 0; i < 84; i++) {
    const cell = document.createElement("div");
    const done = isDayComplete(i);
    const today = i === cd;
    const past = i < cd && !done;
    cell.className = `wp-cell ${done ? "done" : ""} ${today ? "current" : ""} ${
      past ? "missed" : ""
    }`;
    cell.textContent = i + 1;
    cell.title = `Day ${i + 1}${
      done ? " ✓" : today ? " — today" : past ? " — missed" : ""
    }`;
    map.appendChild(cell);
  }
}

function _renderWeekMap() {
  const weekNum = getCurrentWeek();
  const weekStart = (weekNum - 1) * 7;
  const cd = getDaysSinceStart();
  const twm = document.getElementById("this-week-map");
  twm.innerHTML = "";
  let doneCount = 0;
  ["M", "T", "W", "T", "F", "S", "S"].forEach((label, i) => {
    const dn = weekStart + i;
    const done = isDayComplete(dn);
    const today = dn === cd;
    const past = dn < cd && !done;
    if (done) doneCount++;
    const cell = document.createElement("div");
    cell.className = `wp-cell ${done ? "done" : ""} ${today ? "current" : ""} ${
      past ? "missed" : ""
    }`;
    cell.textContent = label;
    twm.appendChild(cell);
  });
  document.getElementById(
    "week-summary-text"
  ).textContent = `${doneCount}/7 days done this week`;
}

function _renderVocabCloud() {
  const allWords = getAllWords();
  document.getElementById(
    "vocab-count"
  ).textContent = `${allWords.length} words`;
  const sb = document.getElementById("study-words-btn");
  if (sb) sb.style.display = allWords.length > 0 ? "inline-flex" : "none";

  const cloud = document.getElementById("vocab-cloud");
  cloud.innerHTML = allWords.length
    ? allWords
        .map((w) => {
          const m = getWordMastery(w);
          const col =
            m.state === "mastered"
              ? "var(--green)"
              : m.state === "fuzzy"
              ? "var(--amber2)"
              : m.state === "learning"
              ? "var(--blue)"
              : "var(--text)";
          return `<span class="vocab-word" style="color:${col}">${w}</span>`;
        })
        .join("")
    : `<span style="color:var(--text3);font-size:13px;font-family:'IBM Plex Mono',monospace;">No words logged yet.</span>`;
}
