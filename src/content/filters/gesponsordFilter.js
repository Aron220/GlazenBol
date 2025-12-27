import { SPONSORED_HIDDEN_ATTR, markHidden, unmarkHidden } from "./visibility.js";

const PRODUCT_LINK_SELECTOR = 'a[href*="/nl/nl/p/"]';
const SPONSORED_KEYWORDS = ["gesponsord", "gesponsorde", "sponsored"];
const SPONSORED_BADGE_SELECTOR = "span.text-12.text-neutral-text-medium";
const SPONSORED_ICON_SELECTOR = 'svg[data-testid="advertisement-disclaimer-icon"]';

function normalizeText(text) {
  return (text || "").trim().toLowerCase();
}

function findListingRoot(startEl) {
  const prefer =
    startEl.closest('[data-bltgi*="ProductList"]') ||
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

function hasSponsoredBadge(listingEl) {
  const badges = listingEl.querySelectorAll(SPONSORED_BADGE_SELECTOR);
  for (const badge of badges) {
    const text = normalizeText(badge.textContent);
    if (!SPONSORED_KEYWORDS.some((kw) => text.includes(kw))) continue;
    const container = badge.parentElement || listingEl;
    if (container.querySelector(SPONSORED_ICON_SELECTOR)) {
      return true;
    }
  }
  return false;
}

function hideListing(listingEl) {
  if (listingEl === document.body || listingEl === document.documentElement) return;
  markHidden(listingEl, SPONSORED_HIDDEN_ATTR);
}

function showListing(listingEl) {
  if (listingEl === document.body || listingEl === document.documentElement) return;
  unmarkHidden(listingEl, SPONSORED_HIDDEN_ATTR);
}

export function createGesponsordFilter() {
  let enabled = true;
  let scanTimer = null;

  const scan = () => {
    const sponsoredListings = new Set();
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
        hideListing(listing);
      }
    });

    document.querySelectorAll(`[${SPONSORED_HIDDEN_ATTR}="true"]`).forEach((listing) => {
      if (!enabled || !sponsoredListings.has(listing)) {
        showListing(listing);
      }
    });
  };

  const scheduleScan = () => {
    if (scanTimer) return;
    scanTimer = window.setTimeout(() => {
      scanTimer = null;
      scan();
    }, 120);
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
      document.querySelectorAll(`[${SPONSORED_HIDDEN_ATTR}="true"]`).forEach(showListing);
    }
    scheduleScan();
  };

  const destroy = () => {
    observer.disconnect();
    if (scanTimer) {
      window.clearTimeout(scanTimer);
      scanTimer = null;
    }
    document.querySelectorAll(`[${SPONSORED_HIDDEN_ATTR}="true"]`).forEach(showListing);
  };

  return {
    observe,
    setEnabled,
    destroy
  };
}
