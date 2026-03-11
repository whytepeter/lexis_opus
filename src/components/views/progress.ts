import { FICTION } from "../../data/fiction";
import {
  state as pState,
  getDaysSinceStart,
  getCurrentWeek,
  countReadArticles,
  countAllWords,
  countSubmittedEssays,
  countFictionRead,
  countMastered as pCountMastered,
  getAllWords as pGetAllWords,
  getWordMastery as pGetWordMastery,
  updateStreak,
} from "../../store/state";
import {
  toggleTip as pToggleTip,
  dismissTip as pDismissTip,
} from "../../utils/tips";
import { openStudySetup as pOpenStudy } from "../modals/studyModal";
import { showResetModal } from "../modals/settingsModal";

export function progressTemplate(): string {
  return /* html */ `
    <div id="view-progress" class="view-panel hidden flex flex-col min-h-full">
      <div class="px-10 pt-7 pb-3 flex-shrink-0">
        <div class="flex items-end justify-between gap-3">
          <div>
            <div class="font-serif text-[26px] font-semibold text-t1 mb-1.5">Your Progress</div>
            <div class="text-sm text-t2 font-light">A snapshot of how far you've come</div>
          </div>
          <div class="flex gap-1.5 pb-1">
            <button class="header-icon-btn" id="settings-btn" title="Settings">⚙</button>
            <button class="header-icon-btn" id="help-btn-progress" title="Help">?</button>
          </div>
        </div>
      </div>
      <div class="px-10 pb-10 flex-1 page-content">
        <div class="info-tip" id="tip-progress">
          <div class="font-mono text-[10px] tracking-[2px] uppercase text-amber mb-1.5">Reading your progress</div>
          <p class="text-sm text-t2 leading-relaxed">Stats update in real time as you mark days, read articles, log words, and write essays. The 84-day map shows every day — amber is today, green is done, red is missed.</p>
          <button class="absolute top-2.5 right-3 bg-transparent border-none text-t3 cursor-pointer text-sm hover:text-t1" id="dismiss-tip-progress">✕</button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-7" id="stats-grid"></div>

        <div class="card mb-4">
          <div class="section-title">12-Week Plan Progress</div>
          <div id="progress-bars"></div>
        </div>

        <div class="card mb-4">
          <div class="flex items-center justify-between mb-4">
            <div class="section-title mb-0">This Week</div>
            <span class="font-mono text-[10px] text-t3">🧊 <span id="prog-freezes">0</span> freeze(s) available</span>
          </div>
          <div class="grid grid-cols-7 gap-1.5 mb-2" id="this-week-map"></div>
          <div class="text-sm text-t2 font-mono" id="week-summary-text"></div>
        </div>

        <div class="card mb-4">
          <div class="section-title">84-Day Activity Map</div>
          <div class="grid grid-cols-7 gap-1.5" id="activity-map"></div>
          <div class="text-[11px] text-t3 font-mono mt-1.5">
            <span class="text-green">■</span> Done &nbsp;
            <span class="text-amber">■</span> Today &nbsp;
            <span class="text-red">■</span> Missed &nbsp;
            <span class="text-b2">■</span> Upcoming
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <div class="section-title mb-0">Vocabulary Bank <span class="text-xs text-t3 font-mono font-normal ml-1.5" id="vocab-count-prog"></span></div>
            <button class="open-btn hidden" id="study-words-btn">⚡ Study</button>
          </div>
          <div class="flex flex-wrap gap-2" id="vocab-cloud"></div>
          <div class="mt-3 text-xs text-t3 font-mono">Words collected from articles you've read</div>
        </div>
      </div>
    </div>`;
}

