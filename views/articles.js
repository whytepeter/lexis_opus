// ─── views/articles.js ────────────────────────────────────────────────────────

import { ARTICLES } from "../data/articles.js";
import {
  getArticleState,
  setArticleState,
  addWordToArticle,
  removeWordFromArticle,
} from "../state/store.js";
import { toast } from "../utils/toast.js";

let _currentFilter = "all";
let _openWordPanels = {};
let _searchOpen = false;

const FILTER_MAP = {
  starter: (a) => a.level === "starter",
  building: (a) => a.level === "building",
  stretch: (a) => a.level === "stretch",
  unread: (a) => !getArticleState(a.id).read,
  read: (a) => getArticleState(a.id).read,
  short: (a) => (a.readTime || 99) <= 5,
  broad: (a) => /^[bcd]/.test(a.id),
  books: (a) => a.id.startsWith("bk"),
  happiness: (a) => a.topic?.toLowerCase().includes("happiness"),
  health: (a) => a.id.startsWith("h"),
  productivity: (a) => a.id.startsWith("p") && !a.id.startsWith("pol"),
  money: (a) => a.id.startsWith("m"),
  politics: (a) => a.id.startsWith("pol"),
  culture: (a) => a.id.startsWith("cl"),
  ideas: (a) => a.id.startsWith("i"),
};

export function renderArticles() {
  _updateBadges();

  let filtered =
    _currentFilter === "all"
      ? ARTICLES
      : ARTICLES.filter(FILTER_MAP[_currentFilter] ?? (() => true));

  const query = document
    .getElementById("article-search-input")
    ?.value.trim()
    .toLowerCase();
  if (query) {
    filtered = filtered.filter((a) =>
      [a.title, a.topic, a.desc].some((s) => s.toLowerCase().includes(query))
    );
  }

  const list = document.getElementById("article-list");
  list.innerHTML = "";

  if (filtered.length === 0) {
    list.innerHTML = `<div style="padding:40px 0;text-align:center;color:var(--text3);font-family:'IBM Plex Mono',monospace;font-size:13px;">
      No articles found.<br><span style="font-size:11px;opacity:0.7;">Try a different filter or clear your search.</span>
    </div>`;
    return;
  }

  filtered.forEach((article) => {
    const as = getArticleState(article.id);
    const item = document.createElement("div");
    item.className = `article-item ${as.read ? "read" : ""}`;

    const rtBadge = article.readTime
      ? `<span class="topic-tag" style="color:var(--blue)">⏱ ${article.readTime} min</span>`
      : "";
    const halfBadge =
      as.half && !as.read
        ? `<span class="topic-tag" style="color:var(--amber)">½ halfway</span>`
        : "";
    const wordBadge =
      as.words?.length > 0
        ? `<span class="topic-tag" style="color:var(--amber)">📖 ${
            as.words.length
          } word${as.words.length > 1 ? "s" : ""} logged</span>`
        : "";
    const cc = as.read ? "checked" : as.half ? "half" : "";
    const ci = as.read ? "✓" : as.half ? "½" : "○";

    item.innerHTML = `
      <div class="article-header">
        <div style="flex:1">
          <div class="article-meta">
            <span class="level-tag level-${article.level}">${
      article.level
    }</span>
            <span class="topic-tag">${article.topic}</span>
            ${rtBadge}${halfBadge}${wordBadge}
          </div>
          <div class="article-title">${article.title}</div>
          <div class="article-desc">${article.desc}</div>
        </div>
        <div class="article-actions">
          <a class="open-btn" href="${article.url}" target="_blank">↗ Read</a>
          <button class="check-btn ${cc}" data-cycle="${
      article.id
    }">${ci}</button>
        </div>
      </div>
      <div class="word-log-panel ${
        _openWordPanels[article.id] ? "open" : ""
      }" id="wlp-${article.id}">
        <div class="word-log-title">Words I learned from this article</div>
        <div class="word-chips" id="chips-${article.id}"></div>
        <div class="word-input-row">
          <input class="word-input" id="winput-${
            article.id
          }" placeholder="Type a word and press Enter..." data-article="${
      article.id
    }"/>
          <button class="add-word-btn" data-addword="${
            article.id
          }">+ Add</button>
        </div>
        <div style="margin-top:10px;font-size:11px;color:var(--text3);font-family:'IBM Plex Mono',monospace;">
          Hint words: ${article.words_hint.join(" · ")}
        </div>
      </div>`;

    item.querySelector(".article-header").addEventListener("click", (e) => {
      if (e.target.closest(".article-actions")) return;
      _toggleWordPanel(article.id);
    });
    list.appendChild(item);
    _renderChips(article.id);
  });

  // Delegated events on the list
  list.addEventListener("click", (e) => {
    const cycleBtn = e.target.closest("[data-cycle]");
    const addWordBtn = e.target.closest("[data-addword]");
    if (cycleBtn) _cycleReadStatus(cycleBtn.dataset.cycle);
    if (addWordBtn) _addWord(addWordBtn.dataset.addword);
  });
  list.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.dataset.article)
      _addWord(e.target.dataset.article);
  });
}

