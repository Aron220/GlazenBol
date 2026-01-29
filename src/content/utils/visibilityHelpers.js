import { markHidden, unmarkHidden } from "../filters/visibility.js";

/**
 * Creates hide/show helper functions for a specific visibility marker attribute.
 * This factory eliminates duplicate hide/show functions across all filter modules.
 * 
 * @param {string} markerAttr - The data attribute to use for marking hidden elements
 * @returns {Object} Object with hide() and show() methods
 */
export function createVisibilityHelpers(markerAttr) {
    return {
        /**
         * Hides a listing element by marking it with the visibility attribute.
         * Skips document.body and document.documentElement for safety.
         * 
         * @param {Element} listingEl - The listing element to hide
         */
        hide(listingEl) {
            if (listingEl === document.body || listingEl === document.documentElement) return;
            markHidden(listingEl, markerAttr);
        },

        /**
         * Shows a listing element by removing the visibility attribute.
         * Skips document.body and document.documentElement for safety.
         * 
         * @param {Element} listingEl - The listing element to show
         */
        show(listingEl) {
            if (listingEl === document.body || listingEl === document.documentElement) return;
            unmarkHidden(listingEl, markerAttr);
        }
    };
}
