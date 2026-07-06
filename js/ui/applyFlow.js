import { state, setDecision } from "../state.js";
import { patchDocument } from "../mendeleyApi.js";
import { fieldLabel } from "../correction/diffEngine.js";

export function getAcceptedChanges() {
  const changes = [];
  for (const doc of state.documents) {
    const decisions = state.decisionsByDocId.get(doc.id);
    const diff = state.diffsByDocId.get(doc.id);
    if (!decisions || !diff) continue;

    const fields = {};
    for (const [field, decision] of Object.entries(decisions)) {
      if (decision.action === "accept") {
        fields[field] = decision.value;
      }
    }
    if (Object.keys(fields).length > 0) {
      changes.push({ doc, fields, diff });
    }
  }
  return changes;
}

export function renderApplySummary(container, changes) {
  container.innerHTML = "";

  if (changes.length === 0) {
    container.textContent = "No accepted changes yet — accept a suggestion above first.";
    return;
  }

  const fieldCount = changes.reduce((sum, c) => sum + Object.keys(c.fields).length, 0);
  const summary = document.createElement("p");
  summary.textContent = `${changes.length} document(s) will be updated (${fieldCount} field change(s) total).`;
  container.appendChild(summary);

  const list = document.createElement("ul");
  for (const { doc, fields } of changes) {
    const item = document.createElement("li");
    item.textContent = `${doc.title || "(untitled)"} — ${Object.keys(fields).map(fieldLabel).join(", ")}`;
    list.appendChild(item);
  }
  container.appendChild(list);
}

export async function applyChanges(changes, onProgress) {
  const results = [];
  for (const { doc, fields, diff } of changes) {
    try {
      const updatedDoc = await patchDocument(doc.id, fields);

      for (const field of Object.keys(fields)) {
        state.changeLog.push({
          documentId: doc.id,
          title: doc.title,
          field,
          previousValue: diff.fields[field].current,
          newValue: fields[field],
          appliedAt: new Date().toISOString(),
        });
        setDecision(doc.id, field, { action: "applied", value: fields[field] });
      }

      const idx = state.documents.findIndex((d) => d.id === doc.id);
      if (idx !== -1) state.documents[idx] = updatedDoc;

      results.push({ doc, status: "success" });
    } catch (err) {
      results.push({ doc, status: "error", message: err.message });
    }
    if (onProgress) onProgress([...results]);
  }
  return results;
}

export function renderApplyProgress(container, results) {
  container.innerHTML = "";
  const list = document.createElement("ul");
  for (const { doc, status, message } of results) {
    const item = document.createElement("li");
    item.textContent = `${doc.title || "(untitled)"} — ${status}${message ? `: ${message}` : ""}`;
    list.appendChild(item);
  }
  container.appendChild(list);
}

export function downloadChangeLog() {
  const blob = new Blob([JSON.stringify(state.changeLog, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mendeley-citation-cleaner-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
