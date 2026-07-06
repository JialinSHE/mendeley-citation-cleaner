# Privacy

This tool is a static web page with **no backend server**. There is nowhere for your data to go except:

- **Mendeley** (`api.mendeley.com`) — you log in directly with Mendeley, using Mendeley's own login page. This tool never sees your password. After login, Mendeley gives your browser a temporary access token (valid for about an hour), which is kept only in your browser's `sessionStorage` — it's cleared when you close the tab and is never sent anywhere except back to Mendeley's API.
- **CrossRef** (`api.crossref.org`) — a free, public metadata lookup service. This tool sends it only the parts of a citation needed to look up canonical metadata (e.g. a DOI, or a title/author/year for search) — never your Mendeley login or token.

Nothing you do in this tool is logged, stored, or sent to the tool's developer. No changes are made to your Mendeley library unless you explicitly click "Apply."
