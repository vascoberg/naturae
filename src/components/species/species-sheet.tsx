"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SpeciesPhotoCarousel } from "./species-photo-carousel";
import { SpeciesAudioPlayer } from "./species-audio-player";
import type { Species } from "@/types/species";
import type { GBIFMediaResult } from "@/lib/services/gbif-media";

interface SpeciesSheetProps {
  speciesId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface WikipediaData {
  title: string;
  extract: string;
  pageUrl: string;
  language: "nl" | "en";
}

interface RelatedSpecies {
  id: string;
  scientific_name: string;
  canonical_name: string | null;
  common_names: Record<string, string> | null;
  gbif_key: number | null;
}

interface SpeciesData {
  species: Species;
  photos: GBIFMediaResult[];
  totalPhotos: number;
  wikipedia: WikipediaData | null;
  relatedSpecies: RelatedSpecies[];
}

export function SpeciesSheet({
  speciesId,
  open,
  onOpenChange,
}: SpeciesSheetProps) {
  const [data, setData] = useState<SpeciesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track the currently displayed species (can differ from prop when navigating)
  const [activeSpeciesId, setActiveSpeciesId] = useState<string | null>(null);

  // Sync activeSpeciesId with prop when dialog opens or speciesId changes
  useEffect(() => {
    if (open && speciesId) {
      setActiveSpeciesId(speciesId);
    }
  }, [open, speciesId]);

  // Fetch species data when activeSpeciesId changes
  useEffect(() => {
    if (open && activeSpeciesId && (!data || data.species.id !== activeSpeciesId)) {
      setLoading(true);
      setError(null);

      fetch(`/api/species/${activeSpeciesId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch species");
          return res.json();
        })
        .then((fetchedData) => {
          setData(fetchedData);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [open, activeSpeciesId]); // Removed 'data' from dependencies!

  // Reset data when dialog closes
  useEffect(() => {
    if (!open) {
      const timeout = setTimeout(() => {
        setData(null);
        setError(null);
        setActiveSpeciesId(null);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  const species = data?.species;
  const displayName = species
    ? species.common_names?.nl ||
      species.canonical_name ||
      species.scientific_name
    : "";

  // Handler to load a related species in the same dialog
  const loadRelatedSpecies = (relatedId: string) => {
    setActiveSpeciesId(relatedId); // This triggers the fetch useEffect
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{loading ? "Laden..." : displayName}</DialogTitle>
          {species && (
            <DialogDescription className="italic">
              {species.scientific_name}
              {species.taxonomy?.family && (
                <span className="not-italic text-muted-foreground">
                  {" "}· {species.taxonomy.family}
                </span>
              )}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-destructive">
              <p className="text-sm">Kon soort niet laden</p>
            </div>
          )}

          {data && !loading && (
            <>
              {/* Photo carousel */}
              {data.photos.length > 0 ? (
                <SpeciesPhotoCarousel
                  photos={data.photos}
                  totalPhotos={data.totalPhotos}
                />
              ) : (
                <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">
                    Geen foto&apos;s beschikbaar
                  </p>
                </div>
              )}

              {/* Audio player */}
              {species?.scientific_name && (
                <SpeciesAudioPlayer
                  scientificName={species.scientific_name}
                  taxonomyClass={species.taxonomy?.class}
                  taxonomyOrder={species.taxonomy?.order}
                  compact
                />
              )}

              {/* Wikipedia description */}
              {data.wikipedia && (
                <section>
                  <h3 className="text-sm font-semibold mb-2">Beschrijving</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {data.wikipedia.extract}
                  </p>
                  <a
                    href={data.wikipedia.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-2"
                  >
                    Meer op Wikipedia
                    {data.wikipedia.language === "en" && (
                      <span className="text-xs text-muted-foreground">(EN)</span>
                    )}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </section>
              )}

              {/* Related species */}
              {data.relatedSpecies.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold mb-2">Verwante soorten</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.relatedSpecies.map((related) => (
                      <RelatedSpeciesChip
                        key={related.id}
                        species={related}
                        onSelect={() => loadRelatedSpecies(related.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* External links - clean text links like BirdID */}
              <section className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-2">Links</h3>
                <div className="flex flex-col gap-1.5">
                  {species?.gbif_key && (
                    <ExternalLinkItem
                      href={`https://www.gbif.org/species/${species.gbif_key}`}
                      label="GBIF"
                      description="Taxonomie & verspreiding"
                    />
                  )}
                  <ExternalLinkItem
                    href={`https://waarneming.nl/species/search/?q=${encodeURIComponent(species?.canonical_name || species?.scientific_name || "")}`}
                    label="Waarneming.nl"
                    description="Recente waarnemingen"
                  />
                  <ExternalLinkItem
                    href={`https://nl.wikipedia.org/wiki/${encodeURIComponent(species?.canonical_name || species?.scientific_name || "")}`}
                    label="Wikipedia"
                    description="Volledige beschrijving"
                  />
                </div>
              </section>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Related species chip (compact, clickable)
function RelatedSpeciesChip({
  species,
  onSelect,
}: {
  species: RelatedSpecies;
  onSelect: () => void;
}) {
  const displayName =
    species.common_names?.nl || species.canonical_name || species.scientific_name;

  return (
    <button
      onClick={onSelect}
      className="px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors text-xs font-medium"
    >
      {displayName}
    </button>
  );
}

// Clean external link item (like BirdID)
function ExternalLinkItem({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between py-1 group"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-primary group-hover:underline">{label}</span>
        {description && (
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {description}
          </span>
        )}
      </div>
      <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
    </a>
  );
}
