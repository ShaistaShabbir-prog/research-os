export interface GrammarIssue {
  type: "grammar" | "spelling" | "style" | "word_choice" | "clarity" | "citation" | "tone" | "punctuation";
  severity: "error" | "warning" | "info";
  message: string;
  suggestion?: string;
  text: string;
  start: number;
  end: number;
}

// ── Grammar & spelling rules ──
const GRAMMAR_RULES: Array<{
  pattern: RegExp;
  type: GrammarIssue["type"];
  severity: GrammarIssue["severity"];
  message: string;
  suggestion?: string;
}> = [
  // Article errors
  { pattern: /\ba ([aeiouAEIOU]\w)/g, type:"grammar", severity:"error", message:'Use "an" before vowel sounds, not "a".', suggestion:'Replace "a" with "an"' },
  { pattern: /\ban ([^aeiouAEIOU\s]\w)/g, type:"grammar", severity:"error", message:'Use "a" before consonant sounds, not "an".', suggestion:'Replace "an" with "a"' },

  // Common confusions
  { pattern: /\bits\s+([a-z])/g, type:"grammar", severity:"error", message:'"its" = possessive. Did you mean "it\'s" (it is)?', suggestion:'Check: possessive "its" vs contraction "it\'s"' },
  { pattern: /\btheir\s+is\b/gi, type:"grammar", severity:"error", message:'"their is" is incorrect. Did you mean "there is"?', suggestion:'Replace with "there is"' },
  { pattern: /\bthere\s+(book|paper|work|study|result|method)\b/gi, type:"grammar", severity:"error", message:'Did you mean "their" (possessive)?', suggestion:'Replace "there" with "their"' },
  { pattern: /\beffect\s+(the|a|an|our|this)\b/gi, type:"grammar", severity:"warning", message:'Check: "effect" (noun) vs "affect" (verb).', suggestion:'Verify: affect (verb) or effect (noun)' },
  { pattern: /\bwhich\s+it\s+is\b/gi, type:"grammar", severity:"warning", message:'Wordy construction — consider simplifying.', suggestion:'Simplify phrasing' },

  // Double words
  { pattern: /\b(\w+)\s+\1\b/gi, type:"grammar", severity:"error", message:'Repeated word detected.', suggestion:'Remove the duplicate word' },

  // Missing Oxford comma hint
  { pattern: /\w+,\s+\w+\s+and\s+\w+/g, type:"style", severity:"info", message:'Consider Oxford comma (A, B, and C) for clarity in academic writing.', suggestion:'Add comma before "and"' },

  // Punctuation issues
  { pattern: /\s+[,\.;:]/g, type:"punctuation", severity:"error", message:'Space before punctuation mark.', suggestion:'Remove space before punctuation' },
  { pattern: /[,\.;:][a-zA-Z]/g, type:"punctuation", severity:"error", message:'Missing space after punctuation mark.', suggestion:'Add space after punctuation' },
  { pattern: /\.{4,}/g, type:"punctuation", severity:"warning", message:'Use exactly three dots for ellipsis (…).', suggestion:'Replace with "…" or "..."' },

  // Weak academic language
  { pattern: /\bvery\s+\w+/gi, type:"word_choice", severity:"warning", message:'"Very + adjective" is weak in academic writing. Use a stronger word.', suggestion:'Replace "very X" with a precise adjective' },
  { pattern: /\breally\b/gi, type:"word_choice", severity:"warning", message:'"Really" is informal — avoid in academic writing.', suggestion:'Remove or replace with a precise qualifier' },
  { pattern: /\bbasically\b/gi, type:"word_choice", severity:"warning", message:'"Basically" is vague — remove or replace.', suggestion:'Remove "basically"' },
  { pattern: /\bkind of\b/gi, type:"word_choice", severity:"warning", message:'"Kind of" is informal — use "somewhat" or be more precise.', suggestion:'Replace with precise qualifier' },
  { pattern: /\ba lot\b/gi, type:"word_choice", severity:"info", message:'"A lot" is informal — use "many", "several", "significantly".', suggestion:'Replace with "many" or "significantly"' },
  { pattern: /\betc\.\b/gi, type:"style", severity:"info", message:'"etc." is vague — list items explicitly or use "and so on" sparingly.', suggestion:'List the items explicitly' },
  { pattern: /\bget\b/gi, type:"style", severity:"info", message:'"Get" is informal — use "obtain", "achieve", "become", or "receive".', suggestion:'Replace "get" with a formal verb' },
  { pattern: /\bshow that\b/gi, type:"citation", severity:"warning", message:'"Show that" is a claim — ensure it is backed by evidence or a citation.', suggestion:'Add citation or reference to data' },
  { pattern: /\bprove(s|d|s that)?\b/gi, type:"citation", severity:"warning", message:'"Prove" is a strong claim — use "demonstrate", "suggest", or "indicate" unless mathematically proven.', suggestion:'Replace with "demonstrate" or "suggest"' },

  // Passive voice (common academic overuse)
  { pattern: /\b(is|are|was|were|be|been|being)\s+\w+ed\b/g, type:"style", severity:"info", message:"Passive voice — consider active voice for clarity and directness.", suggestion:"Rewrite in active voice" },

  // Long sentences
  { pattern: /[^.!?]{250,}[.!?]/g, type:"clarity", severity:"warning", message:"Very long sentence (250+ chars) — split for readability.", suggestion:"Break into 2 shorter sentences" },

  // First-person opinion
  { pattern: /\bI (think|believe|feel|consider|would say)\b/gi, type:"tone", severity:"error", message:"Avoid first-person opinion in academic writing.", suggestion:'Replace with "This work argues…" or cite evidence' },
  { pattern: /\bin my opinion\b/gi, type:"tone", severity:"error", message:'"In my opinion" is inappropriate in academic writing.', suggestion:"State as a position supported by evidence" },

  // Tense consistency hints
  { pattern: /\b(will show|will prove|will demonstrate)\b/gi, type:"style", severity:"info", message:"Future tense in abstract/methodology — use present or past tense for completed work.", suggestion:'Replace "will X" with "X" or "Xed"' },

  // Overused phrases
  { pattern: /\bin order to\b/gi, type:"style", severity:"info", message:'"In order to" is wordy — just use "to".', suggestion:'Replace "in order to" with "to"' },
  { pattern: /\bdue to the fact that\b/gi, type:"style", severity:"info", message:'"Due to the fact that" is wordy — use "because".', suggestion:'Replace with "because"' },
  { pattern: /\bit is (important|worth|interesting) to note\b/gi, type:"style", severity:"info", message:"Filler phrase — state the point directly.", suggestion:"Remove filler; state the observation directly" },
  { pattern: /\bstate of the art\b/gi, type:"style", severity:"info", message:"Use hyphenated form as adjective: 'state-of-the-art method'.", suggestion:"Hyphenate: state-of-the-art" },
];

