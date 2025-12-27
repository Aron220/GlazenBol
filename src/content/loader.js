(() => {
  const entryUrl = chrome.runtime.getURL("src/content/main.js");
  import(entryUrl).catch((err) => {
    console.error("Bol Filter failed to load", err);
  });
})();
