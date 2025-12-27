import { createElement } from "../utils/dom.js";
import { EXTENSION_NAME } from "../../shared/constants.js";

export function createPanel({ store, onCollapse }) {
  const panel = createElement("section", { className: "bf-panel" });

  const header = createElement("header", { className: "bf-panel__header" });
  const brand = createElement("div", { className: "bf-brand" });
  const brandDot = createElement("span", { className: "bf-brand__dot" });
  const brandName = createElement("span", { className: "bf-brand__name", text: EXTENSION_NAME });
  const brandStatus = createElement("span", { className: "bf-brand__status", text: "Aan" });
  brand.append(brandDot, brandName, brandStatus);

  const collapseButton = createElement("button", { className: "bf-button bf-button--ghost", text: "▼" });
  collapseButton.type = "button";
  collapseButton.addEventListener("click", () => onCollapse());

  header.append(brand, collapseButton);

  const body = createElement("div", { className: "bf-panel__body" });
  const sectionTitle = createElement("div", { className: "bf-section-title", text: "Filteropties" });
  const togglesList = createElement("div", { className: "bf-toggle-list" });
  body.append(sectionTitle, togglesList);

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
    panel.style.display = isVisible ? "flex" : "none";
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
