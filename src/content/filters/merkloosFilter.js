import { MERKLOOS_HIDDEN_ATTR } from "./visibility.js";
import { findListingRoot } from "../utils/listingDetection.js";
import { normalizeText } from "../utils/textUtils.js";
import { createVisibilityHelpers } from "../utils/visibilityHelpers.js";
import { TIMING } from "../utils/timing.js";
import { createDebouncedScanner } from "../utils/scheduling.js";

import { BRAND_LINK_SELECTOR, PRODUCT_LINK_SELECTOR } from "../utils/selectors.js";

function isMerkloos(text) {
  const normalized = normalizeText(text);
  return normalized.includes("merkloos") || normalized.includes("sans marque");
}

function getBrandText(listingEl) {
  const brandLink = listingEl.querySelector(BRAND_LINK_SELECTOR);
  if (!brandLink) return "";
  return brandLink.textContent || "";
}

export function createMerkloosFilter() {
  let enabled = true;
  const { hide, show } = createVisibilityHelpers(MERKLOOS_HIDDEN_ATTR);

  const scan = () => {
    const hiddenListings = new Set();
    const productLinks = document.querySelectorAll(PRODUCT_LINK_SELECTOR);

    productLinks.forEach((productLink) => {
      const listing = findListingRoot(productLink);
      if (!listing) return;

      const brandText = getBrandText(listing);
      const shouldHide = enabled && isMerkloos(brandText);

      if (shouldHide) {
        hiddenListings.add(listing);
        hide(listing);
      } else {
        show(listing);
      }
    });

    // Clean up any listings that are no longer hidden
    document.querySelectorAll(`[${MERKLOOS_HIDDEN_ATTR}="true"]`).forEach((listing) => {
      if (!enabled || !hiddenListings.has(listing)) {
        show(listing);
      }
    });
  };

  const { schedule: scheduleScan, clear: clearScan } = createDebouncedScanner(scan, TIMING.FILTER_SCAN_DEBOUNCE);

  const observer = new MutationObserver(() => {
    scheduleScan();
  });

  const observe = () => {
    observer.observe(document.body, { childList: true, subtree: true });
    scheduleScan();
  };

  const setEnabled = (next) => {
    enabled = Boolean(next);
    scheduleScan();
  };

  const destroy = () => {
    observer.disconnect();
    clearScan();
    document.querySelectorAll(`[${MERKLOOS_HIDDEN_ATTR}="true"]`).forEach(show);
  };

  return {
    observe,
    setEnabled,
    destroy
  };
}
