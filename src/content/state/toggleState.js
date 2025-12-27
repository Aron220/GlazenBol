export function createToggleStore(initialToggles = []) {
  const toggles = new Map();
  const listeners = new Set();

  initialToggles.forEach((toggle) => {
    toggles.set(toggle.id, { ...toggle });
  });

  const notify = () => {
    const snapshot = getAll();
    listeners.forEach((listener) => listener(snapshot));
  };

  const getAll = () => Array.from(toggles.values());

  const setToggle = (id, enabled) => {
    const current = toggles.get(id);
    if (!current || current.enabled === enabled) return;
    toggles.set(id, { ...current, enabled });
    notify();
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    listener(getAll());
    return () => listeners.delete(listener);
  };

  return {
    getAll,
    setToggle,
    subscribe
  };
}
