import { SELLER_BLOCK_HIDDEN_ATTR, markHidden, unmarkHidden } from "./visibility.js";

const PRODUCT_LINK_SELECTOR = 'a[href*="/nl/nl/p/"], a[href*="/p/"]';
const LISTING_DATA_SELECTOR = '[data-bltgi*="ProductList"], [data-bltgh*="ProductList"]';
const SELLER_LABEL_PATTERN = /^verkoop door\s*(.*)$/i;
const SELLER_BOL_PATTERN = /\bbol(?:\.com)?\b/i;
const BLOCK_BUTTON_CLASS = "bf-seller-block-btn";
const STYLE_ID = "bf-seller-block-style";

function normalizeSeller(text) {
  return (text || "").trim().toLowerCase();
}

function getElementText(el) {
  if (!el) return "";
  const button = el.querySelector && el.querySelector(`.${BLOCK_BUTTON_CLASS}`);
  if (!button) return (el.textContent || "");
  let text = el.textContent || "";
  const buttonText = button.textContent || "";
  if (buttonText) {
    text = text.replace(buttonText, "");
  }
  return text;
}

function isBolSeller(text) {
  return SELLER_BOL_PATTERN.test(normalizeSeller(text));
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

function getSellerFromLabel(labelEl) {
  let sibling = labelEl.nextElementSibling;
  if (sibling && normalizeSeller(getElementText(sibling))) return getElementText(sibling) || "";

  const parent = labelEl.parentElement;
  if (!parent) return "";
  const children = Array.from(parent.children);
  const labelIndex = children.indexOf(labelEl);
  for (let i = labelIndex + 1; i < children.length; i += 1) {
    const text = getElementText(children[i]) || "";
    if (normalizeSeller(text)) return text;
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

  const text = getElementText(el).trim();
  if (!text) return "";
  const match = text.match(SELLER_LABEL_PATTERN);
  if (!match) return "";
  const remainder = (match[1] || "").trim();
  if (remainder) return remainder;
  const seller = getSellerFromLabel(el);
  if (normalizeSeller(seller)) return seller;
  return "";
}

function resolveButtonContainer(labelEl) {
  let container = labelEl.parentElement || labelEl;
  if (container && container.tagName === "BUTTON") {
    container = container.parentElement || container;
  }
  return container;
}

function updateBlockButton(button, { sellerName, isBlocked }) {
  button.textContent = isBlocked ? "Geblokkeerd" : "Blokkeer";
  button.disabled = Boolean(isBlocked);
  button.setAttribute("data-bf-seller-name", sellerName);
}

function ensureBlockButton({ container, sellerName, isBlocked, onBlock }) {
  if (!container) return;
  let button = container.querySelector(`.${BLOCK_BUTTON_CLASS}`);
  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.className = BLOCK_BUTTON_CLASS;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const seller = button.getAttribute("data-bf-seller-name") || "";
      if (!seller) return;
      onBlock(seller);
    });
    container.appendChild(button);
  }
  updateBlockButton(button, { sellerName, isBlocked });
}

function hideListing(listingEl) {
  if (listingEl === document.body || listingEl === document.documentElement) return;
  markHidden(listingEl, SELLER_BLOCK_HIDDEN_ATTR);
}

function showListing(listingEl) {
  if (listingEl === document.body || listingEl === document.documentElement) return;
  unmarkHidden(listingEl, SELLER_BLOCK_HIDDEN_ATTR);
}

export function createSellerBlockFilter({ store }) {
  let blockedSellers = new Set();
  let scanTimer = null;

  const handleBlockSeller = (sellerName) => {
    store.addSeller(sellerName);
  };

  const scan = () => {
    ensureStyles();
    const hiddenListings = new Set();
    const candidates = new Set();

    document.querySelectorAll("[aria-label]").forEach((el) => {
      const label = (el.getAttribute("aria-label") || "").trim();
      if (SELLER_LABEL_PATTERN.test(label)) {
        candidates.add(el);
      }
    });

    document.querySelectorAll("span, div, p").forEach((el) => {
      if (el.children && el.children.length > 0) return;
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
      const isBol = isBolSeller(sellerText);
      const isBlocked = !isBol && blockedSellers.has(normalizeSeller(sellerText));

      if (!isBol) {
        const container = resolveButtonContainer(el);
        ensureBlockButton({ container, sellerName: sellerText, isBlocked, onBlock: handleBlockSeller });
      } else {
        const container = resolveButtonContainer(el);
        if (container) {
          const button = container.querySelector(`.${BLOCK_BUTTON_CLASS}`);
          if (button) button.remove();
        }
      }

      if (isBlocked) {
        hiddenListings.add(listing);
        hideListing(listing);
      } else {
        showListing(listing);
      }
    });

    document.querySelectorAll(`[${SELLER_BLOCK_HIDDEN_ATTR}="true"]`).forEach((listing) => {
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
    blockedSellers = normalized;
    scheduleScan();
  });

  const destroy = () => {
    observer.disconnect();
    unsubscribe();
    if (scanTimer) {
      window.clearTimeout(scanTimer);
      scanTimer = null;
    }
    document.querySelectorAll(`[${SELLER_BLOCK_HIDDEN_ATTR}="true"]`).forEach(showListing);
  };

  return {
    observe,
    destroy
  };
}
