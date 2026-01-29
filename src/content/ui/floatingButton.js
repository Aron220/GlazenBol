import { createElement } from "../utils/dom.js";

export function createFloatingButton({ onExpand, label = "Open", darkModeEnabled = false }) {
  const button = createElement("button", { className: "bf-floating-button", text: label });
  if (darkModeEnabled) {
    button.classList.add("bf-dark-mode");
  }
  button.type = "button";
  button.addEventListener("click", () => onExpand());

  const setVisible = (isVisible) => {
    button.classList.toggle("bf-floating-button--visible", isVisible);
    button.setAttribute("aria-hidden", String(!isVisible));
    button.tabIndex = isVisible ? 0 : -1;
  };

  const setDarkMode = (enabled) => {
    button.classList.toggle("bf-dark-mode", enabled);
  };

  return { element: button, setVisible, setDarkMode };
}
