import { lookupByDoi } from "../crossrefApi.js";
import { needsTitleCaseFix, toTitleCase } from "./titleCase.js";
import {
  authorListToString,
  crossrefAuthors,
  authorsEqual,
  looksLikeMergedAuthors,
} from "./authorMatch.js";
import { tierForField } from "./confidenceTiers.js";

export const FIELD_LABELS = {
  title: "Title",
  authors: "Authors",
};

export function fieldLabel(field) {
  return FIELD_LABELS[field] || field;
}

function extractCrossrefTitle(work) {
  if (!work || !Array.isArray(work.title) || work.title.length === 0) return null;
  return work.title[0];
}

// A field diff carries both display strings (current/proposed) and the raw
// value to send back to Mendeley (writeValue) — those differ for authors,
// where display is a readable string but the write value is an array.
function makeField({ current, proposed, writeValue, source, risk = [], editable }) {
  return {
    current,
    proposed,
    writeValue,
    source,
    risk,
    editable,
    changed: true,
    tier: tierForField({ source, risk }),
  };
}

function computeTitleField(doc, work) {
  const current = doc.title || "";

  const crossrefTitle = extractCrossrefTitle(work);
  if (crossrefTitle && crossrefTitle.trim() !== current.trim()) {
    return makeField({
      current,
      proposed: crossrefTitle,
      writeValue: crossrefTitle,
      source: "crossref-doi",
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

function computeAuthorsField(doc, work) {
  const current = doc.authors || [];
  const proposed = crossrefAuthors(work);
  if (!proposed || proposed.length === 0 || authorsEqual(current, proposed)) return null;

  const risk = looksLikeMergedAuthors(current, proposed) ? ["merged-authors"] : [];
  return makeField({
    current: authorListToString(current),
    proposed: authorListToString(proposed),
    writeValue: proposed,
    source: "crossref-doi",
    risk,
    editable: false,
  });
}

export async function computeDocumentDiff(doc) {
  const doi = doc.identifiers && doc.identifiers.doi;
  const work = doi ? await lookupByDoi(doi) : null;

  const fields = {};
  const title = computeTitleField(doc, work);
  if (title) fields.title = title;
  const authors = computeAuthorsField(doc, work);
  if (authors) fields.authors = authors;

  if (Object.keys(fields).length === 0) return null;
  return { documentId: doc.id, fields };
}
