import { createElement } from "../utils/dom.js";
import { EXTENSION_NAME } from "../../shared/constants.js";

export function createWelcomeOverlay() {
  const overlay = createElement("div", {
    className: "bf-welcome",
    attrs: { role: "dialog", "aria-modal": "true", "aria-hidden": "true" }
  });

  const card = createElement("div", { className: "bf-welcome__card" });
  const header = createElement("div", { className: "bf-welcome__header" });
  const logo = createElement("img", {
    className: "bf-welcome__logo",
    attrs: {
      src: chrome.runtime.getURL("images/glazenbol.png"),
      alt: "GlazenBol"
    }
  });
  const eyebrow = createElement("span", { className: "bf-welcome__eyebrow", text: `Welkom bij ${EXTENSION_NAME}` });
  const title = createElement("h2", { className: "bf-welcome__title", text: "Fijn dat je er bent!" });
  const intro = createElement("p", {
    className: "bf-welcome__intro",
    text: "Met deze extensie houd je bol.com overzichtelijk en gefocust."
  });
  header.append(logo, eyebrow, title, intro);

  const steps = createElement("ol", { className: "bf-welcome__steps" });
  const stepItems = [
    "Open het paneel rechtsonder (GlazenBol-knop) als je het niet ziet.",
    "Kies een standaard sortering zodat elke pagina direct goed staat.",
    "Schakel filters in of uit om resultaten te schonen.",
    "Klik op het pijltje om het paneel te minimaliseren."
  ];
  stepItems.forEach((step) => {
    steps.appendChild(createElement("li", { text: step }));
  });

  const hint = createElement("p", {
    className: "bf-welcome__hint",
    text: "Later nog eens lezen? Gebruik de ?-knop in het paneel."
  });

  const footer = createElement("div", { className: "bf-welcome__footer" });
  const closeButton = createElement("button", {
    className: "bf-button bf-button--primary",
    text: "Aan de slag"
  });
  closeButton.type = "button";
  footer.appendChild(closeButton);

  card.append(header, steps, hint, footer);
  overlay.appendChild(card);

  const hide = () => {
    overlay.classList.remove("bf-welcome--visible");
    overlay.setAttribute("aria-hidden", "true");
  };

  const show = () => {
    overlay.classList.add("bf-welcome--visible");
    overlay.setAttribute("aria-hidden", "false");
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    try {
      closeButton.focus({ preventScroll: true });
    } catch (error) {
      closeButton.focus();
    }
    if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
      window.scrollTo(scrollX, scrollY);
    }
  };

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      hide();
    }
  });

  closeButton.addEventListener("click", hide);

  const handleKeydown = (event) => {
    if (event.key === "Escape") {
      hide();
    }
  };

  document.addEventListener("keydown", handleKeydown);

  return {
    element: overlay,
    show,
    hide,
    destroy: () => {
      document.removeEventListener("keydown", handleKeydown);
      overlay.remove();
    }
  };
}
