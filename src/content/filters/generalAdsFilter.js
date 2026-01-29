import { GENERAL_AD_HIDDEN_ATTR } from "./visibility.js";
import { normalizeText } from "../utils/textUtils.js";
import { createVisibilityHelpers } from "../utils/visibilityHelpers.js";
import { TIMING } from "../utils/timing.js";
import { createDebouncedScanner } from "../utils/scheduling.js";

import { AD_BADGE_SELECTOR } from "../utils/selectors.js";
const AD_BADGE_TEXT = "gesponsord";
const AD_ICON_SELECTOR = 'svg[data-testid="advertisement-disclaimer-icon"]';
const AD_BLOCK_SELECTOR = '[data-bltgg*="ProductList_Middle_considerationDisplay"]';

function hasSponsoredBadge(badgeEl) {
  if (!badgeEl) return false;
  const text = normalizeText(badgeEl.textContent);
  if (!text.includes(AD_BADGE_TEXT)) return false;
  const container = badgeEl.closest("div") || badgeEl.parentElement;
  if (!container) return false;
  return Boolean(container.querySelector(AD_ICON_SELECTOR));
}

function findAdBlock(startEl) {
  const block = startEl.closest(AD_BLOCK_SELECTOR);
  if (block) return block;
  let node = startEl;
  while (node && node !== document.body) {
    if (node.matches && node.matches(AD_BLOCK_SELECTOR)) return node;
    node = node.parentElement;
  }
  return null;
}

export function createGeneralAdsFilter() {
  let enabled = true;
  const { hide, show } = createVisibilityHelpers(GENERAL_AD_HIDDEN_ATTR);

  const scan = () => {
    const hiddenBlocks = new Set();
    const badges = document.querySelectorAll(AD_BADGE_SELECTOR);
    badges.forEach((badge) => {
      if (!hasSponsoredBadge(badge)) return;
      const block = findAdBlock(badge);
      if (!block) return;
      hiddenBlocks.add(block);
      if (enabled) {
        hide(block);
      } else {
        show(block);
      }
    });

    document.querySelectorAll(`[${GENERAL_AD_HIDDEN_ATTR}="true"]`).forEach((block) => {
      if (!enabled || !hiddenBlocks.has(block)) {
        show(block);
      }
    });
  };

  const { schedule: scheduleScan, clear: clearScan } = createDebouncedScanner(scan, TIMING.FILTER_SCAN_DEBOUNCE);

  const observer = new MutationObserver(() => {
    scheduleScan();
  });

  const observe = () => {
    observer.observe(document.body, { childList: true, subtree: true });
    scheduleScan();
  };

  const setEnabled = (next) => {
    enabled = Boolean(next);
    scheduleScan();
  };

  const destroy = () => {
    observer.disconnect();
    clearScan();
    document.querySelectorAll(`[${GENERAL_AD_HIDDEN_ATTR}="true"]`).forEach(show);
  };

  return {
    observe,
    setEnabled,
    destroy
  };
}
