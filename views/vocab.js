// ─── views/vocab.js ───────────────────────────────────────────────────────────

import { ARTICLES } from "../data/articles.js";
import {
  getAllWords,
  getArticleState,
  getWordMastery,
  countMastered,
} from "../state/store.js";
import { openStudySetup } from "../study/session.js";

let _vocabFilter = "all";

export function renderVocab() {
  const all = getAllWords();
  const wm = (w) => getWordMastery(w).state || "new";
  const counts = {
    new: all.filter((w) => wm(w) === "new").length,
    learning: all.filter((w) => wm(w) === "learning").length,
    fuzzy: all.filter((w) => wm(w) === "fuzzy").length,
    mastered: all.filter((w) => wm(w) === "mastered").length,
  };

  document.getElementById("vocab-stats-grid").innerHTML = `
    <div class="stat-card"><div class="stat-num" style="font-size:28px">${all.length}</div><div class="stat-label">Total</div></div>
    <div class="stat-card"><div class="stat-num" style="font-size:28px;color:var(--blue)">${counts.new}</div><div class="stat-label">New</div></div>
    <div class="stat-card"><div class="stat-num" style="font-size:28px;color:var(--red)">${counts.fuzzy}</div><div class="stat-label">Fuzzy</div></div>
    <div class="stat-card"><div class="stat-num" style="font-size:28px;color:var(--green)">${counts.mastered}</div><div class="stat-label">Mastered</div></div>`;

  const openBtn = document.getElementById("open-study-btn");
  const noWordsMsg = document.getElementById("no-words-msg");
  if (all.length === 0) {
    openBtn?.style.setProperty("display", "none");
    if (noWordsMsg) noWordsMsg.style.display = "block";
  } else {
    openBtn?.style.removeProperty("display");
    if (noWordsMsg) noWordsMsg.style.display = "none";
  }

  document.getElementById("vocab-total-count").textContent = `(${all.length})`;
  renderVocabTable();
}

export function filterVocab(f, btn) {
  _vocabFilter = f;
  document
    .querySelectorAll("#view-vocab .filter-btn")
    .forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderVocabTable();
}

export function renderVocabTable() {
  const wrap = document.getElementById("vocab-table-wrap");
  const all = getAllWords();
  const words =
    _vocabFilter === "all"
      ? all
      : all.filter((w) => (getWordMastery(w).state || "new") === _vocabFilter);

  if (words.length === 0) {
    wrap.innerHTML = `<div style="padding:30px 0;text-align:center;color:var(--text3);font-family:'IBM Plex Mono',monospace;font-size:13px;">${
      all.length === 0
        ? "No words logged yet. Read articles and log words to start."
        : "No words in this category."
    }</div>`;
    return;
  }

  const STATE_META = {
    new: ["New", "ws-new"],
    learning: ["Learning", "ws-learning"],
    fuzzy: ["Fuzzy", "ws-fuzzy"],
    mastered: ["Mastered", "ws-mastered"],
  };

  wrap.innerHTML = `
    <table class="vocab-table">
      <thead><tr><th>Word</th><th>Source Article</th><th>Status</th></tr></thead>
      <tbody>${words
        .map((w) => {
          const m = getWordMastery(w);
          const [label, cls] = STATE_META[m.state || "new"] || STATE_META.new;
          let source = "";
          for (const [aid, adata] of Object.entries({})) {
            // iterates state.articles via getArticleState — see below
            if ((adata.words || []).includes(w)) {
              const art = ARTICLES.find((a) => a.id === aid);
              if (art) {
                source =
                  art.title.length > 40
                    ? art.title.slice(0, 40) + "…"
                    : art.title;
                break;
              }
            }
          }
          // Find source via ARTICLES cross-reference
          for (const art of ARTICLES) {
            if ((getArticleState(art.id).words || []).includes(w)) {
              source =
                art.title.length > 40
                  ? art.title.slice(0, 40) + "…"
                  : art.title;
              break;
            }
          }
          return `<tr>
          <td>${w}</td>
          <td>${source}</td>
          <td><span class="word-state-tag ${cls}">${label}${
            m.state !== "mastered" && m.gotCount > 0 ? ` (${m.gotCount}✓)` : ""
          }</span></td>
        </tr>`;
        })
        .join("")}</tbody>
    </table>`;
}
