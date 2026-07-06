import { isLoggedIn, clearToken } from "./auth.js";
import { fetchAllDocuments } from "./mendeleyApi.js";
import { computeDocumentDiff } from "./correction/diffEngine.js";
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

function openReview(doc, diff) {
  currentReview = { doc, diff };
  refreshView();
}

function refreshView() {
  renderReviewTable({
    tbody,
    documents: state.documents,
    diffsByDocId: state.diffsByDocId,
    showAll: showAllToggle.checked,
    authorNames,
    onRowClick: openReview,
  });
  if (currentReview) {
    renderDiffPanel(diffPanelEl, currentReview.doc, currentReview.diff, refreshView);
  }

  const changes = getAcceptedChanges();
  renderApplySummary(applySummaryEl, changes);
  applyBtn.disabled = changes.length === 0;
}

showAllToggle.addEventListener("change", refreshView);

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
  for (const doc of documents) {
    const diff = await computeDocumentDiff(doc);
    if (diff) {
      state.diffsByDocId.set(doc.id, diff);
      refreshView();
    }
  }
}

try {
  const docs = await fetchAllDocuments((count) => {
    statusEl.textContent = `Loading your library… ${count} documents fetched so far`;
  });
  state.documents = docs;
  statusEl.textContent = `Loaded ${docs.length} documents. Checking for suggestions…`;
  table.hidden = false;
  refreshView();
  renderStylePanel(document.getElementById("style-panel"), docs);
  await computeAllDiffs(docs);
  statusEl.textContent = `Loaded ${docs.length} documents — ${state.diffsByDocId.size} have suggestions.`;
} catch (err) {
  statusEl.textContent = `Error: ${err.message}`;
}
