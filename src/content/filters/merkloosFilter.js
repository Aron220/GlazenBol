import { MERKLOOS_HIDDEN_ATTR, markHidden, unmarkHidden } from "./visibility.js";

const BRAND_LINK_SELECTOR = 'a[href*="/b/"]';
const PRODUCT_LINK_SELECTOR = 'a[href*="/nl/nl/p/"]';

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
    startEl.closest('[data-bltgi*="ProductList"]') ||
    startEl.closest('[data-test*="product"]') ||
    startEl.closest("article") ||
    startEl.closest("li");
  if (prefer && prefer.querySelector(PRODUCT_LINK_SELECTOR)) return prefer;

  // Walk up and choose the highest ancestor that still contains the product link.
  let node = startEl;
  let candidate = null;
  while (node && node !== document.body) {
    if (node.querySelector(PRODUCT_LINK_SELECTOR)) {
      candidate = node;
    }
    node = node.parentElement;
  }
  return candidate;
}

function getBrandText(listingEl) {
  const brandLink = listingEl.querySelector(BRAND_LINK_SELECTOR);
  if (!brandLink) return "";
  return brandLink.textContent || "";
}

function hideListing(listingEl) {
  markHidden(listingEl, MERKLOOS_HIDDEN_ATTR);
}

function showListing(listingEl) {
  unmarkHidden(listingEl, MERKLOOS_HIDDEN_ATTR);
}

export function createMerkloosFilter() {
  let enabled = true;

  const scan = () => {
    const productLinks = document.querySelectorAll(PRODUCT_LINK_SELECTOR);
    productLinks.forEach((productLink) => {
      const listing = findListingRoot(productLink);
      if (!listing) return;
      const brandText = getBrandText(listing);
      const shouldHide = enabled && isMerkloos(brandText);
      if (shouldHide) {
        hideListing(listing);
      } else {
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
