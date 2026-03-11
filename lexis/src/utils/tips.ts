const TIPS_KEY = "lexis_hidden_tips";

function getHidden(): string[] {
  return JSON.parse(localStorage.getItem(TIPS_KEY) ?? "[]");
}
function setHidden(list: string[]): void {
  localStorage.setItem(TIPS_KEY, JSON.stringify(list));
}

export function restoreDismissedTips(): void {
  getHidden().forEach((id) => hideTip(id, false));
}

export function toggleTip(tipId: string, btnId: string): void {
  const el = document.getElementById(tipId);
  const btn = document.getElementById(btnId);
  if (!el) return;
  el.classList.contains("tip-hidden")
    ? showTip(tipId, btn)
    : dismissTipById(tipId, btn);
}

export function dismissTip(tipId: string): void {
  const suffix = tipId.replace("tip-", "");
  const btn = document.getElementById(`help-btn-${suffix}`);
  dismissTipById(tipId, btn);
}

function showTip(id: string, btn: HTMLElement | null): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("tip-hidden");
  el.style.cssText = "overflow:hidden; padding:14px 16px; margin-bottom:20px;";
  requestAnimationFrame(() => {
    el.style.maxHeight = el.scrollHeight + 60 + "px";
    el.style.opacity = "1";
  });
  setTimeout(() => {
    el.style.maxHeight = "none";
    el.style.overflow = "";
  }, 350);
  btn?.classList.add("active");
  const h = getHidden().filter((x) => x !== id);
  setHidden(h);
}

function dismissTipById(id: string, btn: HTMLElement | null): void {
  hideTip(id, true);
  btn?.classList.remove("active");
  const h = getHidden();
  if (!h.includes(id)) {
    h.push(id);
    setHidden(h);
  }
}

function hideTip(id: string, animate: boolean): void {
  const el = document.getElementById(id);
  if (!el) return;
  if (animate) {
    el.style.maxHeight = el.scrollHeight + "px";
    el.style.overflow = "hidden";
    requestAnimationFrame(() => {
      el.style.opacity = "0";
      el.style.maxHeight = "0";
      el.style.marginBottom = "0";
      el.style.padding = "0";
    });
    setTimeout(() => el.classList.add("tip-hidden"), 350);
  } else {
    el.style.cssText =
      "opacity:0; max-height:0; margin-bottom:0; padding:0; overflow:hidden;";
    el.classList.add("tip-hidden");
  }
}
