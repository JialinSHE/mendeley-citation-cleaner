import { lookupByDoi, searchByTitleAuthor } from "../crossrefApi.js";
import { needsTitleCaseFix, toTitleCase } from "./titleCase.js";
import {
  authorListToString,
  crossrefAuthors,
  authorsEqual,
  looksLikeMergedAuthors,
} from "./authorMatch.js";
import { titleSimilarity } from "./similarity.js";
import { tierForField } from "./confidenceTiers.js";

const DOI_MATCH_THRESHOLD = 0.85;

export const FIELD_LABELS = {
  title: "Title",
  authors: "Authors",
  journal: "Journal",
  doi: "DOI",
  year: "Year",
  volume: "Volume",
  issue: "Issue",
  pages: "Pages",
};

export function fieldLabel(field) {
  return FIELD_LABELS[field] || field;
}

function extractCrossrefTitle(work) {
  if (!work || !Array.isArray(work.title) || work.title.length === 0) return null;
  return work.title[0];
}

// The confidence source for data taken from a CrossRef record depends on how
// we found that record: an exact DOI lookup is trusted (auto-suggested), a
// fuzzy title match is not (needs review).
function crossrefSource(matchType) {
  return matchType === "doi" ? "crossref-doi" : "crossref-fuzzy";
}

// A field diff carries both display strings (current/proposed) and the raw
// value to send back to Mendeley (writeValue) — those differ for authors,
// where display is a readable string but the write value is an array.
function makeField({ current, proposed, writeValue, source, risk = [], editable, verifyUrlPrefix = null }) {
  return {
    current,
    proposed,
    writeValue,
    source,
    risk,
    editable,
    verifyUrlPrefix,
    changed: true,
    tier: tierForField({ source, risk }),
  };
}

// A "verify only" section: no change is proposed, but DOI/title/authors are
// always shown on a flagged document so the user can double-check them — e.g.
// to catch a wrong stored DOI that would poison the CrossRef-derived fields.
function makeVerifyField({ current, writeValue, editable, verifyUrlPrefix = null }) {
  return {
    current,
    proposed: current,
    writeValue,
    source: "current",
    risk: [],
    editable,
    verifyUrlPrefix,
    verifyOnly: true,
    changed: false,
    tier: null,
  };
}

function computeTitleField(doc, work, matchType) {
  const current = doc.title || "";

  const crossrefTitle = extractCrossrefTitle(work);
  if (crossrefTitle && crossrefTitle.trim() !== current.trim()) {
    return makeField({
      current,
      proposed: crossrefTitle,
      writeValue: crossrefTitle,
      source: crossrefSource(matchType),
      editable: true,
    });
  }

  if (needsTitleCaseFix(current)) {
    const proposed = toTitleCase(current);
    return makeField({
      current,
      proposed,
      writeValue: proposed,
      source: "local-titlecase",
      editable: true,
    });
  }

  return null;
}

function computeAuthorsField(doc, work, matchType) {
  const current = doc.authors || [];
  const proposed = crossrefAuthors(work);
  if (!proposed || proposed.length === 0 || authorsEqual(current, proposed)) return null;

  const risk = looksLikeMergedAuthors(current, proposed) ? ["merged-authors"] : [];
  return makeField({
    current: authorListToString(current),
    proposed: authorListToString(proposed),
    writeValue: proposed,
    source: crossrefSource(matchType),
    risk,
    editable: false,
  });
}

function crossrefContainer(work) {
  return work && Array.isArray(work["container-title"]) ? work["container-title"][0] : null;
}

// Journal name: prefer the library-wide clustering suggestion (consistency
// across entries); otherwise, if the journal is missing entirely, fill it from
// the matched CrossRef record.
function computeJournalField(doc, work, matchType, context) {
  const suggestion = context.journalSuggestion;
  if (suggestion) {
    return makeField({
      current: suggestion.current,
      proposed: suggestion.proposed,
      writeValue: suggestion.proposed,
      source: "library-cluster",
      editable: true,
    });
  }

  const current = (doc.source || "").trim();
  const container = crossrefContainer(work);
  if (!current && container) {
    return makeField({
      current: "(empty)",
      proposed: container,
      writeValue: container,
      source: crossrefSource(matchType),
      editable: true,
    });
  }
  return null;
}

function crossrefYear(work) {
  const parts = work.issued && work.issued["date-parts"];
  return parts && parts[0] && parts[0][0];
}

