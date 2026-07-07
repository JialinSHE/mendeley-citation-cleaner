import { CROSSREF_MAILTO } from "./config.js";

const API_BASE = "https://api.crossref.org";
const cache = new Map();

// Note: browsers block scripts from setting a custom User-Agent header, so
// the mailto query param is the only "politeness" signal available to us —
// CrossRef's docs confirm this alone is enough to land in the faster pool.
export async function lookupByDoi(doi) {
  if (cache.has(doi)) return cache.get(doi);

  const params = CROSSREF_MAILTO ? `?mailto=${encodeURIComponent(CROSSREF_MAILTO)}` : "";
  const url = `${API_BASE}/works/${encodeURIComponent(doi)}${params}`;

  let work = null;
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      work = data.message;
    }
  } catch {
    work = null;
  }

  cache.set(doi, work);
  return work;
}

const searchCache = new Map();

// Fuzzy bibliographic search, used to find a DOI for documents that have none.
// Returns up to `rows` candidate works (may be empty); callers must score the
// results themselves rather than trust CrossRef's ranking.
export async function searchByTitleAuthor(query, rows = 5) {
  if (searchCache.has(query)) return searchCache.get(query);

  const params = new URLSearchParams({ "query.bibliographic": query, rows: String(rows) });
  if (CROSSREF_MAILTO) params.set("mailto", CROSSREF_MAILTO);
  const url = `${API_BASE}/works?${params.toString()}`;

  let items = [];
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      items = (data.message && data.message.items) || [];
    }
  } catch {
    items = [];
  }

  searchCache.set(query, items);
  return items;
}
