import {
  GENERAL_AD_HIDDEN_ATTR,
  GOEDE_KEUZE_HIDDEN_ATTR,
  MERKLOOS_HIDDEN_ATTR,
  SPONSORED_HIDDEN_ATTR,
  VERKOOP_DOOR_BOL_HIDDEN_ATTR,
  SELLER_BLOCK_HIDDEN_ATTR,
  BRAND_BLOCK_HIDDEN_ATTR
} from "./filters/visibility.js";
import { hideEmptyPageToast, showEmptyPageToast } from "./ui/emptyPageToast.js";
import { findListingRoot, PRODUCT_LINK_SELECTOR } from "./utils/listingDetection.js";
import { TIMING } from "./utils/timing.js";
import { createDebouncedScanner } from "./utils/scheduling.js";

const LISTING_ROOT_SELECTOR =
  '[data-bltgi*="ProductList"], [data-bltgh*="ProductList"], [data-test*="product"], [role="listitem"], article, li';

const HIDDEN_ATTRS = [
  MERKLOOS_HIDDEN_ATTR,
  SPONSORED_HIDDEN_ATTR,
  GENERAL_AD_HIDDEN_ATTR,
  VERKOOP_DOOR_BOL_HIDDEN_ATTR,
  GOEDE_KEUZE_HIDDEN_ATTR,
  SELLER_BLOCK_HIDDEN_ATTR,
  BRAND_BLOCK_HIDDEN_ATTR
];

let lastToastMessage = null;

function isProductDetailPage() {
  return window.location.pathname.toLowerCase().includes("/p/");
}

function getListingRoots() {
  const listings = new Set();

  // Find listings by product links
  document.querySelectorAll(PRODUCT_LINK_SELECTOR).forEach((link) => {
    const listing = findListingRoot(link);
    if (listing) listings.add(listing);
  });

  // Find listings by container selectors
  document.querySelectorAll(LISTING_ROOT_SELECTOR).forEach((el) => {
    if (el.matches('[data-test*="product"]') || el.querySelector(PRODUCT_LINK_SELECTOR)) {
      listings.add(findListingRoot(el) || el);
    }
  });

  // Ensure we include currently hidden items
  HIDDEN_ATTRS.forEach((attr) => {
    document.querySelectorAll(`[${attr}="true"]`).forEach((el) => listings.add(el));
  });

  const listingsArray = Array.from(listings);
  // Deduplicate: Keep only the innermost elements. If listing A contains listing B,
  // we only count B to avoid double-counting containers and their content.
  return listingsArray.filter(
    (a) => !listingsArray.some((b) => a !== b && a.contains(b))
  );
}

function isHidden(listingEl) {
  const hasAttr = (el) => HIDDEN_ATTRS.some((attr) => el.getAttribute(attr) === "true");
  if (hasAttr(listingEl)) return true;

  if (listingEl.closest) {
    for (const attr of HIDDEN_ATTRS) {
      if (listingEl.closest(`[${attr}="true"]`)) return true;
    }
  }

  if (listingEl.querySelector) {
    for (const attr of HIDDEN_ATTRS) {
      if (listingEl.querySelector(`[${attr}="true"]`)) return true;
    }
  }
  return false;
}

function checkForEmptyPage({ root }) {
  if (isProductDetailPage()) {
    lastToastMessage = null;
    hideEmptyPageToast({ root });
    return;
  }

  const listings = getListingRoots().filter((listing) =>
    Boolean(listing.querySelector && listing.querySelector(PRODUCT_LINK_SELECTOR))
  );

  let message = null;
  if (!listings.length) {
    message = "Geen resultaten gevonden.";
  } else {
    const visibleListings = listings.filter((listing) => !isHidden(listing));
    const hiddenCount = listings.length - visibleListings.length;

    if (visibleListings.length === 0) {
      message =
        hiddenCount > 0
          ? "Geen resultaten! Met de huidige filters staan er op deze pagina geen producten. Pas je filters aan of ga verder."
          : "Geen resultaten gevonden.";
    } else if (visibleListings.length < 5) {
      const remaining = visibleListings.length;
      const resultLabel = remaining === 1 ? "resultaat" : "resultaten";
      message =
        hiddenCount > 0
          ? `Nog ${remaining} ${resultLabel} over (${hiddenCount} ${hiddenCount === 1 ? "product" : "producten"
          } verborgen).`
          : `Nog ${remaining} ${resultLabel} over.`;
    }
  }

  if (!message) {
    lastToastMessage = null;
    hideEmptyPageToast({ root });
    return;
  }

  if (message === lastToastMessage) return;
  lastToastMessage = message;
  showEmptyPageToast({ root, message });
}

export function createEmptyPageMonitor({ root } = {}) {
  const { schedule, clear } = createDebouncedScanner(
    () => checkForEmptyPage({ root }),
    TIMING.EMPTY_PAGE_CHECK_DELAY
  );

  const observer = new MutationObserver(() => {
    schedule();
  });

  const observe = () => {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: HIDDEN_ATTRS
    });
  };

  const destroy = () => {
    observer.disconnect();
    clear();
  };

  return {
    observe,
    scheduleCheck: schedule,
    destroy
  };
}
