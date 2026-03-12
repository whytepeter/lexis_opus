export function toggleTheme() {
  const isLight = document.body.classList.toggle("light");
  localStorage.setItem("lexis_theme", isLight ? "light" : "dark");
  _setThemeUI(isLight);
  document
    .querySelector('meta[name="theme-color"]')
    .setAttribute("content", isLight ? "#e8e4dc" : "#0a0a0b");
}

export function loadTheme() {
  const isLight = localStorage.getItem("lexis_theme") === "light";
  if (isLight) document.body.classList.add("light");
  _setThemeUI(isLight);
  document
    .querySelector('meta[name="theme-color"]')
    .setAttribute("content", isLight ? "#e8e4dc" : "#0a0a0b");
}

function _setThemeUI(isLight) {
  const icon = isLight ? "☾" : "☀";
  ["theme-toggle-btn", "fab-theme-btn"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = icon;
  });
}
