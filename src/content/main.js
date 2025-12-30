import { createPanel } from "./ui/panel.js";
import { createFloatingButton } from "./ui/floatingButton.js";
import { createWelcomeOverlay } from "./ui/welcomeOverlay.js";
import { createToggleStore } from "./state/toggleState.js";
import { injectStylesheet } from "./utils/dom.js";
import { storageGet, storageSet } from "./utils/storage.js";
import {
  DEFAULT_TOGGLES,
  EXTENSION_NAME,
  PANEL_COLLAPSED_KEY,
  SORT_OPTIONS,
  SORT_PREFERENCE_KEY,
  TOGGLE_STATE_KEY,
  WELCOME_SEEN_KEY
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
const persistWelcomeSeen = () => storageSet({ [WELCOME_SEEN_KEY]: true });
const persistPanelCollapsed = (isCollapsed) => storageSet({ [PANEL_COLLAPSED_KEY]: Boolean(isCollapsed) });

const loadWelcomeSeen = async () => {
  const result = await storageGet(WELCOME_SEEN_KEY);
  if (!result || typeof result !== "object") return false;
  return Boolean(result[WELCOME_SEEN_KEY]);
};

const loadPanelCollapsed = async () => {
  const result = await storageGet(PANEL_COLLAPSED_KEY);
  if (!result || typeof result !== "object") return false;
  const value = result[PANEL_COLLAPSED_KEY];
  return typeof value === "boolean" ? value : false;
};

const SORT_OPTION_VALUES = new Set(
  SORT_OPTIONS.map((option) => option.value).filter(Boolean)
);

const getSortLabelText = (select) => {
  const label = select.getAttribute("label");
  if (label) return label;
  const ariaLabel = select.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;
  const labelledBy = select.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl && labelEl.textContent) return labelEl.textContent.trim();
  }
  if (select.id) {
    const labelEl = document.querySelector(`label[for="${select.id}"]`);
    if (labelEl && labelEl.textContent) return labelEl.textContent.trim();
  }
  return "";
};

const isSortSelect = (select) => {
  if (!select.options || select.options.length === 0) return false;
  const optionValues = Array.from(select.options).map((option) => option.value);
  const matches = optionValues.filter((value) => SORT_OPTION_VALUES.has(value));
  if (matches.length < 2) return false;
  return matches.includes("RELEVANCE") || matches.includes("POPULARITY");
};

const findSortSelect = () => {
  const selects = Array.from(document.querySelectorAll("select"));
  const labeled = selects.find((select) => /sort/i.test(getSortLabelText(select)));
  if (labeled) return labeled;
  return selects.find((select) => isSortSelect(select));
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

  const welcomeOverlay = createWelcomeOverlay();
  const persistedToggles = await loadToggleState();
  const persistedSortPreference = normalizeSortPreference(await loadSortPreference());
  const welcomeSeen = await loadWelcomeSeen();
  const persistedPanelCollapsed = await loadPanelCollapsed();
  const store = createToggleStore(mergeToggles(DEFAULT_TOGGLES, persistedToggles));
  const filters = {
    "filter-merkloos": createMerkloosFilter(),
    "filter-gesponsord": createGesponsordFilter(),
    "filter-general-ads": createGeneralAdsFilter(),
    "filter-verkoop-door-bol": createVerkoopDoorBolFilter()
  };
  const emptyPageMonitor = createEmptyPageMonitor({ root: shadow });

  const setCollapsed = (isCollapsed, { persist = true } = {}) => {
    panel.setVisible(!isCollapsed);
    floatingButton.setVisible(isCollapsed);
    if (persist) {
      void persistPanelCollapsed(isCollapsed);
    }
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
    onCollapse: () => setCollapsed(true),
    onHelp: () => welcomeOverlay.show()
  });

  const floatingButton = createFloatingButton({
    label: EXTENSION_NAME,
    onExpand: () => setCollapsed(false)
  });

  shadow.append(panel.element, floatingButton.element, welcomeOverlay.element);
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
  setCollapsed(persistedPanelCollapsed, { persist: false });

  if (!welcomeSeen) {
    void persistWelcomeSeen();
    welcomeOverlay.show();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
