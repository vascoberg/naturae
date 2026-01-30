"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAttribution, type GBIFMediaResult } from "@/lib/services/gbif-media";
import { cn } from "@/lib/utils";

interface SpeciesPhotoCarouselProps {
  photos: GBIFMediaResult[];
  totalPhotos: number;
}

// Filter opties
type LifeStageFilter = "all" | "Adult" | "Juvenile" | "Larva" | "Pupa" | "Egg";
type SexFilter = "all" | "Male" | "Female";

// Helper: formatteer datum
function formatEventDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

// Helper: bepaal welke filter opties beschikbaar zijn
function getAvailableFilters(photos: GBIFMediaResult[]) {
  const lifeStages = new Set<string>();
  const sexes = new Set<string>();

  for (const photo of photos) {
    if (photo.lifeStage) lifeStages.add(photo.lifeStage);
    if (photo.sex) sexes.add(photo.sex);
  }

  return { lifeStages, sexes };
}

export function SpeciesPhotoCarousel({
  photos,
  totalPhotos,
}: SpeciesPhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lifeStageFilter, setLifeStageFilter] = useState<LifeStageFilter>("all");
  const [sexFilter, setSexFilter] = useState<SexFilter>("all");

  // Bepaal beschikbare filters
  const { lifeStages, sexes } = useMemo(() => getAvailableFilters(photos), [photos]);

  // Filter foto's
  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      if (lifeStageFilter !== "all" && photo.lifeStage !== lifeStageFilter) {
        return false;
      }
      if (sexFilter !== "all" && photo.sex !== sexFilter) {
        return false;
      }
      return true;
    });
  }, [photos, lifeStageFilter, sexFilter]);

  // Reset index als filters veranderen
  const safeIndex = currentIndex >= filteredPhotos.length ? 0 : currentIndex;
  const currentPhoto = filteredPhotos[safeIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? filteredPhotos.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) =>
      prev === filteredPhotos.length - 1 ? 0 : prev + 1
    );
  };

  // Toon filters alleen als er filterbare data is
  const hasFilters = lifeStages.size > 0 || sexes.size > 0;

  if (!currentPhoto) {
    if (filteredPhotos.length === 0 && photos.length > 0) {
      // Geen resultaten na filteren
      return (
        <div className="space-y-3">
          {/* Filter UI */}
          {hasFilters && (
            <PhotoFilters
              lifeStages={lifeStages}
              sexes={sexes}
              lifeStageFilter={lifeStageFilter}
              sexFilter={sexFilter}
              onLifeStageChange={setLifeStageFilter}
              onSexChange={setSexFilter}
            />
          )}
          <div className="text-center text-muted-foreground py-8">
            Geen foto&apos;s gevonden met deze filters
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Filter UI */}
      {hasFilters && (
        <PhotoFilters
          lifeStages={lifeStages}
          sexes={sexes}
          lifeStageFilter={lifeStageFilter}
          sexFilter={sexFilter}
          onLifeStageChange={setLifeStageFilter}
          onSexChange={setSexFilter}
        />
      )}

      {/* Photo container - max height voor compacte weergave in sheet */}
      <div
        className="relative bg-muted rounded-lg overflow-hidden"
        style={{ maxHeight: "250px" }}
      >
        <div className="relative w-full h-[250px]">
          <Image
            src={currentPhoto.identifier}
            alt="Species foto"
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 500px"
            unoptimized
          />
        </div>

        {/* Navigation arrows */}
        {filteredPhotos.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Photo counter */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
          {safeIndex + 1} / {filteredPhotos.length}
          {totalPhotos > photos.length && (
            <span className="text-white/70"> ({totalPhotos} totaal)</span>
          )}
        </div>
      </div>

      {/* Attribution */}
      <p className="text-xs text-muted-foreground text-center">
        {formatAttribution(currentPhoto)}
      </p>

      {/* Metadata badges */}
      <PhotoMetadataBadges photo={currentPhoto} />
    </div>
  );
}

// Metadata badges component
function PhotoMetadataBadges({ photo }: { photo: GBIFMediaResult }) {
  const badges: { label: string; icon?: string }[] = [];

  // Levensstadium
  if (photo.lifeStage) {
    badges.push({ label: translateLifeStage(photo.lifeStage) });
  }

  // Geslacht met symbool
  if (photo.sex) {
    const sexIcon = photo.sex === "Male" ? "♂" : photo.sex === "Female" ? "♀" : "";
    badges.push({ label: `${sexIcon} ${translateSex(photo.sex)}`.trim() });
  }

  // Land
  if (photo.country) {
    badges.push({ label: photo.country });
  }

  // Datum
  const formattedDate = formatEventDate(photo.eventDate);
  if (formattedDate) {
    badges.push({ label: formattedDate });
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {badges.map((badge, i) => (
        <Badge key={i} variant="secondary" className="text-xs font-normal">
          {badge.label}
        </Badge>
      ))}
    </div>
  );
}

// Filter component
function PhotoFilters({
  lifeStages,
  sexes,
  lifeStageFilter,
  sexFilter,
  onLifeStageChange,
  onSexChange,
}: {
  lifeStages: Set<string>;
  sexes: Set<string>;
  lifeStageFilter: LifeStageFilter;
  sexFilter: SexFilter;
  onLifeStageChange: (value: LifeStageFilter) => void;
  onSexChange: (value: SexFilter) => void;
}) {
  // Sorteer life stages in logische volgorde
  const sortedLifeStages = Array.from(lifeStages).sort((a, b) => {
    const order = ["Adult", "Juvenile", "Larva", "Pupa", "Egg", "Embryo", "Spore"];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
      {/* Life stage filters */}
      {sortedLifeStages.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <FilterChip
            label="Alle"
            active={lifeStageFilter === "all"}
            onClick={() => onLifeStageChange("all")}
          />
          {sortedLifeStages.map((stage) => (
            <FilterChip
              key={stage}
              label={translateLifeStage(stage)}
              active={lifeStageFilter === stage}
              onClick={() => onLifeStageChange(stage as LifeStageFilter)}
            />
          ))}
        </div>
      )}

      {/* Separator */}
      {sortedLifeStages.length > 0 && sexes.size > 0 && (
        <span className="text-muted-foreground">·</span>
      )}

      {/* Sex filters */}
      {sexes.size > 0 && (
        <div className="flex gap-1">
          {sexes.has("Male") && (
            <FilterChip
              label="♂"
              active={sexFilter === "Male"}
              onClick={() => onSexChange(sexFilter === "Male" ? "all" : "Male")}
            />
          )}
          {sexes.has("Female") && (
            <FilterChip
              label="♀"
              active={sexFilter === "Female"}
              onClick={() => onSexChange(sexFilter === "Female" ? "all" : "Female")}
            />
          )}
        </div>
      )}
    </div>
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

// Vertalingen voor UI
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

function translateSex(sex: string): string {
  const translations: Record<string, string> = {
    Male: "Man",
    Female: "Vrouw",
    Hermaphrodite: "Hermafrodiet",
  };
  return translations[sex] || sex;
}
