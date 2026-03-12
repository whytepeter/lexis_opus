const STORAGE_KEY = "lexis_hidden_tips";

function _getHidden() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}
function _setHidden(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

export function toggleTip(tipId, btnId) {
  const el = document.getElementById(tipId);
  const btn = document.getElementById(btnId);
  if (!el) return;

  const isHidden = el.classList.contains("tip-hidden");

  if (isHidden) {
    _showTip(el, btn, tipId);
  } else {
    _hideTip(el, btn, tipId);
  }
}

export function dismissTip(tipId) {
  const suffix = tipId.replace("tip-", "");
  toggleTip(tipId, "help-btn-" + suffix);
}

export function restoreDismissedTips() {
  _getHidden().forEach((tipId) => {
    const el = document.getElementById(tipId);
    if (!el) return;
    Object.assign(el.style, {
      opacity: "0",
      maxHeight: "0",
      marginBottom: "0",
      padding: "0",
      overflow: "hidden",
    });
    el.classList.add("tip-hidden");
    const btn = document.getElementById(
      "help-btn-" + tipId.replace("tip-", "")
    );
    if (btn) btn.classList.remove("active");
  });
}

function _showTip(el, btn, tipId) {
  el.style.transition = "opacity 0.2s,max-height 0.3s,margin 0.3s,padding 0.3s";
  el.classList.remove("tip-hidden");
  Object.assign(el.style, {
    overflow: "hidden",
    padding: "14px 16px",
    marginBottom: "20px",
  });
  requestAnimationFrame(() => {
    el.style.maxHeight = el.scrollHeight + 60 + "px";
    el.style.opacity = "1";
  });
  setTimeout(() => {
    el.style.maxHeight = "none";
    el.style.overflow = "";
  }, 350);
  if (btn) btn.classList.add("active");

  const hidden = _getHidden().filter((id) => id !== tipId);
  _setHidden(hidden);
}

function _hideTip(el, btn, tipId) {
  el.style.transition = "none";
  el.style.maxHeight = el.scrollHeight + "px";
  el.style.overflow = "hidden";
  requestAnimationFrame(() => {
    el.style.transition =
      "opacity 0.2s,max-height 0.3s,margin 0.3s,padding 0.3s";
    Object.assign(el.style, {
      opacity: "0",
      maxHeight: "0",
      marginBottom: "0",
      padding: "0",
    });
  });
  setTimeout(() => el.classList.add("tip-hidden"), 350);
  if (btn) btn.classList.remove("active");

  const hidden = _getHidden();
  if (!hidden.includes(tipId)) _setHidden([...hidden, tipId]);
}
