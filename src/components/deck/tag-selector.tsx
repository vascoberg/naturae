"use client";

import { useState, useEffect, useTransition } from "react";
import { X, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { type Tag, getAllTags, updateDeckTags } from "@/lib/actions/tags";

interface TagSelectorProps {
  deckId: string;
  initialTags: Tag[];
  disabled?: boolean;
}

const TAG_TYPE_LABELS: Record<string, string> = {
  topic: "Onderwerp",
  region: "Regio",
  "content-type": "Type",
  difficulty: "Niveau",
  language: "Taal",
  other: "Overig",
};

export function TagSelector({ deckId, initialTags, disabled = false }: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialTags);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState("");

  // Load all available tags on mount
  useEffect(() => {
    async function loadTags() {
      const { data } = await getAllTags();
      if (data) {
        setAvailableTags(data);
      }
    }
    loadTags();
  }, []);

  const handleSelect = (tag: Tag) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id);
    let newTags: Tag[];

    if (isSelected) {
      newTags = selectedTags.filter((t) => t.id !== tag.id);
    } else {
      newTags = [...selectedTags, tag];
    }

    setSelectedTags(newTags);

    // Save to database
    startTransition(async () => {
      await updateDeckTags(deckId, newTags.map((t) => t.id));
    });
  };

  const handleRemove = (tagId: string) => {
    const newTags = selectedTags.filter((t) => t.id !== tagId);
    setSelectedTags(newTags);

    startTransition(async () => {
      await updateDeckTags(deckId, newTags.map((t) => t.id));
    });
  };

  // Group tags by type
  const groupedTags = availableTags.reduce((acc, tag) => {
    const type = tag.type || "other";
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(tag);
    return acc;
  }, {} as Record<string, Tag[]>);

  // Filter tags based on search
  const filteredGroups = Object.entries(groupedTags).reduce((acc, [type, tags]) => {
    const filtered = tags.filter(
      (tag) =>
        tag.names.nl.toLowerCase().includes(searchValue.toLowerCase()) ||
        tag.slug.toLowerCase().includes(searchValue.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[type] = filtered;
    }
    return acc;
  }, {} as Record<string, Tag[]>);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="gap-1 pr-1"
          >
            {tag.names.nl}
            <button
              type="button"
              onClick={() => handleRemove(tag.id)}
              disabled={disabled || isPending}
              className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Verwijder {tag.names.nl}</span>
            </button>
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || isPending}
            className="justify-between"
          >
            Tags toevoegen...
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Zoek tags..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>Geen tags gevonden.</CommandEmpty>
              {Object.entries(filteredGroups).map(([type, tags]) => (
                <CommandGroup key={type} heading={TAG_TYPE_LABELS[type] || type}>
                  {tags.map((tag) => {
                    const isSelected = selectedTags.some((t) => t.id === tag.id);
                    return (
                      <CommandItem
                        key={tag.id}
                        value={`${tag.slug}-${tag.names.nl}`}
                        onSelect={() => handleSelect(tag)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {tag.names.nl}
                        {tag.usage_count > 0 && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {tag.usage_count}
                          </span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {isPending && (
        <p className="text-xs text-muted-foreground">Opslaan...</p>
      )}
    </div>
  );
}