export function renderProgress(): void {
  updateStreak();
  const days = pState.completedDays.length;
  const articles = countReadArticles();
  const words = countAllWords();
  const essays = countSubmittedEssays();
  const fiction = countFictionRead();
  const mastered = pCountMastered();

  // Stats grid
  const stats = [
    { n: days, l: "Days Done" },
    { n: articles, l: "Articles Read" },
    { n: words, l: "Words Learnt" },
    { n: essays, l: "Essays Written" },
    { n: fiction, l: "Fiction Read" },
    { n: mastered, l: "Words Mastered" },
  ];
  document.getElementById("stats-grid")!.innerHTML = stats
    .map(
      (s) => /* html */ `
    <div class="bg-surface border border-b1 rounded-[10px] p-5 text-center">
      <div class="font-mono text-4xl font-medium text-amber2 leading-none mb-1.5">${s.n}</div>
      <div class="text-xs text-t3 font-mono tracking-wide uppercase">${s.l}</div>
    </div>`
    )
    .join("");

  // Progress bars
  const overall = Math.min(
    Math.round(
      (days / 84) * 35 +
        (articles / ARTICLES.length) * 25 +
        (essays / 12) * 25 +
        (fiction / Math.max(FICTION.length, 1)) * 15
    ),
    100
  );
  document.getElementById("progress-bars")!.innerHTML = [
    {
      label: "Overall completion",
      pct: `${overall}%`,
      fill: overall,
      color: "var(--amber),var(--amber2)",
    },
    {
      label: "Articles read",
      pct: `${articles} / ${ARTICLES.length}`,
      fill: Math.round((articles / ARTICLES.length) * 100),
      color: "#61afef,#88c9ff",
    },
    {
      label: "Essays submitted",
      pct: `${essays} / 12`,
      fill: Math.round((essays / 12) * 100),
      color: "#4caf7d,#7acf9e",
    },
    {
      label: `Fiction finished`,
      pct: `${fiction} / ${FICTION.length}`,
      fill: Math.round((fiction / FICTION.length) * 100),
      color: "#9b59b6,#c39bd3",
    },
  ]
    .map(
      (b) => /* html */ `
    <div class="mb-6 last:mb-0">
      <div class="flex justify-between font-mono text-[11px] text-t3 mb-1.5">
        <span>${b.label}</span><span class="text-amber2">${b.pct}</span>
      </div>
      <div class="h-1.5 bg-s3 rounded-full overflow-hidden">
        <div class="h-full rounded-full transition-all duration-500" style="width:${b.fill}%;background:linear-gradient(90deg,${b.color})"></div>
      </div>
    </div>`
    )
    .join("");

  // Activity map
  const map = document.getElementById("activity-map")!;
  const cd = getDaysSinceStart();
  map.innerHTML = Array.from({ length: 84 }, (_, i) => {
    const isDone = pState.completedDays.includes(i),
      isToday = i === cd,
      isPast = i < cd && !isDone;
    const cls = isDone
      ? "bg-green/15 border-green text-green"
      : isToday
      ? "bg-amber/15 border-amber text-amber2"
      : isPast
      ? "bg-red/15 border-red text-red"
      : "bg-s2 border-b1 text-t3";
    return `<div class="aspect-square rounded-md flex items-center justify-center font-mono text-[10px] border transition-all ${cls}" title="Day ${
      i + 1
    }${isDone ? " ✓" : isToday ? " — today" : isPast ? " — missed" : ""}">${
      i + 1
    }</div>`;
  }).join("");

  // This week
  const weekNum = getCurrentWeek(),
    weekStart = (weekNum - 1) * 7;
  let doneThisWeek = 0;
  document.getElementById("this-week-map")!.innerHTML = Array.from(
    { length: 7 },
    (_, i) => {
      const dn = weekStart + i,
        isDone = pState.completedDays.includes(dn),
        isToday = dn === cd,
        isPast = dn < cd && !isDone;
      if (isDone) doneThisWeek++;
      const cls = isDone
        ? "bg-green/15 border-green text-green"
        : isToday
        ? "bg-amber/15 border-amber text-amber2"
        : isPast
        ? "bg-red/15 border-red text-red"
        : "bg-s2 border-b1 text-t3";
      return `<div class="aspect-square rounded-md flex items-center justify-center font-mono text-[10px] border transition-all ${cls}">${
        ["M", "T", "W", "T", "F", "S", "S"][i]
      }</div>`;
    }
  ).join("");
  document.getElementById(
    "week-summary-text"
  )!.textContent = `${doneThisWeek}/7 days done this week`;
  document.getElementById("prog-freezes")!.textContent = String(
    pState.streakFreezes ?? 0
  );

  // Vocab cloud
  const allWords = pGetAllWords();
  document.getElementById(
    "vocab-count-prog"
  )!.textContent = `${allWords.length} words`;
  const studyBtn = document.getElementById("study-words-btn")!;
  studyBtn.classList.toggle("hidden", allWords.length === 0);
  const stateColor: Record<string, string> = {
    mastered: "var(--green)",
    fuzzy: "var(--amber2)",
    learning: "var(--blue)",
  };
  document.getElementById("vocab-cloud")!.innerHTML = allWords.length
    ? allWords
        .map((w) => {
          const m = pGetWordMastery(w);
          const c = stateColor[m.state] ?? "var(--text)";
          return `<span class="bg-s2 border border-b1 px-3 py-1 rounded-full font-mono text-xs cursor-default transition-colors hover:border-amber hover:text-amber2" style="color:${c}">${w}</span>`;
        })
        .join("")
    : `<span class="text-t3 text-sm font-mono">No words logged yet.</span>`;
}

export function bindProgressStaticEvents(): void {
  document
    .getElementById("help-btn-progress")
    ?.addEventListener("click", () =>
      pToggleTip("tip-progress", "help-btn-progress")
    );
  document
    .getElementById("dismiss-tip-progress")
    ?.addEventListener("click", () => pDismissTip("tip-progress"));
  document
    .getElementById("settings-btn")
    ?.addEventListener("click", showResetModal);
  document
    .getElementById("study-words-btn")
    ?.addEventListener("click", pOpenStudy);
}
