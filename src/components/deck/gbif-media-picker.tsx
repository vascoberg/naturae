"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2, Search, Camera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { GBIFMediaResult } from "@/lib/services/gbif-media";

interface GBIFMediaPickerProps {
  gbifKey: number;
  speciesName: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: GBIFMediaResult) => void;
}

// Filter types
type LifeStageFilter = "all" | string;
type SexFilter = "all" | "Male" | "Female";

export function GBIFMediaPicker({
  gbifKey,
  speciesName,
  isOpen,
  onClose,
  onSelect,
}: GBIFMediaPickerProps) {
  const [media, setMedia] = useState<GBIFMediaResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<GBIFMediaResult | null>(null);

  // Filter state
  const [lifeStageFilter, setLifeStageFilter] = useState<LifeStageFilter>("all");
  const [sexFilter, setSexFilter] = useState<SexFilter>("all");

  const LIMIT = 12;

  // Calculate available filter options from loaded media
  const filterOptions = useMemo(() => {
    const lifeStages = new Set<string>();
    const sexes = new Set<string>();

    for (const item of media) {
      if (item.lifeStage) lifeStages.add(item.lifeStage);
      if (item.sex) sexes.add(item.sex);
    }

    return { lifeStages, sexes };
  }, [media]);

  // Filter media based on selected filters
  const filteredMedia = useMemo(() => {
    return media.filter((item) => {
      if (lifeStageFilter !== "all" && item.lifeStage !== lifeStageFilter) {
        return false;
      }
      if (sexFilter !== "all" && item.sex !== sexFilter) {
        return false;
      }
      return true;
    });
  }, [media, lifeStageFilter, sexFilter]);

  // Load initial media when dialog opens
  useEffect(() => {
    if (isOpen && gbifKey) {
      loadMedia(true);
    }
  }, [isOpen, gbifKey]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setMedia([]);
      setOffset(0);
      setHasMore(false);
      setTotal(0);
      setError(null);
      setSelectedMedia(null);
      setLifeStageFilter("all");
      setSexFilter("all");
    }
  }, [isOpen]);

  async function loadMedia(reset: boolean = false) {
    const currentOffset = reset ? 0 : offset;

    if (reset) {
      setIsLoading(true);
      setMedia([]);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const response = await fetch(
        `/api/gbif/media?gbifKey=${gbifKey}&limit=${LIMIT}&offset=${currentOffset}`
      );

      if (!response.ok) {
        throw new Error("Kon foto's niet laden");
      }

      const data = await response.json();

      if (reset) {
        setMedia(data.media);
      } else {
        setMedia((prev) => [...prev, ...data.media]);
      }

      setHasMore(data.hasMore);
      setTotal(data.total);
      setOffset(currentOffset + LIMIT);
    } catch (err) {
      console.error("Error loading GBIF media:", err);
      setError("Er ging iets mis bij het laden van foto's");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }

  const handleLoadMore = () => {
    loadMedia(false);
  };

  const handleSelect = () => {
    if (selectedMedia) {
      onSelect(selectedMedia);
      onClose();
    }
  };

  const hasFilters = filterOptions.lifeStages.size > 0 || filterOptions.sexes.size > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Foto&apos;s voor &quot;{speciesName}&quot;
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" onClick={() => loadMedia(true)}>
                Opnieuw proberen
              </Button>
            </div>
          ) : media.length === 0 ? (
            <div className="text-center py-8">
              <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Geen foto&apos;s gevonden voor deze soort
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">
                  {filteredMedia.length === media.length
                    ? `${total} foto's beschikbaar`
                    : `${filteredMedia.length} van ${media.length} geladen foto's`}
                </p>
              </div>

              {/* Filter UI */}
              {hasFilters && (
                <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b">
                  <span className="text-xs text-muted-foreground">Filter:</span>

                  {/* Life stage filters */}
                  {filterOptions.lifeStages.size > 0 && (
                    <div className="flex gap-1">
                      <FilterChip
                        label="Alle"
                        active={lifeStageFilter === "all"}
                        onClick={() => setLifeStageFilter("all")}
                      />
                      {Array.from(filterOptions.lifeStages).map((stage) => (
                        <FilterChip
                          key={stage}
                          label={translateLifeStage(stage)}
                          active={lifeStageFilter === stage}
                          onClick={() => setLifeStageFilter(stage)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Separator */}
                  {filterOptions.lifeStages.size > 0 && filterOptions.sexes.size > 0 && (
                    <span className="text-muted-foreground">·</span>
                  )}

                  {/* Sex filters */}
                  {filterOptions.sexes.size > 0 && (
                    <div className="flex gap-1">
                      {filterOptions.sexes.has("Male") && (
                        <FilterChip
                          label="♂"
                          active={sexFilter === "Male"}
                          onClick={() => setSexFilter(sexFilter === "Male" ? "all" : "Male")}
                        />
                      )}
                      {filterOptions.sexes.has("Female") && (
                        <FilterChip
                          label="♀"
                          active={sexFilter === "Female"}
                          onClick={() => setSexFilter(sexFilter === "Female" ? "all" : "Female")}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Media grid */}
              {filteredMedia.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Geen foto&apos;s gevonden met deze filters
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredMedia.map((item, index) => (
                    <MediaCard
                      key={`${item.identifier}-${index}`}
                      item={item}
                      isSelected={selectedMedia?.identifier === item.identifier}
                      onSelect={() => setSelectedMedia(item)}
                    />
                  ))}
                </div>
              )}

              {hasMore && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Laden...
                      </>
                    ) : (
                      "Meer laden"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with selection info and confirm button */}
        {selectedMedia && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={selectedMedia.identifier}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedMedia.creator || "Onbekende fotograaf"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedMedia.licenseType} · {selectedMedia.source}
                  {selectedMedia.lifeStage && ` · ${translateLifeStage(selectedMedia.lifeStage)}`}
                  {selectedMedia.sex && ` · ${selectedMedia.sex === "Male" ? "♂" : "♀"}`}
                </p>
              </div>
              <Button onClick={handleSelect}>
                Selecteren
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Media card with metadata badges
function MediaCard({
  item,
  isSelected,
  onSelect,
}: {
  item: GBIFMediaResult;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const hasMetadata = item.lifeStage || item.sex;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:opacity-90",
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-transparent"
      )}
    >
      <img
        src={item.identifier}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {/* Attribution overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <p className="text-[10px] text-white/90 truncate">
          {item.creator || item.licenseType} · {item.source}
        </p>
        {/* Metadata badges */}
        {hasMetadata && (
          <div className="flex gap-1 mt-0.5">
            {item.lifeStage && (
              <span className="text-[9px] bg-white/20 text-white px-1 rounded">
                {translateLifeStage(item.lifeStage)}
              </span>
            )}
            {item.sex && (
              <span className="text-[9px] bg-white/20 text-white px-1 rounded">
                {item.sex === "Male" ? "♂" : item.sex === "Female" ? "♀" : item.sex}
              </span>
            )}
          </div>
        )}
      </div>

      {/* License badge */}
      <span
        className={cn(
          "absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded font-medium",
          item.licenseType === "CC0"
            ? "bg-green-500/90 text-white"
            : item.licenseType === "CC-BY-NC"
            ? "bg-orange-500/90 text-white"
            : "bg-blue-500/90 text-white"
        )}
      >
        {item.licenseType}
      </span>
    </button>
  );
}

// Filter chip component
function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2 py-0.5 rounded-full text-xs transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
    >
      {label}
    </button>
  );
}

// Translation helper
function translateLifeStage(stage: string): string {
  const translations: Record<string, string> = {
    Adult: "Volwassen",
    Juvenile: "Juveniel",
    Larva: "Larve",
    Pupa: "Pop",
    Egg: "Ei",
    Embryo: "Embryo",
    Spore: "Spore",
  };
  return translations[stage] || stage;
}
