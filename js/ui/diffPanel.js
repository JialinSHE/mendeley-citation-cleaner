import { getDecision, setDecision } from "../state.js";
import { fieldLabel } from "../correction/diffEngine.js";
import { TIER, TIER_LABEL } from "../correction/confidenceTiers.js";
import { fetchDocumentPdfBlob } from "../mendeleyApi.js";
import { renderFirstPage } from "./pdfViewer.js";
import { toTitleCase, toSentenceCase } from "../correction/titleCase.js";

// Quick-casing buttons for the title box, so the user can always pick the form
// they want regardless of what (if anything) was auto-suggested.
function renderCasingButtons(editInput) {
  const wrap = document.createElement("div");
  wrap.className = "casing-buttons";

  const sentenceBtn = document.createElement("button");
  sentenceBtn.type = "button";
  sentenceBtn.textContent = "Sentence case";
  sentenceBtn.addEventListener("click", () => {
    editInput.value = toSentenceCase(editInput.value);
    editInput.dispatchEvent(new Event("input"));
  });

  const titleBtn = document.createElement("button");
  titleBtn.type = "button";
  titleBtn.textContent = "Title Case";
  titleBtn.addEventListener("click", () => {
    editInput.value = toTitleCase(editInput.value);
    editInput.dispatchEvent(new Event("input"));
  });

  wrap.append(sentenceBtn, titleBtn);
  return wrap;
}

// Quick buttons to fill the journal box with CrossRef's full name or its
// abbreviation, so the user can choose which form to store.
function renderJournalButtons(editInput, info) {
  if (!info.journalFull && !info.journalAbbrev) return null;
  const wrap = document.createElement("div");
  wrap.className = "casing-buttons";

  if (info.journalFull) {
    const fullBtn = document.createElement("button");
    fullBtn.type = "button";
    fullBtn.textContent = "Use full name";
    fullBtn.title = info.journalFull;
    fullBtn.addEventListener("click", () => {
      editInput.value = info.journalFull;
      editInput.dispatchEvent(new Event("input"));
    });
    wrap.appendChild(fullBtn);
  }
  if (info.journalAbbrev) {
    const abbrevBtn = document.createElement("button");
    abbrevBtn.type = "button";
    abbrevBtn.textContent = "Use abbreviation";
    abbrevBtn.title = info.journalAbbrev;
    abbrevBtn.addEventListener("click", () => {
      editInput.value = info.journalAbbrev;
      editInput.dispatchEvent(new Event("input"));
    });
    wrap.appendChild(abbrevBtn);
  }
  return wrap;
}

const FIELD_ORDER = ["title", "authors", "doi", "journal", "year", "volume", "issue", "pages"];

function orderedFields(diff) {
  const known = FIELD_ORDER.filter((f) => diff.fields[f]);
  const rest = Object.keys(diff.fields).filter((f) => !FIELD_ORDER.includes(f));
  return [...known, ...rest];
}

export function renderDiffPanel(container, doc, diff, onDecisionChange, onRecheckDoi) {
  container.innerHTML = "";
  container.hidden = false;

  const heading = document.createElement("h2");
  heading.textContent = doc.title || "(untitled)";
  container.appendChild(heading);

  for (const field of orderedFields(diff)) {
    container.appendChild(
      renderFieldBlock(doc, field, diff.fields[field], onDecisionChange, onRecheckDoi)
    );
  }

  container.appendChild(renderPdfViewer(doc));
}

// Lets the user open the paper's attached PDF (first page) inside the panel to
// visually confirm authors before applying — the point of the "must review"
// merged-author flag. Whether the PDF loads depends on Mendeley allowing
// browser access to the file, so failures are shown as a plain message.
function renderPdfViewer(doc) {
  const wrapper = document.createElement("div");
  wrapper.className = "pdf-viewer";

  const button = document.createElement("button");
  button.textContent = "View attached PDF (to check authors)";

  const output = document.createElement("div");
  output.className = "pdf-output";

  button.addEventListener("click", async () => {
    button.disabled = true;
    output.textContent = "Loading the PDF from Mendeley…";
    try {
      const blob = await fetchDocumentPdfBlob(doc.id);
      await renderFirstPage(output, blob);
    } catch (err) {
      output.textContent =
        `Couldn't show the PDF here: ${err.message} ` +
        "(Mendeley may not allow opening files directly in the browser — if so, open the paper in Mendeley itself to check.)";
    } finally {
      button.disabled = false;
    }
  });

  wrapper.append(button, output);
  return wrapper;
}

