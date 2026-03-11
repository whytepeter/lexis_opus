import { ARTICLES } from "../../data/articles";
import { state, getArticleState, saveState } from "../../store/state";
import { showToast } from "../../utils/toast";
import { toggleTip, dismissTip } from "../../utils/tips";
import type { ArticleFilter } from "../../types";

let currentFilter: ArticleFilter = "all";
let openWordPanels: Record<string, boolean> = {};
let searchOpen = false;

// ── Template ──────────────────────────────────────────────────────────────────

export function articlesTemplate(): string {
  return /* html */ `
    <div id="view-articles" class="view-panel hidden flex flex-col min-h-full">
      <div class="px-10 pt-7 pb-3 flex-shrink-0">
        <div class="flex items-end justify-between gap-3">
          <div>
            <div class="font-serif text-[26px] font-semibold text-t1 mb-1.5">Reading List</div>
            <div class="text-sm text-t2 font-light">Mark articles as read · Log new vocabulary words</div>
          </div>
          <div class="flex gap-1.5 pb-1">
            <button class="header-icon-btn" id="search-icon-btn" title="Search">⌕</button>
            <button class="header-icon-btn" id="help-btn-articles" title="Help">?</button>
          </div>
        </div>
        <!-- Search bar -->
        <div class="overflow-hidden max-h-0 opacity-0 transition-all duration-300 mt-0 mb-0" id="search-bar-wrap">
          <div class="relative mt-3.5 mb-3">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-t3 text-sm pointer-events-none">⌕</span>
            <input class="w-full bg-s2 border border-b2 rounded-lg py-2.5 pl-9 pr-9 text-t1 text-sm font-sans outline-none focus:border-amber"
                   id="article-search-input" placeholder="Search articles by title or topic…" />
            <button class="hidden absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none text-t3 cursor-pointer hover:text-t1 text-sm"
                    id="search-clear-btn">✕</button>
          </div>
        </div>
      </div>

      <div class="px-10 pb-10 flex-1 page-content">
        <div class="info-tip" id="tip-articles">
          <div class="font-mono text-[10px] tracking-[2px] uppercase text-amber mb-1.5">How to read these articles</div>
          <p class="text-sm text-t2 leading-relaxed">Start with <strong class="text-t1">⚡ Short reads</strong>. Read once for general understanding, then again slowly. Tap the circle to mark progress — ½ halfway, ✓ done. Find 2–3 new words and log them.</p>
          <button class="absolute top-2.5 right-3 bg-transparent border-none text-t3 cursor-pointer text-sm hover:text-t1" id="dismiss-tip-articles">✕</button>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap gap-2 mb-6" id="article-filters">
          ${filterBtn("all", "All", true)} ${filterBtn(
    "starter",
    "Starter"
  )} ${filterBtn("building", "Building")}
          ${filterBtn("stretch", "Stretch")} ${filterBtn(
    "unread",
    "Unread"
  )} ${filterBtn("read", "Read")}
          ${filterBtn("short", "⚡ Short reads")} ${filterBtn(
    "broad",
    "🌍 Broad interest"
  )}
          ${filterBtn("books", "📚 Book summaries")} ${filterBtn(
    "happiness",
    "😊 Happiness"
  )}
          ${filterBtn("health", "💪 Health")} ${filterBtn(
    "productivity",
    "⚡ Productivity"
  )}
          ${filterBtn("money", "💰 Money")} ${filterBtn(
    "politics",
    "🏛 Politics"
  )}
          ${filterBtn("culture", "🌍 Culture & Life")} ${filterBtn(
    "ideas",
    "💡 Ideas"
  )}
        </div>

        <div id="article-list"></div>
      </div>
    </div>`;
}

function filterBtn(f: ArticleFilter, label: string, active = false): string {
  return `<button class="filter-btn${
    active ? " active" : ""
  }" data-filter="${f}">${label}</button>`;
}

// ── Render ────────────────────────────────────────────────────────────────────

