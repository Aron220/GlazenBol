const normalizeSeller = (name) => (name || "").trim().toLowerCase();

const buildSellerList = (input) => {
  const list = Array.isArray(input) ? input : [];
  const seen = new Set();
  const result = [];

  list.forEach((entry) => {
    if (typeof entry !== "string") return;
    const trimmed = entry.trim();
    if (!trimmed) return;
    const normalized = normalizeSeller(trimmed);
    if (seen.has(normalized)) return;
    seen.add(normalized);
    result.push({ name: trimmed, normalized });
  });

  return result;
};

export function createBlockedSellerStore(initial = []) {
  let sellers = buildSellerList(initial);
  const listeners = new Set();

  const getSnapshot = () => ({
    sellers: sellers.map((seller) => seller.name),
    normalized: new Set(sellers.map((seller) => seller.normalized))
  });

  const notify = () => {
    const snapshot = getSnapshot();
    listeners.forEach((listener) => listener(snapshot));
  };

  const addSeller = (name) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    const normalized = normalizeSeller(trimmed);
    if (sellers.some((seller) => seller.normalized === normalized)) return;
    sellers = [...sellers, { name: trimmed, normalized }];
    notify();
  };

  const removeSeller = (name) => {
    const normalized = normalizeSeller(name);
    if (!normalized) return;
    const next = sellers.filter((seller) => seller.normalized !== normalized);
    if (next.length === sellers.length) return;
    sellers = next;
    notify();
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    listener(getSnapshot());
    return () => listeners.delete(listener);
  };

  return {
    addSeller,
    removeSeller,
    subscribe
  };
}
