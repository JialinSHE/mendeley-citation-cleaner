export function authorListToString(authors) {
  if (!authors || authors.length === 0) return "(none)";
  return authors
    .map((a) => `${a.first_name || ""} ${a.last_name || ""}`.trim())
    .join("; ");
}

// CrossRef author entries use given/family; Mendeley uses first_name/last_name.
export function crossrefAuthors(work) {
  if (!work || !Array.isArray(work.author)) return null;
  return work.author
    .filter((a) => a.family)
    .map((a) => ({ first_name: a.given || "", last_name: a.family }));
}

function surnameSet(authors) {
  return new Set(
    (authors || []).map((a) => (a.last_name || "").trim().toLowerCase()).filter(Boolean)
  );
}

export function authorsEqual(a, b) {
  return authorListToString(a) === authorListToString(b);
}

// Conservative, explainable heuristic for the "two papers merged into one PDF"
// case: flag when the author count jumps a lot, or when the current and
// proposed author lists share no surnames at all. Errs toward over-flagging.
export function looksLikeMergedAuthors(current, proposed) {
  const currentSet = surnameSet(current);
  const proposedSet = surnameSet(proposed);
  if (currentSet.size === 0 || proposedSet.size === 0) return false;

  const countGap = Math.abs(currentSet.size - proposedSet.size) >= 3;

  let overlap = 0;
  for (const name of currentSet) {
    if (proposedSet.has(name)) overlap += 1;
  }
  const noOverlap = overlap === 0;

  return countGap || noOverlap;
}
