# GlazenBol Extension

Browser extension scaffold for bol.com that injects a collapsible control panel to manage filtering toggles.

## Structure

- `manifest.json` — Firefox MV2 manifest wired to bol.com.
- `manifest.chrome.json` — Chrome MV3 manifest wired to bol.com.
- `src/background/index.js` — background script placeholder.
- `src/content/loader.js` — light content script that lazy-loads the real app.
- `src/content/main.js` — bootstraps the injected UI inside a shadow root.
- `src/content/filters/` — DOM filtering logic (e.g., merkloos brand filter).
- `src/content/ui/` — UI building blocks for the panel and floating button.
- `src/content/state/` — simple toggle store to keep UI state in sync.
- `src/content/utils/` — small DOM helpers.
- `src/content/styles/panel.css` — isolated styles for the injected panel.
- `src/shared/` — shared constants across background/content.

## Running

Firefox
1) In Firefox, open `about:debugging#/runtime/this-firefox` and click **Load Temporary Add-on**.  
2) Select this project folder (it must contain `manifest.json`).  
3) Visit bol.com and you should see the panel anchored at bottom-right. Collapse it to reveal the floating button.

Chrome
1) Copy `manifest.chrome.json` to `manifest.json`.  
2) In Chrome, open `chrome://extensions`, enable **Developer mode**, and click **Load unpacked**.  
3) Select this project folder. Visit bol.com and you should see the panel anchored at bottom-right.

## Builds

Chrome
1) Run `./scripts/build-chrome.sh` to generate `dist/chrome`.  
2) Zip the contents of `dist/chrome` for Chrome Web Store upload.

Firefox
1) Run `./scripts/build-firefox.sh` to generate `dist/firefox`.  
2) Zip the contents of `dist/firefox` for AMO upload.

## Next steps

- Wire toggles to real filtering logic on the page.
- Persist toggle state with `chrome.storage.sync`.
- Add icons and polish copy as product direction settles.

Note: `manifest.json` is MV2 for Firefox. Use `manifest.chrome.json` (MV3) when targeting Chromium-only.
