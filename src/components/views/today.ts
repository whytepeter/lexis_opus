import { WEEK_PLAN } from "../../data/weekplan";
import { ARTICLES } from "../../data/articles";
import { ESSAYS } from "../../data/essays";
import { FICTION } from "../../data/fiction";
import {
  state,
  getDaysSinceStart,
  isTodayMarkable,
  getCurrentWeek,
  getCurrentDayOfWeek,
  getArticleState,
  getFictionState,
  getAllWords,
  getWordMastery,
  markDayComplete as storeMarkDay,
  unmarkDayComplete as storeUnmark,
  saveState,
  useStreakFreeze,
} from "../../store/state";
import { showView } from "../../utils/router";
import { showToast } from "../../utils/toast";
import { toggleTip, dismissTip } from "../../utils/tips";
import { openEssayModal } from "../modals/essayModal";
import { openStudySetup } from "../modals/studyModal";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function renderToday(): void {
  const dayIndex = getCurrentDayOfWeek();
  const week = getCurrentWeek();
  const plan = WEEK_PLAN[dayIndex];
  const today = new Date();
  const totalDay = getDaysSinceStart();

  // Header
  q("#today-date-label")!.textContent = `${DAY_NAMES[today.getDay()]}, ${
    MONTH_NAMES[today.getMonth()]
  } ${today.getDate()}`;
  q("#today-day-title")!.textContent = `${plan.day} — ${plan.focus}`;
  q("#today-week-badge")!.textContent = `⬡ Week ${Math.min(week, 12)} · Day ${
    dayIndex + 1
  }`;

  // Week strip
  const strip = q("#week-strip")!;
  strip.innerHTML = "";
  WEEK_PLAN.forEach((_, i) => {
    const absDay = Math.floor(totalDay / 7) * 7 + i;
    const isDone = state.completedDays.includes(absDay);
    const isToday = i === dayIndex;
    strip.insertAdjacentHTML(
      "beforeend",
      /* html */ `
      <div class="week-day bg-surface border border-b1 rounded-lg py-2.5 px-1.5 text-center cursor-pointer transition-all hover:border-b2
                  ${isDone ? "border-green text-green done" : ""}
                  ${isToday ? "border-amber text-amber2 today" : ""}">
        <div class="font-mono text-[9px] uppercase tracking-wide mb-1.5 ${
          isToday ? "text-amber" : "text-t3"
        } ${isDone ? "!text-green" : ""}">${SHORT_DAYS[i]}</div>
        <div class="font-mono text-sm font-medium ${
          isToday ? "text-amber2 font-semibold" : ""
        } ${isDone ? "!text-green" : "text-t2"}">${i + 1}</div>
        <div class="w-1 h-1 rounded-full mx-auto mt-1 ${
          isDone ? "bg-green" : ""
        } ${isToday && !isDone ? "bg-amber" : ""}"></div>
      </div>`
    );
  });

  // Tasks
  const container = q("#today-tasks")!;
  container.innerHTML = "";

  // Main focus card
  container.insertAdjacentHTML(
    "beforeend",
    taskCard(
      plan.color,
      "Today's Focus",
      plan.focus,
      plan.task,
      `<button class="btn-amber mt-3.5 inline-flex items-center gap-1.5" data-goto="${
        plan.action
      }">
       Go to ${cap(plan.action)} →
     </button>`
    )
  );

  // Essay or reading card
  const isWriteDay = ["Writing", "Structure", "Feedback"].includes(plan.focus);
  if (isWriteDay) {
    const essay = ESSAYS[Math.min(week - 1, 11)];
    const es = state.essays[essay.id] ?? { draft: "", corrected: "" };
    container.insertAdjacentHTML(
      "beforeend",
      taskCard(
        "focus-write",
        `Week ${Math.min(week, 12)} Essay`,
        essay.title,
        essay.type,
        `<button class="btn-green mt-3.5 inline-flex items-center gap-1.5" data-essay="${
          essay.id
        }">
         ${es.draft ? "Continue Essay →" : "Start Writing →"}
       </button>`
      )
    );
  } else {
    let unread = ARTICLES.filter((a) => !getArticleState(a.id).read);
    if (week <= 3)
      unread = unread
        .filter((a) => (a.readTime ?? 99) <= 8)
        .concat(unread.filter((a) => (a.readTime ?? 99) > 8));
    const suggested = unread[0] ?? ARTICLES[0];
    container.insertAdjacentHTML(
      "beforeend",
      taskCard(
        "focus-read",
        "Suggested Read",
        suggested.title,
        `${suggested.level} · ${suggested.topic} · ⏱ ${
          suggested.readTime ?? "?"
        } min`,
        `<button class="btn-blue mt-3.5 inline-flex items-center gap-1.5" data-goto="articles">View Articles →</button>`
      )
    );
  }

  // Vocab card
  const dueWords = getAllWords().filter(
    (w) => getWordMastery(w).state !== "mastered"
  );
  if (dueWords.length > 0) {
    container.insertAdjacentHTML(
      "beforeend",
      taskCard(
        "focus-vocab",
        "📖 Vocab Study",
        `${dueWords.length} word${dueWords.length > 1 ? "s" : ""} to review`,
        "Keep your streak strong — study your logged words to move them toward mastered.",
        `<button class="btn-purple mt-3.5 inline-flex items-center gap-1.5" id="today-study-btn">Study Words →</button>`
      )
    );
  }

  // Currently reading fiction
  const reading = FICTION.filter((f) => {
    const fs = getFictionState(f.id);
    return fs.progress && !fs.read;
  });
  if (reading.length > 0) {
    const book = reading[0],
      fs = getFictionState(book.id);
    container.insertAdjacentHTML(
      "beforeend",
      taskCard(
        "focus-read",
        "📖 Currently Reading",
        book.title,
        `${book.author} · ${fs.note ?? book.type}`,
        `<button class="btn-blue mt-3.5 inline-flex items-center gap-1.5" data-goto="fiction">Go to Fiction →</button>`
      )
    );
  }

  // Complete + freeze buttons
  renderCompleteBtn(totalDay);
  renderFreezeBtnToday(totalDay);

  // Events
  container
    .querySelectorAll<HTMLButtonElement>("[data-goto]")
    .forEach((btn) =>
      btn.addEventListener("click", () => showView(btn.dataset["goto"] as any))
    );
  container
    .querySelectorAll<HTMLButtonElement>("[data-essay]")
    .forEach((btn) =>
      btn.addEventListener("click", () => openEssayModal(btn.dataset["essay"]!))
    );
  container
    .querySelector<HTMLButtonElement>("#today-study-btn")
    ?.addEventListener("click", () => {
      showView("vocab");
      setTimeout(openStudySetup, 100);
    });
}

