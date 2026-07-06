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
