"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Tag {
  id: string;
  slug: string;
  names: { nl: string; en?: string };
  type: string;
  usage_count: number;
}

interface TagFilterProps {
  tags: Tag[];
  selectedSlugs: string[];
}

export function TagFilter({ tags, selectedSlugs }: TagFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTagClick = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentTags = params.get("tags")?.split(",").filter(Boolean) || [];

    let newTags: string[];
    if (currentTags.includes(slug)) {
      // Remove tag
      newTags = currentTags.filter((t) => t !== slug);
    } else {
      // Add tag
      newTags = [...currentTags, slug];
    }

    if (newTags.length > 0) {
      params.set("tags", newTags.join(","));
    } else {
      params.delete("tags");
    }

    router.push(`/discover?${params.toString()}`);
  };

  // Group tags by type, only show topic tags for simplicity
  const topicTags = tags.filter((t) => t.type === "topic" && t.usage_count > 0);
  const otherTags = tags.filter((t) => t.type !== "topic" && t.usage_count > 0);

  if (topicTags.length === 0 && otherTags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {topicTags.map((tag) => {
        const isSelected = selectedSlugs.includes(tag.slug);
        return (
          <Badge
            key={tag.id}
            variant={isSelected ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-colors hover:bg-primary/80",
              isSelected && "bg-primary text-primary-foreground"
            )}
            onClick={() => handleTagClick(tag.slug)}
          >
            {tag.names.nl}
            {tag.usage_count > 0 && (
              <span className="ml-1.5 text-xs opacity-70">
                {tag.usage_count}
              </span>
            )}
          </Badge>
        );
      })}
      {otherTags.length > 0 && topicTags.length > 0 && (
        <span className="text-muted-foreground mx-1">|</span>
      )}
      {otherTags.map((tag) => {
        const isSelected = selectedSlugs.includes(tag.slug);
        return (
          <Badge
            key={tag.id}
            variant={isSelected ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-colors hover:bg-primary/80",
              isSelected && "bg-primary text-primary-foreground"
            )}
            onClick={() => handleTagClick(tag.slug)}
          >
            {tag.names.nl}
            {tag.usage_count > 0 && (
              <span className="ml-1.5 text-xs opacity-70">
                {tag.usage_count}
              </span>
            )}
          </Badge>
        );
      })}
    </div>
  );
}
