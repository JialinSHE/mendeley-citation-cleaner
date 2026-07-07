// PDF.js is loaded on demand from a CDN so the app keeps zero local
// dependencies. Pinned to the 4.x line via jsDelivr's version range.
const PDFJS_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4/build/pdf.min.mjs";
const PDFJS_WORKER_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4/build/pdf.worker.min.mjs";

let pdfjsLib = null;

async function loadPdfLib() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import(PDFJS_URL);
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
  return pdfjsLib;
}

// Renders the first page of a PDF blob into the container as a canvas. Authors
// are almost always on page 1, which is all we need for verification.
export async function renderFirstPage(container, blob) {
  const lib = await loadPdfLib();
  const data = await blob.arrayBuffer();
  const pdf = await lib.getDocument({ data }).promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 1.3 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.className = "pdf-canvas";

  await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;

  container.innerHTML = "";
  container.appendChild(canvas);
}
