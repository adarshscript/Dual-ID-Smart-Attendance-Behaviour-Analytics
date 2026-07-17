"use client";

export type ToastPayload = {
  title: string;
  message?: string;
  tone?: "success" | "error" | "info";
};

export function showToast(payload: ToastPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("dias:toast", { detail: payload }));
}

export function showRouteLoading(label = "Opening page...") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("dias:route-loading", { detail: { label } }));
}

export function hideRouteLoading() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("dias:route-loaded"));
}
