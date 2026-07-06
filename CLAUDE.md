# CLAUDE.md — Mendeley Citation Cleaner

Behavioral guidelines to reduce common LLM coding mistakes, merged with this project's specifics.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Project: what this is

A tool that batch-corrects messy citation metadata already sitting in a Mendeley library (wrong author order/merged authors, ALL CAPS or all-lowercase titles, inconsistent journal abbreviations, missing DOIs), and separately lets the user customize how citations are *displayed/exported* (per-element formatting: author list style, title case, journal abbreviation, per citation type — article/book/review). Meant to eventually be usable by other Mendeley users, not just the original author — plain language, no jargon, in explanations to the user, since they're new to coding.

Full architecture, milestones, and rationale live in the plan this project was built from: `C:\Users\windows\.claude\plans\i-would-like-to-lovely-lantern.md`. Read that before making structural changes.

## Architecture (short version)

- **Static client-only web app.** Plain HTML/CSS/vanilla JS (ES modules). No backend, no build step, no bundler. Hosted on GitHub Pages.
- **Auth**: Mendeley OAuth **Implicit flow only** — Mendeley's Authorization Code flow requires a client secret with no PKCE support, which can't be done safely from browser JS. Implicit tokens last ~1 hour, no refresh token, no expiry reported — detect via 401, prompt "Reconnect to Mendeley."
- **Data sources**: Mendeley API (`/documents` read+PATCH, `/catalog`) for the user's own library; CrossRef API (`api.crossref.org`, free, no auth) as the primary ground-truth source for author names, titles, journals, DOIs.
- **Safety rule that must never be violated**: no write to a user's Mendeley library happens without an explicit per-batch or per-document "Apply" click. Suspected merged-author cases and low-confidence matches are never auto-suggested for batch-accept — see `js/correction/confidenceTiers.js`.

## Folder layout

- `index.html` — login screen. `callback.html` — OAuth redirect target (parses token from URL fragment). `app.html` — main app shell.
- `js/config.js` — the only "settings" file: `CLIENT_ID` (public, safe under Implicit flow) and a CrossRef `mailto` contact.
- `js/auth.js` — auth URL construction, fragment parsing, token/expiry handling.
- `js/mendeleyApi.js` — `fetchAllDocuments()` (pagination via `Link` headers), `patchDocument()`.
- `js/crossrefApi.js` — `lookupByDoi()`, `searchByTitleAuthor()`, response caching, always sends `mailto` + descriptive `User-Agent`.
- `js/correction/` — the data-fixing pipeline: `titleCase.js`, `authorMatch.js` (includes the merged-author heuristic), `journalNormalize.js`, `diffEngine.js` (builds the per-document diff object), `confidenceTiers.js` (auto-suggested / needs-review / must-review gating — the file that encodes "never silently overwrite").
- `js/style/` — the display/export formatting layer, independent of the correction pipeline: `templates.js` (per-citation-type placeholder templates), `formatters.js` (per-element formatting functions), `stylePanel.js` (settings UI + live preview + `localStorage` save/load).
- `js/ui/` — `reviewTable.js`, `diffPanel.js`, `applyFlow.js`.
- `js/state.js` — in-memory app state (fetched documents, diffs, session change log for the backup/undo safety net).
- `tests/` — plain assertions run via `node --test`, no test framework needed.
- `tools/local_fallback.py` — optional local script for power users who'd rather run Auth Code flow with their own client credentials on their own machine. Not the main distributed product — don't invest effort here until the main app (through M6 at least) is solid.

## Build order

Follow the milestone order in the plan file (M1 → M8): OAuth login + read-only fetch, then CrossRef+title-case diff (read-only), then the review UI (still read-only), then write-back, then the style/export layer, then the remaining correction types (fuzzy DOI, author order, journal clustering, full risk tiering), then the PDF-side-by-side viewer (deliberately deferred — significant extra scope, only start once the core tool is in real use), then public-distribution polish. Each milestone should be a working, demoable state — don't jump ahead to write-back (M4) before the read-only milestones (M1–M3) are solid and reviewed.

## Known scope boundaries (don't drift past these without asking)

- The style/export layer (`js/style/`) is a personal formatter/exporter with a small fixed set of options per element (2–4 choices) and a handful of citation types — not a full CSL (Citation Style Language) reimplementation. If the fixed set turns out to be insufficient, ask before expanding it into a rule engine.
- The PDF viewer (M7) needs in-browser PDF rendering (e.g. PDF.js) and is intentionally out of scope until the core correction tool (M1–M6) has been used for real and the specific cases that need visual verification are known.
- Never register a second Mendeley application/`client_id` for this project without discussing it — Mendeley's terms discourage multiple apps for overlapping use cases.