function renderFieldBlock(doc, field, info, onDecisionChange, onRecheckDoi) {
  const block = document.createElement("div");
  block.className = info.verifyOnly ? "diff-field verify-field" : "diff-field";

  const label = document.createElement("h3");
  label.textContent = fieldLabel(field);
  if (info.verifyOnly) {
    const note = document.createElement("span");
    note.className = "verify-note";
    note.textContent = "no change suggested — check, and edit only if needed";
    label.append(" ", note);
  } else {
    const tierBadge = document.createElement("span");
    tierBadge.className = `tier-badge tier-${info.tier}`;
    tierBadge.textContent = TIER_LABEL[info.tier];
    label.append(" ", tierBadge);
  }
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
  currentLabel.textContent = info.verifyOnly ? "Stored value: " : "Current: ";
  currentP.appendChild(currentLabel);
  currentP.append(info.current);
  block.appendChild(currentP);

  // A verify-only, non-editable section (authors) is display only — nothing to
  // propose or accept.
  if (info.verifyOnly && !info.editable) {
    return block;
  }

  const proposedP = document.createElement("p");
  const proposedLabel = document.createElement("strong");
  proposedLabel.textContent = info.verifyOnly ? "Corrected value: " : "Proposed: ";
  proposedP.appendChild(proposedLabel);

  let getValue;
  if (info.editable) {
    const editInput = document.createElement("input");
    editInput.type = "text";
    const existingDecision = getDecision(doc.id, field);
    // Verify-only fields start from the real stored value (so a bad DOI is shown
    // and can be corrected); suggested fields start from the proposal.
    const initial = info.verifyOnly
      ? (typeof info.writeValue === "string" ? info.writeValue : "")
      : info.proposed;
    editInput.value =
      existingDecision && typeof existingDecision.value === "string"
        ? existingDecision.value
        : initial;
    proposedP.appendChild(editInput);
    getValue = () => editInput.value;

    // The title box gets one-click Sentence case / Title Case buttons so the
    // user can choose the form they want in their library.
    if (field === "title") {
      proposedP.appendChild(renderCasingButtons(editInput));
    }

    // The journal box gets "full name" / "abbreviation" buttons when CrossRef
    // provides both forms.
    if (field === "journal") {
      const journalButtons = renderJournalButtons(editInput, info);
      if (journalButtons) proposedP.appendChild(journalButtons);
    }

    // For fields we can verify against an external page (e.g. a DOI), show a
    // live link that opens the current value so the user can confirm it points
    // at the right paper.
    if (info.verifyUrlPrefix) {
      const verifyLink = document.createElement("a");
      verifyLink.target = "_blank";
      verifyLink.rel = "noopener";
      verifyLink.textContent = "↗ Open to check it's the right paper";
      verifyLink.className = "verify-link";
      const updateHref = () => {
        verifyLink.href = info.verifyUrlPrefix + editInput.value.trim();
      };
      updateHref();
      editInput.addEventListener("input", updateHref);
      proposedP.append(" ", verifyLink);
    }

    // On the DOI field, let the user re-run the analysis using the DOI they
    // typed, so all the other fields refresh from the correct record.
    if (field === "doi" && onRecheckDoi) {
      const recheckBtn = document.createElement("button");
      recheckBtn.type = "button";
      recheckBtn.className = "recheck-btn";
      recheckBtn.textContent = "Re-check details with this DOI";
      recheckBtn.addEventListener("click", () => {
        const value = editInput.value.trim();
        if (value) onRecheckDoi(doc, value);
      });
      proposedP.append(" ", recheckBtn);
    }
  } else {
    proposedP.append(info.proposed);
    getValue = () => info.writeValue;
  }
  block.appendChild(proposedP);

  if (!info.verifyOnly) {
    const sourceP = document.createElement("p");
    sourceP.className = "source-note";
    sourceP.textContent = `Source: ${info.source}`;
    block.appendChild(sourceP);
  }

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
