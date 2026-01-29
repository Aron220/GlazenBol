import { createBlockedItemStore } from "./blockedItemStore.js";

/**
 * Creates a store for managing blocked brands.
 * Wraps the generic blocked item store with brand-specific method names.
 * 
 * @param {string[]} initial - Initial list of blocked brand names
 * @returns {Object} Store with addBrand, removeBrand, and subscribe methods
 */
export function createBlockedBrandStore(initial = []) {
  const store = createBlockedItemStore(initial, "brands");

  return {
    addBrand: store.add,
    removeBrand: store.remove,
    subscribe: store.subscribe
  };
}
