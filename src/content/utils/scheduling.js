/**
 * Utility for creating a debounced scanner.
 * Standardizes the "scheduleScan" pattern used across all filters.
 * 
 * @param {Function} scanFn - The function to execute
 * @param {number} delayMs - Delay in milliseconds
 * @returns {Object} { schedule, clear }
 */
export function createDebouncedScanner(scanFn, delayMs) {
    let timer = null;

    const schedule = () => {
        if (timer) return;
        timer = window.setTimeout(() => {
            timer = null;
            scanFn();
        }, delayMs);
    };

    const clear = () => {
        if (timer) {
            window.clearTimeout(timer);
            timer = null;
        }
    };

    return { schedule, clear };
}
