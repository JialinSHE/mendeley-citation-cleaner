import { MENDELEY_CLIENT_ID, REDIRECT_URI } from "./config.js";
import { buildAuthUrl, isLoggedIn } from "./auth.js";
import { renderFeedbackForm } from "./ui/feedbackForm.js";

if (isLoggedIn()) {
  window.location.href = "app.html";
}

renderFeedbackForm(document.getElementById("feedback-container"));

const connectBtn = document.getElementById("connect-btn");
const errorMsg = document.getElementById("error-msg");

if (!MENDELEY_CLIENT_ID || !REDIRECT_URI) {
  errorMsg.textContent = "Set MENDELEY_CLIENT_ID and REDIRECT_URI in js/config.js before this will work (see README).";
  errorMsg.hidden = false;
  connectBtn.disabled = true;
} else {
  connectBtn.addEventListener("click", () => {
    window.location.href = buildAuthUrl();
  });
}
