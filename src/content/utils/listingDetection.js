import { PRODUCT_LINK_SELECTOR, LISTING_DATA_SELECTOR } from "./selectors.js";

/**
 * Shared utilities for detecting and finding product listing elements in the DOM.
 * Used by all filter modules to locate the root container of a product listing.
 */

// Export for consumers who need it
export { PRODUCT_LINK_SELECTOR };

const MAX_LISTING_LINKS = 25;

/**
 * Finds the root element of a product listing starting from any child element.
 * 
 * Strategy:
 * 1. First tries to find a known listing container (data attributes, semantic elements)
 * 2. If that fails, walks up the DOM tree to find the smallest container with product links
 * 3. Ensures the result is not document.body
 * 
 * @param {Element} startEl - Any element within a product listing
 * @param {Object} options - Configuration options
 * @param {boolean} options.requireProductLink - Whether the listing must contain a product link (default: true)
 * @returns {Element|null} The root element of the listing, or null if not found
 */
export function findListingRoot(startEl, { requireProductLink = true } = {}) {
    const hasAcceptableLinkCount = (el) => {
        if (!el || !el.querySelectorAll) return false;
        const linkCount = el.querySelectorAll(PRODUCT_LINK_SELECTOR).length;
        return linkCount > 0 && linkCount <= MAX_LISTING_LINKS;
    };

    // Try to find a known listing container type first
    const prefer =
        startEl.closest(LISTING_DATA_SELECTOR) ||
        startEl.closest('[data-test*="product"]') ||
        startEl.closest('[role="listitem"]') ||
        // data-id is a strong signal for a product listing container
        startEl.closest('[data-id]') ||
        startEl.closest("article") ||
        startEl.closest("li");

    if (prefer && prefer !== document.body) {
        if (!requireProductLink || hasAcceptableLinkCount(prefer)) {
            return prefer;
        }
    }

    // Walk up the DOM tree to find the smallest container with product links
    let node = startEl;
    let candidate = null;
    let firstWithProductLink = null;

    while (node && node !== document.body) {
        if (node.querySelector && node.querySelector(PRODUCT_LINK_SELECTOR)) {
            if (!firstWithProductLink) firstWithProductLink = node;
            const linkCount = node.querySelectorAll(PRODUCT_LINK_SELECTOR).length;
            // Prefer containers with 1-25 product links (single product card with variants)
            // Observed counts: Standard=1-2, Variants=~8. Parent list container=~111.
            if (linkCount <= MAX_LISTING_LINKS) {
                candidate = node;
            } else if (candidate) {
                // Stop if we've found a candidate and hit a container with many links
                break;
            }
        }
        node = node.parentElement;
    }

    const resolved = candidate || firstWithProductLink;
    return resolved && resolved !== document.body ? resolved : null;
}

