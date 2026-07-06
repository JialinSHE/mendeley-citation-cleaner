import { formatDocument } from "./templates.js";

const STORAGE_KEY = "mendeley_citation_style";

const DEFAULT_STYLE = {
  authorStyle: "full",
  titleStyle: "as-stored",
  yearStyle: "year-only",
  doiStyle: "bare",
};

function loadStyle() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_STYLE, ...JSON.parse(raw) } : { ...DEFAULT_STYLE };
  } catch {
    return { ...DEFAULT_STYLE };
  }
}

function saveStyle(style) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(style));
}

function exportBibliography(documents, style) {
  const text = documents.map((doc) => formatDocument(doc, style)).join("\n\n");
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bibliography.txt";
  a.click();
  URL.revokeObjectURL(url);
}

function makeSelect(labelText, options, selectedValue, onChange) {
  const wrapper = document.createElement("label");
  wrapper.textContent = `${labelText}: `;
  const select = document.createElement("select");
  for (const [value, text] of options) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = text;
    if (value === selectedValue) opt.selected = true;
    select.appendChild(opt);
  }
  select.addEventListener("change", () => onChange(select.value));
  wrapper.appendChild(select);
  return wrapper;
}

export function renderStylePanel(container, documents) {
  let style = loadStyle();
  container.innerHTML = "";

  const form = document.createElement("div");
  form.className = "style-form";

  form.appendChild(
    makeSelect(
      "Author list",
      [
        ["full", "Full list"],
        ["first-et-al", "First author et al."],
        ["first-and-second", "First & second (if exactly 2 authors)"],
      ],
      style.authorStyle,
      (value) => updateStyle({ authorStyle: value })
    )
  );

  form.appendChild(
    makeSelect(
      "Title case",
      [
        ["as-stored", "As stored"],
        ["sentence-case", "Sentence case"],
        ["title-case", "Title Case"],
      ],
      style.titleStyle,
      (value) => updateStyle({ titleStyle: value })
    )
  );

  form.appendChild(
    makeSelect(
      "Year format",
      [
        ["year-only", "Year only"],
        ["full-date", "Full date (if available)"],
      ],
      style.yearStyle,
      (value) => updateStyle({ yearStyle: value })
    )
  );

  form.appendChild(
    makeSelect(
      "DOI display",
      [
        ["bare", "Bare DOI"],
        ["link", "Full https://doi.org/ link"],
      ],
      style.doiStyle,
      (value) => updateStyle({ doiStyle: value })
    )
  );

  container.appendChild(form);

  const previewHeading = document.createElement("h3");
  previewHeading.textContent = "Preview (first 5 documents)";
  container.appendChild(previewHeading);

  const previewList = document.createElement("ul");
  container.appendChild(previewList);

  const exportBtn = document.createElement("button");
  exportBtn.textContent = "Export Formatted Bibliography (.txt)";
  exportBtn.addEventListener("click", () => exportBibliography(documents, style));
  container.appendChild(exportBtn);

  function updateStyle(patch) {
    style = { ...style, ...patch };
    saveStyle(style);
    renderPreview();
  }

  function renderPreview() {
    previewList.innerHTML = "";
    for (const doc of documents.slice(0, 5)) {
      const item = document.createElement("li");
      item.textContent = formatDocument(doc, style);
      previewList.appendChild(item);
    }
  }

  renderPreview();
}
