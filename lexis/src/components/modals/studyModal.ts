import {
  state,
  getAllWords,
  saveState as sS,
  getWordMastery,
} from "../../store/state";
import { ARTICLES } from "../../data/articles";
import { showToast } from "../../utils/toast";
import { renderVocab } from "../views/vocab";
import type { RatingType, DictionaryResult } from "../../types";

let deck: string[] = [],
  idx = 0,
  got = 0;
let fuzzyList: string[] = [],
  blankQueue: string[] = [];
let chosenSize: number | null = null,
  flipped = false;
const defCache: Record<string, DictionaryResult | null> = {};

export function studyModalTemplate(): string {
  return /* html */ `
    <div class="study-overlay" id="study-overlay">
      <div class="study-modal" id="study-modal-inner">
        <button class="study-close absolute top-3.5 right-4 bg-s2 border border-b1 text-t2 rounded-md w-8 h-8 cursor-pointer text-base flex items-center justify-center hover:bg-s3 hover:text-t1" id="close-study">✕</button>

        <!-- Setup -->
        <div id="study-setup" class="text-center py-2.5">
          <div class="text-5xl mb-4">🧠</div>
          <h2 class="font-serif text-2xl font-bold mb-2">Study Session</h2>
          <p class="text-sm text-t2 mb-7 leading-relaxed" id="study-setup-desc">Choose how many words to study.</p>
          <div class="grid grid-cols-2 gap-2.5 mb-5" id="size-options"></div>
          <button class="btn-save w-full" id="start-session-btn" disabled>Start →</button>
        </div>

        <!-- Session -->
        <div id="study-session" class="hidden">
          <div class="flex items-center justify-between font-mono text-[11px] text-t3 tracking-wide uppercase mb-5">
            <span id="sc-label">Word 1 of 10</span>
            <span class="text-amber2" id="sc-streak"></span>
          </div>
          <div class="h-[3px] bg-b1 rounded-full overflow-hidden mb-7">
            <div class="h-full bg-amber rounded-full transition-all duration-300" id="spf" style="width:0%"></div>
          </div>
          <div class="bg-s2 border border-b2 rounded-2xl p-9 min-h-[180px] flex flex-col items-center justify-center cursor-pointer transition-all text-center select-none active:scale-[0.99] hover:bg-s3 mb-2" id="study-card">
            <div class="font-serif text-4xl font-bold text-t1 mb-2.5" id="sc-word"></div>
            <div class="font-mono text-[11px] text-t3 tracking-wide" id="sc-hint">Tap to reveal definition</div>
            <div class="hidden w-full" id="sc-back">
              <div class="font-mono text-xs text-t3" id="sc-loading">Looking up definition…</div>
              <div class="hidden" id="sc-content">
                <div class="text-[15px] text-t1 leading-[1.7]" id="sc-def"></div>
                <div class="hidden text-sm text-t2 italic leading-relaxed border-l-2 border-amber pl-2.5 mt-2.5" id="sc-ex"></div>
              </div>
            </div>
            <div class="font-mono text-[10px] text-t3 mt-3" id="sc-source"></div>
          </div>
          <div class="hidden grid grid-cols-3 gap-2.5 mt-4" id="study-actions">
            <button class="py-3 px-2 rounded-xl border font-mono text-xs cursor-pointer transition-all hover:-translate-y-px bg-red/10 border-red text-red" data-rate="blank">✗<br/><span class="text-[10px] opacity-80">Blank</span></button>
            <button class="py-3 px-2 rounded-xl border font-mono text-xs cursor-pointer transition-all hover:-translate-y-px bg-amber/10 border-amber text-amber2" data-rate="fuzzy">~<br/><span class="text-[10px] opacity-80">Fuzzy</span></button>
            <button class="py-3 px-2 rounded-xl border font-mono text-xs cursor-pointer transition-all hover:-translate-y-px bg-green/10 border-green text-green" data-rate="got">✓<br/><span class="text-[10px] opacity-80">Got it</span></button>
          </div>
        </div>

        <!-- Done -->
        <div id="study-done" class="hidden text-center py-2.5">
          <div class="text-5xl mb-4" id="done-emoji">🎉</div>
          <h2 class="font-serif text-2xl font-bold mb-2" id="done-title">Session complete!</h2>
          <div class="text-sm text-t2 mb-6" id="done-desc"></div>
          <div class="grid grid-cols-3 gap-2.5 mb-7" id="score-breakdown"></div>
          <div class="flex gap-2.5">
            <button class="hidden flex-1 py-3 px-2 rounded-xl border font-mono text-xs cursor-pointer bg-red/10 border-red text-red" id="retry-btn">↺ Retry missed</button>
            <button class="btn-save flex-1" id="done-close-btn">Done</button>
          </div>
        </div>
      </div>
    </div>`;
}

