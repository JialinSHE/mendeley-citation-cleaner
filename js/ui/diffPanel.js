import { getDecision, setDecision } from "../state.js";
import { fieldLabel } from "../correction/diffEngine.js";
import { TIER, TIER_LABEL } from "../correction/confidenceTiers.js";

export function renderDiffPanel(container, doc, diff, onDecisionChange) {
  container.innerHTML = "";
  container.hidden = false;

  const heading = document.createElement("h2");
  heading.textContent = doc.title || "(untitled)";
  container.appendChild(heading);

  for (const [field, info] of Object.entries(diff.fields)) {
    container.appendChild(renderFieldBlock(doc, field, info, onDecisionChange));
  }
}

function renderFieldBlock(doc, field, info, onDecisionChange) {
  const block = document.createElement("div");
  block.className = "diff-field";

  const label = document.createElement("h3");
  label.textContent = fieldLabel(field);
  const tierBadge = document.createElement("span");
  tierBadge.className = `tier-badge tier-${info.tier}`;
  tierBadge.textContent = TIER_LABEL[info.tier];
  label.append(" ", tierBadge);
  block.appendChild(label);

  if (info.risk.includes("merged-authors")) {
    const warning = document.createElement("p");
    warning.className = "risk-warning";
    warning.textContent =
      "⚠ This looks like it may be two different papers merged into one PDF (the author list changed dramatically). Please open the PDF in Mendeley and confirm the correct authors before applying.";
    block.appendChild(warning);
  }

  const currentP = document.createElement("p");
  const currentLabel = document.createElement("strong");
  currentLabel.textContent = "Current: ";
  currentP.appendChild(currentLabel);
  currentP.append(info.current);
  block.appendChild(currentP);

  const proposedP = document.createElement("p");
  const proposedLabel = document.createElement("strong");
  proposedLabel.textContent = "Proposed: ";
  proposedP.appendChild(proposedLabel);

  let getValue;
  if (info.editable) {
    const editInput = document.createElement("input");
    editInput.type = "text";
    const existingDecision = getDecision(doc.id, field);
    editInput.value =
      existingDecision && typeof existingDecision.value === "string"
        ? existingDecision.value
        : info.proposed;
    proposedP.appendChild(editInput);
    getValue = () => editInput.value;
  } else {
    proposedP.append(info.proposed);
    getValue = () => info.writeValue;
  }
  block.appendChild(proposedP);

  const sourceP = document.createElement("p");
  sourceP.className = "source-note";
  sourceP.textContent = `Source: ${info.source}`;
  block.appendChild(sourceP);

  const acceptBtn = document.createElement("button");
  acceptBtn.textContent = "Accept";
  acceptBtn.addEventListener("click", () => {
    setDecision(doc.id, field, { action: "accept", value: getValue() });
    onDecisionChange();
  });

  const rejectBtn = document.createElement("button");
  rejectBtn.textContent = "Reject";
  rejectBtn.addEventListener("click", () => {
    setDecision(doc.id, field, { action: "reject", value: null });
    onDecisionChange();
  });

  const statusSpan = document.createElement("span");
  statusSpan.className = "decision-status";
  const decision = getDecision(doc.id, field);
  statusSpan.textContent = decision ? decision.action : "pending";

  const controls = document.createElement("div");
  controls.append(acceptBtn, rejectBtn, statusSpan);
  block.appendChild(controls);

  return block;
}
