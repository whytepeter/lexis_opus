export function loadTheme(): void {
  if (localStorage.getItem("lexis_theme") === "light") applyLight();
}

export function toggleTheme(): void {
  const isLight = document.body.classList.toggle("light");
  localStorage.setItem("lexis_theme", isLight ? "light" : "dark");
  syncThemeIcons(isLight);
  document
    .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute("content", isLight ? "#e8e4dc" : "#0a0a0b");
}

function applyLight(): void {
  document.body.classList.add("light");
  syncThemeIcons(true);
  document
    .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute("content", "#e8e4dc");
}

function syncThemeIcons(isLight: boolean): void {
  const icon = isLight ? "☾" : "☀";
  document
    .querySelectorAll<HTMLElement>(".js-theme-icon")
    .forEach((el) => (el.textContent = icon));
}
