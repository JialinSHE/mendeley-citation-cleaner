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
4. Open `js/config.js` and fill in:
   ```js
   export const MENDELEY_CLIENT_ID = "your-client-id-here";
   export const REDIRECT_URI = "http://localhost:8000/callback.html";
   ```

### Running locally

This is a static site — any local web server works (it can't be opened directly as a `file://` URL, because Mendeley's login redirect needs a real `http://` address). From this folder:

```
py -m http.server 8000
```

Then open http://localhost:8000 in your browser.

### Current status

- **M1 (done)**: log in with Mendeley, fetch your whole library (handles pagination), display title/authors/year in a table.
- Everything else in the plan (correction suggestions, review UI, write-back, citation style customization, etc.) is not built yet.
