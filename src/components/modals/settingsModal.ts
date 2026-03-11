import { state, saveState as ss, resetState } from "../../store/state";
import { showToast as st } from "../../utils/toast";
import { renderToday } from "../views/today";
import { renderProgress } from "../views/progress";

export function settingsModalTemplate(): string {
  return /* html */ `
    <div class="modal-overlay" id="reset-modal">
      <div class="modal-box max-w-md">
        <button class="absolute top-4 right-4 bg-s2 border border-b1 text-t2 rounded-md w-8 h-8 cursor-pointer text-base flex items-center justify-center hover:bg-s3 hover:text-t1" id="close-settings-modal">✕</button>
        <div class="font-mono text-[11px] text-amber tracking-[2px] uppercase mb-1.5">Settings</div>
        <div class="font-serif text-xl font-bold mb-5">Plan & Data</div>

        <div class="mb-6">
          <div class="font-mono text-[10px] tracking-[2px] uppercase text-amber mb-2">Change start date</div>
          <div class="text-sm text-t2 mb-3">Move when your 12-week plan begins. Completed days reset.</div>
          <div class="flex gap-2 items-center">
            <input type="date" id="new-start-date"
                   class="flex-1 bg-s2 border border-b2 rounded-lg py-2 px-3 text-t1 text-sm font-sans outline-none focus:border-amber" />
            <button class="btn-save flex-shrink-0" id="apply-start-date-btn">Apply</button>
          </div>
        </div>

        <div class="pt-5 border-t border-b1">
          <div class="font-mono text-[10px] tracking-[2px] uppercase text-red mb-2">Danger zone</div>
          <div class="text-sm text-t2 mb-3">Completely reset all data. This cannot be undone.</div>
          <button id="full-reset-btn" class="bg-red/10 border border-red text-red rounded-lg py-2 px-4 text-sm cursor-pointer font-mono">Reset everything</button>
        </div>
      </div>
    </div>`;
}

export function showResetModal(): void {
  const input = document.getElementById("new-start-date") as HTMLInputElement;
  if (input) input.value = state.startDate ?? "";
  document.getElementById("reset-modal")!.classList.add("open");
}

export function bindSettingsModalEvents(): void {
  document
    .getElementById("close-settings-modal")
    ?.addEventListener("click", () =>
      document.getElementById("reset-modal")!.classList.remove("open")
    );
  document
    .getElementById("reset-modal")
    ?.addEventListener("click", function (e) {
      if (e.target === this) this.classList.remove("open");
    });
  document
    .getElementById("apply-start-date-btn")
    ?.addEventListener("click", () => {
      const val = (
        document.getElementById("new-start-date") as HTMLInputElement
      ).value;
      if (!val) {
        st("Please pick a date.", "amber");
        return;
      }
      state.startDate = val;
      state.completedDays = [];
      state.streak = 0;
      state.streakFreezes = 0;
      state.freezesUsedWeeks = [];
      state.freezeEarnedWeeks = [];
      ss();
      document.getElementById("reset-modal")!.classList.remove("open");
      renderToday();
      renderProgress();
      st("Start date updated.", "green");
    });
  document.getElementById("full-reset-btn")?.addEventListener("click", () => {
    if (!confirm("This will delete ALL your progress. Are you sure?")) return;
    resetState();
  });
}
