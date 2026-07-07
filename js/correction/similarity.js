function tokenize(text) {
  // NFD splits accented letters into base + combining mark; the [^a-z0-9]
  // pass then drops the marks, so "é" becomes "e" with no separate step.
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((t) => t.length >= 2);
}

// Dice coefficient over token sets: 0 (nothing shared) to 1 (identical sets).
// Used to guard fuzzy CrossRef matches against false positives.
export function titleSimilarity(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 || setB.size === 0) return 0;

  let shared = 0;
  for (const token of setA) {
    if (setB.has(token)) shared += 1;
  }
  return (2 * shared) / (setA.size + setB.size);
}
