"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Music, Play, Pause, Square, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { XenoCantoResult } from "@/lib/services/xeno-canto";

interface XenoCantoMediaPickerProps {
  scientificName: string;
  speciesName: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (recording: XenoCantoResult) => void;
}

type QualityFilter = "all" | "A" | "B";
type TypeFilter = "all" | "song" | "call";
type CountryFilter = "all" | "Netherlands" | "Belgium" | "Germany" | "United Kingdom" | "France";

const COUNTRY_OPTIONS: { value: CountryFilter; label: string }[] = [
  { value: "Netherlands", label: "Nederland" },
  { value: "all", label: "Alle landen" },
  { value: "Belgium", label: "België" },
  { value: "Germany", label: "Duitsland" },
  { value: "United Kingdom", label: "Verenigd Koninkrijk" },
  { value: "France", label: "Frankrijk" },
];

export function XenoCantoMediaPicker({
  scientificName,
  speciesName,
  isOpen,
  onClose,
  onSelect,
}: XenoCantoMediaPickerProps) {
  const [recordings, setRecordings] = useState<XenoCantoResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [selectedRecording, setSelectedRecording] = useState<XenoCantoResult | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filter state
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [countryFilter, setCountryFilter] = useState<CountryFilter>("Netherlands");

  const LIMIT = 12;

  // Load recordings when dialog opens or filters change
  useEffect(() => {
    if (isOpen && scientificName) {
      loadRecordings();
    }
  }, [isOpen, scientificName, qualityFilter, typeFilter, countryFilter]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setRecordings([]);
      setTotal(0);
      setError(null);
      setSelectedRecording(null);
      setPlayingId(null);
      setQualityFilter("all");
      setTypeFilter("all");
      setCountryFilter("Netherlands");
      stopAudio();
    }
  }, [isOpen]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  async function loadRecordings() {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        scientificName,
        limit: LIMIT.toString(),
      });

      // Add quality filter (B is default in API, A is stricter)
      if (qualityFilter === "A") {
        params.set("quality", "A");
      }
      // Default is B, "all" also uses B as minimum

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
      // Remove event handlers before stopping to prevent spurious errors
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
      // Use proxy endpoint to avoid CORS issues
      const proxyUrl = `/api/xeno-canto/stream/${recording.id}`;
      const audio = new Audio(proxyUrl);
      audio.onended = () => setPlayingId(null);
      audio.onerror = (e) => {
        // Only log if it's a real error (not from stopping)
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

  const handleSelect = () => {
    if (selectedRecording) {
      stopAudio();
      onSelect(selectedRecording);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Geluiden voor &quot;{speciesName}&quot;
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b">
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

            <span className="text-muted-foreground">·</span>

            <span className="text-xs text-muted-foreground">Type:</span>
            <div className="flex gap-1">
              <FilterChip
                label="Alle"
                active={typeFilter === "all"}
                onClick={() => setTypeFilter("all")}
              />
              <FilterChip
                label="Zang"
                active={typeFilter === "song"}
                onClick={() => setTypeFilter("song")}
              />
              <FilterChip
                label="Roep"
                active={typeFilter === "call"}
                onClick={() => setTypeFilter("call")}
              />
            </div>

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

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" onClick={() => loadRecordings()}>
                Opnieuw proberen
              </Button>
            </div>
          ) : recordings.length === 0 ? (
            <div className="text-center py-8">
              <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Geen geluiden gevonden voor deze soort
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                {recordings.length} van {total} opnames
              </p>

              {/* Recordings grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {recordings.map((recording) => (
                  <RecordingCard
                    key={recording.id}
                    recording={recording}
                    isSelected={selectedRecording?.id === recording.id}
                    isPlaying={playingId === recording.id}
                    onSelect={() => setSelectedRecording(recording)}
                    onTogglePlay={() => togglePlay(recording)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer with selection info and confirm button */}
        {selectedRecording && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-4">
              {/* Sonogram preview */}
              <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                <img
                  src={selectedRecording.sonogramUrl}
                  alt="Sonogram"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedRecording.recordist}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedRecording.type} · {selectedRecording.quality} · {selectedRecording.duration} · {selectedRecording.license}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => togglePlay(selectedRecording)}
              >
                {playingId === selectedRecording.id ? (
                  <Square className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
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

// Recording card with sonogram and play button
function RecordingCard({
  recording,
  isSelected,
  isPlaying,
  onSelect,
  onTogglePlay,
}: {
  recording: XenoCantoResult;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onTogglePlay: () => void;
}) {
  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden border-2 transition-all",
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-transparent hover:border-muted-foreground/30"
      )}
    >
      {/* Sonogram image - clickable to select */}
      <button
        onClick={onSelect}
        className="w-full aspect-[4/3] bg-muted block"
      >
        <img
          src={recording.sonogramUrl}
          alt={`Sonogram ${recording.type}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </button>

      {/* Play button overlay */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTogglePlay();
        }}
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

      {/* License badge - styled like GBIF */}
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

// Translation helper
function translateType(type: string): string {
  const translations: Record<string, string> = {
    song: "Zang",
    call: "Roep",
    "alarm call": "Alarm",
    "flight call": "Vlucht",
  };
  return translations[type.toLowerCase()] || type;
}

// Format license for display (shorten "CC BY-NC-SA 4.0" to "BY-NC-SA")
function formatLicense(license: string): string {
  // Remove "CC " prefix and version number
  return license
    .replace(/^CC\s+/i, "")
    .replace(/\s+\d+\.\d+$/, "")
    .trim();
}

// Get license badge color class based on license type (matches GBIF styling)
function getLicenseColor(license: string): string {
  const upper = license.toUpperCase();

  // CC0 or Public Domain: green
  if (upper.includes("CC0") || upper.includes("PUBLIC")) {
    return "bg-green-500/90 text-white";
  }

  // Non-commercial licenses (BY-NC, BY-NC-SA, BY-NC-ND): orange
  if (upper.includes("NC")) {
    return "bg-orange-500/90 text-white";
  }

  // Commercial-friendly licenses (BY, BY-SA): blue
  return "bg-blue-500/90 text-white";
}
