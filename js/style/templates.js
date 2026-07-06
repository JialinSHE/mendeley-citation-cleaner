import { formatAuthors, formatTitle, formatYear, formatJournal, formatDoi } from "./formatters.js";

export function formatDocument(doc, style) {
  const authors = formatAuthors(doc.authors, style.authorStyle);
  const year = formatYear(doc, style.yearStyle);
  const title = formatTitle(doc.title, style.titleStyle);
  const journal = formatJournal(doc);
  const doi = formatDoi(doc, style.doiStyle);

  if (doc.type === "book") {
    const place = [doc.city, doc.publisher].filter(Boolean).join(": ");
    return [`${authors} (${year}).`, `${title}.`, place ? `${place}.` : ""]
      .filter(Boolean)
      .join(" ");
  }

  if (doc.type === "journal") {
    const volumeIssue = [doc.volume, doc.issue ? `(${doc.issue})` : ""].filter(Boolean).join("");
    const pages = doc.pages ? `, ${doc.pages}` : "";
    const journalPart = journal ? `${journal}${volumeIssue ? `, ${volumeIssue}` : ""}${pages}.` : "";
    return [`${authors} (${year}).`, `${title}.`, journalPart, doi].filter(Boolean).join(" ");
  }

  return [`${authors} (${year}).`, `${title}.`].filter(Boolean).join(" ");
}
