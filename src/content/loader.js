(() => {
  const entryUrl = chrome.runtime.getURL("src/content/main.js");
  import(entryUrl).catch((err) => {
    console.error("GlazenBol failed to load", err);
  });
})();
