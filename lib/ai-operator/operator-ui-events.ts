export const OPERATOR_OPEN_EVENT = "diazites:operator-open";
export const OPERATOR_TOGGLE_EVENT = "diazites:operator-toggle";
export const OPERATOR_CLOSE_EVENT = "diazites:operator-close";

export function dispatchOperatorOpen() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPERATOR_OPEN_EVENT));
}

export function dispatchOperatorToggle() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPERATOR_TOGGLE_EVENT));
}

export function dispatchOperatorClose() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPERATOR_CLOSE_EVENT));
}
