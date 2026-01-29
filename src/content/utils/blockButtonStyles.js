/**
 * Shared styles and class names for block buttons.
 * Used by sellerBlockFilter and brandBlockFilter to ensure consistent styling.
 */

export const BLOCK_BUTTON_CLASS = "bf-block-btn";
const STYLE_ID = "bf-block-btn-style";

/**
 * Injects the CSS styles for block buttons if they don't already exist.
 * This ensures the buttons look consistent across different types of blocking (seller vs brand).
 */
export function ensureBlockButtonStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
    .${BLOCK_BUTTON_CLASS} {
      margin-left: 6px;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid #d5dbe3;
      background: #ffffff;
      color: #0f172a;
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
      line-height: 1.3;
    }
    .${BLOCK_BUTTON_CLASS}:hover {
      background: #f1f5f9;
    }
    .${BLOCK_BUTTON_CLASS}[disabled] {
      background: #e2e8f0;
      border-color: #e2e8f0;
      color: #64748b;
      cursor: default;
    }
  `;
    document.head.appendChild(style);
}
