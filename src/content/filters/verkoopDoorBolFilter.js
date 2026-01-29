import { VERKOOP_DOOR_BOL_HIDDEN_ATTR } from "./visibility.js";
import { findListingRoot } from "../utils/listingDetection.js";
import { createVisibilityHelpers } from "../utils/visibilityHelpers.js";
import { findSellerFromElement, isBolSeller, SELLER_LABEL_PATTERN } from "../utils/sellerDetection.js";
import { TIMING } from "../utils/timing.js";
import { createDebouncedScanner } from "../utils/scheduling.js";

export function createVerkoopDoorBolFilter() {
  let enabled = true;
  const { hide, show } = createVisibilityHelpers(VERKOOP_DOOR_BOL_HIDDEN_ATTR);

  const scan = () => {
    const hiddenListings = new Set();
    const candidates = new Set();

    // Find all elements with aria-label containing seller info
    document.querySelectorAll("[aria-label]").forEach((el) => {
      const label = (el.getAttribute("aria-label") || "").trim();
      if (SELLER_LABEL_PATTERN.test(label)) {
        candidates.add(el);
      }
    });

    // Find all text elements that might contain seller info
    document.querySelectorAll("span, div, p").forEach((el) => {
      const text = (el.textContent || "").trim();
      if (SELLER_LABEL_PATTERN.test(text)) {
        candidates.add(el);
      }
    });

    // Process each candidate
    candidates.forEach((el) => {
      const sellerText = findSellerFromElement(el);
      if (!sellerText) return;

      const listing = findListingRoot(el);
      if (!listing) return;

      const shouldHide = enabled && !isBolSeller(sellerText);
      if (shouldHide) {
        hiddenListings.add(listing);
        hide(listing);
      } else {
        show(listing);
      }
    });

    // Clean up any listings that are no longer hidden
    document.querySelectorAll(`[${VERKOOP_DOOR_BOL_HIDDEN_ATTR}="true"]`).forEach((listing) => {
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
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    });
    scheduleScan();
  };

  const setEnabled = (next) => {
    enabled = Boolean(next);
    scheduleScan();
  };

  const destroy = () => {
    observer.disconnect();
    clearScan();
    document.querySelectorAll(`[${VERKOOP_DOOR_BOL_HIDDEN_ATTR}="true"]`).forEach(show);
  };

  return {
    observe,
    setEnabled,
    destroy
  };
}
