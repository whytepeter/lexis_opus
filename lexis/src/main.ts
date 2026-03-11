import "./style.css";
import { loadState } from "./store/state";
import { loadTheme } from "./utils/theme";
import { restoreDismissedTips } from "./utils/tips";
import { showView } from "./utils/router";

// Shell
import {
  renderSidebar,
  renderBottomTabs,
  renderMoreSheet,
  renderFAB,
  bindShellEvents,
} from "./components/shell";

// View templates
import { todayTemplate, bindTodayStaticEvents } from "./components/views/today";
import {
  articlesTemplate,
  bindArticlesStaticEvents,
} from "./components/views/articles";
import {
  essaysTemplate,
  bindEssaysStaticEvents,
} from "./components/views/essays";
import {
  fictionTemplate,
  bindFictionStaticEvents,
} from "./components/views/fiction";
import { vocabTemplate, bindVocabStaticEvents } from "./components/views/vocab";
import {
  progressTemplate,
  bindProgressStaticEvents,
} from "./components/views/progress";

// Modal templates
import {
  essayModalTemplate,
  bindEssayModalEvents,
} from "./components/modals/essayModal";
import {
  studyModalTemplate,
  bindStudyModalEvents,
} from "./components/modals/studyModal";
import {
  settingsModalTemplate,
  bindSettingsModalEvents,
} from "./components/modals/settingsModal";

// ── Bootstrap ─────────────────────────────────────────────────────────────────

function bootstrap(): void {
  loadState();
  loadTheme();

  const app = document.getElementById("app")!;

  // Inject full layout
  app.innerHTML = /* html */ `
    <!-- Shell wrapper -->
    <div class="flex h-screen overflow-hidden">
      ${renderSidebar()}

      <!-- Main scroll area -->
      <main class="flex-1 overflow-y-auto flex flex-col">
        ${todayTemplate()}
        ${articlesTemplate()}
        ${essaysTemplate()}
        ${fictionTemplate()}
        ${vocabTemplate()}
        ${progressTemplate()}
      </main>
    </div>

    <!-- Mobile chrome -->
    ${renderBottomTabs()}
    ${renderMoreSheet()}
    ${renderFAB()}

    <!-- Modals -->
    ${essayModalTemplate()}
    ${studyModalTemplate()}
    ${settingsModalTemplate()}

    <!-- Toast -->
    <div class="toast" id="toast"></div>
  `;

  // Bind all events
  bindShellEvents();
  bindTodayStaticEvents();
  bindArticlesStaticEvents();
  bindEssaysStaticEvents();
  bindFictionStaticEvents();
  bindVocabStaticEvents();
  bindProgressStaticEvents();
  bindEssayModalEvents();
  bindStudyModalEvents();
  bindSettingsModalEvents();

  // Restore hidden tips, then render initial view
  restoreDismissedTips();
  showView("today");

  // PWA manifest
  registerPWA();
}

// ── PWA ───────────────────────────────────────────────────────────────────────

function registerPWA(): void {
  const manifest = {
    name: "Lexis — English Tracker",
    short_name: "Lexis",
    description: "Track your English learning.",
    start_url: ".",
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#0a0a0b",
    orientation: "portrait-primary",
    icons: [
      {
        src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><rect width='512' height='512' rx='100' fill='%230a0a0b'/><text y='360' x='256' text-anchor='middle' font-size='300' font-family='Georgia,serif' fill='%23d4931a'>L</text></svg>",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  };
  const blob = new Blob([JSON.stringify(manifest)], {
    type: "application/json",
  });
  document
    .getElementById("pwa-manifest")
    ?.setAttribute("href", URL.createObjectURL(blob));
}

bootstrap();
