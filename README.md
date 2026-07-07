# Mendeley Citation Cleaner

A free tool to batch-fix messy citation metadata already sitting in your Mendeley library — wrong author order, ALL-CAPS or all-lowercase titles, inconsistent journal name abbreviations, and missing DOIs — and to customize how your citations are displayed or exported.

## Use it (no installation)

👉 **https://jialinshe.github.io/mendeley-citation-cleaner/**

Open the link, click **Connect to Mendeley**, and log in with **your own** Mendeley
account. You log in on Mendeley's own page — this tool never sees your password,
and nothing in your library changes unless you review a suggestion and click
**Apply**. (Everything runs in your browser; there is no server storing anything.)

## Why

Mendeley's automatic metadata extraction from PDFs sometimes gets it wrong, especially on older or scanned papers. This tool connects to your own Mendeley library (with your permission, via Mendeley's official login), suggests corrections sourced from [CrossRef](https://www.crossref.org/), and lets you review and apply them — nothing is changed without your explicit approval.

## How it works (once built)

1. Log in with your Mendeley account (your credentials go directly to Mendeley — this tool never sees them).
2. The tool scans your library and looks up canonical metadata for each entry.
3. You review proposed corrections side by side with what's currently stored, and choose what to apply.
4. Optionally, customize how citations are displayed/exported (author list style, title case, journal abbreviation, per citation type).

## Privacy

See [PRIVACY.md](PRIVACY.md). Short version: this is a static web app with no backend — nothing about your library or your login ever touches a server other than Mendeley's and CrossRef's own.

## Self-hosting your own copy (developers)

You do **not** need to do any of this to *use* the tool — just open the link
above. This section is only for running your own copy or contributing.

Plain HTML/CSS/JavaScript, no build step, no dependencies required to run. See `CLAUDE.md` for the full architecture and build-order notes.

`js/config.js` in this repo is set up for the hosted version. To run your own,
you need your own Mendeley app:

1. Go to https://dev.mendeley.com/myapps.html and sign in with your Mendeley account.
2. Register a new application. For **Redirect URL**, use where `callback.html` will be served from — for local testing, `http://localhost:8000/callback.html`.
3. Copy the **Client ID** it gives you.
4. Edit `js/config.js` (or start from `js/config.example.js`) with your values:
   ```js
   export const MENDELEY_CLIENT_ID = "your-client-id-here";
   export const REDIRECT_URI = "http://localhost:8000/callback.html";
   export const CROSSREF_MAILTO = "you@example.com";
   ```
   The Client ID is a public value (safe to commit); there is no secret.

### Running locally

This is a static site — any local web server works (it can't be opened directly as a `file://` URL, because Mendeley's login redirect needs a real `http://` address). From this folder:

```
py tools/dev_server.py
```

(`tools/dev_server.py` is a small server that tells the browser not to cache files, so code changes always show on a normal reload. A plain `py -m http.server 8000` also works but may serve stale files after edits.)

Then open http://localhost:8000 in your browser.

## Features

- Log in with Mendeley and scan your whole library.
- Suggestions for **title, authors, DOI, journal, year, volume, issue, and pages**, sourced from [CrossRef](https://www.crossref.org/) (by DOI, or by a careful fuzzy title/author search for entries with no DOI).
- One-click **Sentence case / Title Case** buttons for titles.
- **Re-check with a corrected DOI**: fix a wrong DOI and refresh all the other details from the right record.
- Always-visible **DOI / Title / Authors** verification sections, plus a **"must review"** safety flag for suspected merged-PDF entries and colored **confidence tiers**.
- **View the attached PDF** in-app to confirm authors before applying.
- **Journal-name consistency** across your library (matched by ISSN).
- Review, accept/reject/edit, then **apply** — with a downloadable JSON backup of every change.
- A **citation style/export** panel: customize per-element formatting with a live preview and export a text bibliography.

Nothing is ever written to your library without your explicit review and Apply click.

Not built: applying your custom style to Word citations via CSL (Word citation styling is handled by Mendeley's own [CSL editor](https://www.mendeley.com/guides/csl-editor)).
