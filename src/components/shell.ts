import { showView } from "../utils/router";
import { toggleTheme } from "../utils/theme";
import { state } from "../store/state";
import type { ViewName } from "../types";

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function renderSidebar(): string {
  return /* html */ `
    <nav class="sidebar h-screen">
      <!-- Logo -->
      <div class="px-6 py-7 border-b border-b1">
        <div class="font-serif text-lg font-bold text-t1 tracking-tight">Lexis</div>
        <div class="font-mono text-[10px] text-amber tracking-[2px] uppercase mt-0.5">Track · Learn · Write</div>
      </div>

      <!-- Nav -->
      <div class="px-3 pt-5 pb-2">
        <div class="font-mono text-[9px] tracking-[2px] uppercase text-t3 px-3 mb-1.5">Navigate</div>
        ${navItem("today", "◈", "Today")}
        ${navItem("articles", "◎", "Articles", "unread-badge")}
        ${navItem("essays", "◻", "Essays")}
        ${navItem("progress", "◈", "Progress")}
        ${navItem("vocab", "◆", "Vocab")}
        ${navItem("fiction", "◉", "Fiction")}
      </div>

      <!-- Footer -->
      <div class="mt-auto px-5 py-4 border-t border-b1">
        <div class="font-mono text-[11px] text-t3 mb-1.5">
          <span class="text-amber2 text-base font-medium" id="streak-num">0</span> day streak 🔥
        </div>
        <div class="font-mono text-[10px] text-t3 mb-3 flex items-center justify-between">
          <span>🧊 <span id="streak-freeze-count">0</span> freeze(s)</span>
          <button id="freeze-btn" class="text-blue text-[10px] font-mono cursor-pointer bg-transparent border-none p-0">Use</button>
        </div>
        <div class="flex gap-2">
          <button class="icon-action-btn js-theme-icon flex-1 bg-s2 border border-b1 text-t2 rounded-lg p-2 cursor-pointer text-base transition-all hover:bg-s3 hover:text-t1 hover:border-b2">☀</button>
          <button id="refresh-btn" class="icon-action-btn flex-1 bg-s2 border border-b1 text-t2 rounded-lg p-2 cursor-pointer text-base transition-all hover:bg-s3 hover:text-t1 hover:border-b2">↺</button>
        </div>
      </div>
    </nav>`;
}

function navItem(
  view: ViewName,
  icon: string,
  label: string,
  badgeId?: string
): string {
  return /* html */ `
    <button class="nav-item" data-view="${view}">
      <span class="w-[18px] text-center text-[15px]">${icon}</span>
      <span>${label}</span>
      ${
        badgeId
          ? `<span class="ml-auto bg-amber text-bg font-mono text-[10px] font-medium px-1.5 py-0.5 rounded-full" id="${badgeId}">0</span>`
          : ""
      }
    </button>`;
}

// ── Bottom tabs ───────────────────────────────────────────────────────────────

export function renderBottomTabs(): string {
  return /* html */ `
    <nav class="bottom-tabs">
      ${bottomTab("today", "◈", "Today")}
      ${bottomTab("articles", "◎", "Articles", "bt-unread-badge")}
      ${bottomTab("essays", "◻", "Essays")}
      ${bottomTab("progress", "◈", "Progress")}
      <button class="bottom-tab flex-1 flex flex-col items-center justify-center gap-0.5 border-none bg-transparent text-t3 font-mono text-[9px] tracking-wide uppercase cursor-pointer transition-colors relative p-0" id="bt-more">
        <span class="text-lg leading-none">⋯</span>
        <span>More</span>
      </button>
    </nav>`;
}

function bottomTab(
  view: ViewName,
  icon: string,
  label: string,
  badgeId?: string
): string {
  return /* html */ `
    <button class="bottom-tab flex-1 flex flex-col items-center justify-center gap-0.5 border-none bg-transparent text-t3 font-mono text-[9px] tracking-wide uppercase cursor-pointer transition-colors relative p-0" id="bt-${view}" data-view="${view}">
      <span class="text-lg leading-none">${icon}</span>
      <span>${label}</span>
      ${
        badgeId
          ? `<span class="bt-badge hidden absolute top-1 font-mono text-[9px] font-bold w-[15px] h-[15px] rounded-full flex items-center justify-center bg-amber text-bg" id="${badgeId}" style="right:calc(50% - 16px)"></span>`
          : ""
      }
    </button>`;
}

// ── More sheet ────────────────────────────────────────────────────────────────

