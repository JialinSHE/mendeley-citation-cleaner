import { handleCallback } from "./auth.js";

const statusEl = document.getElementById("status");

try {
  handleCallback();
  window.location.href = "app.html";
} catch (err) {
  statusEl.textContent = `Login failed: ${err.message}`;
}
