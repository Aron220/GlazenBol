import { createElement } from "../utils/dom.js";

const TOAST_ID = "bol-filter-bubble-notification";
const DEFAULT_TIMEOUT_MS = 5000;

let hideTimer = null;

export function hideEmptyPageToast({ root } = {}) {
  const container = root || document.body;
  const toast = container.querySelector(`#${TOAST_ID}`);
  if (!toast) return;

  toast.classList.remove("visible");

  if (hideTimer) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }

  window.setTimeout(() => {
    toast.remove();
  }, 240);
}

export function showEmptyPageToast({ root, message, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (!message) return;

  const container = root || document.body;
  let toast = container.querySelector(`#${TOAST_ID}`);

  if (!toast) {
    toast = createElement("div", {
      className: "bf-empty-toast",
      text: message,
      attrs: { id: TOAST_ID, role: "status" }
    });
    container.appendChild(toast);
  } else {
    toast.textContent = message;
  }

  toast.classList.remove("visible");
  void toast.offsetWidth;
  toast.classList.add("visible");

  if (hideTimer) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }

  hideTimer = window.setTimeout(() => {
    toast.classList.remove("visible");
    window.setTimeout(() => {
      toast.remove();
    }, 240);
  }, timeoutMs);
}
