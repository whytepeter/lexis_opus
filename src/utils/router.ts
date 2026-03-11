import type { ViewName } from "../types";
import { renderToday } from "../components/views/today";
import { renderArticles } from "../components/views/articles";
import { renderEssays } from "../components/views/essays";
import { renderFiction } from "../components/views/fiction";
import { renderVocab } from "../components/views/vocab";
import { renderProgress } from "../components/views/progress";

let _currentView: ViewName = "today";
export const currentView = (): ViewName => _currentView;

export function showView(name: ViewName): void {
  _currentView = name;

  // Swap visible view panels
  document.querySelectorAll<HTMLElement>(".view-panel").forEach((v) => {
    v.classList.add("hidden");
    v.classList.remove("active");
  });
  const panel = document.getElementById(`view-${name}`);
  if (panel) {
    panel.classList.remove("hidden");
    panel.classList.add("active");
  }

  // Sidebar nav highlight
  document.querySelectorAll<HTMLElement>(".nav-item").forEach((n) => {
    n.classList.toggle("active", n.dataset["view"] === name);
  });

  // Bottom tab highlight — vocab/fiction → highlight "More"
  const mainTabs = ["today", "articles", "essays", "progress"] as ViewName[];
  document
    .querySelectorAll<HTMLElement>(".bottom-tab")
    .forEach((t) => t.classList.remove("active"));
  const tabTarget = mainTabs.includes(name) ? name : "more";
  document.getElementById(`bt-${tabTarget}`)?.classList.add("active");

  // Render
  const renders: Record<ViewName, () => void> = {
    today: renderToday,
    articles: renderArticles,
    essays: renderEssays,
    fiction: renderFiction,
    vocab: renderVocab,
    progress: renderProgress,
  };
  renders[name]?.();
}
