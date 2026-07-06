import { MENDELEY_CLIENT_ID, REDIRECT_URI } from "./config.js";

const AUTHORIZE_URL = "https://api.mendeley.com/oauth/authorize";
const TOKEN_KEY = "mendeley_access_token";
const STATE_KEY = "mendeley_oauth_state";

export function buildAuthUrl() {
  const state = crypto.randomUUID();
  sessionStorage.setItem(STATE_KEY, state);
  const params = new URLSearchParams({
    client_id: MENDELEY_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "token",
    scope: "all",
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

// Mendeley's implicit flow puts the token in the URL fragment, not a query
// string, so it's never sent to any server. It also reports no expiry time,
// so token validity is only ever discovered reactively via a 401 response.
export function handleCallback() {
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const token = fragment.get("access_token");
  const state = fragment.get("state");
  const expectedState = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);

  if (!token || !expectedState || state !== expectedState) {
    throw new Error("Login didn't complete correctly (missing token or state mismatch). Please try again.");
  }

  sessionStorage.setItem(TOKEN_KEY, token);
  history.replaceState(null, "", window.location.pathname);
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn() {
  return Boolean(getToken());
}
