import { ESSAYS } from "../../data/essays";
import { state, saveState, getEssayState } from "../../store/state";
import { showToast } from "../../utils/toast";
import { renderEssays } from "../views/essays";

let currentEssayId = "";

export function essayModalTemplate(): string {
  return /* html */ `
    <div class="modal-overlay" id="essay-modal">
      <div class="modal-box">
        <button class="absolute top-4 right-4 bg-s2 border border-b1 text-t2 rounded-md w-8 h-8 cursor-pointer text-base flex items-center justify-center hover:bg-s3 hover:text-t1" id="close-essay-modal">✕</button>
        <div class="font-mono text-[11px] text-amber tracking-[2px] uppercase mb-1.5" id="modal-week"></div>
        <div class="font-serif text-2xl font-bold mb-1.5" id="modal-title"></div>
        <div class="text-xs text-t3 font-mono mb-4" id="modal-type"></div>
        <div class="bg-s2 border-l-[3px] border-amber pl-4 pr-4 py-3.5 rounded-r-lg text-sm italic text-t2 leading-relaxed mb-6" id="modal-prompt"></div>

        <!-- Tabs -->
        <div class="flex border-b border-b1 mb-5" id="essay-tabs">
          <button class="modal-tab font-mono text-xs px-4 py-2.5 cursor-pointer border-none bg-none text-t3 border-b-2 border-transparent -mb-px transition-all hover:text-t2 active:!text-amber2 active:!border-amber" data-tab="draft">My Draft</button>
          <button class="modal-tab font-mono text-xs px-4 py-2.5 cursor-pointer border-none bg-none text-t3 border-b-2 border-transparent -mb-px transition-all hover:text-t2" data-tab="corrected">Claude's Correction</button>
          <button class="modal-tab font-mono text-xs px-4 py-2.5 cursor-pointer border-none bg-none text-t3 border-b-2 border-transparent -mb-px transition-all hover:text-t2" data-tab="compare">Side by Side</button>
        </div>

        <!-- Tab: Draft -->
        <div id="tab-draft">
          <div class="font-mono text-[10px] tracking-[2px] uppercase text-amber mb-2">Your essay</div>
          <textarea class="w-full min-h-[220px] bg-s2 border border-b1 rounded-lg text-t1 font-sans text-base font-light leading-[1.75] p-4 resize-y outline-none transition-colors focus:border-amber placeholder:text-t3"
                    id="draft-textarea" placeholder="Write your essay here…"></textarea>
          <button class="btn-save" id="save-draft-btn">Save Draft</button>
        </div>

        <!-- Tab: Corrected -->
        <div id="tab-corrected" class="hidden">
          <div class="flex items-center justify-between mb-2">
            <div class="font-mono text-[10px] tracking-[2px] uppercase text-green">Claude's corrected version</div>
            <button class="open-btn" id="copy-prompt-btn">⎘ Copy prompt for Claude</button>
          </div>
          <div class="text-xs text-t3 font-mono mb-3">Copy the prompt above, paste it into Claude with your essay.</div>
          <textarea class="w-full min-h-[220px] bg-s2 border border-b1 rounded-lg text-t1 font-sans text-base font-light leading-[1.75] p-4 resize-y outline-none transition-colors focus:border-amber placeholder:text-t3"
                    id="corrected-textarea" placeholder="Paste Claude's corrected version here…"></textarea>
          <button class="btn-save" id="save-correction-btn">Save Correction</button>
        </div>

        <!-- Tab: Compare -->
        <div id="tab-compare" class="hidden">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div class="font-mono text-[10px] tracking-[2px] uppercase text-amber mb-2">Your Draft</div>
              <div class="bg-s2 border border-b1 rounded-lg p-4 text-[13.5px] leading-[1.75] min-h-[200px] text-t2 whitespace-pre-wrap" id="compare-draft"></div>
            </div>
            <div>
              <div class="font-mono text-[10px] tracking-[2px] uppercase text-green mb-2">Claude's Correction</div>
              <div class="bg-s2 border border-b1 rounded-lg p-4 text-[13.5px] leading-[1.75] min-h-[200px] text-t2 whitespace-pre-wrap" id="compare-corrected"></div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

export function openEssayModal(id: string): void {
  currentEssayId = id;
  const essay = ESSAYS.find((e) => e.id === id)!;
  const es = getEssayState(id);
  document.getElementById("modal-week")!.textContent = `Week ${essay.week}`;
  document.getElementById("modal-title")!.textContent = essay.title;
  document.getElementById("modal-type")!.textContent = essay.type;
  document.getElementById("modal-prompt")!.textContent = `"${essay.prompt}"`;
  (document.getElementById("draft-textarea") as HTMLTextAreaElement).value =
    es.draft ?? "";
  (document.getElementById("corrected-textarea") as HTMLTextAreaElement).value =
    es.corrected ?? "";
  document.getElementById("compare-draft")!.textContent =
    es.draft || "(No draft yet)";
  document.getElementById("compare-corrected")!.textContent =
    es.corrected || "(No correction yet)";
  switchEssayTab("draft");
  document.getElementById("essay-modal")!.classList.add("open");
}

function switchEssayTab(name: string): void {
  document.querySelectorAll("#essay-tabs .modal-tab").forEach((t) => {
    const active = t.getAttribute("data-tab") === name;
    t.classList.toggle("text-amber2", active);
    t.classList.toggle("border-amber", active);
    t.classList.toggle("text-t3", !active);
  });
  ["draft", "corrected", "compare"].forEach((tab) => {
    document
      .getElementById(`tab-${tab}`)!
      .classList.toggle("hidden", tab !== name);
  });
}

export function bindEssayModalEvents(): void {
  document
    .getElementById("close-essay-modal")
    ?.addEventListener("click", () =>
      document.getElementById("essay-modal")!.classList.remove("open")
    );
  document
    .getElementById("essay-modal")
    ?.addEventListener("click", function (e) {
      if (e.target === this) this.classList.remove("open");
    });
  document.getElementById("essay-tabs")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-tab]"
    );
    if (btn) switchEssayTab(btn.dataset["tab"]!);
  });
  document.getElementById("save-draft-btn")?.addEventListener("click", () => {
    const draft = (
      document.getElementById("draft-textarea") as HTMLTextAreaElement
    ).value;
    if (!state.essays[currentEssayId])
      state.essays[currentEssayId] = { draft: "", corrected: "" };
    state.essays[currentEssayId].draft = draft;
    document.getElementById("compare-draft")!.textContent =
      draft || "(No draft yet)";
    saveState();
    showToast("Draft saved ✓", "amber");
    renderEssays();
  });
  document
    .getElementById("save-correction-btn")
    ?.addEventListener("click", () => {
      const c = (
        document.getElementById("corrected-textarea") as HTMLTextAreaElement
      ).value;
      if (!state.essays[currentEssayId])
        state.essays[currentEssayId] = { draft: "", corrected: "" };
      state.essays[currentEssayId].corrected = c;
      document.getElementById("compare-corrected")!.textContent =
        c || "(No correction yet)";
      saveState();
      showToast("Correction saved ✓", "green");
      renderEssays();
    });
  document.getElementById("copy-prompt-btn")?.addEventListener("click", () => {
    const essay = ESSAYS.find((e) => e.id === currentEssayId);
    const draft = (
      document.getElementById("draft-textarea") as HTMLTextAreaElement
    ).value.trim();
    if (!draft) {
      showToast("Write your draft first.", "amber");
      return;
    }
    const prompt = `Please correct my English essay and help me improve it.\n\nEssay type: ${essay?.type}\nTopic / Prompt: ${essay?.prompt}\n\nMy draft:\n"""\n${draft}\n"""\n\nPlease:\n1. Correct all grammar, spelling, and punctuation errors\n2. Improve sentence structure and flow where needed\n3. Keep my original meaning and voice\n4. List the main things I got wrong and why\n5. End with one specific thing I did well`;
    navigator.clipboard
      .writeText(prompt)
      .then(() => showToast("Prompt copied — paste it into Claude ✓", "green"))
      .catch(() => {
        const ta = Object.assign(document.createElement("textarea"), {
          value: prompt,
          style: "position:fixed;opacity:0",
        });
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        showToast("Prompt copied ✓", "green");
      });
  });
}
