"use client";

import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoAttributionProps {
  creator: string | null;
  license: "CC0" | "CC-BY" | "CC-BY-NC";
  source: string;
  references?: string | null;
  className?: string;
}

/**
 * Toont attributie voor openbare foto's
 * Format: 📷 Paul Braun · CC-BY · iNaturalist
 * Of: 📷 CC0 · iNaturalist (als geen creator)
 */
export function PhotoAttribution({
  creator,
  license,
  source,
  references,
  className,
}: PhotoAttributionProps) {
  const parts: string[] = [];

  if (creator) {
    parts.push(creator);
  }

  parts.push(license);
  parts.push(source);

  const content = (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <Camera className="w-3 h-3" />
      <span>{parts.join(" · ")}</span>
    </span>
  );

  // Als er een referentie URL is, maak het een link
  if (references) {
    return (
      <a
        href={references}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        {content}
      </a>
    );
  }

  return content;
}
