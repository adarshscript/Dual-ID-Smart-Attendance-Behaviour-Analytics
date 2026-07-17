"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { showRouteLoading } from "@/lib/feedback";

export function NavLink({
  href,
  className,
  children,
  label
}: {
  href: string;
  className?: string;
  children: ReactNode;
  label?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={clsx("nav-link-button", className)}
      onClick={() => {
        showRouteLoading(label || "Opening page...");
        router.push(href);
      }}
    >
      {children}
    </button>
  );
}
