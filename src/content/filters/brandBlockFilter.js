import { BRAND_BLOCK_HIDDEN_ATTR } from "./visibility.js";
import { findListingRoot } from "../utils/listingDetection.js";
import { normalizeText, getCleanText } from "../utils/textUtils.js";
import { createVisibilityHelpers } from "../utils/visibilityHelpers.js";
import { ensureBlockButtonStyles, BLOCK_BUTTON_CLASS } from "../utils/blockButtonStyles.js";
import { TIMING } from "../utils/timing.js";
import { createDebouncedScanner } from "../utils/scheduling.js";

import { BRAND_LINK_SELECTOR } from "../utils/selectors.js";

function resolveButtonContainer(linkEl) {
  if (!linkEl) return null;
  if (linkEl.tagName === "A") {
    return linkEl.parentElement || linkEl;
  }
  return linkEl.parentElement || linkEl;
}

function updateBlockButton(button, { brandName, isBlocked }) {
  button.textContent = isBlocked ? "Geblokkeerd" : "Blokkeer";
  button.disabled = Boolean(isBlocked);
  button.setAttribute("data-bf-brand-name", brandName);
}

function ensureBlockButton({ container, brandName, isBlocked, onBlock }) {
  if (!container) return;
  let button = container.querySelector(`.${BLOCK_BUTTON_CLASS}`);
  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.className = BLOCK_BUTTON_CLASS;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const brand = button.getAttribute("data-bf-brand-name") || "";
      if (!brand) return;
      onBlock(brand);
    });
    container.appendChild(button);
  }
  updateBlockButton(button, { brandName, isBlocked });
}

export function createBrandBlockFilter({ store }) {
  let blockedBrands = new Set();
  const { hide, show } = createVisibilityHelpers(BRAND_BLOCK_HIDDEN_ATTR);

  const handleBlockBrand = (brandName) => {
    store.addBrand(brandName);
  };

  const scan = () => {
    ensureBlockButtonStyles();
    const hiddenListings = new Set();

    document.querySelectorAll(BRAND_LINK_SELECTOR).forEach((brandLink) => {
      const brandText = getCleanText(brandLink, BLOCK_BUTTON_CLASS);
      if (!brandText) return;

      const listing = findListingRoot(brandLink);
      if (!listing) return;

      const isBlocked = blockedBrands.has(normalizeText(brandText));
      const container = resolveButtonContainer(brandLink);
      ensureBlockButton({ container, brandName: brandText, isBlocked, onBlock: handleBlockBrand });

      if (isBlocked) {
        hiddenListings.add(listing);
        hide(listing);
      } else {
        show(listing);
      }
    });

    document.querySelectorAll(`[${BRAND_BLOCK_HIDDEN_ATTR}="true"]`).forEach((listing) => {
      if (!hiddenListings.has(listing)) {
        show(listing);
      }
    });
  };

  const { schedule: scheduleScan, clear: clearScan } = createDebouncedScanner(scan, TIMING.FILTER_SCAN_DEBOUNCE);

  const observer = new MutationObserver(() => {
    scheduleScan();
  });

  const observe = () => {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    });
    scheduleScan();
  };

  const unsubscribe = store.subscribe(({ normalized }) => {
    blockedBrands = normalized;
    scheduleScan();
  });

  const destroy = () => {
    observer.disconnect();
    unsubscribe();
    clearScan();
    document.querySelectorAll(`[${BRAND_BLOCK_HIDDEN_ATTR}="true"]`).forEach(show);
  };

  return {
    observe,
    destroy
  };
}
