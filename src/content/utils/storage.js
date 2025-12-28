const getStorageArea = () => {
  if (typeof browser !== "undefined" && browser.storage && browser.storage.local) {
    return browser.storage.local;
  }
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    return chrome.storage.local;
  }
  return null;
};

const getRuntimeError = () => {
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.lastError) {
    return chrome.runtime.lastError;
  }
  return null;
};

export const storageGet = (key) => {
  const storage = getStorageArea();
  if (!storage) return Promise.resolve({});

  try {
    const result = storage.get(key);
    if (result && typeof result.then === "function") {
      return result;
    }
  } catch (error) {
    return Promise.resolve({});
  }

  return new Promise((resolve) => {
    storage.get(key, (items) => {
      if (getRuntimeError()) {
        resolve({});
        return;
      }
      resolve(items || {});
    });
  });
};

export const storageSet = (items) => {
  const storage = getStorageArea();
  if (!storage) return Promise.resolve();

  try {
    const result = storage.set(items);
    if (result && typeof result.then === "function") {
      return result;
    }
  } catch (error) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    storage.set(items, () => resolve());
  });
};
