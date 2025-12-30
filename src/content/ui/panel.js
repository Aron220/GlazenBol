import { createElement } from "../utils/dom.js";
import { EXTENSION_NAME } from "../../shared/constants.js";

export function createPanel({
  store,
  sortOptions = [],
  sortValue = "",
  onSortChange,
  onCollapse,
  onHelp
}) {
  const panel = createElement("section", { className: "bf-panel" });

  const header = createElement("header", { className: "bf-panel__header" });
  const brand = createElement("div", { className: "bf-brand" });
  const brandLogo = createElement("img", {
    className: "bf-brand__logo",
    attrs: {
      src: chrome.runtime.getURL("images/glazenbol.png"),
      alt: "GlazenBol logo"
    }
  });
  const brandName = createElement("span", { className: "bf-brand__name", text: EXTENSION_NAME });
  brand.append(brandLogo, brandName);

  const actions = createElement("div", { className: "bf-panel__actions" });
  const helpButton = createElement("button", { className: "bf-button bf-button--ghost bf-button--icon", text: "?" });
  helpButton.type = "button";
  helpButton.setAttribute("aria-label", "Uitleg");
  helpButton.addEventListener("click", () => {
    if (typeof onHelp === "function") {
      onHelp();
    }
  });

  const collapseButton = createElement("button", { className: "bf-button bf-button--ghost", text: "▼" });
  collapseButton.type = "button";
  collapseButton.addEventListener("click", () => onCollapse());

  actions.append(helpButton, collapseButton);
  header.append(brand, actions);

  const body = createElement("div", { className: "bf-panel__body" });
  const sortSection = createElement("div", { className: "bf-sort" });
  const sortLabel = createElement("label", { className: "bf-sort__label", text: "Standaard sortering" });
  const sortSelect = createElement("select", {
    className: "bf-select",
    attrs: { "aria-label": "Standaard sortering" }
  });
  sortOptions.forEach((option) => {
    const optionEl = createElement("option", { text: option.label });
    optionEl.value = option.value;
    sortSelect.appendChild(optionEl);
  });
  sortSelect.value = sortValue;
  sortSelect.addEventListener("change", (event) => {
    if (typeof onSortChange === "function") {
      onSortChange(event.target.value);
    }
  });
  const sortMain = createElement("div", { className: "bf-sort__main" });
  sortMain.append(sortLabel, sortSelect);
  sortSection.append(sortMain);

  const sectionTitle = createElement("div", { className: "bf-section-title", text: "Filteropties" });
  const togglesList = createElement("div", { className: "bf-toggle-list" });
  body.append(sortSection, sectionTitle, togglesList);

  panel.append(header, body);

  const renderToggle = (toggle) => {
    const item = createElement("label", { className: "bf-toggle" });
    const main = createElement("div", { className: "bf-toggle__main" });
    const textWrap = createElement("div", { className: "bf-toggle__text" });
    const name = createElement("span", { className: "bf-toggle__label", text: toggle.label });
    const input = createElement("input", { attrs: { type: "checkbox" }, className: "bf-switch__input" });
    input.checked = Boolean(toggle.enabled);
    input.addEventListener("change", (event) => {
      store.setToggle(toggle.id, event.target.checked);
    });

    const switchEl = createElement("span", { className: "bf-switch" });
    const switchKnob = createElement("span", { className: "bf-switch__knob" });
    switchEl.appendChild(switchKnob);

    main.append(textWrap, input, switchEl);
    if (toggle.badgeSvg) {
      name.classList.add("bf-toggle__label--with-badge");
      const badge = createElement("span", {
        className: "bf-toggle__badge",
        attrs: {
          role: "img",
          "aria-label": toggle.badgeAlt || ""
        }
      });
      badge.innerHTML = toggle.badgeSvg;
      name.appendChild(badge);
    }

    textWrap.appendChild(name);

    if (toggle.description) {
      const desc = createElement("p", { className: "bf-toggle__description", text: toggle.description });
      textWrap.appendChild(desc);
    }

    item.appendChild(main);
    return item;
  };

  const renderToggles = (list) => {
    togglesList.innerHTML = "";
    list.forEach((toggle) => togglesList.appendChild(renderToggle(toggle)));
  };

  const setVisible = (isVisible) => {
    panel.classList.toggle("bf-panel--collapsed", !isVisible);
    panel.setAttribute("aria-hidden", String(!isVisible));
  };

  const unsubscribe = store.subscribe(renderToggles);

  return {
    element: panel,
    setVisible,
    destroy: () => {
      unsubscribe();
      panel.remove();
    }
  };
}
