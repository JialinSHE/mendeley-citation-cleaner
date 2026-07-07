import { getDecision } from "../state.js";
import { fieldLabel } from "../correction/diffEngine.js";
import { documentTier, TIER_LABEL } from "../correction/confidenceTiers.js";

export function renderReviewTable({ tbody, documents, diffsByDocId, showAll, authorNames, onRowClick }) {
  tbody.innerHTML = "";
  for (const doc of documents) {
    const diff = diffsByDocId.get(doc.id);
    if (!diff && !showAll) continue;

    const row = document.createElement("tr");

    const titleCell = document.createElement("td");
    titleCell.textContent = doc.title || "(untitled)";

    const authorsCell = document.createElement("td");
    authorsCell.textContent = authorNames(doc);

    const yearCell = document.createElement("td");
    yearCell.textContent = doc.year || "—";

    const issuesCell = document.createElement("td");
    if (diff) {
      const tier = documentTier(diff);
      const badge = document.createElement("span");
      badge.className = `tier-badge tier-${tier}`;
      badge.textContent = TIER_LABEL[tier];
      issuesCell.appendChild(badge);
      const fieldText = document.createElement("span");
      fieldText.textContent =
        " " +
        Object.entries(diff.fields)
          .filter(([, info]) => !info.verifyOnly)
          .map(([field]) => {
            const decision = getDecision(doc.id, field);
            return decision ? `${fieldLabel(field)} (${decision.action})` : fieldLabel(field);
          })
          .join(", ");
      issuesCell.appendChild(fieldText);
    } else {
      issuesCell.textContent = "—";
    }

    row.append(titleCell, authorsCell, yearCell, issuesCell);

    if (diff) {
      row.classList.add("flagged-row");
      row.addEventListener("click", () => onRowClick(doc, diff));
    }

    tbody.appendChild(row);
  }
}