// Generic before/after for a plain bibliographic field (year, volume, issue,
// pages). Proposes the CrossRef value when it exists and differs from what's
// stored — including filling an empty field. Skips when they already match.
function computeSimpleField(currentRaw, proposedRaw, source) {
  const current = currentRaw == null ? "" : String(currentRaw).trim();
  const proposed = proposedRaw == null ? "" : String(proposedRaw).trim();
  if (!proposed || proposed === current) return null;
  return makeField({
    current: current || "(empty)",
    proposed,
    writeValue: proposed,
    source,
    editable: true,
  });
}

// For documents with no DOI: fuzzy-search CrossRef and return the best-matching
// record, but only if its title is a strong match and the year lines up. The
// returned record (when confident) is reused to propose title/authors/DOI, so
// one lookup fixes several fields at once. Kept conservative to avoid matching
// the wrong paper.
async function fuzzyFindWork(doc) {
  const title = doc.title;
  if (!title) return null;

  const firstAuthor = (doc.authors && doc.authors[0] && doc.authors[0].last_name) || "";
  const query = [title, firstAuthor, doc.year].filter(Boolean).join(" ");
  const items = await searchByTitleAuthor(query);

  let best = null;
  let bestScore = 0;
  let bestRawScore = 0;
  for (const item of items) {
    const itemTitle = Array.isArray(item.title) ? item.title[0] : "";
    const rawScore = titleSimilarity(itemTitle, title);
    const itemYear = crossrefYear(item);
    const yearOk = !doc.year || !itemYear || Math.abs(Number(doc.year) - itemYear) <= 1;
    if (!yearOk) continue;

    // When titles tie, prefer the published journal article over preprints
    // ("posted-content") and other variants, which often share a near-identical
    // title but carry a different DOI.
    const typeBonus = item.type === "journal-article" ? 0.03 : 0;
    const adjustedScore = rawScore + typeBonus;
    if (adjustedScore > bestScore) {
      best = item;
      bestScore = adjustedScore;
      bestRawScore = rawScore;
    }
  }

  return best && bestRawScore >= DOI_MATCH_THRESHOLD ? best : null;
}

export async function computeDocumentDiff(doc, context = {}) {
  const existingDoi = doc.identifiers && doc.identifiers.doi;

  let work = null;
  let matchType = null;
  if (existingDoi) {
    work = await lookupByDoi(existingDoi);
    matchType = "doi";
  } else {
    work = await fuzzyFindWork(doc);
    if (work) matchType = "fuzzy";
  }

  const fields = {};
  const title = computeTitleField(doc, work, matchType);
  if (title) fields.title = title;
  const authors = computeAuthorsField(doc, work, matchType);
  if (authors) fields.authors = authors;
  const journal = computeJournalField(doc, work, matchType, context);
  if (journal) fields.journal = journal;

  if (work) {
    const src = crossrefSource(matchType);
    const year = computeSimpleField(doc.year, crossrefYear(work), src);
    if (year) fields.year = year;
    const volume = computeSimpleField(doc.volume, work.volume, src);
    if (volume) fields.volume = volume;
    const issue = computeSimpleField(doc.issue, work.issue, src);
    if (issue) fields.issue = issue;
    const pages = computeSimpleField(doc.pages, work.page, src);
    if (pages) fields.pages = pages;
  }

  if (!existingDoi && work && work.DOI) {
    fields.doi = makeField({
      current: "(no DOI)",
      proposed: work.DOI,
      writeValue: work.DOI,
      source: "crossref-fuzzy",
      editable: true,
      verifyUrlPrefix: "https://doi.org/",
    });
  }

  if (Object.keys(fields).length === 0) return null;

  // The document is already flagged; always surface DOI/title/authors for
  // verification (even when unchanged) so a wrong stored value can be caught.
  if (!fields.title) {
    fields.title = makeVerifyField({
      current: doc.title || "(empty)",
      writeValue: doc.title || "",
      editable: true,
    });
  }
  if (!fields.authors) {
    fields.authors = makeVerifyField({
      current: authorListToString(doc.authors || []),
      writeValue: doc.authors || [],
      editable: false,
    });
  }
  if (!fields.doi) {
    fields.doi = makeVerifyField({
      current: existingDoi || "(no DOI)",
      writeValue: existingDoi || "",
      editable: true,
      verifyUrlPrefix: "https://doi.org/",
    });
  }

  return { documentId: doc.id, fields };
}
