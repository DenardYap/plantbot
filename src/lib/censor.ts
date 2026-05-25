// Lightweight profanity filter. Anyone can drop a message into a public
// chat with a plant, so we mask the obvious stuff before it gets persisted
// (and before we hand it to the model).
//
// The list is intentionally small — we're not aiming for perfect coverage,
// just keeping the room PG-13 by default. We mask common variants by
// matching word boundaries on the base form and a few inflections.

const BAD_WORDS: readonly string[] = [
  "fuck",
  "fucker",
  "fucking",
  "motherfucker",
  "shit",
  "shitty",
  "bullshit",
  "bitch",
  "bitches",
  "ass",
  "asshole",
  "asses",
  "cunt",
  "dick",
  "dickhead",
  "piss",
  "pissed",
  "bastard",
  "douche",
  "douchebag",
  "wanker",
  "twat",
  "slut",
  "whore",
  "cock",
  "pussy",
  "fag",
  "faggot",
  "nigger",
  "nigga",
  "retard",
  "retarded",
];

// Compiled once at module load. `\b` keeps "ass" from matching "class" or
// "assist" — we only want whole-word hits.
const PATTERN = new RegExp(
  `\\b(?:${BAD_WORDS.map((w) =>
    w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  ).join("|")})\\b`,
  "gi",
);

function mask(word: string): string {
  if (word.length <= 2) return "*".repeat(word.length);
  return `${word[0]}${"*".repeat(word.length - 1)}`;
}

/**
 * Replace recognised profanity with a starred-out version of the same
 * length (first letter preserved for readability). Punctuation and casing
 * around the word are untouched.
 */
export function censor(text: string): string {
  return text.replace(PATTERN, (match) => mask(match));
}

/** True if any recognised profanity is present. Useful for analytics/logs. */
export function containsProfanity(text: string): boolean {
  PATTERN.lastIndex = 0;
  return PATTERN.test(text);
}
