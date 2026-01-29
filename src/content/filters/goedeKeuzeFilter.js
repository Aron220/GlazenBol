import { GOEDE_KEUZE_HIDDEN_ATTR } from "./visibility.js";
import { findListingRoot, PRODUCT_LINK_SELECTOR } from "../utils/listingDetection.js";
import { normalizeText } from "../utils/textUtils.js";
import { createVisibilityHelpers } from "../utils/visibilityHelpers.js";
import { TIMING } from "../utils/timing.js";
import { createDebouncedScanner } from "../utils/scheduling.js";

const GOOD_CHOICE_LABELS = ["goede keuze", "duurzame keuze"];

function isGoodChoiceLabel(text) {
  const normalized = normalizeText(text);
  return GOOD_CHOICE_LABELS.some((label) => normalized === label);
}

function collectListings() {
  const listings = new Set();
  document.querySelectorAll(PRODUCT_LINK_SELECTOR).forEach((link) => {
    const listing = findListingRoot(link);
    if (listing) listings.add(listing);
  });
  return listings;
}

function listingHasGoodChoice(listing) {
  const candidates = listing.querySelectorAll("span, div, p");
  for (const el of candidates) {
    if (isGoodChoiceLabel(el.textContent)) return true;
  }
  return false;
}

export function createGoedeKeuzeFilter() {
  let enabled = true;
  const { hide, show } = createVisibilityHelpers(GOEDE_KEUZE_HIDDEN_ATTR);

  const scan = () => {
    const listings = collectListings();
    const goodListings = new Set();

    listings.forEach((listing) => {
      if (listingHasGoodChoice(listing)) {
        goodListings.add(listing);
      }
    });

    listings.forEach((listing) => {
      const shouldHide = enabled && !goodListings.has(listing);
      if (shouldHide) {
        hide(listing);
      } else {
        show(listing);
      }
    });

    // Clean up any listings that are no longer hidden
    document.querySelectorAll(`[${GOEDE_KEUZE_HIDDEN_ATTR}="true"]`).forEach((listing) => {
      if (!enabled || goodListings.has(listing)) {
        show(listing);
      }
    });
  };

  const { schedule: scheduleScan, clear: clearScan } = createDebouncedScanner(scan, TIMING.FILTER_SCAN_DEBOUNCE_SLOW);

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
    document.querySelectorAll(`[${GOEDE_KEUZE_HIDDEN_ATTR}="true"]`).forEach(show);
  };

  return {
    observe,
    setEnabled,
    destroy
  };
}
