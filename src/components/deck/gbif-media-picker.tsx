"use client";

import { useState, useEffect } from "react";
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

  const LIMIT = 12;

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Foto's voor "{speciesName}"
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
                Geen foto's gevonden voor deze soort
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                {total} foto's beschikbaar
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {media.map((item, index) => (
                  <button
                    key={`${item.identifier}-${index}`}
                    onClick={() => setSelectedMedia(item)}
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:opacity-90",
                      selectedMedia?.identifier === item.identifier
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
                    </div>
                    {/* License badge */}
                    <span
                      className={cn(
                        "absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded font-medium",
                        item.licenseType === "CC0"
                          ? "bg-green-500/90 text-white"
                          : "bg-blue-500/90 text-white"
                      )}
                    >
                      {item.licenseType}
                    </span>
                  </button>
                ))}
              </div>

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
