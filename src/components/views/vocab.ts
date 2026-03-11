import { ARTICLES } from "../../data/articles";
import {
  state,
  getAllWords,
  getWordMastery,
  countMastered,
} from "../../store/state";
import { toggleTip, dismissTip } from "../../utils/tips";
import { openStudySetup } from "../modals/studyModal";
import type { WordState } from "../../types";

type VocabFilter = "all" | WordState;
let currentVocabFilter: VocabFilter = "all";

export function vocabTemplate(): string {
  return /* html */ `
    <div id="view-vocab" class="view-panel hidden flex flex-col min-h-full">
      <div class="px-10 pt-7 pb-3 flex-shrink-0">
        <div class="flex items-end justify-between gap-3">
          <div>
            <div class="font-serif text-[26px] font-semibold text-t1 mb-1.5">Vocabulary</div>
            <div class="text-sm text-t2 font-light">Study your logged words · Track mastery</div>
          </div>
          <div class="flex gap-1.5 pb-1">
            <button class="header-icon-btn" id="help-btn-vocab" title="Help">?</button>
          </div>
        </div>
      </div>
      <div class="px-10 pb-10 flex-1 page-content">
        <div class="info-tip" id="tip-vocab">
          <div class="font-mono text-[10px] tracking-[2px] uppercase text-amber mb-1.5">How the study mode works</div>
          <p class="text-sm text-t2 leading-relaxed">Choose how many words to study. Each card shows a word — try to recall the meaning, then tap to flip. Rate yourself: <strong class="text-green">Got it</strong>, <strong class="text-amber2">Fuzzy</strong>, or <strong class="text-red">Blank</strong>. Get a word right 3 sessions in a row to <strong class="text-green">Master</strong> it.</p>
          <button class="absolute top-2.5 right-3 bg-transparent border-none text-t3 cursor-pointer text-sm hover:text-t1" id="dismiss-tip-vocab">✕</button>
        </div>

        <div class="grid grid-cols-4 gap-3 mb-6" id="vocab-stats-grid"></div>

        <div class="card text-center py-8" id="vocab-start-card">
          <div class="text-[40px] mb-3.5">🧠</div>
          <div class="font-serif text-xl font-semibold mb-2">Study your words</div>
          <div class="text-sm text-t2 mb-6 leading-relaxed">Definitions and example sentences are fetched live from the dictionary.<br/>Rate each word to track your progress.</div>
          <button class="btn-save max-w-[280px] mx-auto block" id="open-study-btn">Start a session →</button>
          <div class="hidden text-sm text-t3 font-mono mt-4" id="no-words-msg">Log words from articles first to start studying.</div>
        </div>

        <div class="card mt-0 overflow-hidden">
          <div class="flex items-center justify-between mb-4">
            <div class="section-title mb-0">All Words <span class="font-normal text-t3 text-[10px]" id="vocab-total-count"></span></div>
            <div class="flex gap-1.5" id="vocab-filters">
              ${vBtn("all", "All", true)} ${vBtn("new", "New")} ${vBtn(
    "learning",
    "Learning"
  )}
              ${vBtn("fuzzy", "Fuzzy")} ${vBtn("mastered", "Mastered")}
            </div>
          </div>
          <div id="vocab-table-wrap"></div>
        </div>
      </div>
    </div>`;
}

function vBtn(f: VocabFilter, label: string, active = false) {
  return `<button class="filter-btn text-[10px] py-1 px-2.5${
    active ? " active" : ""
  }" data-vfilter="${f}">${label}</button>`;
}

export function renderVocab(): void {
  const allWords = getAllWords();
  const wm = state.wordMastery ?? {};
  const counts = { new: 0, learning: 0, fuzzy: 0, mastered: 0 };
  allWords.forEach((w) => {
    const st = wm[w]?.state ?? "new";
    counts[st]++;
  });

  document.getElementById("vocab-stats-grid")!.innerHTML = /* html */ `
    <div class="stat-mini"><div class="num">${allWords.length}</div><div class="lbl">Total</div></div>
    <div class="stat-mini" style="--num-color:var(--blue)"><div class="num">${counts.new}</div><div class="lbl">New</div></div>
    <div class="stat-mini" style="--num-color:var(--red)"><div class="num">${counts.fuzzy}</div><div class="lbl">Fuzzy</div></div>
    <div class="stat-mini" style="--num-color:var(--green)"><div class="num">${counts.mastered}</div><div class="lbl">Mastered</div></div>`;

  const openBtn = document.getElementById("open-study-btn")!;
  const noWordsMsg = document.getElementById("no-words-msg")!;
  openBtn.classList.toggle("hidden", allWords.length === 0);
  noWordsMsg.classList.toggle("hidden", allWords.length > 0);
  document.getElementById(
    "vocab-total-count"
  )!.textContent = `(${allWords.length})`;
  renderVocabTable(allWords);
}

