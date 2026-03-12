// ─── views/today.js ───────────────────────────────────────────────────────────

import { ARTICLES } from "../data/articles.js";
import { ESSAYS, WEEK_PLAN } from "../data/essays.js";
import { FICTION } from "../data/fiction.js";
import {
  getDaysSinceStart,
  getCurrentWeek,
  getCurrentDayOfWeek,
  isTodayMarkable,
  isDayComplete,
  markDayComplete as storeMark,
  unmarkDayComplete as storeUnmark,
  useStreakFreeze,
  updateStreak,
  getArticleState,
  getFictionState,
  getAllWords,
  getWordMastery,
} from "../state/store.js";
import { toast } from "../utils/toast.js";
import { openEssayModal } from "./essays.js";
import { openStudySetup } from "../study/session.js";

export function renderToday() {
  const dayIndex = getCurrentDayOfWeek();
  const week = getCurrentWeek();
  const plan = WEEK_PLAN[dayIndex];
  const today = new Date();
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

  document.getElementById("today-date-label").textContent = `${
    DAY_NAMES[today.getDay()]
  }, ${MONTH_NAMES[today.getMonth()]} ${today.getDate()}`;
  document.getElementById(
    "today-day-title"
  ).textContent = `${plan.day} — ${plan.focus}`;
  document.getElementById("today-week-badge").textContent = `⬡ Week ${Math.min(
    week,
    12
  )} · Day ${dayIndex + 1}`;

  _renderWeekStrip(dayIndex);
  _renderTasks(plan, week);
  _renderCompleteBtn();
}

function _renderWeekStrip(dayIndex) {
  const SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const totalDays = getDaysSinceStart();
  const strip = document.getElementById("week-strip");
  strip.innerHTML = "";
  WEEK_PLAN.forEach((_, i) => {
    const absDay = Math.floor(totalDays / 7) * 7 + i;
    const isDone = isDayComplete(absDay);
    const isToday = i === dayIndex;
    const el = document.createElement("div");
    el.className = `week-day ${isDone ? "done" : ""} ${isToday ? "today" : ""}`;
    el.innerHTML = `<div class="wd-name">${SHORT[i]}</div><div class="wd-num">${
      i + 1
    }</div><div class="wd-dot"></div>`;
    strip.appendChild(el);
  });
}

function _renderTasks(plan, week) {
  const container = document.getElementById("today-tasks");
  container.innerHTML = "";

  // Main focus card
  const main = document.createElement("div");
  main.className = `task-card ${plan.color}`;
  const viewLabel = plan.action.charAt(0).toUpperCase() + plan.action.slice(1);
  main.innerHTML = `
    <div class="task-type">Today's Focus</div>
    <div class="task-title">${plan.focus}</div>
    <div class="task-desc">${plan.task}</div>
    <button class="task-action btn-amber" data-goto="${plan.action}">Go to ${viewLabel} →</button>`;
  container.appendChild(main);

  // Write-day essay card
  if (["Writing", "Structure", "Feedback"].includes(plan.focus)) {
    const essayForWeek = ESSAYS[Math.min(week - 1, 11)];
    const hasDraft = !!(getWordMastery && true); // just use essay state
    const ec = document.createElement("div");
    ec.className = "task-card focus-write";
    ec.innerHTML = `
      <div class="task-type">Week ${Math.min(week, 12)} Essay</div>
      <div class="task-title">${essayForWeek.title}</div>
      <div class="task-desc">${essayForWeek.type}</div>
      <button class="task-action btn-green" data-essay="${
        essayForWeek.id
      }">Start / Continue →</button>`;
    container.appendChild(ec);
  } else {
    // Suggested article card
    let unread = ARTICLES.filter((a) => !getArticleState(a.id).read);
    if (week <= 3) {
      unread = [
        ...unread.filter((a) => (a.readTime || 99) <= 8),
        ...unread.filter((a) => (a.readTime || 99) > 8),
      ];
    }
    const suggested = unread[0] || ARTICLES[0];
    const ac = document.createElement("div");
    ac.className = "task-card focus-read";
    ac.innerHTML = `
      <div class="task-type">Suggested Read</div>
      <div class="task-title">${suggested.title}</div>
      <div class="task-desc">${suggested.level} · ${suggested.topic} · ⏱ ${
      suggested.readTime || "?"
    } min</div>
      <button class="task-action btn-blue" data-goto="articles">View Articles →</button>`;
    container.appendChild(ac);
  }

  // Vocab study card
  const dueWords = getAllWords().filter(
    (w) => getWordMastery(w).state !== "mastered"
  );
  if (dueWords.length > 0) {
    const vc = document.createElement("div");
    vc.className = "task-card focus-vocab";
    vc.innerHTML = `
      <div class="task-type">📖 Vocab Study</div>
      <div class="task-title">${dueWords.length} word${
      dueWords.length > 1 ? "s" : ""
    } to review</div>
      <div class="task-desc">Keep your streak strong — study your logged words to move them toward mastered.</div>
      <button class="task-action btn-purple" data-goto="vocab">Study Words →</button>`;
    container.appendChild(vc);
  }

  // Currently reading fiction card
  const reading = FICTION.filter((f) => {
    const fs = getFictionState(f.id);
    return fs.progress && !fs.read;
  });
  if (reading.length > 0) {
    const book = reading[0],
      fs = getFictionState(book.id);
    const fc = document.createElement("div");
    fc.className = "task-card focus-read";
    fc.innerHTML = `
      <div class="task-type">📖 Currently Reading</div>
      <div class="task-title">${book.title}</div>
      <div class="task-desc">${book.author} · ${fs.note || book.type}</div>
      <button class="task-action btn-blue" data-goto="fiction">Go to Fiction →</button>`;
    container.appendChild(fc);
  }

  // Delegate navigation clicks
  container.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-goto]");
    const essayBtn = e.target.closest("button[data-essay]");
    if (btn) window._showView(btn.dataset.goto);
    if (essayBtn) openEssayModal(essayBtn.dataset.essay);
  });
}

function _renderCompleteBtn() {
  const btn = document.getElementById("complete-day-btn");
  const totalDay = getDaysSinceStart();
  const done = isDayComplete(totalDay);
  const canMark = isTodayMarkable();

  if (done) {
    btn.className = `complete-day-btn done${canMark ? "" : " locked"}`;
    if (canMark) {
      btn.innerHTML =
        '✓ Day complete &nbsp;<span id="undo-btn" style="font-size:10px;opacity:0.6;text-decoration:underline;cursor:pointer;">undo</span>';
      btn.onclick = null;
      document.getElementById("undo-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        storeUnmark();
        renderToday();
        toast("Day unmarked.", "amber");
      });
    } else {
      btn.innerHTML = "✓ Day complete";
      btn.onclick = null;
    }
  } else {
    btn.className = `complete-day-btn${canMark ? "" : " locked"}`;
    btn.innerHTML = canMark ? "✓ Mark today complete" : "✓ Day not completed";
    btn.onclick = canMark
      ? () => {
          storeMark();
          renderToday();
          toast("Day complete! Great work 🔥", "amber");
        }
      : null;
  }
}

export function handleUseStreakFreeze() {
  const ok = useStreakFreeze();
  if (!ok) {
    toast(
      "No freezes available — complete 5+ days in a week to earn one.",
      "amber"
    );
    return;
  }
  renderToday();
  toast("❄️ Streak freeze used!", "amber");
}
