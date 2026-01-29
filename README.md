# GlazenBol Extension

Browser extension for bol.com that injects a collapsible control panel to clean up search results, block sellers/brands, and set a default sort order.

## Features

- Filter sponsored listings, ad blocks, and "merkloos" products.
- Optional filters for "Goede/Duurzame keuze" only and "Verkoop door bol".
- Block specific sellers and brands directly from listings, with a manage view in the panel.
- Default sort preference persisted in extension storage.
- Empty-page toast when filters remove too many results.
- First-run welcome overlay and floating reopen button when the panel is collapsed.

## Structure

- `manifest.json` — Firefox MV2 manifest wired to bol.com.
- `manifest.chrome.json` — Chrome MV3 manifest wired to bol.com.
- `src/background/index.js` — background script placeholder.
- `src/content/loader.js` — light content script that lazy-loads the real app.
- `src/content/main.js` — bootstraps the injected UI inside a shadow root.
- `src/content/filters/` — DOM filters (sponsored listings, ads, merkloos, Goede Keuze, verkoop door bol, seller/brand blocking).
- `src/content/ui/` — panel, floating button, welcome overlay, empty-page toast.
- `src/content/state/` — stores for toggles, blocked sellers, blocked brands.
- `src/content/utils/` — DOM helpers and storage wrapper.
- `src/content/styles/panel.css` — isolated styles for the injected panel.
- `src/shared/constants.js` — toggle metadata, storage keys, default sort options.

## Running

Firefox
1) In Firefox, open `about:debugging#/runtime/this-firefox` and click **Load Temporary Add-on**.  
2) Select this project folder (it must contain `manifest.json`).  
3) Visit bol.com and you should see the panel anchored at bottom-right. Collapse it to reveal the floating button.

Chrome
1) Copy `manifest.chrome.json` to `manifest.json` or run `./scripts/build-chrome.sh`.  
2) In Chrome, open `chrome://extensions`, enable **Developer mode**, and click **Load unpacked**.  
3) Select this project folder (or `dist/chrome`). Visit bol.com and you should see the panel anchored at bottom-right.

## Builds

Chrome
1) Run `./scripts/build-chrome.sh` to generate `dist/chrome`.  
2) Zip the contents of `dist/chrome` for Chrome Web Store upload.

Firefox
1) Run `./scripts/build-firefox.sh` to generate `dist/firefox`.  
2) Zip the contents of `dist/firefox` for AMO upload.

## Next steps

- Extend filter coverage as bol.com layout changes.
- Add release automation for the Chrome Web Store and AMO.

Note: `manifest.json` is MV2 for Firefox. Use `manifest.chrome.json` (MV3) when targeting Chromium-only.
