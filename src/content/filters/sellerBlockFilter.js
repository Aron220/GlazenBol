import { SELLER_BLOCK_HIDDEN_ATTR } from "./visibility.js";
import { findListingRoot } from "../utils/listingDetection.js";
import { normalizeText } from "../utils/textUtils.js";
import { createVisibilityHelpers } from "../utils/visibilityHelpers.js";
import { findSellerFromElement, isBolSeller, SELLER_LABEL_PATTERN } from "../utils/sellerDetection.js";
import { ensureBlockButtonStyles, BLOCK_BUTTON_CLASS } from "../utils/blockButtonStyles.js";
import { TIMING } from "../utils/timing.js";
import { createDebouncedScanner } from "../utils/scheduling.js";

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

export function createSellerBlockFilter({ store }) {
  let blockedSellers = new Set();
  const { hide, show } = createVisibilityHelpers(SELLER_BLOCK_HIDDEN_ATTR);

  const handleBlockSeller = (sellerName) => {
    store.addSeller(sellerName);
  };

  const scan = () => {
    ensureBlockButtonStyles();
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
      const isBlocked = !isBol && blockedSellers.has(normalizeText(sellerText));

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
        hide(listing);
      } else {
        show(listing);
      }
    });

    document.querySelectorAll(`[${SELLER_BLOCK_HIDDEN_ATTR}="true"]`).forEach((listing) => {
      if (!hiddenListings.has(listing)) {
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

  const unsubscribe = store.subscribe(({ normalized }) => {
    blockedSellers = normalized;
    scheduleScan();
  });

  const destroy = () => {
    observer.disconnect();
    unsubscribe();
    clearScan();
    document.querySelectorAll(`[${SELLER_BLOCK_HIDDEN_ATTR}="true"]`).forEach(show);
  };

  return {
    observe,
    destroy
  };
}