export function openStudySetup(): void {
  const allWords = getAllWords();
  if (allWords.length === 0) {
    showToast("Log some words from articles first!", "amber");
    return;
  }
  const wm = state.wordMastery ?? {};
  const prioritised = [
    ...allWords.filter((w) => wm[w]?.state === "fuzzy"),
    ...allWords.filter((w) => !wm[w] || wm[w].state === "new"),
    ...allWords.filter((w) => wm[w]?.state === "learning"),
    ...allWords.filter((w) => wm[w]?.state === "mastered"),
  ];
  const opts = [
    ...new Set(
      [5, 10, 20, prioritised.length].filter((v) => v <= prioritised.length)
    ),
  ];
  const sizeOpts = document.getElementById("size-options")!;
  sizeOpts.innerHTML = "";
  opts.forEach((n) => {
    const div = document.createElement("div");
    div.className =
      "bg-s2 border border-b2 rounded-xl py-4 px-3 cursor-pointer transition-all font-mono hover:border-amber hover:bg-amber/10";
    div.innerHTML = `<div class="text-[28px] font-semibold text-amber2 leading-none mb-1">${n}</div><div class="text-[11px] text-t3 tracking-wide uppercase">${
      n === prioritised.length ? "All words" : "words"
    }</div>`;
    div.addEventListener("click", () => {
      document
        .querySelectorAll("#size-options > div")
        .forEach((d) => d.classList.remove("border-amber", "bg-amber/10"));
      div.classList.add("border-amber", "bg-amber/10");
      chosenSize = n;
      (
        document.getElementById("start-session-btn") as HTMLButtonElement
      ).disabled = false;
    });
    sizeOpts.appendChild(div);
  });
  document.getElementById("study-setup-desc")!.textContent = `You have ${
    prioritised.length
  } word${
    prioritised.length > 1 ? "s" : ""
  } to study. Fuzzy and new words are shown first.`;
  chosenSize = null;
  (document.getElementById("start-session-btn") as HTMLButtonElement).disabled =
    true;
  document.getElementById("study-setup")!.classList.remove("hidden");
  document.getElementById("study-session")!.classList.add("hidden");
  document.getElementById("study-done")!.classList.add("hidden");
  document.getElementById("study-overlay")!.classList.add("open");
}

function startSession(): void {
  if (!chosenSize) return;
  const allWords = getAllWords();
  const wm = state.wordMastery ?? {};
  const prioritised = [
    ...allWords.filter((w) => wm[w]?.state === "fuzzy"),
    ...allWords.filter((w) => !wm[w] || wm[w].state === "new"),
    ...allWords.filter((w) => wm[w]?.state === "learning"),
    ...allWords.filter((w) => wm[w]?.state === "mastered"),
  ];
  deck = prioritised.slice(0, chosenSize);
  idx = 0;
  got = 0;
  fuzzyList = [];
  blankQueue = [];
  flipped = false;
  document.getElementById("study-setup")!.classList.add("hidden");
  document.getElementById("study-session")!.classList.remove("hidden");
  document.getElementById("study-done")!.classList.add("hidden");
  showStudyCard();
}

