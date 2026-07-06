import { toTitleCase } from "../correction/titleCase.js";

export function formatAuthors(authors, style) {
  if (!authors || authors.length === 0) return "";

  const names = authors.map((a) => {
    const last = a.last_name || "";
    const first = a.first_name || "";
    const initial = first ? `${first[0]}.` : "";
    return `${last}, ${initial}`.trim().replace(/,$/, "");
  });

  if (style === "first-et-al") {
    return names.length === 1 ? names[0] : `${names[0]} et al.`;
  }

  if (style === "first-and-second" && names.length === 2) {
    return `${names[0]} & ${names[1]}`;
  }

  return names.join(", ");
}

export function formatTitle(title, style) {
  if (!title) return "";
  if (style === "title-case") return toTitleCase(title);
  if (style === "sentence-case") {
    const lower = title.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  return title;
}

export function formatJournal(doc) {
  return doc.source || "";
}

export function formatYear(doc, style) {
  if (!doc.year) return "";
  if (style === "full-date" && doc.month) {
    const day = doc.day ? `${doc.day} ` : "";
    return `${day}${doc.month}/${doc.year}`;
  }
  return String(doc.year);
}

export function formatDoi(doc, style) {
  const doi = doc.identifiers && doc.identifiers.doi;
  if (!doi) return "";
  return style === "link" ? `https://doi.org/${doi}` : doi;
}
