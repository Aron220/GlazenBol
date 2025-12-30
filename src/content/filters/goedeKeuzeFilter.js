import { GOEDE_KEUZE_HIDDEN_ATTR, markHidden, unmarkHidden } from "./visibility.js";

const PRODUCT_LINK_SELECTOR = 'a[href*="/nl/nl/p/"]';
const LISTING_DATA_SELECTOR = '[data-bltgi*="ProductList"], [data-bltgh*="ProductList"]';
const GOOD_CHOICE_LABELS = ["goede keuze", "duurzame keuze"];

function normalizeText(text) {
  return (text || "").trim().toLowerCase();
}

function isGoodChoiceLabel(text) {
  const normalized = normalizeText(text);
  return GOOD_CHOICE_LABELS.some((label) => normalized === label);
}

function findListingRoot(startEl) {
  const prefer =
    startEl.closest(LISTING_DATA_SELECTOR) ||
    startEl.closest('[data-test*="product"]') ||
    startEl.closest('[role="listitem"]') ||
    startEl.closest("article") ||
    startEl.closest("li");
  if (prefer && prefer !== document.body && prefer.querySelector(PRODUCT_LINK_SELECTOR)) return prefer;

  let node = startEl;
  let candidate = null;
  while (node && node !== document.body) {
    if (node.querySelector(PRODUCT_LINK_SELECTOR)) {
      const linkCount = node.querySelectorAll(PRODUCT_LINK_SELECTOR).length;
      if (linkCount <= 2) {
        candidate = node;
      } else if (candidate) {
        break;
      }
    }
    node = node.parentElement;
  }
  return candidate && candidate !== document.body ? candidate : null;
}

function hideListing(listingEl) {
  if (listingEl === document.body || listingEl === document.documentElement) return;
  markHidden(listingEl, GOEDE_KEUZE_HIDDEN_ATTR);
}

function showListing(listingEl) {
  if (listingEl === document.body || listingEl === document.documentElement) return;
  unmarkHidden(listingEl, GOEDE_KEUZE_HIDDEN_ATTR);
}

function collectListings() {
  const listings = new Set();
  document.querySelectorAll(PRODUCT_LINK_SELECTOR).forEach((link) => {
    const listing = findListingRoot(link);
    if (listing) listings.add(listing);
  });
  return listings;
}

export function createGoedeKeuzeFilter() {
  let enabled = true;
  let scanTimer = null;

  const scan = () => {
    const listings = collectListings();
    const goodListings = new Set();

    document.querySelectorAll("span, div, p").forEach((el) => {
      const text = el.textContent || "";
      if (!isGoodChoiceLabel(text)) return;
      const listing = findListingRoot(el);
      if (!listing) return;
      goodListings.add(listing);
    });

    listings.forEach((listing) => {
      const shouldHide = enabled && !goodListings.has(listing);
      if (shouldHide) {
        hideListing(listing);
      } else {
        showListing(listing);
      }
    });

    document.querySelectorAll(`[${GOEDE_KEUZE_HIDDEN_ATTR}="true"]`).forEach((listing) => {
      if (!enabled || goodListings.has(listing)) {
        showListing(listing);
      }
    });
  };

  const scheduleScan = () => {
    if (scanTimer) return;
    scanTimer = window.setTimeout(() => {
      scanTimer = null;
      scan();
    }, 140);
  };

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
    if (!enabled) {
      document.querySelectorAll(`[${GOEDE_KEUZE_HIDDEN_ATTR}="true"]`).forEach(showListing);
    }
    scheduleScan();
  };

  const destroy = () => {
    observer.disconnect();
    if (scanTimer) {
      window.clearTimeout(scanTimer);
      scanTimer = null;
    }
    document.querySelectorAll(`[${GOEDE_KEUZE_HIDDEN_ATTR}="true"]`).forEach(showListing);
  };

  return {
    observe,
    setEnabled,
    destroy
  };
}
