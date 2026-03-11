import { FICTION } from "../../data/fiction";
import { state, getFictionState, saveState } from "../../store/state";
import { showToast } from "../../utils/toast";
import { toggleTip, dismissTip as dt } from "../../utils/tips";
import type { FictionFilter } from "../../types";

let currentFictionFilter: FictionFilter = "all";
let fictionSearchOpen = false;

export function fictionTemplate(): string {
  return /* html */ `
    <div id="view-fiction" class="view-panel hidden flex flex-col min-h-full">
      <div class="px-10 pt-7 pb-3 flex-shrink-0">
        <div class="flex items-end justify-between gap-3">
          <div>
            <div class="font-serif text-[26px] font-semibold text-t1 mb-1.5">Fiction Library</div>
            <div class="text-sm text-t2 font-light">Short stories · Novels · Scripts · Classic fiction</div>
          </div>
          <div class="flex gap-1.5 pb-1">
            <button class="header-icon-btn" id="fiction-search-icon-btn" title="Search fiction">⌕</button>
            <button class="header-icon-btn" id="help-btn-fiction" title="Help">?</button>
          </div>
        </div>
        <div class="overflow-hidden max-h-0 opacity-0 transition-all duration-300" id="fiction-search-bar-wrap">
          <div class="relative mt-3.5 mb-3">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-t3 text-sm pointer-events-none">⌕</span>
            <input class="w-full bg-s2 border border-b2 rounded-lg py-2.5 pl-9 pr-9 text-t1 text-sm font-sans outline-none focus:border-amber"
                   id="fiction-search-input" placeholder="Search by title, author or type…" />
            <button class="hidden absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none text-t3 cursor-pointer hover:text-t1 text-sm"
                    id="fiction-search-clear">✕</button>
          </div>
        </div>
      </div>
      <div class="px-10 pb-10 flex-1 page-content">
        <div class="info-tip" id="tip-fiction">
          <div class="font-mono text-[10px] tracking-[2px] uppercase text-amber mb-1.5">How to read fiction</div>
          <p class="text-sm text-t2 leading-relaxed">Fiction teaches rhythm, tone, dialogue, and emotion. Don't worry about every word — read for the story first. Start with short stories before tackling novels.</p>
          <button class="absolute top-2.5 right-3 bg-transparent border-none text-t3 cursor-pointer text-sm hover:text-t1" id="dismiss-tip-fiction">✕</button>
        </div>
        <div class="flex flex-wrap gap-2 mb-4" id="fiction-filters">
          ${fBtn("all", "All", true)} ${fBtn("story", "Short Stories")} ${fBtn(
    "novel",
    "Novels"
  )}
          ${fBtn("script", "Scripts")} ${fBtn("beginner", "Beginner")} ${fBtn(
    "intermediate",
    "Intermediate"
  )}
          ${fBtn("advanced", "Advanced")} ${fBtn(
    "reading",
    "📖 Reading"
  )} ${fBtn("finished", "✓ Finished")}
        </div>
        <div id="fiction-list" class="mt-4"></div>
      </div>
    </div>`;
}

function fBtn(f: FictionFilter, label: string, active = false) {
  return `<button class="filter-btn${
    active ? " active" : ""
  }" data-ffilter="${f}">${label}</button>`;
}

