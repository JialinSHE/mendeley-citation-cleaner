import { getToken, clearToken } from "./auth.js";

const API_BASE = "https://api.mendeley.com";
const MAX_RETRIES = 5;

function parseNextLink(linkHeader) {
  if (!linkHeader) return null;
  const nextLink = linkHeader
    .split(",")
    .map((part) => part.trim())
    .find((part) => part.endsWith('rel="next"'));
  if (!nextLink) return null;
  return nextLink.match(/<([^>]+)>/)[1];
}

async function apiFetch(url, options = {}, attempt = 0) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    clearToken();
    throw new Error("Your Mendeley session expired. Please reconnect.");
  }

  if (res.status === 429 && attempt < MAX_RETRIES) {
    const waitMs = 1000 * 2 ** attempt;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return apiFetch(url, options, attempt + 1);
  }

  if (!res.ok) {
    throw new Error(`Mendeley API error ${res.status}: ${await res.text()}`);
  }

  return res;
}

export async function fetchAllDocuments(onProgress) {
  let url = `${API_BASE}/documents?limit=500&view=all`;
  const documents = [];
  while (url) {
    const res = await apiFetch(url);
    const page = await res.json();
    documents.push(...page);
    if (onProgress) onProgress(documents.length);
    url = parseNextLink(res.headers.get("Link"));
  }
  return documents;
}

export async function patchDocument(id, fields) {
  const res = await apiFetch(`${API_BASE}/documents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/vnd.mendeley-document.1+json" },
    body: JSON.stringify(fields),
  });
  return res.json();
}