function renderCompleteBtn(totalDay: number): void {
  const btn = q<HTMLButtonElement>("#complete-day-btn")!;
  const done = state.completedDays.includes(totalDay);
  const canMark = isTodayMarkable();
  const baseClass =
    "flex items-center gap-2 font-mono text-xs px-4 py-2.5 rounded-lg cursor-pointer transition-all mt-2 border";

  if (done) {
    btn.className = `${baseClass} ${
      canMark
        ? "text-amber2 border-amber/30"
        : "text-amber2 border-amber/30 opacity-45 cursor-not-allowed"
    }`;
    btn.style.background = "var(--amber-dim)";
    btn.innerHTML = canMark
      ? '✓ Day complete &nbsp;<span id="undo-day" style="font-size:10px;opacity:0.6;text-decoration:underline;cursor:pointer;">undo</span>'
      : "✓ Day complete";
    btn.onclick = null;
    q("#undo-day")?.addEventListener("click", (e) => {
      e.stopPropagation();
      storeUnmark();
      showToast("Day unmarked.", "amber");
      renderToday();
    });
  } else {
    btn.className = `${baseClass} text-green ${
      canMark ? "" : "opacity-45 cursor-not-allowed"
    }`;
    btn.style.cssText = `background:var(--green-dim);${borderStyle(
      "rgba(76,175,125,0.3)"
    )}`;
    btn.innerHTML = canMark ? "✓ Mark today complete" : "✓ Day not completed";
    btn.onclick = canMark
      ? () => {
          storeMarkDay();
          showToast("Day complete! Great work 🔥", "amber");
          renderToday();
        }
      : null;
  }
}

