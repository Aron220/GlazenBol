import { createElement } from "../utils/dom.js";
import { EXTENSION_NAME } from "../../shared/constants.js";

const createInfoOverlay = ({ eyebrowText, titleText, introText, steps, noteText, hintText, buttonText }) => {
  const overlay = createElement("div", {
    className: "bf-welcome",
    attrs: { role: "dialog", "aria-modal": "true", "aria-hidden": "true" }
  });
  overlay.style.opacity = "0";
  overlay.style.pointerEvents = "none";

  const card = createElement("div", { className: "bf-welcome__card" });
  const header = createElement("div", { className: "bf-welcome__header" });
  const logo = createElement("img", {
    className: "bf-welcome__logo",
    attrs: {
      src: chrome.runtime.getURL("images/glazenbol.png"),
      alt: "GlazenBol"
    }
  });
  const eyebrow = createElement("span", { className: "bf-welcome__eyebrow", text: eyebrowText });
  const title = createElement("h2", { className: "bf-welcome__title", text: titleText });
  const intro = createElement("p", {
    className: "bf-welcome__intro",
    text: introText
  });
  header.append(logo, eyebrow, title, intro);

  let stepsElement = null;
  if (Array.isArray(steps) && steps.length > 0) {
    stepsElement = createElement("ol", { className: "bf-welcome__steps" });
    steps.forEach((step) => {
      stepsElement.appendChild(createElement("li", { text: step }));
    });
  }

  let note = null;
  if (noteText) {
    note = createElement("p", {
      className: "bf-welcome__hint",
      text: noteText
    });
  }

  let hint = null;
  if (hintText) {
    hint = createElement("p", {
      className: "bf-welcome__hint",
      text: hintText
    });
  }

  const footer = createElement("div", { className: "bf-welcome__footer" });
  const closeButton = createElement("button", {
    className: "bf-button bf-button--primary",
    text: buttonText
  });
  closeButton.type = "button";
  footer.appendChild(closeButton);

  card.append(header);
  if (stepsElement) {
    card.appendChild(stepsElement);
  }
  if (note) {
    card.appendChild(note);
  }
  if (hint) {
    card.appendChild(hint);
  }
  card.appendChild(footer);
  overlay.appendChild(card);

  const hide = () => {
    overlay.classList.remove("bf-welcome--visible");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
  };

  const show = () => {
    overlay.style.opacity = "";
    overlay.style.pointerEvents = "";
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
};

export function createWelcomeOverlay() {
  return createInfoOverlay({
    eyebrowText: `Welkom bij ${EXTENSION_NAME}`,
    titleText: "Fijn dat je er bent!",
    introText: "Met deze extensie houd je bol.com overzichtelijk en gefocust.",
    steps: [
      "Open het paneel rechtsonder (GlazenBol-knop) als je het niet ziet.",
      "Kies een standaard sortering zodat elke pagina direct goed staat.",
      "Schakel filters in of uit om resultaten te schonen.",
      "Klik op het pijltje om het paneel te minimaliseren."
    ],
    hintText: "Later nog eens lezen? Gebruik de ?-knop in het paneel.",
    buttonText: "Aan de slag"
  });
}

export function createUpdateOverlay({ version, highlights }) {
  const titleSuffix = version ? ` (${version})` : "";
  return createInfoOverlay({
    eyebrowText: "Nieuwe update",
    titleText: `Wat is er nieuw?${titleSuffix}`,
    introText: "GlazenBol is bijgewerkt met verbeteringen en fixes.",
    steps: highlights,
    noteText: "Jullie support en feedback maken dit extra leuk, dankjewel!",
    hintText: "Vragen? Klik op de ?-knop in het paneel.",
    buttonText: "Top, bedankt"
  });
}
