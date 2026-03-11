import type { ToastType } from "../types";

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export function showToast(msg: string, type: ToastType = "green"): void {
  const el = document.getElementById("toast");
  if (!el) return;
  if (toastTimer) clearTimeout(toastTimer);
  el.textContent = msg;
  el.className = `toast ${type} show`;
  toastTimer = setTimeout(() => el.classList.remove("show"), 2500);
}