function renderVocabTable(allWords: string[]): void {
  const wrap = document.getElementById("vocab-table-wrap")!;
  const wm = state.wordMastery ?? {};
  const words =
    currentVocabFilter === "all"
      ? allWords
      : allWords.filter((w) => (wm[w]?.state ?? "new") === currentVocabFilter);

  if (words.length === 0) {
    wrap.innerHTML = `<div class="py-8 text-center text-t3 font-mono text-sm">${
      allWords.length === 0
        ? "No words logged yet. Read articles and log words to start."
        : "No words in this category."
    }</div>`;
    return;
  }

  const stateMap: Record<string, [string, string]> = {
    new: [
      "New",
      "text-blue;background:rgba(97,175,239,0.1);border-color:rgba(97,175,239,0.25)",
    ],
    learning: [
      "Learning",
      "text-amber2;background:rgba(212,147,26,0.1);border-color:rgba(212,147,26,0.25)",
    ],
    fuzzy: [
      "Fuzzy",
      "text-red;background:rgba(224,108,117,0.1);border-color:rgba(224,108,117,0.25)",
    ],
    mastered: [
      "Mastered",
      "text-green;background:rgba(76,175,125,0.1);border-color:rgba(76,175,125,0.25)",
    ],
  };

  wrap.innerHTML = /* html */ `
    <table class="w-full border-collapse">
      <thead><tr>
        <th class="font-mono text-[10px] tracking-[2px] uppercase text-t3 text-left px-3 py-2 border-b border-b1">Word</th>
        <th class="font-mono text-[10px] tracking-[2px] uppercase text-t3 text-left px-3 py-2 border-b border-b1">Source Article</th>
        <th class="font-mono text-[10px] tracking-[2px] uppercase text-t3 text-left px-3 py-2 border-b border-b1">Status</th>
      </tr></thead>
      <tbody>${words
        .map((w) => {
          const m = wm[w] ?? { state: "new", gotCount: 0 };
          const [label, cls] = stateMap[m.state] ?? [
            "New",
            "bg-blue/10 text-blue border-blue/25",
          ];
          let source = "";
          for (const [aid, adata] of Object.entries(state.articles)) {
            if ((adata.words ?? []).includes(w)) {
              const art = ARTICLES.find((a) => a.id === aid);
              if (art) {
                source =
                  art.title.length > 40
                    ? art.title.substring(0, 40) + "…"
                    : art.title;
                break;
              }
            }
          }
          return /* html */ `<tr class="hover:[&>td]:bg-s2">
          <td class="px-3 py-2.5 border-b border-b1 font-mono font-medium text-t1 text-sm">${w}</td>
          <td class="px-3 py-2.5 border-b border-b1 text-t2 text-xs">${source}</td>
          <td class="px-3 py-2.5 border-b border-b1 text-right whitespace-nowrap">
            <span class="font-mono text-[9px] tracking-[1.5px] uppercase px-2 py-0.5 rounded-full font-medium border" style="${cls}">
              ${label}${
            m.state !== "mastered" && m.gotCount > 0 ? ` (${m.gotCount}✓)` : ""
          }
            </span>
          </td>
        </tr>`;
        })
        .join("")}</tbody>
    </table>`;
}

export function bindVocabStaticEvents(): void {
  document
    .getElementById("help-btn-vocab")
    ?.addEventListener("click", () => toggleTip("tip-vocab", "help-btn-vocab"));
  document
    .getElementById("dismiss-tip-vocab")
    ?.addEventListener("click", () => dismissTip("tip-vocab"));
  document
    .getElementById("open-study-btn")
    ?.addEventListener("click", openStudySetup);
  document.getElementById("vocab-filters")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-vfilter]"
    );
    if (!btn) return;
    document
      .querySelectorAll("#vocab-filters .filter-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentVocabFilter = btn.dataset["vfilter"] as VocabFilter;
    renderVocab();
  });
}
