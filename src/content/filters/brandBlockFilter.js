import { BRAND_BLOCK_HIDDEN_ATTR, markHidden, unmarkHidden } from "./visibility.js";

const BRAND_LINK_SELECTOR = 'a[href*="/b/"], a[href*="/pb/"]';
const PRODUCT_LINK_SELECTOR = 'a[href*="/nl/nl/p/"], a[href*="/p/"]';
const LISTING_DATA_SELECTOR = '[data-bltgi*="ProductList"], [data-bltgh*="ProductList"]';
const BLOCK_BUTTON_CLASS = "bf-brand-block-btn";
const STYLE_ID = "bf-brand-block-style";

function normalizeBrand(text) {
  return (text || "").trim().toLowerCase();
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .${BLOCK_BUTTON_CLASS} {
      margin-left: 6px;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid #d5dbe3;
      background: #ffffff;
      color: #0f172a;
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
      line-height: 1.3;
    }
    .${BLOCK_BUTTON_CLASS}:hover {
      background: #f1f5f9;
    }
    .${BLOCK_BUTTON_CLASS}[disabled] {
      background: #e2e8f0;
      border-color: #e2e8f0;
      color: #64748b;
      cursor: default;
    }
  `;
  document.head.appendChild(style);
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
    if (node.querySelector && node.querySelector(PRODUCT_LINK_SELECTOR)) {
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

function resolveButtonContainer(linkEl) {
  if (!linkEl) return null;
  if (linkEl.tagName === "A") {
    return linkEl.parentElement || linkEl;
  }
  return linkEl.parentElement || linkEl;
}

function updateBlockButton(button, { brandName, isBlocked }) {
  button.textContent = isBlocked ? "Geblokkeerd" : "Blokkeer";
  button.disabled = Boolean(isBlocked);
  button.setAttribute("data-bf-brand-name", brandName);
}

function ensureBlockButton({ container, brandName, isBlocked, onBlock }) {
  if (!container) return;
  let button = container.querySelector(`.${BLOCK_BUTTON_CLASS}`);
  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.className = BLOCK_BUTTON_CLASS;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const brand = button.getAttribute("data-bf-brand-name") || "";
      if (!brand) return;
      onBlock(brand);
    });
    container.appendChild(button);
  }
  updateBlockButton(button, { brandName, isBlocked });
}

function hideListing(listingEl) {
  if (listingEl === document.body || listingEl === document.documentElement) return;
  markHidden(listingEl, BRAND_BLOCK_HIDDEN_ATTR);
}

function showListing(listingEl) {
  if (listingEl === document.body || listingEl === document.documentElement) return;
  unmarkHidden(listingEl, BRAND_BLOCK_HIDDEN_ATTR);
}

export function createBrandBlockFilter({ store }) {
  let blockedBrands = new Set();
  let scanTimer = null;

  const handleBlockBrand = (brandName) => {
    store.addBrand(brandName);
  };

  const scan = () => {
    ensureStyles();
    const hiddenListings = new Set();

    document.querySelectorAll(BRAND_LINK_SELECTOR).forEach((brandLink) => {
      const brandText = (brandLink.textContent || "").trim();
      if (!brandText) return;
      const listing = findListingRoot(brandLink);
      if (!listing) return;

      const isBlocked = blockedBrands.has(normalizeBrand(brandText));
      const container = resolveButtonContainer(brandLink);
      ensureBlockButton({ container, brandName: brandText, isBlocked, onBlock: handleBlockBrand });

      if (isBlocked) {
        hiddenListings.add(listing);
        hideListing(listing);
      } else {
        showListing(listing);
      }
    });

    document.querySelectorAll(`[${BRAND_BLOCK_HIDDEN_ATTR}="true"]`).forEach((listing) => {
      if (!hiddenListings.has(listing)) {
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

  const unsubscribe = store.subscribe(({ normalized }) => {
    blockedBrands = normalized;
    scheduleScan();
  });

  const destroy = () => {
    observer.disconnect();
    unsubscribe();
    if (scanTimer) {
      window.clearTimeout(scanTimer);
      scanTimer = null;
    }
    document.querySelectorAll(`[${BRAND_BLOCK_HIDDEN_ATTR}="true"]`).forEach(showListing);
  };

  return {
    observe,
    destroy
  };
}
