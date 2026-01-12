import { MERKLOOS_HIDDEN_ATTR, markHidden, unmarkHidden } from "./visibility.js";

const BRAND_LINK_SELECTOR = 'a[href*="/b/"]';
const PRODUCT_LINK_SELECTOR = 'a[href*="/nl/nl/p/"]';
const LISTING_DATA_SELECTOR = '[data-bltgi*="ProductList"], [data-bltgh*="ProductList"]';

function normalizeText(text) {
  return (text || "").trim().toLowerCase();
}

function isMerkloos(text) {
  const normalized = normalizeText(text);
  return normalized.includes("merkloos") || normalized.includes("sans marque");
}

function findListingRoot(startEl) {
  // Try obvious container types first.
  const prefer =
    startEl.closest(LISTING_DATA_SELECTOR) ||
    startEl.closest('[data-test*="product"]') ||
    startEl.closest('[role="listitem"]') ||
    startEl.closest("article") ||
    startEl.closest("li");
  if (prefer && prefer !== document.body) {
    const dataRoot = prefer.closest('[data-bltgi*="ProductList"]');
    const resolved = dataRoot && dataRoot !== document.body ? dataRoot : prefer;
    if (resolved.querySelector(PRODUCT_LINK_SELECTOR)) return resolved;
  }

  // Walk up and keep the closest ancestor that looks like a single product card.
  let node = startEl;
  let candidate = null;
  let firstWithProductLink = null;
  while (node && node !== document.body) {
    if (node.querySelector(PRODUCT_LINK_SELECTOR)) {
      if (!firstWithProductLink) firstWithProductLink = node;
      const linkCount = node.querySelectorAll(PRODUCT_LINK_SELECTOR).length;
      if (linkCount <= 2) {
        candidate = node;
      } else if (candidate) {
        break;
      }
    }
    node = node.parentElement;
  }
  const resolved = candidate || firstWithProductLink;
  return resolved && resolved !== document.body ? resolved : null;
}

function getBrandText(listingEl) {
  const brandLink = listingEl.querySelector(BRAND_LINK_SELECTOR);
  if (!brandLink) return "";
  return brandLink.textContent || "";
}

function hideListing(listingEl) {
  if (listingEl === document.body || listingEl === document.documentElement) return;
  markHidden(listingEl, MERKLOOS_HIDDEN_ATTR);
}

function showListing(listingEl) {
  if (listingEl === document.body || listingEl === document.documentElement) return;
  unmarkHidden(listingEl, MERKLOOS_HIDDEN_ATTR);
}

export function createMerkloosFilter() {
  let enabled = true;

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
        hideListing(listing);
      } else {
        showListing(listing);
      }
    });

    document.querySelectorAll(`[${MERKLOOS_HIDDEN_ATTR}="true"]`).forEach((listing) => {
      if (!enabled || !hiddenListings.has(listing)) {
        showListing(listing);
      }
    });
  };

  const observer = new MutationObserver(() => {
    scan();
  });

  const observe = () => {
    observer.observe(document.body, { childList: true, subtree: true });
    scan();
  };

  const setEnabled = (next) => {
    enabled = Boolean(next);
    if (!enabled) {
      document.querySelectorAll(`[${MERKLOOS_HIDDEN_ATTR}="true"]`).forEach(showListing);
    }
    scan();
  };

  const destroy = () => {
    observer.disconnect();
    document.querySelectorAll(`[${MERKLOOS_HIDDEN_ATTR}="true"]`).forEach(showListing);
  };

  return {
    observe,
    setEnabled,
    destroy
  };
}
