import { createPanel } from "./ui/panel.js";
import { createFloatingButton } from "./ui/floatingButton.js";
import { createToggleStore } from "./state/toggleState.js";
import { injectStylesheet } from "./utils/dom.js";
import { storageGet, storageSet } from "./utils/storage.js";
import {
  DEFAULT_TOGGLES,
  EXTENSION_NAME,
  SORT_OPTIONS,
  SORT_PREFERENCE_KEY,
  TOGGLE_STATE_KEY
} from "../shared/constants.js";
import { createMerkloosFilter } from "./filters/merkloosFilter.js";
import { createGesponsordFilter } from "./filters/gesponsordFilter.js";
import { createGeneralAdsFilter } from "./filters/generalAdsFilter.js";
import { createVerkoopDoorBolFilter } from "./filters/verkoopDoorBolFilter.js";
import { createEmptyPageMonitor } from "./emptyPageMonitor.js";

const ROOT_ID = "bol-filter-root";
let initialized = false;

const loadToggleState = async () => {
  const result = await storageGet(TOGGLE_STATE_KEY);
  if (!result || typeof result !== "object") return null;
  const state = result[TOGGLE_STATE_KEY];
  if (!state || typeof state !== "object") return null;
  return state;
};

const mergeToggles = (defaults, persisted) => defaults.map((toggle) => {
  if (persisted && Object.prototype.hasOwnProperty.call(persisted, toggle.id)) {
    return { ...toggle, enabled: Boolean(persisted[toggle.id]) };
  }
  return { ...toggle };
});

const loadSortPreference = async () => {
  const result = await storageGet(SORT_PREFERENCE_KEY);
  if (!result || typeof result !== "object") return "";
  const preference = result[SORT_PREFERENCE_KEY];
  return typeof preference === "string" ? preference : "";
};

const normalizeSortPreference = (value) => {
  const allowed = new Set(SORT_OPTIONS.map((option) => option.value));
  return allowed.has(value) ? value : "";
};

const persistToggleState = (list) => {
  const state = {};
  list.forEach((toggle) => {
    state[toggle.id] = Boolean(toggle.enabled);
  });
  return storageSet({ [TOGGLE_STATE_KEY]: state });
};

const persistSortPreference = (value) => storageSet({ [SORT_PREFERENCE_KEY]: value });

const findSortSelect = () => {
  const selects = Array.from(document.querySelectorAll("select"));
  return selects.find((select) => {
    if (!select.options || select.options.length === 0) return false;
    const optionValues = Array.from(select.options).map((option) => option.value);
    return optionValues.includes("RELEVANCE") && optionValues.includes("POPULARITY");
  });
};

const applySortPreference = (preference) => {
  if (!preference) return false;
  const select = findSortSelect();
  if (!select) return false;
  if (select.value === preference) return true;
  select.value = preference;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
};

const scheduleSortPreference = (preference) => {
  if (!preference) return;
  let attempts = 0;
  const maxAttempts = 20;
  const attempt = () => {
    if (applySortPreference(preference)) return;
    attempts += 1;
    if (attempts < maxAttempts) {
      setTimeout(attempt, 250);
    }
  };
  attempt();
};

async function init() {
  if (initialized) return;
  initialized = true;

  const existing = document.getElementById(ROOT_ID);
  if (existing) {
    existing.remove();
  }

  const host = document.createElement("div");
  host.id = ROOT_ID;

  const shadow = host.attachShadow({ mode: "open" });
  injectStylesheet(shadow, chrome.runtime.getURL("src/content/styles/panel.css"));

  const persistedToggles = await loadToggleState();
  const persistedSortPreference = normalizeSortPreference(await loadSortPreference());
  const store = createToggleStore(mergeToggles(DEFAULT_TOGGLES, persistedToggles));
  const filters = {
    "filter-merkloos": createMerkloosFilter(),
    "filter-gesponsord": createGesponsordFilter(),
    "filter-general-ads": createGeneralAdsFilter(),
    "filter-verkoop-door-bol": createVerkoopDoorBolFilter()
  };
  const emptyPageMonitor = createEmptyPageMonitor({ root: shadow });

  const setCollapsed = (isCollapsed) => {
    panel.setVisible(!isCollapsed);
    floatingButton.setVisible(isCollapsed);
  };

  const panel = createPanel({
    store,
    sortOptions: SORT_OPTIONS,
    sortValue: persistedSortPreference,
    onSortChange: (value) => {
      const normalized = normalizeSortPreference(value);
      void persistSortPreference(normalized);
      scheduleSortPreference(normalized);
    },
    onCollapse: () => setCollapsed(true)
  });

  const floatingButton = createFloatingButton({
    label: EXTENSION_NAME,
    onExpand: () => setCollapsed(false)
  });

  shadow.append(panel.element, floatingButton.element);
  document.body.appendChild(host);

  Object.values(filters).forEach((filter) => filter.observe());
  emptyPageMonitor.observe();
  emptyPageMonitor.scheduleCheck({ delayMs: 300 });

  store.subscribe((list) => {
    list.forEach((toggle) => {
      const filter = filters[toggle.id];
      if (filter && typeof filter.setEnabled === "function") {
        filter.setEnabled(Boolean(toggle.enabled));
      }
    });
    void persistToggleState(list);
    emptyPageMonitor.scheduleCheck();
  });

  scheduleSortPreference(persistedSortPreference);
  setCollapsed(false);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
