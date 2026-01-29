import { createBlockedItemStore } from "./blockedItemStore.js";

/**
 * Creates a store for managing blocked sellers.
 * Wraps the generic blocked item store with seller-specific method names.
 * 
 * @param {string[]} initial - Initial list of blocked seller names
 * @returns {Object} Store with addSeller, removeSeller, and subscribe methods
 */
export function createBlockedSellerStore(initial = []) {
  const store = createBlockedItemStore(initial, "sellers");

  return {
    addSeller: store.add,
    removeSeller: store.remove,
    subscribe: store.subscribe
  };
}
