import { createElement } from "../utils/dom.js";

export function createFloatingButton({ onExpand, label = "Open" }) {
  const button = createElement("button", { className: "bf-floating-button", text: label });
  button.type = "button";
  button.addEventListener("click", () => onExpand());

  const setVisible = (isVisible) => {
    button.classList.toggle("bf-floating-button--visible", isVisible);
    button.setAttribute("aria-hidden", String(!isVisible));
    button.tabIndex = isVisible ? 0 : -1;
  };

  return { element: button, setVisible };
}
