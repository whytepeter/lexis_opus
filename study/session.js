import {
  getAllWords,
  getWordMastery,
  setWordMastery,
  getWordSourceArticle,
} from "../state/store.js";
import { toast } from "../utils/toast.js";

// ─── Session state (module-private) ──────────────────────────────────────────
let _deck = [];
let _index = 0;
let _got = 0;
let _fuzzy = [];
let _blankQueue = [];
let _chosenSize = null;
let _flipped = false;
let _defCache = {};

// ─── Public entry point ───────────────────────────────────────────────────────

export function openStudySetup() {
  const allWords = getAllWords();
  if (allWords.length === 0) {
    toast("Log some words from articles first!", "amber");
    return;
  }

  const prioritised = _prioritiseWords(allWords);
  _buildSizeOptions(prioritised);
  document.getElementById("study-setup-desc").textContent = `You have ${
    prioritised.length
  } word${
    prioritised.length > 1 ? "s" : ""
  } to study. Fuzzy and new words come first.`;

  _chosenSize = null;
  document.getElementById("start-session-btn").disabled = true;

  _showPhase("setup");
  document.getElementById("study-overlay").classList.add("open");
}

export function startSession() {
  if (!_chosenSize) return;
  const allWords = getAllWords();
  const prioritised = _prioritiseWords(allWords);

  _deck = prioritised.slice(0, _chosenSize);
  _index = 0;
  _got = 0;
  _fuzzy = [];
  _blankQueue = [];
  _flipped = false;

  _showPhase("session");
  _showCard();
}

export function flipStudyCard() {
  if (_flipped) return;
  _flipped = true;

  const card = document.getElementById("study-card");
  card.classList.add("flipped");
  document.getElementById("study-actions").classList.add("visible");

  const word = document.getElementById("sc-word").textContent;
  const source = getWordSourceArticle(word);
  if (source) {
    const label =
      source.title.length > 50 ? source.title.slice(0, 50) + "…" : source.title;
    document.getElementById("sc-source").textContent = label;
    document.getElementById("sc-source").style.display = "flex";
  }

  if (_defCache[word] !== undefined) {
    _displayDefinitions(_defCache[word]);
    return;
  }
  fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
      word
    )}`
  )
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      _defCache[word] = _parseMeanings(data);
      _displayDefinitions(_defCache[word]);
    })
    .catch(() => {
      _defCache[word] = null;
      _displayDefinitions(null);
    });
}

export function rateWord(rating) {
  if (!_flipped) {
    flipStudyCard();
    return;
  }
  const word = document.getElementById("sc-word").textContent;
  const m = getWordMastery(word);

  if (rating === "easy") {
    _got++;
    m.gotCount = (m.gotCount || 0) + 2;
    m.state = m.gotCount >= 3 ? "mastered" : "learning";
  } else if (rating === "got") {
    _got++;
    m.gotCount = (m.gotCount || 0) + 1;
    m.state = m.gotCount >= 3 ? "mastered" : "learning";
  } else if (rating === "fuzzy") {
    m.gotCount = Math.max(0, (m.gotCount || 0) - 1);
    m.state = "fuzzy";
    _fuzzy.push(word);
  } else {
    m.gotCount = 0;
    m.state = "fuzzy";
    _blankQueue.push(word);
    _fuzzy.push(word);
  }
  m.lastSeen = new Date().toISOString();
  setWordMastery(word, m);

  const FLASH = {
    easy: "rgba(97,175,239,0.2)",
    got: "rgba(76,175,125,0.2)",
    fuzzy: "rgba(212,147,26,0.2)",
    blank: "rgba(224,108,117,0.2)",
  };
  const card = document.getElementById("study-card");
  card.style.transition = "none";
  card.style.background = FLASH[rating];
  setTimeout(() => {
    card.style.transition = "";
    card.style.background = "";
    _showCard();
  }, 280);
}

export function retryFuzzy() {
  const fuzzyWords = [...new Set(_fuzzy)].filter(
    (w) => getWordMastery(w).state === "fuzzy"
  );
  if (fuzzyWords.length === 0) {
    closeStudy();
    return;
  }
  _deck = fuzzyWords;
  _index = 0;
  _got = 0;
  _fuzzy = [];
  _blankQueue = [];
  _flipped = false;
  _showPhase("session");
  _showCard();
}

export function closeStudy() {
  document.getElementById("study-overlay").classList.remove("open");
  // Refresh vocab view if open
  const vocabView = document.getElementById("view-vocab");
  if (vocabView?.classList.contains("active")) {
    import("../views/vocab.js").then((m) => m.renderVocab());
  }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _prioritiseWords(allWords) {
  const wm = (w) => getWordMastery(w).state || "new";
  return [
    ...allWords.filter((w) => wm(w) === "fuzzy"),
    ...allWords.filter((w) => wm(w) === "new"),
    ...allWords.filter((w) => wm(w) === "learning"),
    ...allWords.filter((w) => wm(w) === "mastered"),
  ];
}

function _buildSizeOptions(prioritised) {
  const opts = [...new Set([5, 10, 20, prioritised.length])].filter(
    (v) => v <= prioritised.length
  );
  const container = document.getElementById("size-options");
  container.innerHTML = "";
  opts.forEach((n) => {
    const div = document.createElement("div");
    div.className = "size-opt";
    div.innerHTML = `<div class="s-num">${n}</div><div class="s-label">${
      n === prioritised.length ? "All words" : "words"
    }</div>`;
    div.addEventListener("click", () => {
      container
        .querySelectorAll(".size-opt")
        .forEach((d) => d.classList.remove("active"));
      div.classList.add("active");
      _chosenSize = n;
      document.getElementById("start-session-btn").disabled = false;
    });
    container.appendChild(div);
  });
}

function _showPhase(phase) {
  document.getElementById("study-setup").style.display =
    phase === "setup" ? "" : "none";
  document.getElementById("study-session").style.display =
    phase === "session" ? "" : "none";
  document.getElementById("study-done").style.display =
    phase === "done" ? "" : "none";
}

function _showCard() {
  if (_index >= _deck.length && _blankQueue.length === 0) {
    _showDone();
    return;
  }

  const word = _blankQueue.length > 0 ? _blankQueue.shift() : _deck[_index++];
  _flipped = false;

  const card = document.getElementById("study-card");
  card.classList.remove("flipped");
  card.style.background = "";
  document.getElementById("sc-word").textContent = word;
  document.getElementById("sc-loading").style.display = "block";
  document.getElementById("sc-meanings").style.display = "none";
  document.getElementById("sc-meanings").innerHTML = "";
  document.getElementById("sc-source").style.display = "none";
  document.getElementById("study-actions").classList.remove("visible");

  const done = Math.min(_index, _deck.length);
  const total = _deck.length;
  document.getElementById("sc-label").textContent = `Word ${done} of ${total}`;
  document.getElementById("spf").style.width = `${(done / total) * 100}%`;
  document.getElementById("sc-streak").textContent =
    _got > 0 ? `${_got} ✓` : "";

  _prefetch(word);
}

function _prefetch(word) {
  if (_defCache[word] !== undefined) return;
  fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
      word
    )}`
  )
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      _defCache[word] = _parseMeanings(data);
    })
    .catch(() => {
      _defCache[word] = null;
    });
}

