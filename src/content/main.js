import { createPanel } from "./ui/panel.js";
import { createFloatingButton } from "./ui/floatingButton.js";
import { createToggleStore } from "./state/toggleState.js";
import { injectStylesheet } from "./utils/dom.js";
import { storageGet, storageSet } from "./utils/storage.js";
import { DEFAULT_TOGGLES, EXTENSION_NAME, TOGGLE_STATE_KEY } from "../shared/constants.js";
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

const persistToggleState = (list) => {
  const state = {};
  list.forEach((toggle) => {
    state[toggle.id] = Boolean(toggle.enabled);
  });
  return storageSet({ [TOGGLE_STATE_KEY]: state });
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

  setCollapsed(false);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
