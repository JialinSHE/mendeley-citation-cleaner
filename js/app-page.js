import { isLoggedIn, clearToken } from "./auth.js";
import { fetchAllDocuments } from "./mendeleyApi.js";
import { computeDocumentDiff } from "./correction/diffEngine.js";
import { buildJournalCanonicalMap } from "./correction/journalNormalize.js";
import { state } from "./state.js";
import { renderReviewTable } from "./ui/reviewTable.js";
import { renderDiffPanel } from "./ui/diffPanel.js";
import {
  getAcceptedChanges,
  renderApplySummary,
  applyChanges,
  renderApplyProgress,
  downloadChangeLog,
} from "./ui/applyFlow.js";
import { renderStylePanel } from "./style/stylePanel.js";

if (!isLoggedIn()) {
  window.location.href = "index.html";
}

document.getElementById("logout-btn").addEventListener("click", () => {
  clearToken();
  window.location.href = "index.html";
});

const statusEl = document.getElementById("status");
const table = document.getElementById("library-table");
const tbody = document.getElementById("library-body");
const showAllToggle = document.getElementById("show-all-toggle");
const diffPanelEl = document.getElementById("diff-panel");
const applySummaryEl = document.getElementById("apply-summary");
const applyBtn = document.getElementById("apply-btn");
const downloadBackupBtn = document.getElementById("download-backup-btn");
const applyProgressEl = document.getElementById("apply-progress");

function authorNames(doc) {
  if (!doc.authors || doc.authors.length === 0) return "—";
  return doc.authors
    .map((a) => `${a.first_name || ""} ${a.last_name || ""}`.trim())
    .join("; ");
}

let currentReview = null;
let journalMap = new Map();

function openReview(doc, diff) {
  currentReview = { doc, diff };
  refreshView();
}

// Re-runs the analysis for one document using a DOI the user typed in, so the
// other fields (title, authors, year, volume, pages…) refresh from the correct
// record. Prior accept/reject choices for this document are cleared so the user
// re-decides against the fresh suggestions.
async function recheckWithDoi(doc, newDoi) {
  state.decisionsByDocId.delete(doc.id);
  diffPanelEl.textContent = "Re-checking this paper with the DOI you entered…";
  const diff = await computeDocumentDiff(doc, {
    overrideDoi: newDoi,
    journalSuggestion: journalMap.get(doc.id),
  });
  if (diff) {
    state.diffsByDocId.set(doc.id, diff);
    currentReview = { doc, diff };
  } else {
    state.diffsByDocId.delete(doc.id);
    currentReview = null;
    diffPanelEl.hidden = true;
    diffPanelEl.textContent = "";
  }
  refreshView();
}

// Re-renders the table and apply summary only. Used while the library is still
// being scanned, so incoming suggestions don't wipe an open diff panel / PDF.
function refreshTable() {
  renderReviewTable({
    tbody,
    documents: state.documents,
    diffsByDocId: state.diffsByDocId,
    showAll: showAllToggle.checked,
    authorNames,
    onRowClick: openReview,
  });

  const changes = getAcceptedChanges();
  renderApplySummary(applySummaryEl, changes);
  applyBtn.disabled = changes.length === 0;
}

// Full refresh including the diff panel. Only used on user actions (opening a
// document, accepting/rejecting), never on the background scan.
function refreshView() {
  refreshTable();
  if (currentReview) {
    renderDiffPanel(diffPanelEl, currentReview.doc, currentReview.diff, refreshView, recheckWithDoi);
  }
}

showAllToggle.addEventListener("change", refreshTable);

applyBtn.addEventListener("click", async () => {
  const changes = getAcceptedChanges();
  const confirmed = window.confirm(
    `Apply ${changes.length} document change(s) to your live Mendeley library now? This cannot be undone automatically — download a backup first if you're unsure.`
  );
  if (!confirmed) return;

  applyBtn.disabled = true;
  await applyChanges(changes, (results) => renderApplyProgress(applyProgressEl, results));
  refreshView();
});

downloadBackupBtn.addEventListener("click", downloadChangeLog);

// Computed one document at a time (not in parallel) to avoid bursting
// CrossRef with hundreds of simultaneous requests for a large library.
async function computeAllDiffs(documents) {
  journalMap = buildJournalCanonicalMap(documents);
  for (const doc of documents) {
    const diff = await computeDocumentDiff(doc, {
      journalSuggestion: journalMap.get(doc.id),
    });
    if (diff) {
      state.diffsByDocId.set(doc.id, diff);
      refreshTable();
    }
  }
}

function showError(message, offerReconnect) {
  statusEl.textContent = message;
  if (offerReconnect) {
    const reconnectBtn = document.createElement("button");
    reconnectBtn.textContent = "Reconnect to Mendeley";
    reconnectBtn.addEventListener("click", () => {
      clearToken();
      window.location.href = "index.html";
    });
    statusEl.append(" ", reconnectBtn);
  }
}

try {
  const docs = await fetchAllDocuments((count) => {
    statusEl.textContent = `Loading your library… ${count} documents fetched so far`;
  });
  state.documents = docs;

  if (docs.length === 0) {
    statusEl.textContent = "Your Mendeley library is empty — there's nothing to check.";
  } else {
    statusEl.textContent = `Loaded ${docs.length} documents. Checking for suggestions…`;
    table.hidden = false;
    refreshView();
    renderStylePanel(document.getElementById("style-panel"), docs);
    await computeAllDiffs(docs);
    statusEl.textContent = `Loaded ${docs.length} documents — ${state.diffsByDocId.size} have suggestions.`;
  }
} catch (err) {
  const expired = err.message.includes("session expired");
  showError(
    expired ? "Your Mendeley session expired." : `Something went wrong: ${err.message}`,
    expired
  );
}
