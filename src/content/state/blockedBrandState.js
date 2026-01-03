const normalizeBrand = (name) => (name || "").trim().toLowerCase();

const buildBrandList = (input) => {
  const list = Array.isArray(input) ? input : [];
  const seen = new Set();
  const result = [];

  list.forEach((entry) => {
    if (typeof entry !== "string") return;
    const trimmed = entry.trim();
    if (!trimmed) return;
    const normalized = normalizeBrand(trimmed);
    if (seen.has(normalized)) return;
    seen.add(normalized);
    result.push({ name: trimmed, normalized });
  });

  return result;
};

export function createBlockedBrandStore(initial = []) {
  let brands = buildBrandList(initial);
  const listeners = new Set();

  const getSnapshot = () => ({
    brands: brands.map((brand) => brand.name),
    normalized: new Set(brands.map((brand) => brand.normalized))
  });

  const notify = () => {
    const snapshot = getSnapshot();
    listeners.forEach((listener) => listener(snapshot));
  };

  const addBrand = (name) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    const normalized = normalizeBrand(trimmed);
    if (brands.some((brand) => brand.normalized === normalized)) return;
    brands = [...brands, { name: trimmed, normalized }];
    notify();
  };

  const removeBrand = (name) => {
    const normalized = normalizeBrand(name);
    if (!normalized) return;
    const next = brands.filter((brand) => brand.normalized !== normalized);
    if (next.length === brands.length) return;
    brands = next;
    notify();
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    listener(getSnapshot());
    return () => listeners.delete(listener);
  };

  return {
    addBrand,
    removeBrand,
    subscribe
  };
}
