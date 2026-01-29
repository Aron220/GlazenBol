/**
 * Generic blocked item store factory.
 * Provides a reusable store implementation for managing blocked items (sellers, brands, etc.)
 * with case-insensitive deduplication and reactive subscriptions.
 */

/**
 * Creates a store for managing a list of blocked items.
 * 
 * @param {string[]} initial - Initial list of blocked items
 * @param {string} itemType - The property name for items in snapshots (e.g., "sellers", "brands")
 * @returns {Object} Store with add, remove, and subscribe methods
 */
export function createBlockedItemStore(initial = [], itemType = "items") {
    const normalize = (name) => (name || "").trim().toLowerCase();

    const buildList = (input) => {
        const list = Array.isArray(input) ? input : [];
        const seen = new Set();
        const result = [];

        list.forEach((entry) => {
            if (typeof entry !== "string") return;
            const trimmed = entry.trim();
            if (!trimmed) return;
            const normalized = normalize(trimmed);
            if (seen.has(normalized)) return;
            seen.add(normalized);
            result.push({ name: trimmed, normalized });
        });

        return result;
    };

    let items = buildList(initial);
    const listeners = new Set();

    const getSnapshot = () => ({
        [itemType]: items.map((item) => item.name),
        normalized: new Set(items.map((item) => item.normalized))
    });

    const notify = () => {
        const snapshot = getSnapshot();
        listeners.forEach((listener) => listener(snapshot));
    };

    const add = (name) => {
        const trimmed = (name || "").trim();
        if (!trimmed) return;
        const normalized = normalize(trimmed);
        if (items.some((item) => item.normalized === normalized)) return;
        items = [...items, { name: trimmed, normalized }];
        notify();
    };

    const remove = (name) => {
        const normalized = normalize(name);
        if (!normalized) return;
        const next = items.filter((item) => item.normalized !== normalized);
        if (next.length === items.length) return;
        items = next;
        notify();
    };

    const subscribe = (listener) => {
        listeners.add(listener);
        listener(getSnapshot());
        return () => listeners.delete(listener);
    };

    return { add, remove, subscribe };
}
