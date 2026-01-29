const isFirefox = typeof browser !== "undefined";
const hasOwnKey = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

function storageGetArea(area, keys) {
  if (isFirefox) {
    return browser.storage[area].get(keys);
  }
  return new Promise((resolve) => {
    chrome.storage[area].get(keys, (result) => {
      resolve(result || {});
    });
  });
}

function storageSetArea(area, data) {
  if (isFirefox) {
    return browser.storage[area].set(data);
  }
  return new Promise((resolve) => {
    chrome.storage[area].set(data, () => {
      resolve();
    });
  });
}

/**
 * Low-level wrapper for browser storage API.
 * Handles cross-browser differences (Firefox generic promise, Chrome callback).
 * 
 * @param {string|string[]|Object} keys - Keys to retrieve
 * @returns {Promise<Object>} Storage data
 */
export function storageGet(keys) {
  return storageGetArea("sync", keys);
}

/**
 * Saves data to browser storage.
 * 
 * @param {Object} data - Key-value pairs to save
 * @returns {Promise<void>}
 */
export function storageSet(data) {
  return storageSetArea("sync", data);
}

/**
 * typed storage getter that ensures the result is an object.
 * Useful for loading configuration states safely.
 * 
 * @param {string} key - The specific key to retrieve
 * @returns {Promise<any>} The value of the key, or undefined
 */
export async function loadStorageValue(key) {
  try {
    const result = await storageGet([key]);
    if (!result || typeof result !== "object") return undefined;
    if (hasOwnKey(result, key)) {
      return result[key];
    }

    const localResult = await storageGetArea("local", [key]);
    if (localResult && typeof localResult === "object" && hasOwnKey(localResult, key)) {
      const value = localResult[key];
      try {
        await storageSet({ [key]: value });
      } catch (err) {
        console.warn(`Failed to migrate storage key "${key}" to sync:`, err);
      }
      return value;
    }
    return undefined;
  } catch (err) {
    console.error(`Error loading storage key "${key}":`, err);
    return undefined;
  }
}
