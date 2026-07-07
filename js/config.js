// Configuration for the hosted (GitHub Pages) version of this tool.
//
// MENDELEY_CLIENT_ID is a public OAuth client id — it is safe to be public
// (the implicit flow has no secret). End users log in with their own Mendeley
// account; this id only identifies the app.
//
// If you self-host your own copy: register your own app at
// https://dev.mendeley.com/myapps.html, set REDIRECT_URI to your own
// callback.html URL, and put your values here (see config.example.js).
export const MENDELEY_CLIENT_ID = "23944";
export const REDIRECT_URI = "https://jialinshe.github.io/mendeley-citation-cleaner/callback.html";

// Optional contact email sent to CrossRef for the faster "polite pool".
// Left blank on the public build to avoid publishing a personal address.
export const CROSSREF_MAILTO = "";

// Formspree endpoint for the in-app feedback form, e.g.
// "https://formspree.io/f/abcdwxyz". Sign up free at https://formspree.io,
// create a form, and paste its endpoint URL here. Leave blank to hide the form.
export const FORMSPREE_ENDPOINT = "https://formspree.io/f/xlgyvyar";
