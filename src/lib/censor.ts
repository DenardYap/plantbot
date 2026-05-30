// Lightweight profanity filter. Anyone can drop a message into a public
// chat with a plant, so we mask the obvious stuff before it gets persisted
// (and before we hand it to the model).
//
// The list is intentionally small — we're not aiming for perfect coverage,
// just keeping the room PG-13 by default. We mask common variants by
// matching word boundaries on the base form and a few inflections.

const BAD_WORDS: readonly string[] = [
  // f-word family
  "fuck",
  "fucks",
  "fucked",
  "fucker",
  "fuckers",
  "fucking",
  "fuckin",
  "fuckface",
  "fuckwit",
  "fuckboy",
  "clusterfuck",
  "motherfucker",
  "motherfucking",
  "mofo",
  "fml",
  "stfu",
  "gtfo",
  "wtf",

  // s-word family
  "shit",
  "shits",
  "shite",
  "shitty",
  "shitter",
  "shithead",
  "shithole",
  "shitface",
  "shitfaced",
  "bullshit",
  "horseshit",
  "dipshit",
  "batshit",
  "crap",
  "crappy",

  // b-word family
  "bitch",
  "bitches",
  "bitching",
  "bitchy",
  "biatch",

  // ass family
  "ass",
  "asses",
  "asshole",
  "assholes",
  "asshat",
  "asswipe",
  "assclown",
  "dumbass",
  "jackass",
  "smartass",
  "badass",
  "arse",
  "arsehole",

  // d-word family
  "damn",
  "damnit",
  "dammit",
  "goddamn",
  "goddamnit",

  // anatomical / sexual
  "penis",
  "penises",
  "vagina",
  "dick",
  "dicks",
  "dickhead",
  "dickwad",
  "dickface",
  "cock",
  "cocks",
  "cocksucker",
  "pussy",
  "pussies",
  "cunt",
  "cunts",
  "twat",
  "boob",
  "boobs",
  "boobies",
  "tit",
  "tits",
  "titties",
  "nipple",
  "nipples",
  "ballsack",
  "nutsack",
  "scrotum",
  "testicle",
  "testicles",
  "clit",
  "clitoris",
  "dildo",
  "anus",
  "butthole",
  "buttplug",

  // sexual acts / porn
  "sex",
  "sexy",
  "horny",
  "porn",
  "porno",
  "pornography",
  "masturbate",
  "masturbation",
  "jerkoff",
  "handjob",
  "blowjob",
  "rimjob",
  "cum",
  "cumming",
  "jizz",
  "orgasm",
  "ejaculate",
  "boner",
  "erection",
  "fap",
  "milf",
  "hentai",

  // insults
  "bastard",
  "bastards",
  "douche",
  "douchebag",
  "wanker",
  "tosser",
  "git",
  "prick",
  "pricks",
  "knob",
  "knobhead",
  "bellend",
  "slut",
  "sluts",
  "slutty",
  "whore",
  "whores",
  "skank",
  "hoe",
  "hoes",
  "moron",
  "idiot",
  "imbecile",
  "scumbag",
  "loser",

  // p-word family
  "piss",
  "pissed",
  "pissing",
  "pissoff",

  // bodily / misc
  "fart",
  "turd",
  "wank",

  // slurs (always masked)
  "fag",
  "fags",
  "faggot",
  "faggots",
  "dyke",
  "tranny",
  "nigger",
  "niggers",
  "nigga",
  "niggas",
  "chink",
  "spic",
  "wetback",
  "kike",
  "gook",
  "coon",
  "paki",
  "retard",
  "retards",
  "retarded",
  "spaz",
  "cripple",
  "midget",
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
