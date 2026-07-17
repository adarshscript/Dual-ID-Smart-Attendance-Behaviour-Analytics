"use client";

import { AlertCircle, CheckCircle2, Info, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { hideRouteLoading } from "@/lib/feedback";

type ToastItem = {
  id: string;
  title: string;
  message?: string;
  tone: "success" | "error" | "info";
};

export function FeedbackShell() {
  const pathname = usePathname();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [routeLoading, setRouteLoading] = useState("");

  useEffect(() => {
    const toastHandler = (event: Event) => {
      const detail = (event as CustomEvent).detail as ToastItem;
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { ...detail, id, tone: detail.tone || "info" }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 2600);
    };

    const routeStart = (event: Event) => {
      const detail = (event as CustomEvent).detail as { label?: string };
      setRouteLoading(detail?.label || "Loading...");
    };

    const routeEnd = () => {
      setRouteLoading("");
    };

    window.addEventListener("dias:toast", toastHandler as EventListener);
    window.addEventListener("dias:route-loading", routeStart as EventListener);
    window.addEventListener("dias:route-loaded", routeEnd);

    return () => {
      window.removeEventListener("dias:toast", toastHandler as EventListener);
      window.removeEventListener("dias:route-loading", routeStart as EventListener);
      window.removeEventListener("dias:route-loaded", routeEnd);
    };
  }, []);

  useEffect(() => {
    hideRouteLoading();
  }, [pathname]);

  return (
    <>
      {routeLoading ? (
        <div className="route-loader">
          <LoaderCircle size={18} className="spin-loader" />
          <span>{routeLoading}</span>
        </div>
      ) : null}

      <div className="toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card toast-card--${toast.tone}`}>
            <div className="toast-icon">
              {toast.tone === "success" ? (
                <CheckCircle2 size={18} />
              ) : toast.tone === "error" ? (
                <AlertCircle size={18} />
              ) : (
                <Info size={18} />
              )}
            </div>
            <div>
              <strong>{toast.title}</strong>
              {toast.message ? <p>{toast.message}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
