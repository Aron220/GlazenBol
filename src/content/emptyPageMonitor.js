import {
  GENERAL_AD_HIDDEN_ATTR,
  MERKLOOS_HIDDEN_ATTR,
  SPONSORED_HIDDEN_ATTR,
  VERKOOP_DOOR_BOL_HIDDEN_ATTR
} from "./filters/visibility.js";
import { showEmptyPageToast } from "./ui/emptyPageToast.js";

const PRODUCT_LINK_SELECTOR = 'a[href*="/nl/nl/p/"], a[href*="/p/"]';
const LISTING_ROOT_SELECTOR =
  '[data-bltgi*="ProductList"], [data-bltgh*="ProductList"], [data-test*="product"], [role="listitem"], article, li';
const DEFAULT_CHECK_DELAY_MS = 1000;
const HIDDEN_ATTRS = [
  MERKLOOS_HIDDEN_ATTR,
  SPONSORED_HIDDEN_ATTR,
  GENERAL_AD_HIDDEN_ATTR,
  VERKOOP_DOOR_BOL_HIDDEN_ATTR
];

function findListingRoot(startEl) {
  const prefer = startEl.closest(LISTING_ROOT_SELECTOR);
  if (prefer && prefer !== document.body && prefer.querySelector(PRODUCT_LINK_SELECTOR)) return prefer;

  let node = startEl;
  let candidate = null;
  while (node && node !== document.body) {
    if (node.querySelector && node.querySelector(PRODUCT_LINK_SELECTOR)) {
      candidate = node;
    }
    node = node.parentElement;
  }
  return candidate && candidate !== document.body ? candidate : null;
}

function getListingRoots() {
  const listings = new Set();
  document.querySelectorAll(PRODUCT_LINK_SELECTOR).forEach((link) => {
    const listing = findListingRoot(link);
    if (listing) listings.add(listing);
  });
  document.querySelectorAll(LISTING_ROOT_SELECTOR).forEach((el) => {
    if (el.matches("[data-test*=\"product\"]") || el.querySelector(PRODUCT_LINK_SELECTOR)) {
      listings.add(el);
    }
  });
  HIDDEN_ATTRS.forEach((attr) => {
    document.querySelectorAll(`[${attr}=\"true\"]`).forEach((el) => listings.add(el));
  });
  return Array.from(listings);
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
  const listings = getListingRoots().filter((listing) =>
    Boolean(listing.querySelector && listing.querySelector(PRODUCT_LINK_SELECTOR))
  );
  if (!listings.length) return;

  const visibleListings = listings.filter((listing) => !isHidden(listing));
  const hiddenCount = listings.length - visibleListings.length;

  if (hiddenCount === 0) return;

  if (visibleListings.length === 0) {
    showEmptyPageToast({
      root,
      message: "De pagina is leeg omdat deze helemaal uit advertenties bestond! Probeer een volgende pagina of wijzig de filters."
    });
    return;
  }

  if (visibleListings.length < 5) {
    const remaining = visibleListings.length;
    const hidden = hiddenCount;
    const resultLabel = remaining === 1 ? "resultaat" : "resultaten";
    const hiddenLabel = hidden === 1 ? "product" : "producten";
    showEmptyPageToast({
      root,
      message: `Nog ${remaining} ${resultLabel} over (${hidden} ${hiddenLabel} verborgen).`
    });
  }
}

export function createEmptyPageMonitor({ root } = {}) {
  let checkTimer = null;

  const scheduleCheck = ({ delayMs = DEFAULT_CHECK_DELAY_MS } = {}) => {
    if (checkTimer) {
      window.clearTimeout(checkTimer);
      checkTimer = null;
    }

    checkTimer = window.setTimeout(() => {
      checkTimer = null;
      checkForEmptyPage({ root });
    }, delayMs);
  };

  const observer = new MutationObserver(() => {
    scheduleCheck();
  });

  const observe = () => {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: HIDDEN_ATTRS
    });
  };

  const destroy = () => {
    observer.disconnect();
    if (checkTimer) {
      window.clearTimeout(checkTimer);
      checkTimer = null;
    }
  };

  return {
    observe,
    scheduleCheck,
    destroy
  };
}
