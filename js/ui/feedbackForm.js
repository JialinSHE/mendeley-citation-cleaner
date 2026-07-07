import { FORMSPREE_ENDPOINT } from "../config.js";

function labelledInput(labelText, element) {
  const label = document.createElement("label");
  label.className = "feedback-row";
  const span = document.createElement("span");
  span.textContent = labelText;
  label.append(span, element);
  return label;
}

// A small in-page feedback form that submits directly to Formspree (no backend
// of our own). Hidden entirely when no endpoint is configured.
export function renderFeedbackForm(container) {
  container.innerHTML = "";
  if (!FORMSPREE_ENDPOINT) return;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.textContent = "💬 Send feedback";

  const panel = document.createElement("div");
  panel.className = "feedback-panel";
  panel.hidden = true;
  toggle.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
  });

  const form = document.createElement("form");

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.name = "name";

  const usageInput = document.createElement("input");
  usageInput.type = "text";
  usageInput.name = "usage";

  const messageInput = document.createElement("textarea");
  messageInput.name = "message";
  messageInput.rows = 4;
  messageInput.required = true;

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "Send";

  const statusEl = document.createElement("p");
  statusEl.className = "feedback-status";
  statusEl.setAttribute("aria-live", "polite");

  form.append(
    labelledInput("Your name (optional)", nameInput),
    labelledInput("How you use this tool / your role (optional)", usageInput),
    labelledInput("Your feedback or the problem you hit", messageInput),
    submit,
    statusEl
  );

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!messageInput.value.trim()) {
      statusEl.textContent = "Please write your feedback before sending.";
      return;
    }
    submit.disabled = true;
    statusEl.textContent = "Sending…";
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameInput.value,
          usage: usageInput.value,
          message: messageInput.value,
        }),
      });
      if (res.ok) {
        statusEl.textContent = "Thanks! Your feedback was sent.";
        form.reset();
      } else {
        statusEl.textContent = "Sorry, that didn't send. Please try again later.";
      }
    } catch {
      statusEl.textContent = "Couldn't send (network error). Please try again later.";
    } finally {
      submit.disabled = false;
    }
  });

  panel.appendChild(form);
  container.append(toggle, panel);
}