function showStudyCard(): void {
  if (idx >= deck.length && blankQueue.length === 0) {
    showSessionDone();
    return;
  }
  const word = blankQueue.length > 0 ? blankQueue.shift()! : deck[idx++];
  flipped = false;
  document.getElementById("sc-word")!.textContent = word;
  document.getElementById("sc-hint")!.classList.remove("hidden");
  document.getElementById("sc-back")!.classList.add("hidden");
  document.getElementById("study-actions")!.classList.add("hidden");
  document.getElementById("sc-source")!.textContent = "";
  const total = deck.length,
    done = Math.min(idx, total);
  document.getElementById("sc-label")!.textContent = `Word ${done} of ${total}`;
  document.getElementById("spf")!.style.width = `${(done / total) * 100}%`;
  document.getElementById("sc-streak")!.textContent = got > 0 ? `${got} ✓` : "";
}

function flipStudyCard(): void {
  if (flipped) return;
  flipped = true;
  const word = document.getElementById("sc-word")!.textContent!;
  document.getElementById("sc-hint")!.classList.add("hidden");
  document.getElementById("sc-back")!.classList.remove("hidden");
  document.getElementById("sc-loading")!.classList.remove("hidden");
  document.getElementById("sc-content")!.classList.add("hidden");
  document.getElementById("study-actions")!.classList.remove("hidden");

  let source = "";
  for (const [aid, adata] of Object.entries(state.articles)) {
    if ((adata.words ?? []).includes(word)) {
      const art = ARTICLES.find((a) => a.id === aid);
      if (art) {
        source = `From: "${
          art.title.length > 45 ? art.title.substring(0, 45) + "…" : art.title
        }"`;
        break;
      }
    }
  }
  document.getElementById("sc-source")!.textContent = source;

  if (word in defCache) {
    displayDef(defCache[word]);
    return;
  }
  fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
      word
    )}`
  )
    .then((r) => (r.ok ? r.json() : null))
    .then((data: any) => {
      const result: DictionaryMeaning[] = [];
      if (data?.[0]) {
        for (const m of (data[0].meanings ?? []).slice(0, 2)) {
          if (m.definitions?.[0]) {
            result.push({
              partOfSpeech: m.partOfSpeech,
              def: m.definitions[0].definition,
              example: m.definitions[0].example ?? null,
              synonyms: (m.synonyms ?? []).slice(0, 5),
            });
          }
        }
      }
      defCache[word] = result.length ? { meanings: result } : null;
      displayDef(defCache[word]);
    })
    .catch(() => {
      defCache[word] = null;
      displayDef(null);
    });
}

function displayDef(result: DictionaryResult | null): void {
  document.getElementById("sc-loading")!.classList.add("hidden");
  document.getElementById("sc-content")!.classList.remove("hidden");
  if (result?.meanings?.length) {
    document.getElementById("sc-def")!.innerHTML = result.meanings
      .map(
        (m, i) => /* html */ `
      <div class="${i > 0 ? "mt-4 pt-4 border-t border-b1/60" : ""}">
        <span class="font-mono text-[10px] text-t3 uppercase tracking-wide">${
          m.partOfSpeech
        }</span>
        <div class="text-[15px] text-t1 leading-[1.7] mt-0.5">${m.def}</div>
        ${
          m.example
            ? `<div class="text-sm text-t2 italic leading-relaxed border-l-2 border-amber pl-2.5 mt-2">"${m.example}"</div>`
            : ""
        }
        ${
          m.synonyms.length
            ? `<div class="mt-2 flex flex-wrap gap-1">${m.synonyms
                .map(
                  (s) =>
                    `<span class="font-mono text-[10px] px-2 py-0.5 rounded-full border border-b2 text-t3">${s}</span>`
                )
                .join("")}</div>`
            : ""
        }
      </div>`
      )
      .join("");
    document.getElementById("sc-ex")!.classList.add("hidden"); // now rendered inline above
  } else {
    document.getElementById(
      "sc-def"
    )!.innerHTML = `<span class="text-t3 text-sm">No dictionary entry found.<br/>Try to recall the meaning from context.</span>`;
    document.getElementById("sc-ex")!.classList.add("hidden");
  }
}

function rateWord(rating: RatingType): void {
  const word = document.getElementById("sc-word")!.textContent!;
  if (!state.wordMastery) state.wordMastery = {};
  if (!state.wordMastery[word])
    state.wordMastery[word] = { state: "new", gotCount: 0 };
  const m = state.wordMastery[word];
  if (rating === "got") {
    got++;
    m.gotCount = (m.gotCount ?? 0) + 1;
    m.state = m.gotCount >= 3 ? "mastered" : "learning";
  } else if (rating === "fuzzy") {
    m.gotCount = Math.max(0, (m.gotCount ?? 0) - 1);
    m.state = "fuzzy";
    fuzzyList.push(word);
  } else {
    m.gotCount = 0;
    m.state = "fuzzy";
    blankQueue.push(word);
    fuzzyList.push(word);
  }
  m.lastSeen = new Date().toISOString();
  sS();
  const card = document.getElementById("study-card")!;
  const col =
    rating === "got"
      ? "rgba(76,175,125,0.15)"
      : rating === "fuzzy"
      ? "rgba(212,147,26,0.15)"
      : "rgba(224,108,117,0.15)";
  card.style.background = col;
  setTimeout(() => {
    card.style.background = "";
    showStudyCard();
  }, 200);
}

function showSessionDone(): void {
  document.getElementById("study-session")!.classList.add("hidden");
  document.getElementById("study-done")!.classList.remove("hidden");
  const total = deck.length;
  const uniqueFuzzy = [...new Set(fuzzyList)].filter(
    (w) => state.wordMastery[w]?.state === "fuzzy"
  ).length;
  const newMastered = deck.filter(
    (w) => state.wordMastery[w]?.state === "mastered"
  ).length;
  document.getElementById("done-emoji")!.textContent =
    got >= total * 0.8 ? "🎉" : got >= total * 0.5 ? "👍" : "💪";
  document.getElementById("done-title")!.textContent =
    got >= total * 0.8
      ? "Excellent session!"
      : got >= total * 0.5
      ? "Good progress!"
      : "Keep practising!";
  document.getElementById("done-desc")!.textContent = `You rated ${total} word${
    total > 1 ? "s" : ""
  } in this session.`;
  document.getElementById("score-breakdown")!.innerHTML = [
    { n: got, c: "var(--green)", l: "Got it" },
    { n: uniqueFuzzy, c: "var(--amber2)", l: "Fuzzy" },
    { n: newMastered, c: "var(--blue)", l: "Mastered" },
  ]
    .map(
      (s) => /* html */ `
    <div class="bg-s2 border border-b1 rounded-xl py-3.5 px-2">
      <div class="font-mono text-2xl font-semibold mb-1" style="color:${s.c}">${s.n}</div>
      <div class="font-mono text-[10px] text-t3 tracking-wide uppercase">${s.l}</div>
    </div>`
    )
    .join("");
  const retryBtn = document.getElementById("retry-btn")!;
  retryBtn.classList.toggle("hidden", uniqueFuzzy === 0);
}

function closeStudy(): void {
  document.getElementById("study-overlay")!.classList.remove("open");
  const vv = document.getElementById("view-vocab");
  if (vv?.classList.contains("active")) renderVocab();
}

export function bindStudyModalEvents(): void {
  document.getElementById("close-study")?.addEventListener("click", closeStudy);
  document
    .getElementById("study-overlay")
    ?.addEventListener("click", function (e) {
      if (e.target === this) closeStudy();
    });
  document
    .getElementById("start-session-btn")
    ?.addEventListener("click", startSession);
  document
    .getElementById("study-card")
    ?.addEventListener("click", flipStudyCard);
  document.getElementById("study-actions")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-rate]"
    );
    if (btn) rateWord(btn.dataset["rate"] as RatingType);
  });
  document.getElementById("retry-btn")?.addEventListener("click", () => {
    const fuzzyWords = [...new Set(fuzzyList)].filter(
      (w) => state.wordMastery[w]?.state === "fuzzy"
    );
    if (!fuzzyWords.length) {
      closeStudy();
      return;
    }
    deck = [...fuzzyWords];
    idx = 0;
    got = 0;
    fuzzyList = [];
    blankQueue = [];
    flipped = false;
    document.getElementById("study-done")!.classList.add("hidden");
    document.getElementById("study-session")!.classList.remove("hidden");
    showStudyCard();
  });
  document
    .getElementById("done-close-btn")
    ?.addEventListener("click", closeStudy);
}
