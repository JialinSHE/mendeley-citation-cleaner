function normalizeIssn(issn) {
  return (issn || "").replace(/[^0-9xX]/g, "").toUpperCase();
}

// Pick the canonical journal name within a cluster: the most frequently used
// name, breaking ties toward the longer string (full names beat abbreviations).
function pickCanonical(sources) {
  const counts = new Map();
  for (const s of sources) counts.set(s, (counts.get(s) || 0) + 1);

  let best = null;
  let bestCount = -1;
  for (const [name, count] of counts) {
    if (count > bestCount || (count === bestCount && name.length > best.length)) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

// Cluster documents by ISSN (the reliable link between an abbreviation and its
// full journal name) and, where a cluster uses inconsistent names, propose the
// canonical one. Documents without an ISSN are left untouched — clustering by
// name alone would risk wrongly merging distinct journals.
export function buildJournalCanonicalMap(documents) {
  const groups = new Map();
  for (const doc of documents) {
    const issn = normalizeIssn(doc.identifiers && doc.identifiers.issn);
    const source = doc.source && doc.source.trim();
    if (!issn || !source) continue;
    if (!groups.has(issn)) groups.set(issn, []);
    groups.get(issn).push({ docId: doc.id, source });
  }

  const suggestions = new Map();
  for (const entries of groups.values()) {
    const distinctNames = new Set(entries.map((e) => e.source));
    if (distinctNames.size < 2) continue;

    const canonical = pickCanonical(entries.map((e) => e.source));
    for (const { docId, source } of entries) {
      if (source !== canonical) {
        suggestions.set(docId, { current: source, proposed: canonical });
      }
    }
  }
  return suggestions;
}
