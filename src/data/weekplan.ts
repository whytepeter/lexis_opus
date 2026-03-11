import type { WeekDay } from "../types";

export const WEEK_PLAN: WeekDay[] = [
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
