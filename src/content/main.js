import { createPanel } from "./ui/panel.js";
import { createFloatingButton } from "./ui/floatingButton.js";
import { createToggleStore } from "./state/toggleState.js";
import { injectStylesheet } from "./utils/dom.js";
import { DEFAULT_TOGGLES, EXTENSION_NAME } from "../shared/constants.js";
import { createMerkloosFilter } from "./filters/merkloosFilter.js";
import { createGesponsordFilter } from "./filters/gesponsordFilter.js";
import { createGeneralAdsFilter } from "./filters/generalAdsFilter.js";
import { createVerkoopDoorBolFilter } from "./filters/verkoopDoorBolFilter.js";

const ROOT_ID = "bol-filter-root";
let initialized = false;

function init() {
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

  const store = createToggleStore(DEFAULT_TOGGLES);
  const filters = {
    "filter-merkloos": createMerkloosFilter(),
    "filter-gesponsord": createGesponsordFilter(),
    "filter-general-ads": createGeneralAdsFilter(),
    "filter-verkoop-door-bol": createVerkoopDoorBolFilter()
  };

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

  store.subscribe((list) => {
    list.forEach((toggle) => {
      const filter = filters[toggle.id];
      if (filter && typeof filter.setEnabled === "function") {
        filter.setEnabled(Boolean(toggle.enabled));
      }
    });
  });

  setCollapsed(false);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
