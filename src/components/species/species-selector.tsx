"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Search, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  searchSpecies,
  getOrCreateSpecies,
  getSpeciesById,
} from "@/lib/actions/species";
import type { SpeciesSearchResult, Species } from "@/types/species";

interface SpeciesSelectorProps {
  /** Currently selected species ID (UUID) */
  value: string | null;
  /** Callback when species is selected or cleared */
  onChange: (speciesId: string | null, species: Species | null) => void;
  /** Disable the selector */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

export function SpeciesSelector({
  value,
  onChange,
  disabled = false,
  placeholder = "Zoek soort...",
}: SpeciesSelectorProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpeciesSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load selected species on mount if value is provided
  useEffect(() => {
    async function loadSpecies() {
      if (value && !selectedSpecies) {
        const { data } = await getSpeciesById(value);
        if (data) {
          setSelectedSpecies(data);
        }
      }
    }
    loadSpecies();
  }, [value, selectedSpecies]);

  // Debounced search
  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const { data } = await searchSpecies(searchQuery);
      setResults(data);
      setIsSearching(false);
    }, 300);
  }, []);

  // Handle species selection
  const handleSelect = async (result: SpeciesSearchResult) => {
    setIsSelecting(true);

    let species: Species | null = null;

    if (result.source === "local") {
      // Already in database, fetch full data
      const { data } = await getSpeciesById(result.id);
      species = data;
    } else if (result.gbif_key) {
      // From GBIF, create in database
      const { data } = await getOrCreateSpecies(result.gbif_key);
      species = data;
    }

    if (species) {
      setSelectedSpecies(species);
      onChange(species.id, species);
    }

    setIsSelecting(false);
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  // Handle clear
  const handleClear = () => {
    setSelectedSpecies(null);
    onChange(null, null);
  };

  // Focus input when popover opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  if (!mounted) {
    return (
      <Button variant="outline" disabled className="justify-start w-full">
        <Search className="mr-2 h-4 w-4 opacity-50" />
        {placeholder}
      </Button>
    );
  }

  // Show selected species as badge
  if (selectedSpecies) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-2 py-1.5 px-3 text-sm">
          <span className="font-medium">
            {selectedSpecies.common_names?.nl || selectedSpecies.canonical_name}
          </span>
          <span className="text-muted-foreground italic">
            {selectedSpecies.canonical_name}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Verwijder soort</span>
            </button>
          )}
        </Badge>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="justify-start w-full text-muted-foreground"
        >
          <Search className="mr-2 h-4 w-4 opacity-50" />
          {placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Zoek op naam (NL/wetenschappelijk)..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {isSearching && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isSearching && query.length >= 2 && results.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Geen soorten gevonden
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="py-1">
              {results.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => handleSelect(result)}
                  disabled={isSelecting}
                  className={cn(
                    "w-full text-left px-3 py-2 hover:bg-muted transition-colors",
                    "flex items-start justify-between gap-2",
                    isSelecting && "opacity-50 cursor-wait"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {result.dutch_name || result.canonical_name || result.scientific_name}
                    </p>
                    <p className="text-sm text-muted-foreground italic truncate">
                      {result.canonical_name || result.scientific_name}
                    </p>
                    {result.taxonomy?.family && (
                      <p className="text-xs text-muted-foreground">
                        {result.taxonomy.family}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs shrink-0",
                      result.source === "local"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    )}
                  >
                    {result.source === "local" ? "Lokaal" : "GBIF"}
                  </Badge>
                </button>
              ))}
            </div>
          )}

          {query.length < 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Typ minimaal 2 karakters om te zoeken
            </div>
          )}
        </div>

        {/* Manual add option - for future use */}
        {/* <div className="p-2 border-t">
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
            <Plus className="mr-2 h-4 w-4" />
            Soort niet gevonden? Voeg handmatig toe
          </Button>
        </div> */}
      </PopoverContent>
    </Popover>
  );
}
