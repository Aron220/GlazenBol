import { GENERAL_AD_HIDDEN_ATTR, markHidden, unmarkHidden } from "./visibility.js";

const AD_BADGE_TEXT = "gesponsord";
const AD_BADGE_SELECTOR = "span.text-12";
const AD_ICON_SELECTOR = 'svg[data-testid="advertisement-disclaimer-icon"]';
const AD_BLOCK_SELECTOR = '[data-bltgg*="ProductList_Middle_considerationDisplay"]';

function hideBlock(blockEl) {
  if (blockEl === document.body || blockEl === document.documentElement) return;
  markHidden(blockEl, GENERAL_AD_HIDDEN_ATTR);
}

function showBlock(blockEl) {
  if (blockEl === document.body || blockEl === document.documentElement) return;
  unmarkHidden(blockEl, GENERAL_AD_HIDDEN_ATTR);
}

function normalizeText(text) {
  return (text || "").trim().toLowerCase();
}

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

  const scan = () => {
    const badges = document.querySelectorAll(AD_BADGE_SELECTOR);
    badges.forEach((badge) => {
      if (!hasSponsoredBadge(badge)) return;
      const block = findAdBlock(badge);
      if (!block) return;
      if (enabled) {
        hideBlock(block);
      } else {
        showBlock(block);
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
      document.querySelectorAll(`[${GENERAL_AD_HIDDEN_ATTR}="true"]`).forEach(showBlock);
    }
    scan();
  };

  const destroy = () => {
    observer.disconnect();
    document.querySelectorAll(`[${GENERAL_AD_HIDDEN_ATTR}="true"]`).forEach(showBlock);
  };

  return {
    observe,
    setEnabled,
    destroy
  };
}