function renderFreezeBtnToday(totalDay: number): void {
  const countEl = document.getElementById("freeze-count-today");
  if (countEl) countEl.textContent = String(state.streakFreezes ?? 0);

  const btn = document.getElementById("freeze-btn-today") as HTMLButtonElement;
  if (!btn) return;
  const alreadyDone = state.completedDays.includes(totalDay);
  const hasFreeze = (state.streakFreezes ?? 0) > 0;
  btn.disabled = alreadyDone || !hasFreeze;
  btn.classList.toggle("opacity-40", alreadyDone || !hasFreeze);
  btn.classList.toggle("cursor-not-allowed", alreadyDone || !hasFreeze);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function taskCard(
  colorClass: string,
  type: string,
  title: string,
  desc: string,
  action: string
): string {
  return /* html */ `
    <div class="task-card ${colorClass} mb-4">
      <div class="font-mono text-[10px] tracking-[2px] uppercase text-t3 mb-2">${type}</div>
      <div class="font-serif text-base font-semibold mb-2 leading-snug">${title}</div>
      <div class="text-[12.5px] text-t2 leading-relaxed">${desc}</div>
      ${action}
    </div>`;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function q<T extends Element = HTMLElement>(sel: string): T | null {
  return document.querySelector<T>(sel);
}

// ── Template (static HTML injected once at app init) ─────────────────────────

export function todayTemplate(): string {
  return /* html */ `
    <div id="view-today" class="view-panel flex flex-col min-h-full">
      <div class="px-10 pt-7 pb-3 flex-shrink-0">
        <div class="flex items-end justify-between gap-3">
          <div>
            <div class="font-mono text-[11px] text-t3 tracking-wide uppercase mb-1" id="today-date-label"></div>
            <div class="font-serif text-3xl font-bold text-t1 mb-1.5" id="today-day-title">Good morning.</div>
            <div class="inline-flex items-center gap-1.5 font-mono text-[11px] px-3 py-1 rounded-full mb-7 text-amber2"
                 style="background:var(--amber-dim);border:1px solid rgba(212,147,26,0.25)" id="today-week-badge">⬡ Week 1 · Day 1</div>
          </div>
          <div class="flex gap-1.5 pb-1">
            <button class="header-icon-btn" id="help-btn-today" title="How to use Today">?</button>
          </div>
        </div>
      </div>

      <div class="px-10 pb-10 flex-1 page-content">
        <div class="grid grid-cols-7 gap-2 mb-6" id="week-strip"></div>

        <div class="info-tip" id="tip-today">
          <div class="font-mono text-[10px] tracking-[2px] uppercase text-amber mb-1.5">How to use Today</div>
          <p class="text-sm text-t2 leading-relaxed">Each day has a focus. Complete the suggested task, then tap
             <strong class="text-t1">Mark today complete</strong> to build your streak.</p>
          <button class="absolute top-2.5 right-3 bg-transparent border-none text-t3 cursor-pointer text-sm hover:text-t1" onclick=""></button>
        </div>

        <div class="font-mono text-[10px] tracking-[3px] uppercase text-t3 mb-3.5 pb-2 border-b border-b1">Today's Tasks</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="today-tasks"></div>

        <div class="flex items-center gap-3 mt-2 flex-wrap">
          <button class="flex items-center gap-2 font-mono text-xs px-4 py-2.5 rounded-lg cursor-pointer transition-all"
                  style="border:1px solid var(--border)"
                  id="complete-day-btn">✓ Mark today complete</button>
          <button class="flex items-center gap-1.5 font-mono text-xs px-4 py-2.5 rounded-lg cursor-pointer transition-all text-t3 bg-s2 hover:text-t1"
                  style="border:1px solid var(--border)"
                  id="freeze-btn-today" title="Use a streak freeze for today">
            🧊 Use freeze (<span id="freeze-count-today">0</span>)
          </button>
        </div>
      </div>
    </div>`;
}

// Wire up static button events (called once after template is injected)
export function bindTodayStaticEvents(): void {
  document
    .getElementById("help-btn-today")
    ?.addEventListener("click", () => toggleTip("tip-today", "help-btn-today"));
  document
    .querySelector<HTMLButtonElement>("#tip-today button")
    ?.addEventListener("click", () => dismissTip("tip-today"));

  // Freeze button — bound once here, always works after re-renders
  document.getElementById("freeze-btn-today")?.addEventListener("click", () => {
    const r = useStreakFreeze();
    if (r === "no-freezes")
      showToast(
        "No freezes available — complete 5+ days in a week to earn one.",
        "amber"
      );
    else if (r === "already-done")
      showToast("Today is already marked complete.", "amber");
    else {
      showToast("❄️ Streak freeze used!", "amber");
      renderToday();
    }
  });
}