export function filterArticles(f, btn) {
  _currentFilter = f;
  document
    .querySelectorAll(".filter-row .filter-btn")
    .forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderArticles();
}

export function toggleSearch() {
  const wrap = document.getElementById("search-bar-wrap");
  const btn = document.getElementById("search-icon-btn");
  const input = document.getElementById("article-search-input");
  if (!wrap || !btn || !input) return;
  _searchOpen = !_searchOpen;
  if (_searchOpen) {
    wrap.classList.add("open");
    btn.classList.add("active");
    setTimeout(() => input.focus(), 250);
  } else {
    wrap.classList.remove("open");
    btn.classList.remove("active");
    input.value = "";
    document.getElementById("search-clear-btn").style.display = "none";
    renderArticles();
  }
}

export function onSearchInput() {
  const input = document.getElementById("article-search-input");
  const cb = document.getElementById("search-clear-btn");
  if (cb) cb.style.display = input.value.length > 0 ? "block" : "none";
  renderArticles();
}

export function clearSearch() {
  const input = document.getElementById("article-search-input");
  const cb = document.getElementById("search-clear-btn");
  if (input) {
    input.value = "";
    input.focus();
  }
  if (cb) cb.style.display = "none";
  renderArticles();
}

function _updateBadges() {
  const unread = ARTICLES.filter((a) => !getArticleState(a.id).read).length;
  document.getElementById("unread-badge").textContent = unread;
  const btb = document.getElementById("bt-unread-badge");
  if (btb) {
    btb.textContent = unread;
    btb.style.display = unread > 0 ? "flex" : "none";
  }
}

function _cycleReadStatus(id) {
  const a = getArticleState(id);
  if (!a.half && !a.read) {
    setArticleState(id, { half: true, read: false });
    toast("Marked as halfway 📖", "amber");
  } else if (a.half && !a.read) {
    setArticleState(id, { half: false, read: true });
    toast("Marked as fully read ✓", "green");
  } else {
    setArticleState(id, { half: false, read: false });
    toast("Reset to unread", "amber");
  }
  renderArticles();
}

function _toggleWordPanel(id) {
  _openWordPanels[id] = !_openWordPanels[id];
  const panel = document.getElementById(`wlp-${id}`);
  if (panel) {
    panel.classList.toggle("open", _openWordPanels[id]);
    if (_openWordPanels[id]) document.getElementById(`winput-${id}`)?.focus();
  }
}

function _addWord(id) {
  const input = document.getElementById(`winput-${id}`);
  const word = input?.value.trim().toLowerCase();
  if (!word) return;
  const added = addWordToArticle(id, word);
  if (added) {
    _renderChips(id);
    toast(`"${word}" added to your vocabulary! 📖`, "amber");
  }
  if (input) input.value = "";
}

function _renderChips(id) {
  const container = document.getElementById(`chips-${id}`);
  if (!container) return;
  const words = getArticleState(id).words || [];
  container.innerHTML = words
    .map(
      (w) =>
        `<span class="word-chip">${w} <span class="rm" data-rm-article="${id}" data-rm-word="${w}">✕</span></span>`
    )
    .join("");
  container.querySelectorAll("[data-rm-article]").forEach((el) => {
    el.addEventListener("click", () => {
      removeWordFromArticle(el.dataset.rmArticle, el.dataset.rmWord);
      _renderChips(el.dataset.rmArticle);
    });
  });
}
