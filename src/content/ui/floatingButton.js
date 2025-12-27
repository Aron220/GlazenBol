import { createElement } from "../utils/dom.js";

export function createFloatingButton({ onExpand, label = "Open" }) {
  const button = createElement("button", { className: "bf-floating-button", text: label });
  button.type = "button";
  button.addEventListener("click", () => onExpand());

  const setVisible = (isVisible) => {
    button.style.display = isVisible ? "flex" : "none";
  };

  return { element: button, setVisible };
}
