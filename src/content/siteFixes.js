(() => {
  const STYLE_URL = chrome.runtime.getURL("src/content/styles/site-fixes.css");

  const injectStyle = () => {
    if (document.querySelector(`link[href="${STYLE_URL}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = STYLE_URL;
    if (document.head) {
      document.head.appendChild(link);
    } else {
      document.documentElement.appendChild(link);
    }
  };

  injectStyle();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectStyle, { once: true });
  }
})();
