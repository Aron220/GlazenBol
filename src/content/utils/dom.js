export function createElement(tag, options = {}) {
  const el = document.createElement(tag);
  const { className, text, attrs } = options;
  if (className) el.className = className;
  if (text) el.textContent = text;
  if (attrs) {
    Object.entries(attrs).forEach(([key, value]) => {
      el.setAttribute(key, value);
    });
  }
  return el;
}

export function injectStylesheet(shadowRoot, href) {
  return new Promise((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.addEventListener("load", () => resolve(true), { once: true });
    link.addEventListener("error", () => resolve(false), { once: true });
    shadowRoot.appendChild(link);
  });
}
