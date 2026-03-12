// ─── views/fiction.js ─────────────────────────────────────────────────────────

import { FICTION } from "../data/fiction.js";
import { getFictionState, setFictionState } from "../state/store.js";
import { toast } from "../utils/toast.js";

let _fictionFilter = "all";
let _fictionSearchOpen = false;

const FICTION_FILTERS = {
  story: (f) => f.type === "story",
  novel: (f) => f.type === "novel",
  script: (f) => f.type === "script",
  beginner: (f) => f.level === "beginner",
  intermediate: (f) => f.level === "intermediate",
  advanced: (f) => f.level === "advanced",
  reading: (f) => getFictionState(f.id).progress && !getFictionState(f.id).read,
  finished: (f) => getFictionState(f.id).read,
};

export function renderFiction() {
  const list = document.getElementById("fiction-list");
  if (!list) return;

  let filtered =
    _fictionFilter === "all"
      ? FICTION
      : FICTION.filter(FICTION_FILTERS[_fictionFilter] ?? (() => true));

  const query = document
    .getElementById("fiction-search-input")
    ?.value.trim()
    .toLowerCase();
  if (query) {
    filtered = filtered.filter((f) =>
      [f.title, f.author, f.type, f.desc].some((s) =>
        s.toLowerCase().includes(query)
      )
    );
  }

  list.innerHTML = "";
  if (filtered.length === 0) {
    list.innerHTML = `<div style="padding:40px 0;text-align:center;color:var(--text3);font-family:'IBM Plex Mono',monospace;font-size:13px;">No results found.</div>`;
    return;
  }

  filtered.forEach((item) => {
    const fs = getFictionState(item.id);
    const card = document.createElement("div");
    card.className = `fiction-card ${
      fs.read ? "read" : fs.progress ? "reading" : ""
    }`;

    const TYPE_LABELS = {
      story: "Short Story",
      novel: "Novel",
      script: "Script",
    };
    const typeLabel = TYPE_LABELS[item.type] || item.type;
    const typeClass =
      item.type === "novel" ? "novel" : item.type === "script" ? "script" : "";
    const levelColor =
      item.level === "beginner"
        ? "var(--green)"
        : item.level === "intermediate"
        ? "var(--amber)"
        : "var(--red)";
    const rt =
      item.readTime >= 60
        ? `~${Math.round(item.readTime / 60)}h`
        : `~${item.readTime} min`;
    const checkBtn = fs.read
      ? `<button class="check-btn checked" data-fiction-cycle="${item.id}">✓</button>`
      : `<button class="check-btn ${
          fs.progress ? "half" : ""
        }" data-fiction-cycle="${item.id}">${fs.progress ? "…" : "○"}</button>`;
    const noteRow =
      fs.progress && !fs.read
        ? `<div style="margin-top:10px;display:flex;align-items:center;gap:8px;">
           <span style="font-size:11px;color:var(--amber);font-family:'IBM Plex Mono',monospace;">Currently reading</span>
           <input class="word-input" style="flex:1;font-size:12px;padding:5px 10px;" placeholder="Add a note, e.g. Chapter 3..." value="${
             fs.note || ""
           }" data-fiction-note="${item.id}"/>
         </div>`
        : "";

    card.innerHTML = `
      <div class="fiction-meta">
        <span class="fiction-type-tag ${typeClass}">${typeLabel}</span>
        <span class="topic-tag" style="color:${levelColor}">${item.level}</span>
        <span class="topic-tag" style="color:var(--text3)">${item.year}</span>
        <span class="topic-tag" style="color:var(--blue)">⏱ ${rt}</span>
        ${
          fs.read
            ? '<span class="topic-tag" style="color:var(--green)">✓ read</span>'
            : ""
        }
      </div>
      <div class="fiction-title">${item.title}</div>
      <div class="fiction-author">${item.author}</div>
      <div class="fiction-desc">${item.desc}</div>
      <div class="fiction-actions">
        <a class="open-btn" href="${item.url}" target="_blank">↗ Read</a>
        ${checkBtn}
      </div>
      ${noteRow}
      <div class="fiction-hint">Vocabulary hints: ${item.words_hint.join(
        " · "
      )}</div>`;

    list.appendChild(card);
  });

  // Delegated events
  list.addEventListener("click", (e) => {
    const cyc = e.target.closest("[data-fiction-cycle]");
    if (cyc) _cycleFictionStatus(cyc.dataset.fictionCycle);
  });
  list.addEventListener("input", (e) => {
    const noteInput = e.target.closest("[data-fiction-note]");
    if (noteInput)
      setFictionState(noteInput.dataset.fictionNote, { note: noteInput.value });
  });
}

export function filterFiction(f, btn) {
  _fictionFilter = f;
  document
    .querySelectorAll(".fiction-filter-row .filter-btn")
    .forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderFiction();
}

export function toggleFictionSearch() {
  const wrap = document.getElementById("fiction-search-bar-wrap");
  const btn = document.getElementById("fiction-search-icon-btn");
  const input = document.getElementById("fiction-search-input");
  if (!wrap || !btn || !input) return;
  _fictionSearchOpen = !_fictionSearchOpen;
  if (_fictionSearchOpen) {
    wrap.classList.add("open");
    btn.classList.add("active");
    setTimeout(() => input.focus(), 250);
  } else {
    wrap.classList.remove("open");
    btn.classList.remove("active");
    input.value = "";
    document.getElementById("fiction-search-clear-btn").style.display = "none";
    renderFiction();
  }
}

export function onFictionSearchInput() {
  const input = document.getElementById("fiction-search-input");
  const cb = document.getElementById("fiction-search-clear-btn");
  if (cb) cb.style.display = input.value.length > 0 ? "block" : "none";
  renderFiction();
}

export function clearFictionSearch() {
  const input = document.getElementById("fiction-search-input");
  const cb = document.getElementById("fiction-search-clear-btn");
  if (input) {
    input.value = "";
    input.focus();
  }
  if (cb) cb.style.display = "none";
  renderFiction();
}

function _cycleFictionStatus(id) {
  const f = getFictionState(id);
  if (!f.progress && !f.read) {
    setFictionState(id, { progress: true, read: false });
    toast("Added to currently reading 📖", "amber");
  } else if (f.progress && !f.read) {
    setFictionState(id, { progress: false, read: true });
    toast("Marked as finished ✓", "green");
  } else {
    setFictionState(id, { progress: false, read: false });
    toast("Removed from reading list", "amber");
  }
  renderFiction();
}
