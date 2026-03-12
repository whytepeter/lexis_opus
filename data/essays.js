// ─── data/essays.js ──────────────────────────────────────────────────────────

export const ESSAYS = [
  {
    id: "e1",
    week: 1,
    type: "Narrative / Descriptive",
    title: "A Place That Shaped You",
    prompt:
      "Write about a place that has shaped you. Describe it in detail and explain why it matters to you.",
  },
  {
    id: "e2",
    week: 2,
    type: "Narrative / Character",
    title: "A Person I Admire",
    prompt:
      "Who do you admire most and why? Use specific examples to show what makes them remarkable.",
  },
  {
    id: "e3",
    week: 3,
    type: "Reflective",
    title: "Something I Changed My Mind About",
    prompt:
      "Describe something you used to believe that you no longer do. What changed your mind?",
  },
  {
    id: "e4",
    week: 4,
    type: "Argumentative",
    title: "The Problem With Social Media",
    prompt:
      "What is the most harmful effect of social media on young people today? Argue your position clearly.",
  },
  {
    id: "e5",
    week: 5,
    type: "Compare & Contrast",
    title: "City Life vs Village Life",
    prompt:
      "What are the main differences between growing up in a city and growing up in a village? Which do you think is better, and why?",
  },
  {
    id: "e6",
    week: 6,
    type: "Expository",
    title: "The Value of Failure",
    prompt:
      "Why is failure important? Write an essay that explains and defends the idea that failing is necessary for growth.",
  },
  {
    id: "e7",
    week: 7,
    type: "Argumentative — Nuanced",
    title: "Is Money the Key to Happiness?",
    prompt:
      "Does money lead to happiness? Explore both sides of the argument before reaching your own conclusion.",
  },
  {
    id: "e8",
    week: 8,
    type: "Critical Analysis",
    title: "What My Country Gets Right — and Wrong",
    prompt:
      "What is one thing your country does well, and one thing it needs to urgently improve? Explain your reasoning.",
  },
  {
    id: "e9",
    week: 9,
    type: "Argumentative — Abstract",
    title: "The Role of Education in Society",
    prompt:
      "What should the purpose of education be? Is today's education system achieving that purpose?",
  },
  {
    id: "e10",
    week: 10,
    type: "Discursive",
    title: "Technology: Servant or Master?",
    prompt:
      "To what extent has technology improved our lives? Are there ways in which it has made us worse off?",
  },
  {
    id: "e11",
    week: 11,
    type: "Analytical",
    title: "What Makes a Great Leader?",
    prompt:
      "What qualities define a truly great leader? Support your argument with examples.",
  },
  {
    id: "e12",
    week: 12,
    type: "Free-Form Argument — Final Piece",
    title: "The Most Important Problem Facing the World Today",
    prompt:
      "In your opinion, what is the single most urgent problem facing humanity today? What should be done about it?",
  },
];

export const WEEK_PLAN = [
  {
    day: "Monday",
    focus: "Vocabulary",
    color: "focus-vocab",
    task: "Read one article. Find 2 new words. Write a sentence for each.",
    action: "articles",
  },
  {
    day: "Tuesday",
    focus: "Writing",
    color: "focus-write",
    task: "Write one paragraph (5–7 sentences) on any topic. No editing while writing.",
    action: "essays",
  },
  {
    day: "Wednesday",
    focus: "Structure",
    color: "focus-read",
    task: "Outline a short essay (intro, 2 body points, conclusion) — don't write it yet.",
    action: "essays",
  },
  {
    day: "Thursday",
    focus: "Writing",
    color: "focus-write",
    task: "Write the full essay from Wednesday's outline.",
    action: "essays",
  },
  {
    day: "Friday",
    focus: "Feedback",
    color: "focus-read",
    task: "Submit your essay to Claude. Review and rewrite one paragraph.",
    action: "essays",
  },
  {
    day: "Saturday",
    focus: "Reading aloud",
    color: "focus-vocab",
    task: "Read a well-written article out loud for 10 minutes. Record yourself if possible.",
    action: "articles",
  },
  {
    day: "Sunday",
    focus: "Review",
    color: "focus-review",
    task: "Review your words from the week. Study your vocab bank. Celebrate your progress!",
    action: "vocab",
  },
];
