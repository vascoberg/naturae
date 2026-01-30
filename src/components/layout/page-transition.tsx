"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    // Check if route has changed
    if (pathname !== previousPathname.current) {
      previousPathname.current = pathname;

      // Check if View Transitions API is supported
      if (typeof document !== "undefined" && "startViewTransition" in document) {
        // Use native View Transitions API
        (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
          setDisplayChildren(children);
        });
      } else {
        // Fallback: CSS transition
        setIsTransitioning(true);

        // Short delay to allow fade-out, then update content
        const timeout = setTimeout(() => {
          setDisplayChildren(children);
          setIsTransitioning(false);
        }, 100);

        return () => clearTimeout(timeout);
      }
    } else {
      // Same route, just update children (e.g., data changes)
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  return (
    <div
      className={cn(
        "transition-opacity duration-150 ease-out",
        isTransitioning ? "opacity-0" : "opacity-100"
      )}
    >
      {displayChildren}
    </div>
  );
}