export function renderArticles(): void {
  updateUnreadBadge();
  const list = document.getElementById("article-list")!;
  list.innerHTML = "";

  let filtered = applyFilter(currentFilter);
  const query =
    (document.getElementById("article-search-input") as HTMLInputElement)?.value
      .trim()
      .toLowerCase() ?? "";
  if (query)
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.topic.toLowerCase().includes(query) ||
        a.desc.toLowerCase().includes(query)
    );

  if (filtered.length === 0) {
    list.innerHTML = `<div class="py-10 text-center text-t3 font-mono text-sm">No articles found.<br><span class="text-xs opacity-70">Try a different filter or clear your search.</span></div>`;
    return;
  }

  filtered.forEach((article) => {
    const as = getArticleState(article.id);
    const cc = as.read ? "checked" : as.half ? "half" : "";
    const ci = as.read ? "✓" : as.half ? "½" : "○";
    const wordCount = (as.words ?? []).length;

    const el = document.createElement("div");
    el.className = `article-item bg-surface border border-b1 rounded-[10px] px-5 py-[18px] mb-2.5 transition-all cursor-pointer hover:border-b2 hover:translate-x-0.5 ${
      as.read
        ? "border-l-[3px] !border-l-green opacity-75 hover:opacity-100"
        : ""
    }`;
    el.dataset["id"] = article.id;
    el.innerHTML = /* html */ `
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1">
          <div class="flex gap-2 items-center flex-wrap mb-1.5">
            <span class="level-tag level-${article.level}">${
      article.level
    }</span>
            <span class="font-mono text-[10px] text-t3 tracking-wide">${
              article.topic
            }</span>
            ${
              article.readTime
                ? `<span class="font-mono text-[10px] text-blue">⏱ ${article.readTime} min</span>`
                : ""
            }
            ${
              as.half && !as.read
                ? `<span class="font-mono text-[10px] text-amber">½ halfway</span>`
                : ""
            }
            ${
              wordCount > 0
                ? `<span class="font-mono text-[10px] text-amber">📖 ${wordCount} word${
                    wordCount > 1 ? "s" : ""
                  } logged</span>`
                : ""
            }
          </div>
          <div class="font-serif text-[15px] font-semibold mb-1 leading-snug">${
            article.title
          }</div>
          <div class="text-[12.5px] text-t2 leading-relaxed">${
            article.desc
          }</div>
        </div>
        <div class="flex gap-2 items-center flex-shrink-0">
          <a class="open-btn" href="${article.url}" target="_blank">↗ Read</a>
          <button class="check-btn ${cc}" data-cycle="${
      article.id
    }">${ci}</button>
        </div>
      </div>
      <!-- Word log panel -->
      <div class="bg-s2 border border-b1 rounded-lg px-4 py-3.5 mt-3 ${
        openWordPanels[article.id] ? "" : "hidden"
      }" id="wlp-${article.id}">
        <div class="font-mono text-[10px] tracking-[2px] uppercase text-t3 mb-2.5">Words I learned from this article</div>
        <div class="flex flex-wrap gap-1.5 mb-2.5" id="chips-${
          article.id
        }"></div>
        <div class="flex gap-2">
          <input class="field-input flex-1" id="winput-${
            article.id
          }" placeholder="Type a word and press Enter…" />
          <button class="bg-amber-dim border border-amber/30 text-amber2 font-mono text-[11px] px-3.5 py-1.5 rounded-md cursor-pointer transition-all hover:bg-amber/20" data-addword="${
            article.id
          }">+ Add</button>
        </div>
        <div class="mt-2.5 text-[11px] text-t3 font-mono">Hint words: ${article.words_hint.join(
          " · "
        )}</div>
      </div>`;

    list.appendChild(el);
    renderChips(article.id);
  });

  // Events
  list.querySelectorAll<HTMLElement>("[data-id]").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (
        (e.target as HTMLElement).closest("[data-cycle]") ||
        (e.target as HTMLElement).closest("a") ||
        (e.target as HTMLElement).closest("[data-addword]")
      )
        return;
      toggleWordPanel(el.dataset["id"]!);
    });
  });
  list.querySelectorAll<HTMLButtonElement>("[data-cycle]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      cycleReadStatus(btn.dataset["cycle"]!);
    });
  });
  list.querySelectorAll<HTMLButtonElement>("[data-addword]").forEach((btn) => {
    btn.addEventListener("click", () => addWord(btn.dataset["addword"]!));
  });
  list
    .querySelectorAll<HTMLInputElement>('[id^="winput-"]')
    .forEach((input) => {
      const id = input.id.replace("winput-", "");
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") addWord(id);
      });
    });
}

// ── Actions ───────────────────────────────────────────────────────────────────

function cycleReadStatus(id: string): void {
  if (!state.articles[id])
    state.articles[id] = { read: false, half: false, words: [] };
  const a = state.articles[id];
  if (!a.half && !a.read) {
    a.half = true;
    a.read = false;
    showToast("Marked as halfway 📖", "amber");
  } else if (a.half && !a.read) {
    a.half = false;
    a.read = true;
    showToast("Marked as fully read ✓", "green");
  } else {
    a.half = false;
    a.read = false;
    showToast("Reset to unread", "amber");
  }
  saveState();
  renderArticles();
}

function toggleWordPanel(id: string): void {
  openWordPanels[id] = !openWordPanels[id];
  document
    .getElementById(`wlp-${id}`)
    ?.classList.toggle("hidden", !openWordPanels[id]);
  if (openWordPanels[id])
    (document.getElementById(`winput-${id}`) as HTMLInputElement)?.focus();
}

function addWord(id: string): void {
  const input = document.getElementById(`winput-${id}`) as HTMLInputElement;
  const word = input.value.trim().toLowerCase();
  if (!word) return;
  if (!state.articles[id]) state.articles[id] = { read: false, words: [] };
  if (!state.articles[id].words) state.articles[id].words = [];
  if (!state.articles[id].words.includes(word)) {
    state.articles[id].words.push(word);
    if (!state.wordMastery) state.wordMastery = {};
    if (!state.wordMastery[word])
      state.wordMastery[word] = { state: "new", gotCount: 0 };
    saveState();
    renderChips(id);
    showToast(`"${word}" added to your vocabulary! 📖`, "amber");
  }
  input.value = "";
}

