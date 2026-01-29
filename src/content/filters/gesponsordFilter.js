import { SPONSORED_HIDDEN_ATTR } from "./visibility.js";
import { findListingRoot, PRODUCT_LINK_SELECTOR } from "../utils/listingDetection.js";
import { normalizeText } from "../utils/textUtils.js";
import { createVisibilityHelpers } from "../utils/visibilityHelpers.js";
import { TIMING } from "../utils/timing.js";
import { createDebouncedScanner } from "../utils/scheduling.js";

import { SPONSORED_BADGE_SELECTOR } from "../utils/selectors.js";

const SPONSORED_KEYWORDS = ["gesponsord", "gesponsorde", "sponsored"];
const SPONSORED_ICON_SELECTOR = 'svg[data-testid="advertisement-disclaimer-icon"]';
const PDP_SPONSORED_ITEM_SELECTOR = ".js_sponsored-products_item";
const PDP_SPONSORED_LABEL_SELECTOR = ".dsa__label__text, button.dsa__label";

export function createGesponsordFilter() {
  let enabled = true;
  const { hide, show } = createVisibilityHelpers(SPONSORED_HIDDEN_ATTR);

  const scan = () => {
    const sponsoredListings = new Set();

    // Scan for sponsored badges in search results
    const badges = document.querySelectorAll(SPONSORED_BADGE_SELECTOR);
    badges.forEach((badge) => {
      const text = normalizeText(badge.textContent);
      if (!SPONSORED_KEYWORDS.some((kw) => text.includes(kw))) return;
      const container = badge.parentElement || badge;
      if (!container.querySelector(SPONSORED_ICON_SELECTOR)) return;
      const listing = findListingRoot(badge);
      if (!listing) return;
      sponsoredListings.add(listing);
      if (enabled) {
        hide(listing);
      }
    });

    // Scan for sponsored items on product detail pages
    const pdpSponsoredItems = document.querySelectorAll(PDP_SPONSORED_ITEM_SELECTOR);
    pdpSponsoredItems.forEach((item) => {
      const listing = item.matches("li, article, [role='listitem']") ? item : findListingRoot(item);
      if (!listing) return;
      sponsoredListings.add(listing);
      if (enabled) {
        hide(listing);
      }
    });

    // Scan for sponsored labels on product detail pages
    const pdpSponsoredLabels = document.querySelectorAll(PDP_SPONSORED_LABEL_SELECTOR);
    pdpSponsoredLabels.forEach((label) => {
      const text = normalizeText(label.textContent);
      if (!SPONSORED_KEYWORDS.some((kw) => text.includes(kw))) return;
      const listing = findListingRoot(label);
      if (!listing) return;
      sponsoredListings.add(listing);
      if (enabled) {
        hide(listing);
      }
    });

    // Clean up any listings that are no longer sponsored
    document.querySelectorAll(`[${SPONSORED_HIDDEN_ATTR}="true"]`).forEach((listing) => {
      if (!enabled || !sponsoredListings.has(listing)) {
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
    document.querySelectorAll(`[${SPONSORED_HIDDEN_ATTR}="true"]`).forEach(show);
  };

  return {
    observe,
    setEnabled,
    destroy
  };
}
