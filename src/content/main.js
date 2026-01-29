import { createPanel } from "./ui/panel.js";
import { createFloatingButton } from "./ui/floatingButton.js";
import { createWelcomeOverlay, createUpdateOverlay } from "./ui/welcomeOverlay.js";
import { createToggleStore } from "./state/toggleState.js";
import { createBlockedSellerStore } from "./state/blockedSellerState.js";
import { createBlockedBrandStore } from "./state/blockedBrandState.js";
import { injectStylesheet } from "./utils/dom.js";
import { storageSet, loadStorageValue } from "./utils/storage.js";
import { TIMING } from "./utils/timing.js";
import {
  BLOCKED_SELLERS_KEY,
  BLOCKED_BRANDS_KEY,
  DEFAULT_TOGGLES,
  EXTENSION_NAME,
  PANEL_COLLAPSED_KEY,
  PANEL_VIEW_KEY,
  SORT_OPTIONS,
  SORT_PREFERENCE_KEY,
  TOGGLE_STATE_KEY,
  UPDATE_SEEN_VERSION_KEY,
  WELCOME_SEEN_KEY,
  DARK_MODE_KEY
} from "../shared/constants.js";
import { createMerkloosFilter } from "./filters/merkloosFilter.js";
import { createGesponsordFilter } from "./filters/gesponsordFilter.js";
import { createGeneralAdsFilter } from "./filters/generalAdsFilter.js";
import { createVerkoopDoorBolFilter } from "./filters/verkoopDoorBolFilter.js";
import { createGoedeKeuzeFilter } from "./filters/goedeKeuzeFilter.js";
import { createSellerBlockFilter } from "./filters/sellerBlockFilter.js";
import { createBrandBlockFilter } from "./filters/brandBlockFilter.js";
import { createEmptyPageMonitor } from "./emptyPageMonitor.js";

const ROOT_ID = "bol-filter-root";
const GLOBAL_INIT_KEY = "__glazenbolContentInit";
let initialized = false;
let host = null;
let rootObserver = null;
let hostAttachTimer = null;
let syncCollapsedState = null;
let currentCollapsed = false;
let uiReady = false;

const hasReactRootFlag = (node) => {
  if (!node) return false;
  return Object.getOwnPropertyNames(node).some((key) => key.startsWith("__reactFiber$") || key.startsWith("__reactContainer$"));
};

const waitForHydration = async () => {
  const maxAttempts = 20;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (hasReactRootFlag(document.documentElement) || hasReactRootFlag(document.body)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return false;
};

const revealHost = () => {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      if (!host) return;
      host.setAttribute("data-bf-ready", "true");
      host.style.visibility = "visible";
      host.style.pointerEvents = "";
    });
  });
};

const ensureHostAttached = ({ forceReveal = false } = {}) => {
  if (!host) return;
  const parent = document.body || document.documentElement;
  if (!parent) return;
  const needsAttach = !host.isConnected || host.parentElement !== parent;
  if (needsAttach) {
    host.setAttribute("data-bf-ready", "false");
    host.style.visibility = "hidden";
    host.style.pointerEvents = "none";
    parent.appendChild(host);
  }
  if (uiReady && typeof syncCollapsedState === "function" && needsAttach) {
    syncCollapsedState();
  }
  if (uiReady && (needsAttach || forceReveal)) {
    revealHost();
  }
};

const scheduleHostAttach = () => {
  if (hostAttachTimer) return;
  hostAttachTimer = window.setTimeout(() => {
    hostAttachTimer = null;
    ensureHostAttached();
  }, 0);
};

const startRootObserver = () => {
  if (rootObserver) return;
  rootObserver = new MutationObserver(() => {
    scheduleHostAttach();
  });
  rootObserver.observe(document.documentElement, { childList: true, subtree: true });
};

