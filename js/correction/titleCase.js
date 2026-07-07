const MINOR_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "nor", "of", "in", "on", "at", "to",
  "for", "with", "from", "by", "as", "is", "vs",
]);

export function isAllCaps(text) {
  return /[a-z]/i.test(text) && text === text.toUpperCase() && text !== text.toLowerCase();
}

export function isAllLower(text) {
  return /[a-z]/i.test(text) && text === text.toLowerCase() && text !== text.toUpperCase();
}

export function needsTitleCaseFix(text) {
  return isAllCaps(text) || isAllLower(text);
}

export function toTitleCase(text) {
  const words = text.toLowerCase().split(/\s+/);
  return words
    .map((word, index) => {
      if (word.length === 0) return word;
      const isFirstOrLast = index === 0 || index === words.length - 1;
      if (!isFirstOrLast && MINOR_WORDS.has(word)) return word;
      return word[0].toUpperCase() + word.slice(1);
    })
    .join(" ");
}

// Sentence case: everything lowercase except the first letter. Proper nouns
// can't be detected automatically, so the user can hand-edit those after.
export function toSentenceCase(text) {
  const lower = text.toLowerCase();
  return lower.replace(/[a-z]/, (c) => c.toUpperCase());
}
