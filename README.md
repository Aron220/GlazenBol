# GlazenBol Extension

Browser extension scaffold for bol.com that injects a collapsible control panel to manage filtering toggles.

## Structure

- `manifest.json` — Chrome MV3 manifest wired to bol.com.
- `src/background/index.js` — background service worker placeholder.
- `src/content/loader.js` — light content script that lazy-loads the real app.
- `src/content/main.js` — bootstraps the injected UI inside a shadow root.
- `src/content/filters/` — DOM filtering logic (e.g., merkloos brand filter).
- `src/content/ui/` — UI building blocks for the panel and floating button.
- `src/content/state/` — simple toggle store to keep UI state in sync.
- `src/content/utils/` — small DOM helpers.
- `src/content/styles/panel.css` — isolated styles for the injected panel.
- `src/shared/` — shared constants across background/content.

## Running

1) In Chrome/Edge, open `chrome://extensions` and enable **Developer mode**.  
2) Click **Load unpacked** and select this project folder (it must contain `manifest.json`).  
3) Visit bol.com and you should see the panel anchored at bottom-right. Collapse it to reveal the floating button.

## Next steps

- Wire toggles to real filtering logic on the page.
- Persist toggle state with `chrome.storage.sync`.
- Add icons and polish copy as product direction settles.

Note: manifest is MV2 for Firefox temporary installs; upgrade to MV3 when targeting Chromium-only.
