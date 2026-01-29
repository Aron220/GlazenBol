/**
 * Normalizes text by trimming whitespace and converting to lowercase.
 * Used for case-insensitive comparisons across filters and state management.
 * 
 * @param {string} text - The text to normalize
 * @returns {string} Normalized text
 */
export function normalizeText(text) {
    return (text || "").trim().toLowerCase();
}

/**
 * Extracts text from an element while excluding children with a specific class.
 * This is useful for avoiding buttons or other injected UI elements in labels.
 * 
 * @param {Element} el - The element to extract text from
 * @param {string} excludeClass - The class name identifying elements to exclude
 * @returns {string} The cleaned text
 */
export function getCleanText(el, excludeClass) {
    if (!el) return "";
    if (!excludeClass) return el.textContent || "";

    // If the element itself has the class, it should probably be excluded entirely
    if (el.classList && el.classList.contains(excludeClass)) return "";

    // Optimization: if no children have the class, return textContent directly
    if (!el.querySelector(`.${excludeClass}`)) {
        return el.textContent.trim();
    }

    const clone = el.cloneNode(true);
    clone.querySelectorAll(`.${excludeClass}`).forEach(node => node.remove());
    return clone.textContent.trim();
}
