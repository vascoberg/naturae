"use client";

import { useState, useEffect, useRef } from "react";
import { Music, Play, Pause, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { XenoCantoResult } from "@/lib/services/xeno-canto";

// Xeno-canto species groups
export type XenoCantoGroup = "birds" | "grasshoppers" | "bats" | "frogs" | "mammals" | "unknown";

interface SpeciesAudioPlayerProps {
  scientificName: string;
  /** Taxonomy class (e.g., "Aves", "Amphibia") to determine Xeno-canto group */
  taxonomyClass?: string;
  /** Taxonomy order (e.g., "Orthoptera", "Chiroptera") for more specific detection */
  taxonomyOrder?: string;
  /** Start in compact mode (3 recordings, no filters) */
  compact?: boolean;
}

type QualityFilter = "all" | "A";
// Type filters vary by species group
type BirdTypeFilter = "all" | "song" | "call";
type GrasshopperTypeFilter = "all" | "calling song" | "courtship song" | "rivalry song";
type BatTypeFilter = "all" | "echolocation" | "social call";
type FrogTypeFilter = "all" | "advertisement call" | "mating call" | "territorial call";
type MammalTypeFilter = "all" | "call" | "social call";
type TypeFilter = BirdTypeFilter | GrasshopperTypeFilter | BatTypeFilter | FrogTypeFilter | MammalTypeFilter;
type CountryFilter = "all" | "Netherlands" | "Belgium" | "Germany" | "United Kingdom" | "France";

const COUNTRY_OPTIONS: { value: CountryFilter; label: string }[] = [
  { value: "Netherlands", label: "Nederland" },
  { value: "all", label: "Alle landen" },
  { value: "Belgium", label: "België" },
  { value: "Germany", label: "Duitsland" },
  { value: "United Kingdom", label: "Verenigd Koninkrijk" },
  { value: "France", label: "Frankrijk" },
];

// Determine Xeno-canto group from taxonomy
function getXenoCantoGroup(taxonomyClass?: string, taxonomyOrder?: string): XenoCantoGroup {
  const cls = taxonomyClass?.toLowerCase();
  const order = taxonomyOrder?.toLowerCase();

  // Birds
  if (cls === "aves") return "birds";

  // Grasshoppers and crickets (Orthoptera)
  if (order === "orthoptera") return "grasshoppers";

  // Bats (Chiroptera within Mammalia)
  if (order === "chiroptera") return "bats";

  // Frogs and toads (Amphibia)
  if (cls === "amphibia") return "frogs";

  // Other mammals
  if (cls === "mammalia") return "mammals";

  return "unknown";
}

// Type filter options per group (based on Xeno-canto's standardized types)
const TYPE_FILTERS_BY_GROUP: Record<XenoCantoGroup, { value: TypeFilter; label: string }[]> = {
  birds: [
    { value: "all", label: "Alle" },
    { value: "song", label: "Zang" },
    { value: "call", label: "Roep" },
  ],
  grasshoppers: [
    { value: "all", label: "Alle" },
    { value: "calling song", label: "Lokzang" },
    { value: "courtship song", label: "Balts" },
    { value: "rivalry song", label: "Rivaal" },
  ],
  bats: [
    { value: "all", label: "Alle" },
    { value: "echolocation", label: "Echolocatie" },
    { value: "social call", label: "Sociaal" },
  ],
  frogs: [
    { value: "all", label: "Alle" },
    { value: "advertisement call", label: "Balts" },
    { value: "mating call", label: "Paring" },
    { value: "territorial call", label: "Territoriaal" },
  ],
  mammals: [
    { value: "all", label: "Alle" },
    { value: "call", label: "Roep" },
    { value: "social call", label: "Sociaal" },
  ],
  unknown: [
    { value: "all", label: "Alle" },
  ],
};

export function SpeciesAudioPlayer({
  scientificName,
  taxonomyClass,
  taxonomyOrder,
  compact = false,
}: SpeciesAudioPlayerProps) {
  const [recordings, setRecordings] = useState<XenoCantoResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filter state
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [countryFilter, setCountryFilter] = useState<CountryFilter>("Netherlands");
  // Track if we fell back to "all countries" because no recordings were found for Netherlands
  const [countryFallback, setCountryFallback] = useState(false);

  // Determine species group and available type filters
  const speciesGroup = getXenoCantoGroup(taxonomyClass, taxonomyOrder);
  const typeFilterOptions = TYPE_FILTERS_BY_GROUP[speciesGroup];

  // In compact mode, show 3 recordings; expanded shows 6
  const COMPACT_LIMIT = 3;
  const EXPANDED_LIMIT = 6;
  const displayLimit = isExpanded ? EXPANDED_LIMIT : COMPACT_LIMIT;

  // Load recordings on mount and when filters change
  useEffect(() => {
    if (scientificName) {
      loadRecordings();
    }
  }, [scientificName, qualityFilter, typeFilter, countryFilter]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  async function loadRecordings() {
    setIsLoading(true);
    setError(null);
    setCountryFallback(false);

    try {
      const params = new URLSearchParams({
        scientificName,
        limit: EXPANDED_LIMIT.toString(), // Always fetch enough for expanded view
      });

      // Add quality filter
      if (qualityFilter === "A") {
        params.set("quality", "A");
      }

      // Add type filter
      if (typeFilter !== "all") {
        params.set("type", typeFilter);
      }

      // Add country filter
      if (countryFilter !== "all") {
        params.set("country", countryFilter);
      }

      const response = await fetch(`/api/xeno-canto/audio?${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Kon geluiden niet laden");
      }

      const data = await response.json();

      // If no results with country filter, try without country filter (fallback)
      if (data.recordings.length === 0 && countryFilter !== "all" && typeFilter === "all") {
        const fallbackParams = new URLSearchParams({
          scientificName,
          limit: EXPANDED_LIMIT.toString(),
        });
        if (qualityFilter === "A") {
          fallbackParams.set("quality", "A");
        }

        const fallbackResponse = await fetch(`/api/xeno-canto/audio?${fallbackParams}`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.recordings.length > 0) {
            setRecordings(fallbackData.recordings);
            setTotal(fallbackData.total);
            setCountryFallback(true);
            return;
          }
        }
      }

      setRecordings(data.recordings);
      setTotal(data.total);
    } catch (err) {
      console.error("Error loading Xeno-canto recordings:", err);
      setError("Er ging iets mis bij het laden van geluiden");
    } finally {
      setIsLoading(false);
    }
  }

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingId(null);
  }

  function togglePlay(recording: XenoCantoResult) {
    if (playingId === recording.id) {
      stopAudio();
    } else {
      stopAudio();
      const proxyUrl = `/api/xeno-canto/stream/${recording.id}`;
      const audio = new Audio(proxyUrl);
      audio.onended = () => setPlayingId(null);
      audio.onerror = (e) => {
        if (audioRef.current === audio) {
          console.error("Error playing audio:", recording.id, e);
        }
        setPlayingId(null);
      };
      audio.play();
      audioRef.current = audio;
      setPlayingId(recording.id);
    }
  }

  // Show nothing if no scientific name
  if (!scientificName) {
    return null;
  }

  // Recordings to display (limited by current view mode)
  const displayedRecordings = recordings.slice(0, displayLimit);
  const hasMore = recordings.length > COMPACT_LIMIT || total > recordings.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Music className="w-5 h-5" />
          Geluiden
        </h2>
        {!isLoading && !error && recordings.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {total} opnames beschikbaar
          </span>
        )}
      </div>

      {/* Fallback notice - shown when no Dutch recordings exist */}
      {countryFallback && !isLoading && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
          Geen opnames uit Nederland beschikbaar. Geluiden uit andere landen worden getoond.
        </p>
      )}

      {/* Filters - only show when expanded */}
      {isExpanded && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs text-muted-foreground">Kwaliteit:</span>
          <div className="flex gap-1">
            <FilterChip
              label="Alle (B+)"
              active={qualityFilter === "all"}
              onClick={() => setQualityFilter("all")}
            />
            <FilterChip
              label="Alleen A"
              active={qualityFilter === "A"}
              onClick={() => setQualityFilter("A")}
            />
          </div>

          {/* Type filter - options depend on species group */}
          {typeFilterOptions.length > 1 && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">Type:</span>
              <div className="flex gap-1">
                {typeFilterOptions.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={option.label}
                    active={typeFilter === option.value}
                    onClick={() => setTypeFilter(option.value)}
                  />
                ))}
              </div>
            </>
          )}

          <span className="text-muted-foreground">·</span>

          <span className="text-xs text-muted-foreground">Land:</span>
          <div className="relative">
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value as CountryFilter)}
              className="appearance-none bg-muted text-xs px-2 py-0.5 pr-6 rounded-full cursor-pointer hover:bg-muted/80 transition-colors"
            >
              {COUNTRY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: COMPACT_LIMIT }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-6">
          <p className="text-muted-foreground mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={() => loadRecordings()}>
            Opnieuw proberen
          </Button>
        </div>
      ) : recordings.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <Music className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>Geen geluiden gevonden</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {displayedRecordings.map((recording) => (
              <RecordingCard
                key={recording.id}
                recording={recording}
                isPlaying={playingId === recording.id}
                onTogglePlay={() => togglePlay(recording)}
              />
            ))}
          </div>

          {/* Expand/collapse button */}
          {hasMore && (
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-muted-foreground"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Minder tonen
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Meer geluiden ({total > COMPACT_LIMIT ? total - COMPACT_LIMIT : recordings.length - COMPACT_LIMIT}+)
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Xeno-canto attribution */}
      {!isLoading && !error && recordings.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Geluiden via{" "}
          <a
            href="https://xeno-canto.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Xeno-canto
          </a>
        </p>
      )}
    </div>
  );
}

// Recording card with sonogram and play button
function RecordingCard({
  recording,
  isPlaying,
  onTogglePlay,
}: {
  recording: XenoCantoResult;
  isPlaying: boolean;
  onTogglePlay: () => void;
}) {
  return (
    <div className="relative rounded-lg overflow-hidden border hover:border-muted-foreground/30 transition-colors">
      {/* Sonogram image */}
      <div className="aspect-[4/3] bg-muted">
        <img
          src={recording.sonogramUrl}
          alt={`Sonogram ${recording.type}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Play button overlay */}
      <button
        onClick={onTogglePlay}
        className={cn(
          "absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
          isPlaying
            ? "bg-primary text-primary-foreground"
            : "bg-black/60 text-white hover:bg-black/80"
        )}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>

      {/* Quality badge */}
      <span
        className={cn(
          "absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded font-medium",
          recording.quality === "A"
            ? "bg-green-500/90 text-white"
            : recording.quality === "B"
            ? "bg-blue-500/90 text-white"
            : "bg-orange-500/90 text-white"
        )}
      >
        {recording.quality}
      </span>

      {/* License badge */}
      <span
        className={cn(
          "absolute top-2 left-11 text-[9px] px-1.5 py-0.5 rounded font-medium",
          getLicenseColor(recording.license)
        )}
      >
        {formatLicense(recording.license)}
      </span>

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <p className="text-[10px] text-white/90 truncate">
          {recording.recordist} · {recording.duration}
        </p>
        <div className="flex gap-1 mt-0.5">
          <span className="text-[9px] bg-white/20 text-white px-1 rounded">
            {translateType(recording.type)}
          </span>
          <span className="text-[9px] bg-white/20 text-white px-1 rounded">
            {recording.country}
          </span>
        </div>
      </div>
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

// Translation helper for sound types
function translateType(type: string): string {
  const translations: Record<string, string> = {
    // Birds
    song: "Zang",
    call: "Roep",
    "alarm call": "Alarm",
    "flight call": "Vlucht",
    "dawn song": "Ochtendzang",
    subsong: "Subzang",
    duet: "Duet",
    drumming: "Roffel",
    "nocturnal flight call": "Nachtroep",
    "begging call": "Bedelroep",
    // Grasshoppers
    "calling song": "Lokzang",
    "courtship song": "Baltszang",
    "rivalry song": "Rivaalzang",
    "searching song": "Zoekzang",
    "disturbance song": "Verstoringszang",
    // Bats
    echolocation: "Echolocatie",
    "social call": "Sociaal",
    "feeding buzz": "Voedingsbuzz",
    // Frogs
    "advertisement call": "Baltsroep",
    "mating call": "Paringsroep",
    "release call": "Loslaatroep",
    "territorial call": "Territoriumroep",
    "distress call": "Noodroep",
    "agonistic call": "Agressieroep",
    "defensive call": "Verdedigingsroep",
  };
  return translations[type.toLowerCase()] || type;
}

// Format license for display
function formatLicense(license: string): string {
  return license
    .replace(/^CC\s+/i, "")
    .replace(/\s+\d+\.\d+$/, "")
    .trim();
}

// Get license badge color
function getLicenseColor(license: string): string {
  const upper = license.toUpperCase();
  if (upper.includes("CC0") || upper.includes("PUBLIC")) {
    return "bg-green-500/90 text-white";
  }
  if (upper.includes("NC")) {
    return "bg-orange-500/90 text-white";
  }
  return "bg-blue-500/90 text-white";
}
