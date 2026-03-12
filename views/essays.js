// ─── views/essays.js ──────────────────────────────────────────────────────────

import { ESSAYS } from "../data/essays.js";
import { getEssayState, setEssayState } from "../state/store.js";
import { toast } from "../utils/toast.js";

let _currentEssayId = null;

export function renderEssays() {
  const list = document.getElementById("essay-list");
  list.innerHTML = "";
  ESSAYS.forEach((essay) => {
    const es = getEssayState(essay.id);
    const hasDraft = es.draft?.trim().length > 20;
    const hasCorrection = es.corrected?.trim().length > 20;

    const card = document.createElement("div");
    card.className = `essay-card ${hasDraft ? "submitted" : ""}`;
    card.innerHTML = `
      <div class="essay-week-label">Week ${essay.week}</div>
      <h3>${essay.title}</h3>
      <div class="essay-type">${essay.type}</div>
      <div class="essay-prompt-text">"${essay.prompt}"</div>
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div class="essay-status">
          <div class="status-dot ${hasDraft ? "done" : ""}"></div>
          <span class="status-label">${
            hasDraft ? "Draft written" : "Not started"
          }</span>
          &nbsp;&nbsp;
          <div class="status-dot ${
            hasCorrection ? "done" : hasDraft ? "partial" : ""
          }"></div>
          <span class="status-label">${
            hasCorrection
              ? "Correction saved"
              : hasDraft
              ? "Awaiting correction"
              : "No correction yet"
          }</span>
        </div>
        <button class="task-action btn-amber" data-open-essay="${essay.id}">${
      hasDraft ? "View / Edit →" : "Start Essay →"
    }</button>
      </div>`;
    list.appendChild(card);
  });

  list.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-open-essay]");
    if (btn) openEssayModal(btn.dataset.openEssay);
  });
}

export function openEssayModal(id) {
  _currentEssayId = id;
  const essay = ESSAYS.find((e) => e.id === id);
  const es = getEssayState(id);

  document.getElementById("modal-week").textContent = `Week ${essay.week}`;
  document.getElementById("modal-title").textContent = essay.title;
  document.getElementById("modal-type").textContent = essay.type;
  document.getElementById("modal-prompt").textContent = `"${essay.prompt}"`;
  document.getElementById("draft-textarea").value = es.draft || "";
  document.getElementById("corrected-textarea").value = es.corrected || "";
  document.getElementById("compare-draft").textContent =
    es.draft || "(No draft yet)";
  document.getElementById("compare-corrected").textContent =
    es.corrected || "(No correction yet)";
  switchTab("draft");
  document.getElementById("essay-modal").classList.add("open");
}

export function switchTab(name) {
  document
    .querySelectorAll(".modal-tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".modal-tab-content")
    .forEach((t) => t.classList.remove("active"));
  document.getElementById(`tab-${name}`).classList.add("active");
  document.querySelectorAll(".modal-tab").forEach((t) => {
    if (t.getAttribute("onclick")?.includes(name)) t.classList.add("active");
  });
}

export function saveDraft() {
  const draft = document.getElementById("draft-textarea").value;
  setEssayState(_currentEssayId, { draft });
  document.getElementById("compare-draft").textContent =
    draft || "(No draft yet)";
  toast("Draft saved ✓", "amber");
  renderEssays();
}

export function saveCorrection() {
  const corrected = document.getElementById("corrected-textarea").value;
  setEssayState(_currentEssayId, { corrected });
  document.getElementById("compare-corrected").textContent =
    corrected || "(No correction yet)";
  toast("Correction saved ✓", "green");
  renderEssays();
}

export function copyEssayPrompt() {
  const essay = ESSAYS.find((e) => e.id === _currentEssayId);
  const draft = document.getElementById("draft-textarea").value.trim();
  if (!draft) {
    toast("Write your draft first.", "amber");
    return;
  }

  const prompt = `Please correct my English essay and help me improve it.\n\nEssay type: ${essay?.type}\nTopic / Prompt: ${essay?.prompt}\n\nMy draft:\n"""\n${draft}\n"""\n\nPlease:\n1. Correct all grammar, spelling, and punctuation errors\n2. Improve sentence structure and flow where needed\n3. Keep my original meaning and voice\n4. List the main things I got wrong and why\n5. End with one specific thing I did well`;

  navigator.clipboard
    .writeText(prompt)
    .then(() => toast("Prompt copied — paste it into Claude ✓", "green"))
    .catch(() => {
      const ta = Object.assign(document.createElement("textarea"), {
        value: prompt,
      });
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast("Prompt copied ✓", "green");
    });
}