// ── Missing citation detector ──
function checkMissingCitations(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = [];
  const claimVerbs = [
    "shows", "demonstrates", "confirms", "proves", "indicates",
    "reveals", "suggests", "found that", "reported", "concluded",
    "established", "verified", "validated",
  ];
  claimVerbs.forEach(verb => {
    const re = new RegExp(`\\b${verb}\\b`, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const window = text.slice(Math.max(0, m.index - 10), m.index + 100);
      const hasCitation = /\[|\(\d{4}\)|et al/.test(window);
      if (!hasCitation) {
        issues.push({
          type: "citation", severity: "error",
          message: `"${verb}" is a claim — needs a citation or reference to data.`,
          suggestion: "Add [Author, Year] or refer to a specific figure/table",
          text: verb, start: m.index, end: m.index + verb.length,
        });
      }
    }
  });
  return issues;
}

// ── Main analysis function ──
export function analyzeGrammar(text: string): GrammarIssue[] {
  if (!text || text.trim().length < 30) return [];
  const issues: GrammarIssue[] = [];

  GRAMMAR_RULES.forEach(rule => {
    const re = new RegExp(rule.pattern.source, rule.pattern.flags.includes("g") ? rule.pattern.flags : rule.pattern.flags + "g");
    let m: RegExpExecArray | null;
    let count = 0;
    while ((m = re.exec(text)) !== null && count < 5) {
      // Don't flag "an" rule inside code blocks or URLs
      if (text.slice(Math.max(0, m.index - 20), m.index).includes("http")) continue;
      issues.push({
        type: rule.type,
        severity: rule.severity,
        message: rule.message,
        suggestion: rule.suggestion,
        text: m[0],
        start: m.index,
        end: m.index + m[0].length,
      });
      count++;
    }
  });

  // Citation checks
  issues.push(...checkMissingCitations(text));

  // Deduplicate by start position
  const seen = new Set<number>();
  const deduped = issues.filter(i => {
    if (seen.has(i.start)) return false;
    seen.add(i.start);
    return true;
  });

  // Sort by severity then position
  const sev = { error: 0, warning: 1, info: 2 };
  return deduped
    .sort((a, b) => sev[a.severity] - sev[b.severity] || a.start - b.start)
    .slice(0, 30);
}

export const TYPE_LABEL: Record<string, string> = {
  grammar: "Grammar", spelling: "Spelling", style: "Style",
  word_choice: "Word choice", clarity: "Clarity",
  citation: "Missing citation", tone: "Tone", punctuation: "Punctuation",
};

export const SEVERITY_COLOR: Record<string, string> = {
  error:   "text-red-400 bg-red-500/10 border-red-500/20",
  warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  info:    "text-sky-400 bg-sky-500/10 border-sky-500/20",
};

export const SEVERITY_DOT: Record<string, string> = {
  error: "bg-red-400", warning: "bg-amber-400", info: "bg-sky-400",
};
