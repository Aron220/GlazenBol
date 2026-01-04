import { createElement } from "../utils/dom.js";
import { EXTENSION_NAME } from "../../shared/constants.js";

export function createPanel({
  store,
  blockedSellerStore,
  blockedBrandStore,
  sortOptions = [],
  sortValue = "",
  onSortChange,
  onCollapse,
  onHelp
}) {
  const panel = createElement("section", { className: "bf-panel" });
  const tooltip = createElement("div", { className: "bf-global-tooltip" });
  tooltip.style.display = "none";

  const attachTooltip = (icon) => {
    const showTooltip = () => {
      const text = icon.getAttribute("data-tooltip");
      if (!text) return;

      tooltip.textContent = text;
      tooltip.style.display = "block";

      const rect = icon.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();

      let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));

      let top = rect.top - tooltipRect.height - 8;
      if (top < 8) top = rect.bottom + 8;

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      tooltip.style.opacity = "1";
    };

    const hideTooltip = () => {
      tooltip.style.opacity = "0";
      tooltip.style.display = "none";
    };

    icon.addEventListener("mouseenter", showTooltip);
    icon.addEventListener("mouseleave", hideTooltip);
    icon.addEventListener("focus", showTooltip);
    icon.addEventListener("blur", hideTooltip);
  };

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
  const view = createElement("div", { className: "bf-panel__view" });
  const mainView = createElement("div", { className: "bf-panel__view-panel bf-panel__view-panel--active" });
  const blockedSellerView = createElement("div", { className: "bf-panel__view-panel" });
  const blockedBrandView = createElement("div", { className: "bf-panel__view-panel" });
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
  const blockedSellerTitle = createElement("div", { className: "bf-section-title", text: "Geblokkeerde verkopers" });
  const blockedSellerManageButton = createElement("button", {
    className: "bf-button bf-button--ghost bf-button--block",
    text: "Beheer geblokkeerde verkopers"
  });
  blockedSellerManageButton.type = "button";
  const blockedSellerWrap = createElement("div", { className: "bf-blocked" });
  const blockedSellerList = createElement("div", { className: "bf-blocked__list" });
  const blockedSellerEmpty = createElement("p", {
    className: "bf-blocked__empty",
    text: "Nog geen verkopers geblokkeerd."
  });
  const blockedSellerHint = createElement("p", {
    className: "bf-blocked__hint",
    text: "Je kunt een verkoper blokkeren door in de zoekresultaten op de knop 'Blokkeer' naast de verkoper te klikken."
  });
  blockedSellerWrap.append(blockedSellerList, blockedSellerEmpty, blockedSellerHint);

  const blockedBrandTitle = createElement("div", { className: "bf-section-title", text: "Geblokkeerde merken" });
  const blockedBrandManageButton = createElement("button", {
    className: "bf-button bf-button--ghost bf-button--block",
    text: "Beheer geblokkeerde merken"
  });
  blockedBrandManageButton.type = "button";
  const blockedBrandWrap = createElement("div", { className: "bf-blocked" });
  const blockedBrandList = createElement("div", { className: "bf-blocked__list" });
  const blockedBrandEmpty = createElement("p", {
    className: "bf-blocked__empty",
    text: "Nog geen merken geblokkeerd."
  });
  const blockedBrandHint = createElement("p", {
    className: "bf-blocked__hint",
    text: "Je kunt een merk blokkeren door in de zoekresultaten op de knop 'Blokkeer' naast het merk te klikken."
  });
  blockedBrandWrap.append(blockedBrandList, blockedBrandEmpty, blockedBrandHint);

  mainView.append(
    sortSection,
    sectionTitle,
    togglesList,
    blockedSellerTitle,
    blockedSellerManageButton,
    blockedBrandTitle,
    blockedBrandManageButton
  );

  const blockedSellerHeader = createElement("div", { className: "bf-blocked__header" });
  const blockedSellerHeaderTitle = createElement("div", { className: "bf-section-title", text: "Geblokkeerde verkopers" });
  const sellerBackButton = createElement("button", { className: "bf-button bf-button--ghost", text: "Terug" });
  sellerBackButton.type = "button";
  blockedSellerHeader.append(blockedSellerHeaderTitle, sellerBackButton);
  blockedSellerView.append(blockedSellerHeader, blockedSellerWrap);

  const blockedBrandHeader = createElement("div", { className: "bf-blocked__header" });
  const blockedBrandHeaderTitle = createElement("div", { className: "bf-section-title", text: "Geblokkeerde merken" });
  const brandBackButton = createElement("button", { className: "bf-button bf-button--ghost", text: "Terug" });
  brandBackButton.type = "button";
  blockedBrandHeader.append(blockedBrandHeaderTitle, brandBackButton);
  blockedBrandView.append(blockedBrandHeader, blockedBrandWrap);

  view.append(mainView, blockedSellerView, blockedBrandView);
  body.append(view);

  const footer = createElement("footer", { className: "bf-panel__footer" });
  const bmcWrap = createElement("div", { className: "bf-bmc" });
  const bmcLink = createElement("a", {
    className: "bf-bmc__button",
    text: "☕ Buy me a coffee",
    attrs: {
      href: "https://www.buymeacoffee.com/cleanplaats",
      target: "_blank",
      rel: "noopener noreferrer",
      "aria-label": "Buy me a coffee (opens in a new tab)"
    }
  });
  bmcWrap.appendChild(bmcLink);
  footer.appendChild(bmcWrap);

  panel.append(header, body, footer);

  const renderToggle = (toggle) => {
    const item = createElement("label", { className: "bf-toggle" });
    const main = createElement("div", { className: "bf-toggle__main" });
    const textWrap = createElement("div", { className: "bf-toggle__text" });
    const labelRow = createElement("div", { className: "bf-toggle__label-row" });
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

    labelRow.appendChild(name);
    if (toggle.tooltip) {
      const help = createElement("span", {
        className: "bf-tooltip-icon",
        text: "?",
        attrs: {
          "data-tooltip": toggle.tooltip,
          role: "img",
          tabindex: "0",
          "aria-label": `Info over ${toggle.label}`
        }
      });
      attachTooltip(help);
      labelRow.appendChild(help);
    }

    textWrap.appendChild(labelRow);

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
  let unsubscribeBlockedSellers = null;
  let unsubscribeBlockedBrands = null;

  const renderBlockedSellers = (snapshot) => {
    const sellers = (snapshot && snapshot.sellers) || [];
    blockedSellerManageButton.textContent = `Beheer geblokkeerde verkopers (${sellers.length})`;
    blockedSellerList.innerHTML = "";
    if (!sellers.length) {
      blockedSellerEmpty.style.display = "block";
      blockedSellerHint.style.display = "block";
      return;
    }
    blockedSellerEmpty.style.display = "none";
    blockedSellerHint.style.display = "none";
    sellers.forEach((seller) => {
      const item = createElement("div", { className: "bf-blocked__item" });
      const name = createElement("span", { className: "bf-blocked__name", text: seller });
      const button = createElement("button", { className: "bf-button bf-button--ghost bf-button--small", text: "Deblokkeer" });
      button.type = "button";
      button.addEventListener("click", () => {
        if (blockedSellerStore && typeof blockedSellerStore.removeSeller === "function") {
          blockedSellerStore.removeSeller(seller);
        }
      });
      item.append(name, button);
      blockedSellerList.appendChild(item);
    });
  };

  if (blockedSellerStore && typeof blockedSellerStore.subscribe === "function") {
    unsubscribeBlockedSellers = blockedSellerStore.subscribe(renderBlockedSellers);
  } else {
    renderBlockedSellers({ sellers: [] });
  }

  const renderBlockedBrands = (snapshot) => {
    const brands = (snapshot && snapshot.brands) || [];
    blockedBrandManageButton.textContent = `Beheer geblokkeerde merken (${brands.length})`;
    blockedBrandList.innerHTML = "";
    if (!brands.length) {
      blockedBrandEmpty.style.display = "block";
      blockedBrandHint.style.display = "block";
      return;
    }
    blockedBrandEmpty.style.display = "none";
    blockedBrandHint.style.display = "none";
    brands.forEach((brand) => {
      const item = createElement("div", { className: "bf-blocked__item" });
      const name = createElement("span", { className: "bf-blocked__name", text: brand });
      const button = createElement("button", { className: "bf-button bf-button--ghost bf-button--small", text: "Deblokkeer" });
      button.type = "button";
      button.addEventListener("click", () => {
        if (blockedBrandStore && typeof blockedBrandStore.removeBrand === "function") {
          blockedBrandStore.removeBrand(brand);
        }
      });
      item.append(name, button);
      blockedBrandList.appendChild(item);
    });
  };

  if (blockedBrandStore && typeof blockedBrandStore.subscribe === "function") {
    unsubscribeBlockedBrands = blockedBrandStore.subscribe(renderBlockedBrands);
  } else {
    renderBlockedBrands({ brands: [] });
  }

  const setView = (target) => {
    const showMain = target === "main";
    const showSellers = target === "blocked-sellers";
    const showBrands = target === "blocked-brands";
    mainView.classList.toggle("bf-panel__view-panel--active", showMain);
    blockedSellerView.classList.toggle("bf-panel__view-panel--active", showSellers);
    blockedBrandView.classList.toggle("bf-panel__view-panel--active", showBrands);
  };

  blockedSellerManageButton.addEventListener("click", () => setView("blocked-sellers"));
  sellerBackButton.addEventListener("click", () => setView("main"));
  blockedBrandManageButton.addEventListener("click", () => setView("blocked-brands"));
  brandBackButton.addEventListener("click", () => setView("main"));

  return {
    element: panel,
    tooltipElement: tooltip,
    setVisible,
    destroy: () => {
      unsubscribe();
      if (unsubscribeBlockedSellers) {
        unsubscribeBlockedSellers();
      }
      if (unsubscribeBlockedBrands) {
        unsubscribeBlockedBrands();
      }
      panel.remove();
    }
  };
}
