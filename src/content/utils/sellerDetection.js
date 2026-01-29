import { normalizeText, getCleanText } from "./textUtils.js";
import { BLOCK_BUTTON_CLASS } from "./blockButtonStyles.js";

const SELLER_LABEL_PATTERN = /^verkoop door\s*(.*)$/i;
const SELLER_BOL_PATTERN = /\bbol(?:\.com)?\b/i;

/**
 * Checks if a seller name matches bol.com.
 * 
 * @param {string} text - The seller name to check
 * @returns {boolean} True if the seller is bol.com
 */
export function isBolSeller(text) {
    return SELLER_BOL_PATTERN.test((text || "").trim());
}

/**
 * Extracts seller name from a label element's siblings or children.
 * 
 * @param {Element} labelEl - The label element containing "Verkoop door"
 * @param {Function} getTextFn - Optional function to extract text from elements
 * @returns {string} The seller name, or empty string if not found
 */
export function getSellerFromLabel(labelEl, getTextFn = (el) => getCleanText(el, BLOCK_BUTTON_CLASS)) {
    // Try next sibling first
    let sibling = labelEl.nextElementSibling;
    const siblingText = sibling ? getTextFn(sibling).trim() : "";
    if (siblingText) return siblingText;

    // Try subsequent siblings in parent
    const parent = labelEl.parentElement;
    if (!parent) return "";

    const children = Array.from(parent.children);
    const labelIndex = children.indexOf(labelEl);

    for (let i = labelIndex + 1; i < children.length; i += 1) {
        const text = getTextFn(children[i]).trim();
        if (text) return text;
    }

    return "";
}

/**
 * Finds seller name from an element that might contain "Verkoop door" text.
 * 
 * @param {Element} el - The element to search
 * @param {Function} getTextFn - Optional function to extract text from elements
 * @returns {string} The seller name, or empty string if not found
 */
export function findSellerFromElement(el, getTextFn = (el) => getCleanText(el, BLOCK_BUTTON_CLASS)) {
    // Check aria-label first
    const ariaLabel = (el.getAttribute && el.getAttribute("aria-label")) || "";
    if (ariaLabel) {
        const match = ariaLabel.match(SELLER_LABEL_PATTERN);
        if (match) {
            const remainder = (match[1] || "").trim();
            if (remainder) return remainder;
        }
    }

    // Check text content
    const text = getTextFn(el).trim();
    if (!text) return "";

    const match = text.match(SELLER_LABEL_PATTERN);
    if (!match) return "";

    const remainder = (match[1] || "").trim();
    if (remainder) return remainder;

    // Try to find seller in siblings
    const seller = getSellerFromLabel(el, getTextFn);
    if (seller) return seller;

    return "";
}

/**
 * Export the pattern for use in other modules.
 */
export { SELLER_LABEL_PATTERN };
