"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

interface MainContentProps {
  children: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  const { isCollapsed, isMobile } = useSidebar();

  return (
    <div
      className={cn(
        "transition-all duration-200",
        isMobile ? "pt-14" : isCollapsed ? "pl-16" : "pl-64"
      )}
    >
      <main className="min-h-screen">{children}</main>
    </div>
  );
}
