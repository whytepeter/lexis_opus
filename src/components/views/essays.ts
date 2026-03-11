import { ESSAYS } from "../../data/essays";
import { getEssayState } from "../../store/state";
import { toggleTip, dismissTip } from "../../utils/tips";
import { openEssayModal } from "../modals/essayModal";

export function essaysTemplate(): string {
  return /* html */ `
    <div id="view-essays" class="view-panel hidden flex flex-col min-h-full">
      <div class="px-10 pt-7 pb-3 flex-shrink-0">
        <div class="flex items-end justify-between gap-3">
          <div>
            <div class="font-serif text-[26px] font-semibold text-t1 mb-1.5">Essay Journal</div>
            <div class="text-sm text-t2 font-light">Write your essays · Paste Claude's corrections side by side</div>
          </div>
          <div class="flex gap-1.5 pb-1">
            <button class="header-icon-btn" id="help-btn-essays" title="Help">?</button>
          </div>
        </div>
      </div>
      <div class="px-10 pb-10 flex-1 page-content">
        <div class="info-tip" id="tip-essays">
          <div class="font-mono text-[10px] tracking-[2px] uppercase text-amber mb-1.5">How to use the essay journal</div>
          <p class="text-sm text-t2 leading-relaxed">Essays run Week 1–12. Tap any essay to open it, write your draft, then paste Claude's corrected version. Use <strong class="text-t1">Side by Side</strong> to compare and understand every change.</p>
          <button class="absolute top-2.5 right-3 bg-transparent border-none text-t3 cursor-pointer text-sm hover:text-t1" id="dismiss-tip-essays">✕</button>
        </div>
        <div id="essay-list"></div>
      </div>
    </div>`;
}

export function renderEssays(): void {
  const list = document.getElementById("essay-list")!;
  list.innerHTML = "";
  ESSAYS.forEach((essay) => {
    const es = getEssayState(essay.id);
    const hasDraft = es.draft && es.draft.trim().length > 20;
    const hasCorrection = es.corrected && es.corrected.trim().length > 20;
    list.insertAdjacentHTML(
      "beforeend",
      /* html */ `
      <div class="bg-surface border border-b1 rounded-[10px] px-[22px] py-5 mb-2.5 transition-colors hover:border-b2 ${
        hasDraft ? "border-l-[3px] !border-l-amber" : ""
      }">
        <div class="font-mono text-[10px] tracking-[2px] uppercase text-amber mb-1">Week ${
          essay.week
        }</div>
        <h3 class="font-serif text-base font-semibold mb-1">${essay.title}</h3>
        <div class="text-[11px] text-t3 font-mono mb-2">${essay.type}</div>
        <div class="text-[13px] text-t2 italic leading-relaxed border-l-2 border-amber pl-3 mb-3.5">"${
          essay.prompt
        }"</div>
        <div class="flex items-center justify-between flex-wrap gap-2.5">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5">
              <div class="w-[7px] h-[7px] rounded-full ${
                hasDraft ? "bg-green" : "bg-b2"
              }"></div>
              <span class="text-xs text-t3 font-mono">${
                hasDraft ? "Draft written" : "Not started"
              }</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-[7px] h-[7px] rounded-full ${
                hasCorrection ? "bg-green" : hasDraft ? "bg-amber" : "bg-b2"
              }"></div>
              <span class="text-xs text-t3 font-mono">${
                hasCorrection
                  ? "Correction saved"
                  : hasDraft
                  ? "Awaiting correction"
                  : "No correction yet"
              }</span>
            </div>
          </div>
          <button class="btn-amber inline-flex items-center gap-1.5" data-essay="${
            essay.id
          }">${hasDraft ? "View / Edit →" : "Start Essay →"}</button>
        </div>
      </div>`
    );
  });
  list
    .querySelectorAll<HTMLButtonElement>("[data-essay]")
    .forEach((btn) =>
      btn.addEventListener("click", () => openEssayModal(btn.dataset["essay"]!))
    );
}

export function bindEssaysStaticEvents(): void {
  document
    .getElementById("help-btn-essays")
    ?.addEventListener("click", () =>
      toggleTip("tip-essays", "help-btn-essays")
    );
  document
    .getElementById("dismiss-tip-essays")
    ?.addEventListener("click", () => dismissTip("tip-essays"));
}
