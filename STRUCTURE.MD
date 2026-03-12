lexis/
├── index.html (shell only — nav, modals, view containers)
├── data/
│ ├── articles.js (ARTICLES array)
│ ├── essays.js (ESSAYS array + WEEK_PLAN)
│ └── fiction.js (FICTION array)
├── state/
│ └── store.js (loadState, saveState, all getters/setters)
├── views/
│ ├── today.js (renderToday, markDayComplete, streak logic)
│ ├── articles.js (renderArticles, filterArticles, word panel)
│ ├── essays.js (renderEssays, openEssayModal, saveDraft)
│ ├── fiction.js (renderFiction, filterFiction)
│ ├── vocab.js (renderVocab, renderVocabTable, filterVocab)
│ └── progress.js (renderProgress)
├── study/
│ └── session.js (all study session logic — setup, flip, rate, done)
└── utils/
├── theme.js (toggleTheme, loadTheme)
├── tips.js (toggleTip, dismissTip, restoreDismissedTips)
└── toast.js (toast function)