export function renderMoreSheet(): string {
  return /* html */ `
    <div class="fixed inset-0 bg-transparent z-[800] hidden" id="more-sheet-overlay"></div>
    <div class="fixed bottom-0 left-0 right-0 bg-surface border-t border-b2 rounded-t-[20px] z-[801] translate-y-full transition-transform duration-300 pb-3" id="more-sheet"
         style="padding-bottom: calc(12px + env(safe-area-inset-bottom))">
      <div class="w-9 h-1 bg-b2 rounded-full mx-auto mt-3 mb-5"></div>
      <div class="font-mono text-[10px] tracking-[2px] uppercase text-t3 px-5 mb-3">More sections</div>
      ${moreItem(
        "vocab",
        "◆",
        "more-icon-vocab",
        "Vocabulary",
        "Study your logged words · Track mastery"
      )}
      ${moreItem(
        "fiction",
        "◉",
        "more-icon-fiction",
        "Fiction",
        "Short stories · Novels · Scripts"
      )}
    </div>`;
}

function moreItem(
  view: ViewName,
  icon: string,
  _cls: string,
  label: string,
  desc: string
): string {
  return /* html */ `
    <button class="more-sheet-item flex items-center gap-4 px-5 py-4 cursor-pointer border-none bg-transparent w-full text-left transition-colors hover:bg-s2 active:bg-s3 first-of-type:border-t first-of-type:border-b1" data-sheet-view="${view}">
      <div class="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0" style="background:var(--amber-dim)">${icon}</div>
      <div class="flex-1">
        <div class="font-serif text-base font-semibold text-t1 mb-0.5">${label}</div>
        <div class="text-xs text-t2">${desc}</div>
      </div>
      <div class="text-t3 text-base">›</div>
    </button>`;
}

// ── FAB pill (mobile top-right) ───────────────────────────────────────────────

export function renderFAB(): string {
  return /* html */ `
    <div class="flex md:hidden fixed z-[400] bg-s2 border border-b2 rounded-full shadow-lg overflow-hidden flex-row items-center"
         style="top:max(14px,env(safe-area-inset-top)); right:14px;" id="fab-pill">
      <button class="bg-transparent border-none text-t2 text-lg w-10 h-9 flex items-center justify-center cursor-pointer transition-colors js-theme-icon hover:text-t1 hover:bg-s3">☀</button>
      <div class="w-px h-4 bg-b1 flex-shrink-0"></div>
      <button id="fab-refresh" class="bg-transparent border-none text-t2 text-lg w-10 h-9 flex items-center justify-center cursor-pointer transition-colors hover:text-t1 hover:bg-s3">↺</button>
    </div>`;
}

// ── FAB visibility (show on mobile only via CSS; this handles JS events) ──────

export function bindShellEvents(): void {
  // Sidebar nav
  document
    .querySelectorAll<HTMLButtonElement>(".nav-item[data-view]")
    .forEach((btn) => {
      btn.addEventListener("click", () =>
        showView(btn.dataset["view"] as ViewName)
      );
    });

  // Bottom tabs
  document
    .querySelectorAll<HTMLButtonElement>(".bottom-tab[data-view]")
    .forEach((btn) => {
      btn.addEventListener("click", () =>
        showView(btn.dataset["view"] as ViewName)
      );
    });

  // More sheet
  const btMore = document.getElementById("bt-more");
  const overlay = document.getElementById("more-sheet-overlay");
  const sheet = document.getElementById("more-sheet");

  const openSheet = () => {
    overlay?.classList.replace("hidden", "block");
    overlay!.style.background = "rgba(0,0,0,0.55)";
    sheet?.classList.remove("translate-y-full");
  };
  const closeSheet = () => {
    overlay?.classList.replace("block", "hidden");
    overlay!.style.background = "transparent";
    sheet?.classList.add("translate-y-full");
  };

  btMore?.addEventListener("click", openSheet);
  overlay?.addEventListener("click", closeSheet);

  document
    .querySelectorAll<HTMLButtonElement>("[data-sheet-view]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        closeSheet();
        showView(btn.dataset["sheetView"] as ViewName);
      });
    });

  // Theme
  document
    .querySelectorAll<HTMLButtonElement>(".js-theme-icon")
    .forEach((btn) => btn.addEventListener("click", toggleTheme));

  // Refresh
  document
    .querySelectorAll<HTMLButtonElement>("#refresh-btn, #fab-refresh")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        btn.classList.add("spin-once");
        setTimeout(() => location.reload(), 300);
      });
    });

  // Freeze
  document.getElementById("freeze-btn")?.addEventListener("click", () => {
    import("../store/state").then(({ useStreakFreeze, updateStreak }) => {
      import("../utils/toast").then(({ showToast }) => {
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
          import("../components/views/today").then((m) => m.renderToday());
        }
      });
    });
  });
}

export function updateStreakUI(): void {
  const el = document.getElementById("streak-num");
  if (el) el.textContent = String(state.streakFreezes ?? 0);
  const fc = document.getElementById("streak-freeze-count");
  if (fc) fc.textContent = String(state.streakFreezes ?? 0);
}