const mergeToggles = (defaults, persisted) => defaults.map((toggle) => {
  if (persisted && Object.prototype.hasOwnProperty.call(persisted, toggle.id)) {
    return { ...toggle, enabled: Boolean(persisted[toggle.id]) };
  }
  return { ...toggle };
});

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

const persistKey = (key, value) => storageSet({ [key]: value });

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
      setTimeout(attempt, TIMING.SORT_RETRY_DELAY);
    }
  };
  attempt();
};

const getExtensionVersion = () => {
  try {
    if (chrome && chrome.runtime && typeof chrome.runtime.getManifest === "function") {
      const manifest = chrome.runtime.getManifest();
      if (manifest && typeof manifest.version === "string") {
        return manifest.version;
      }
    }
  } catch (error) {
    return "";
  }
  return "";
};



async function init() {
  if (initialized) return;
  if (window[GLOBAL_INIT_KEY]) {
    return;
  }
  window[GLOBAL_INIT_KEY] = true;
  initialized = true;

  await waitForHydration();

  const existing = document.getElementById(ROOT_ID);
  if (existing) {
    existing.remove();
  }

  host = document.createElement("div");
  host.id = ROOT_ID;
  host.setAttribute("data-bf-ready", "false");
  host.style.visibility = "hidden";
  host.style.pointerEvents = "none";

  const shadow = host.attachShadow({ mode: "open" });
  const stylesheetReady = injectStylesheet(shadow, chrome.runtime.getURL("src/content/styles/panel.css"));
  ensureHostAttached();
  startRootObserver();

  const welcomeOverlay = createWelcomeOverlay();
  const currentVersion = getExtensionVersion();
  const updateHighlights = [
    "Ondersteuning voor Firefox op Android.",
    "Paneel verschijnt nu stabieler zonder flits.",
    "Geen lege pagina meer na het openen van menu's.",
    "Gesponsorde producten worden nu ook op productpagina's verborgen.",
    "Vraagteken-iconen zijn netjes uitgelijnd."
  ];
  const updateOverlay = createUpdateOverlay({ version: currentVersion, highlights: updateHighlights });

  const persistedToggles = (await loadStorageValue(TOGGLE_STATE_KEY)) || {};
  const persistedSortPreference = normalizeSortPreference((await loadStorageValue(SORT_PREFERENCE_KEY)) || "");

  const rawBlockedSellers = (await loadStorageValue(BLOCKED_SELLERS_KEY)) || [];
  const persistedBlockedSellers = Array.isArray(rawBlockedSellers) ? rawBlockedSellers.filter(s => typeof s === "string") : [];

  const rawBlockedBrands = (await loadStorageValue(BLOCKED_BRANDS_KEY)) || [];
  const persistedBlockedBrands = Array.isArray(rawBlockedBrands) ? rawBlockedBrands.filter(b => typeof b === "string") : [];

  const welcomeSeen = Boolean(await loadStorageValue(WELCOME_SEEN_KEY));
  const updateSeenVersion = (await loadStorageValue(UPDATE_SEEN_VERSION_KEY)) || "";
  const persistedPanelCollapsed = Boolean(await loadStorageValue(PANEL_COLLAPSED_KEY));
  const persistedDarkMode = Boolean(await loadStorageValue(DARK_MODE_KEY));

  const rawPanelView = (await loadStorageValue(PANEL_VIEW_KEY)) || "main";
  const validViews = ["main", "settings", "blocked-sellers", "blocked-brands"];
  const persistedPanelView = validViews.includes(rawPanelView) ? rawPanelView : "main";

  await stylesheetReady;

  const store = createToggleStore(mergeToggles(DEFAULT_TOGGLES, persistedToggles));
  const blockedSellerStore = createBlockedSellerStore(persistedBlockedSellers);
  const blockedBrandStore = createBlockedBrandStore(persistedBlockedBrands);

  const filters = {
    "filter-merkloos": createMerkloosFilter(),
    "filter-gesponsord": createGesponsordFilter(),
    "filter-general-ads": createGeneralAdsFilter(),
    "filter-goede-keuze": createGoedeKeuzeFilter(),
    "filter-verkoop-door-bol": createVerkoopDoorBolFilter(),
    "filter-seller-block": createSellerBlockFilter({ store: blockedSellerStore }),
    "filter-brand-block": createBrandBlockFilter({ store: blockedBrandStore })
  };

  const emptyPageMonitor = createEmptyPageMonitor({ root: shadow });

  const setCollapsed = (isCollapsed, { persist = true } = {}) => {
    const collapsed = Boolean(isCollapsed);
    currentCollapsed = collapsed;
    panel.setVisible(!collapsed);
    floatingButton.setVisible(collapsed);
    if (persist) {
      persistKey(PANEL_COLLAPSED_KEY, collapsed);
    }
  };

  syncCollapsedState = () => setCollapsed(currentCollapsed, { persist: false });

  const panel = createPanel({
    store,
    blockedSellerStore,
    blockedBrandStore,
    sortOptions: SORT_OPTIONS,
    sortValue: persistedSortPreference,
    onSortChange: (value) => {
      const normalized = normalizeSortPreference(value);
      persistKey(SORT_PREFERENCE_KEY, normalized);
      scheduleSortPreference(normalized);
    },
    onCollapse: () => setCollapsed(true),
    onHelp: () => welcomeOverlay.show(),
    darkModeEnabled: persistedDarkMode,
    onDarkModeChange: (enabled) => {
      panel.setDarkMode(enabled);
      floatingButton.setDarkMode(enabled);
      persistKey(DARK_MODE_KEY, enabled);
    },
    currentView: persistedPanelView,
    onViewChange: (view) => {
      persistKey(PANEL_VIEW_KEY, view);
    }
  });

  const floatingButton = createFloatingButton({
    label: EXTENSION_NAME,
    darkModeEnabled: persistedDarkMode,
    onExpand: () => setCollapsed(false)
  });

  setCollapsed(persistedPanelCollapsed, { persist: false });
  shadow.append(
    panel.element,
    panel.tooltipElement,
    floatingButton.element,
    welcomeOverlay.element,
    updateOverlay.element
  );
  uiReady = true;
  ensureHostAttached({ forceReveal: true });

  Object.values(filters).forEach((filter) => filter.observe());
  emptyPageMonitor.observe();
  emptyPageMonitor.scheduleCheck({ delayMs: 500 }); // Using logic inside emptyPageMonitor which handles default, but here explicit is fine

  store.subscribe((list) => {
    const activeState = {};
    list.forEach((toggle) => {
      const filter = filters[toggle.id];
      if (filter && typeof filter.setEnabled === "function") {
        filter.setEnabled(Boolean(toggle.enabled));
      }
      activeState[toggle.id] = toggle.enabled;
    });
    // We can use persistKey here but persistToggleState has extra logic to transform list to object, 
    // which I kept above? Yes.
    persistToggleState(list);
    emptyPageMonitor.scheduleCheck();
  });

  blockedSellerStore.subscribe(({ sellers }) => {
    persistKey(BLOCKED_SELLERS_KEY, sellers);
    emptyPageMonitor.scheduleCheck();
  });

  blockedBrandStore.subscribe(({ brands }) => {
    persistKey(BLOCKED_BRANDS_KEY, brands);
    emptyPageMonitor.scheduleCheck();
  });

  scheduleSortPreference(persistedSortPreference);

  if (!welcomeSeen) {
    persistKey(WELCOME_SEEN_KEY, true);
    if (currentVersion) {
      persistKey(UPDATE_SEEN_VERSION_KEY, currentVersion);
    }
    welcomeOverlay.show();
  } else if (currentVersion && updateSeenVersion !== currentVersion) {
    persistKey(UPDATE_SEEN_VERSION_KEY, currentVersion);
    updateOverlay.show();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