function _parseMeanings(data) {
  if (!data?.[0]) return null;
  const results = [];
  for (const entry of data) {
    for (const meaning of entry.meanings || []) {
      if (results.length >= 3) break;
      const def = meaning.definitions?.[0];
      if (def)
        results.push({
          pos: meaning.partOfSpeech || "",
          def: def.definition || "",
          example: def.example || null,
        });
    }
    if (results.length >= 3) break;
  }
  return results.length > 0 ? results : null;
}

function _displayDefinitions(meanings) {
  document.getElementById("sc-loading").style.display = "none";
  const container = document.getElementById("sc-meanings");
  container.style.display = "block";
  container.innerHTML = "";

  if (meanings?.length > 0) {
    meanings.forEach((m, i) => {
      const block = document.createElement("div");
      block.className = "meaning-block";
      block.innerHTML = `
        ${
          meanings.length > 1
            ? `<div class="meaning-num">Meaning ${i + 1} of ${
                meanings.length
              }</div>`
            : ""
        }
        ${m.pos ? `<span class="study-pos">${m.pos}</span>` : ""}
        <div class="study-definition">${m.def}</div>
        ${m.example ? `<div class="study-example">"${m.example}"</div>` : ""}`;
      container.appendChild(block);
    });
  } else {
    container.innerHTML = `<div style="color:var(--text3);font-size:13px;text-align:center;width:100%;padding:16px 0">
      No dictionary entry found.<br>Try to recall the meaning from context.
    </div>`;
  }
}

function _showDone() {
  _showPhase("done");
  const total = _deck.length;
  const uniqueFuzzy = [...new Set(_fuzzy)].filter(
    (w) => getWordMastery(w).state === "fuzzy"
  ).length;
  const newMastered = _deck.filter(
    (w) => getWordMastery(w).state === "mastered"
  ).length;

  document.getElementById("done-emoji").textContent =
    _got >= total * 0.8 ? "🎉" : _got >= total * 0.5 ? "👍" : "💪";
  document.getElementById("done-title").textContent =
    _got >= total * 0.8
      ? "Excellent session!"
      : _got >= total * 0.5
      ? "Good progress!"
      : "Keep practising!";
  document.getElementById("done-desc").textContent = `You rated ${total} word${
    total > 1 ? "s" : ""
  } in this session.`;
  document.getElementById("score-breakdown").innerHTML = `
    <div class="score-cell"><div class="sc-num" style="color:var(--green)">${_got}</div><div class="sc-lbl">Got it</div></div>
    <div class="score-cell"><div class="sc-num" style="color:var(--amber2)">${uniqueFuzzy}</div><div class="sc-lbl">Fuzzy</div></div>
    <div class="score-cell"><div class="sc-num" style="color:var(--blue)">${newMastered}</div><div class="sc-lbl">Mastered</div></div>
    <div class="score-cell"><div class="sc-num" style="color:var(--text3)">${Math.max(
      0,
      total - _got - uniqueFuzzy
    )}</div><div class="sc-lbl">Replayed</div></div>`;

  const retryBtn = document.getElementById("retry-btn");
  if (retryBtn) retryBtn.style.display = uniqueFuzzy > 0 ? "" : "none";
}