export function renderFiction(): void {
  if (!state.fiction) state.fiction = {};
  const list = document.getElementById("fiction-list")!;
  list.innerHTML = "";

  let filtered = applyFictionFilter(currentFictionFilter);
  const q =
    (document.getElementById("fiction-search-input") as HTMLInputElement)?.value
      .trim()
      .toLowerCase() ?? "";
  if (q)
    filtered = filtered.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.author.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q) ||
        f.desc.toLowerCase().includes(q)
    );

  if (filtered.length === 0) {
    list.innerHTML = `<div class="py-10 text-center text-t3 font-mono text-sm">No results found.</div>`;
    return;
  }

  filtered.forEach((item) => {
    const fs = getFictionState(item.id);
    const tl =
      item.type === "story"
        ? "Short Story"
        : item.type === "novel"
        ? "Novel"
        : "Script";
    const lc =
      item.level === "beginner"
        ? "var(--green)"
        : item.level === "intermediate"
        ? "var(--amber)"
        : "var(--red)";
    const rt =
      item.readTime >= 60
        ? `~${Math.round(item.readTime / 60)}h`
        : `~${item.readTime} min`;
    const typeCls =
      item.type === "novel"
        ? "text-purple"
        : item.type === "script"
        ? "text-red"
        : "text-blue";
    const typeBg =
      item.type === "novel"
        ? "background:rgba(155,89,182,0.1);border-color:rgba(155,89,182,0.25)"
        : item.type === "script"
        ? "background:rgba(224,108,117,0.1);border-color:rgba(224,108,117,0.25)"
        : "background:rgba(97,175,239,0.1);border-color:rgba(97,175,239,0.25)";

    list.insertAdjacentHTML(
      "beforeend",
      /* html */ `
      <div class="bg-surface border border-b1 rounded-[10px] px-5 py-[18px] mb-3 cursor-pointer transition-all hover:border-b2 hover:bg-s2
                  ${fs.read ? "border-l-[3px] !border-l-green" : ""} ${
        fs.progress && !fs.read ? "border-l-[3px] !border-l-amber" : ""
      }">
        <div class="flex flex-wrap gap-2 items-center mb-2">
          <span class="font-mono text-[9px] tracking-[1.5px] uppercase px-2 py-0.5 rounded border ${typeCls}" style="${typeBg}">${tl}</span>
          <span class="font-mono text-[10px]" style="color:${lc}">${
        item.level
      }</span>
          <span class="font-mono text-[10px] text-t3">${item.year}</span>
          <span class="font-mono text-[10px] text-blue">⏱ ${rt}</span>
          ${
            fs.read
              ? '<span class="font-mono text-[10px] text-green">✓ read</span>'
              : ""
          }
        </div>
        <div class="font-serif text-base font-semibold text-t1 mb-0.5">${
          item.title
        }</div>
        <div class="font-mono text-[11px] text-t3 mb-2">${item.author}</div>
        <div class="text-[13px] text-t2 leading-relaxed mb-3.5">${
          item.desc
        }</div>
        <div class="flex gap-2 items-center">
          <a class="open-btn" href="${item.url}" target="_blank">↗ Read</a>
          ${
            !fs.read
              ? `<button class="check-btn ${
                  fs.progress ? "half" : ""
                }" data-cycle-fiction="${item.id}">${
                  fs.progress ? "…" : "○"
                }</button>`
              : `<button class="check-btn checked" data-cycle-fiction="${item.id}">✓</button>`
          }
        </div>
        ${
          fs.progress && !fs.read
            ? /* html */ `
          <div class="flex items-center gap-2 mt-2.5">
            <span class="text-[11px] text-amber font-mono">Currently reading</span>
            <input class="field-input flex-1 text-xs py-1 px-2.5" placeholder="Add a note, e.g. Chapter 3…"
                   value="${fs.note ?? ""}" data-note="${item.id}" />
          </div>`
            : ""
        }
        <div class="mt-3.5 pt-3 border-t border-b1 text-[11px] text-t3 font-mono">Vocabulary hints: ${item.words_hint.join(
          " · "
        )}</div>
      </div>`
    );
  });

  list
    .querySelectorAll<HTMLButtonElement>("[data-cycle-fiction]")
    .forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        cycleFictionStatus(btn.dataset["cycleFiction"]!);
      })
    );
  list.querySelectorAll<HTMLInputElement>("[data-note]").forEach((inp) =>
    inp.addEventListener("input", () => {
      const id = inp.dataset["note"]!;
      if (!state.fiction[id])
        state.fiction[id] = { read: false, progress: true };
      state.fiction[id].note = inp.value;
      saveState();
    })
  );
}

function cycleFictionStatus(id: string): void {
  if (!state.fiction) state.fiction = {};
  if (!state.fiction[id]) state.fiction[id] = { read: false, progress: false };
  const f = state.fiction[id];
  if (!f.progress && !f.read) {
    f.progress = true;
    f.read = false;
    showToast("Added to currently reading 📖", "amber");
  } else if (f.progress && !f.read) {
    f.progress = false;
    f.read = true;
    showToast("Marked as finished ✓", "green");
  } else {
    f.progress = false;
    f.read = false;
    showToast("Removed from reading list", "amber");
  }
  saveState();
  renderFiction();
}

function applyFictionFilter(f: FictionFilter) {
  switch (f) {
    case "story":
      return FICTION.filter((i) => i.type === "story");
    case "novel":
      return FICTION.filter((i) => i.type === "novel");
    case "script":
      return FICTION.filter((i) => i.type === "script");
    case "beginner":
      return FICTION.filter((i) => i.level === "beginner");
    case "intermediate":
      return FICTION.filter((i) => i.level === "intermediate");
    case "advanced":
      return FICTION.filter((i) => i.level === "advanced");
    case "reading":
      return FICTION.filter((i) => {
        const fs = getFictionState(i.id);
        return fs.progress && !fs.read;
      });
    case "finished":
      return FICTION.filter((i) => getFictionState(i.id).read);
    default:
      return FICTION;
  }
}

export function bindFictionStaticEvents(): void {
  document
    .getElementById("help-btn-fiction")
    ?.addEventListener("click", () =>
      toggleTip("tip-fiction", "help-btn-fiction")
    );
  document
    .getElementById("dismiss-tip-fiction")
    ?.addEventListener("click", () => dt("tip-fiction"));

  const searchBtn = document.getElementById("fiction-search-icon-btn")!;
  const searchWrap = document.getElementById("fiction-search-bar-wrap")!;
  const searchInput = document.getElementById(
    "fiction-search-input"
  ) as HTMLInputElement;
  const clearBtn = document.getElementById("fiction-search-clear")!;

  searchBtn.addEventListener("click", () => {
    fictionSearchOpen = !fictionSearchOpen;
    if (fictionSearchOpen) {
      searchWrap.style.cssText = "max-height:60px; opacity:1;";
      searchBtn.classList.add("active");
      setTimeout(() => searchInput.focus(), 250);
    } else {
      searchWrap.style.cssText = "max-height:0; opacity:0;";
      searchBtn.classList.remove("active");
      searchInput.value = "";
      clearBtn.classList.add("hidden");
      renderFiction();
    }
  });
  searchInput.addEventListener("input", () => {
    clearBtn.classList.toggle("hidden", !searchInput.value);
    renderFiction();
  });
  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearBtn.classList.add("hidden");
    searchInput.focus();
    renderFiction();
  });

  document.getElementById("fiction-filters")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-ffilter]"
    );
    if (!btn) return;
    document
      .querySelectorAll("#fiction-filters .filter-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFictionFilter = btn.dataset["ffilter"] as FictionFilter;
    renderFiction();
  });
}
