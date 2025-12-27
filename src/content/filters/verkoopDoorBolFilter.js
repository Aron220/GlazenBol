import { VERKOOP_DOOR_BOL_HIDDEN_ATTR, markHidden, unmarkHidden } from "./visibility.js";

const PRODUCT_LINK_SELECTOR = 'a[href*="/nl/nl/p/"]';
const LISTING_DATA_SELECTOR = '[data-bltgi*="ProductList"], [data-bltgh*="ProductList"]';
const SELLER_LABEL_PATTERN = /^verkoop door\s*(.*)$/i;
const SELLER_BOL_PATTERN = /\bbol(?:\.com)?\b/i;

function normalizeText(text) {
  return (text || "").trim().toLowerCase();
}

function findListingRoot(startEl, { requireProductLink = true } = {}) {
  const prefer =
    startEl.closest(LISTING_DATA_SELECTOR) ||
    startEl.closest('[data-test*="product"]') ||
    startEl.closest('[role="listitem"]') ||
    startEl.closest("article") ||
    startEl.closest("li");
  if (prefer && prefer !== document.body) {
    if (!requireProductLink || prefer.querySelector(PRODUCT_LINK_SELECTOR)) return prefer;
  }

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

function getSellerFromLabel(labelEl) {
  let sibling = labelEl.nextElementSibling;
  if (sibling && normalizeText(sibling.textContent)) return sibling.textContent || "";

  const parent = labelEl.parentElement;
  if (!parent) return "";
  const children = Array.from(parent.children);
  const labelIndex = children.indexOf(labelEl);
  for (let i = labelIndex + 1; i < children.length; i += 1) {
    const text = children[i].textContent || "";
    if (normalizeText(text)) return text;
  }
  return "";
}

function findSellerFromElement(el) {
  const ariaLabel = (el.getAttribute && el.getAttribute("aria-label")) || "";
  if (ariaLabel) {
    const match = ariaLabel.match(SELLER_LABEL_PATTERN);
    if (match) {
      const remainder = (match[1] || "").trim();
      if (remainder) return remainder;
    }
  }

  const text = (el.textContent || "").trim();
  if (!text) return "";
  const match = text.match(SELLER_LABEL_PATTERN);
  if (!match) return "";
  const remainder = (match[1] || "").trim();
  if (remainder) return remainder;
  const seller = getSellerFromLabel(el);
  if (normalizeText(seller)) return seller;
  return "";
}

function hideListing(listingEl) {
  if (listingEl === document.body || listingEl === document.documentElement) return;
  markHidden(listingEl, VERKOOP_DOOR_BOL_HIDDEN_ATTR);
}

function showListing(listingEl) {
  if (listingEl === document.body || listingEl === document.documentElement) return;
  unmarkHidden(listingEl, VERKOOP_DOOR_BOL_HIDDEN_ATTR);
}

function isBolSeller(text) {
  return SELLER_BOL_PATTERN.test((text || "").trim());
}

export function createVerkoopDoorBolFilter() {
  let enabled = true;
  let scanTimer = null;

  const scan = () => {
    const hiddenListings = new Set();
    const candidates = new Set();

    document.querySelectorAll("[aria-label]").forEach((el) => {
      const label = (el.getAttribute("aria-label") || "").trim();
      if (SELLER_LABEL_PATTERN.test(label)) {
        candidates.add(el);
      }
    });

    document.querySelectorAll("span, div, p").forEach((el) => {
      const text = (el.textContent || "").trim();
      if (SELLER_LABEL_PATTERN.test(text)) {
        candidates.add(el);
      }
    });

    candidates.forEach((el) => {
      const sellerText = findSellerFromElement(el);
      if (!sellerText) return;
      const listing = findListingRoot(el);
      if (!listing) return;
      const shouldHide = enabled && !isBolSeller(sellerText);
      if (shouldHide) {
        hiddenListings.add(listing);
        hideListing(listing);
      } else {
        showListing(listing);
      }
    });

    document.querySelectorAll(`[${VERKOOP_DOOR_BOL_HIDDEN_ATTR}="true"]`).forEach((listing) => {
      if (!enabled || !hiddenListings.has(listing)) {
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
      document.querySelectorAll(`[${VERKOOP_DOOR_BOL_HIDDEN_ATTR}="true"]`).forEach(showListing);
    }
    scheduleScan();
  };

  const destroy = () => {
    observer.disconnect();
    if (scanTimer) {
      window.clearTimeout(scanTimer);
      scanTimer = null;
    }
    document.querySelectorAll(`[${VERKOOP_DOOR_BOL_HIDDEN_ATTR}="true"]`).forEach(showListing);
  };

  return {
    observe,
    setEnabled,
    destroy
  };
}