function renderChips(id: string): void {
  const container = document.getElementById(`chips-${id}`);
  if (!container) return;
  const words = (state.articles[id] ?? {}).words ?? [];
  container.innerHTML = words
    .map(
      (w) => /* html */ `
    <span class="word-chip">${w}
      <span class="cursor-pointer text-t3 text-[11px] hover:text-red" data-remove="${id}" data-word="${w}">✕</span>
    </span>`
    )
    .join("");
  container
    .querySelectorAll<HTMLElement>("[data-remove]")
    .forEach((el) =>
      el.addEventListener("click", () =>
        removeWord(el.dataset["remove"]!, el.dataset["word"]!)
      )
    );
}

function removeWord(id: string, word: string): void {
  if (state.articles[id]?.words) {
    state.articles[id].words = state.articles[id].words.filter(
      (w) => w !== word
    );
    saveState();
    renderChips(id);
  }
}

function updateUnreadBadge(): void {
  const read = Object.values(state.articles).filter((a) => a.read).length;
  const unread = ARTICLES.length - read;
  const badge = document.getElementById("unread-badge");
  const btBadge = document.getElementById("bt-unread-badge");
  if (badge) badge.textContent = String(unread);
  if (btBadge) {
    btBadge.textContent = String(unread);
    btBadge.classList.toggle("hidden", unread === 0);
  }
}

// ── Filter logic ──────────────────────────────────────────────────────────────

function applyFilter(f: ArticleFilter) {
  switch (f) {
    case "starter":
      return ARTICLES.filter((a) => a.level === "starter");
    case "building":
      return ARTICLES.filter((a) => a.level === "building");
    case "stretch":
      return ARTICLES.filter((a) => a.level === "stretch");
    case "unread":
      return ARTICLES.filter((a) => !getArticleState(a.id).read);
    case "read":
      return ARTICLES.filter((a) => getArticleState(a.id).read);
    case "short":
      return ARTICLES.filter((a) => (a.readTime ?? 99) <= 5);
    case "broad":
      return ARTICLES.filter((a) => /^[bcd]/.test(a.id));
    case "books":
      return ARTICLES.filter((a) => a.id.startsWith("bk"));
    case "happiness":
      return ARTICLES.filter((a) =>
        a.topic.toLowerCase().includes("happiness")
      );
    case "health":
      return ARTICLES.filter((a) => a.id.startsWith("h"));
    case "productivity":
      return ARTICLES.filter(
        (a) => a.id.startsWith("p") && !a.id.startsWith("pol")
      );
    case "money":
      return ARTICLES.filter((a) => a.id.startsWith("m"));
    case "politics":
      return ARTICLES.filter((a) => a.id.startsWith("pol"));
    case "culture":
      return ARTICLES.filter((a) => a.id.startsWith("cl"));
    case "ideas":
      return ARTICLES.filter((a) => a.id.startsWith("id"));
    default:
      return ARTICLES;
  }
}

// ── Bind static events (called once) ─────────────────────────────────────────

export function bindArticlesStaticEvents(): void {
  document
    .getElementById("help-btn-articles")
    ?.addEventListener("click", () =>
      toggleTip("tip-articles", "help-btn-articles")
    );
  document
    .getElementById("dismiss-tip-articles")
    ?.addEventListener("click", () => dismissTip("tip-articles"));

  // Search toggle
  const searchBtn = document.getElementById("search-icon-btn")!;
  const searchWrap = document.getElementById("search-bar-wrap")!;
  const searchInput = document.getElementById(
    "article-search-input"
  ) as HTMLInputElement;
  const clearBtn = document.getElementById("search-clear-btn")!;

  searchBtn.addEventListener("click", () => {
    searchOpen = !searchOpen;
    if (searchOpen) {
      searchWrap.style.cssText =
        "max-height:60px; opacity:1; margin-top:0; margin-bottom:0;";
      searchBtn.classList.add("active");
      setTimeout(() => searchInput.focus(), 250);
    } else {
      searchWrap.style.cssText =
        "max-height:0; opacity:0; margin-top:0; margin-bottom:0;";
      searchBtn.classList.remove("active");
      searchInput.value = "";
      clearBtn.classList.add("hidden");
      renderArticles();
    }
  });

  searchInput.addEventListener("input", () => {
    clearBtn.classList.toggle("hidden", searchInput.value.length === 0);
    renderArticles();
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearBtn.classList.add("hidden");
    searchInput.focus();
    renderArticles();
  });

  // Filter buttons
  document.getElementById("article-filters")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-filter]"
    );
    if (!btn) return;
    document
      .querySelectorAll("#article-filters .filter-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset["filter"] as ArticleFilter;
    renderArticles();
  });
}
