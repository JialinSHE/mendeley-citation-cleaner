# Mendeley Citation Cleaner

A free tool to batch-fix messy citation metadata already sitting in your Mendeley library — wrong author order, ALL-CAPS or all-lowercase titles, inconsistent journal name abbreviations, and missing DOIs — and to customize how your citations are displayed or exported.

> Status: early development. Not yet usable end-to-end.

## Why

Mendeley's automatic metadata extraction from PDFs sometimes gets it wrong, especially on older or scanned papers. This tool connects to your own Mendeley library (with your permission, via Mendeley's official login), suggests corrections sourced from [CrossRef](https://www.crossref.org/), and lets you review and apply them — nothing is changed without your explicit approval.

## How it works (once built)

1. Log in with your Mendeley account (your credentials go directly to Mendeley — this tool never sees them).
2. The tool scans your library and looks up canonical metadata for each entry.
3. You review proposed corrections side by side with what's currently stored, and choose what to apply.
4. Optionally, customize how citations are displayed/exported (author list style, title case, journal abbreviation, per citation type).

## Privacy

See [PRIVACY.md](PRIVACY.md). Short version: this is a static web app with no backend — nothing about your library or your login ever touches a server other than Mendeley's and CrossRef's own.

## Development

Plain HTML/CSS/JavaScript, no build step, no dependencies required to run. See `CLAUDE.md` for the full architecture and build-order notes.

### One-time setup: register the app with Mendeley

1. Go to https://dev.mendeley.com/myapps.html and sign in with your Mendeley account.
2. Register a new application. For **Redirect URL**, use where `callback.html` will be served from — for local testing, `http://localhost:8000/callback.html`.
3. Copy the **Client ID** it gives you.
4. Copy `js/config.example.js` to `js/config.js`, then fill in your values:
   ```js
   export const MENDELEY_CLIENT_ID = "your-client-id-here";
   export const REDIRECT_URI = "http://localhost:8000/callback.html";
   export const CROSSREF_MAILTO = "you@example.com";
   ```
   (`js/config.js` is git-ignored, so your details are never committed.)

### Running locally

This is a static site — any local web server works (it can't be opened directly as a `file://` URL, because Mendeley's login redirect needs a real `http://` address). From this folder:

```
py tools/dev_server.py
```

(`tools/dev_server.py` is a small server that tells the browser not to cache files, so code changes always show on a normal reload. A plain `py -m http.server 8000` also works but may serve stale files after edits.)

Then open http://localhost:8000 in your browser.

### Current status

Done and working end-to-end:

- **M1** — log in with Mendeley, fetch your whole library (handles pagination).
- **M2** — title suggestions from CrossRef (by DOI) and local ALL-CAPS/all-lowercase fixes.
- **M3** — review table (flagged docs only) with a per-field before/after diff panel; accept, reject, or edit each suggestion.
- **M4** — apply accepted changes back to Mendeley, with a confirmation step, per-document progress, and a downloadable JSON backup of every change.
- **M5** — citation style/export panel: customize per-element formatting with a live preview and export a text bibliography.
- **M6** — author-name correction (from CrossRef), a "must review" safety flag for suspected merged-PDF entries, confidence tiers (colored badges), missing-DOI lookup via CrossRef search, and journal-name consistency across the library.

Not built yet: applying the custom style to Word citations via CSL (approach undecided), a PDF side-by-side author-verification view, and final polish for public hosting.
