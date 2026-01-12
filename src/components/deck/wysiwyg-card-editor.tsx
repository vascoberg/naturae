"use client";

import { useState } from "react";
import { Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardSideEditor } from "./card-side-editor";
import { SpeciesSelector } from "@/components/species";
import type { Species, SpeciesDisplayOption } from "@/types/species";

interface CardMedia {
  id: string;
  type: "image" | "audio";
  url: string;
  position: "front" | "back" | "both";
  displayOrder: number;
  attributionName?: string | null;
  attributionSource?: string | null;
  license?: string | null;
}

interface CardSpecies {
  id: string;
  scientificName: string;
  canonicalName: string;
  commonNames: { nl?: string };
  gbifKey?: number | null;
}

interface WysiwygCardEditorProps {
  frontText: string;
  backText: string;
  media: CardMedia[];
  cardId?: string;
  deckId?: string;
  speciesId?: string | null;
  speciesDisplay?: SpeciesDisplayOption;
  species?: CardSpecies | null;
  onSave: (
    frontText: string,
    backText: string,
    speciesId: string | null,
    speciesDisplay: SpeciesDisplayOption
  ) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onMediaAdded?: (media: CardMedia) => void;
  onMediaDeleted?: (mediaId: string) => void;
  onMediaUpdated?: (mediaId: string, attribution: string) => void;
  isNew?: boolean;
}

export function WysiwygCardEditor({
  frontText: initialFrontText,
  backText: initialBackText,
  media,
  cardId,
  deckId,
  speciesId: initialSpeciesId,
  speciesDisplay: initialSpeciesDisplay = "back",
  species: initialSpecies,
  onSave,
  onCancel,
  onDelete,
  onMediaAdded,
  onMediaDeleted,
  onMediaUpdated,
  isNew = false,
}: WysiwygCardEditorProps) {
  const [frontText, setFrontText] = useState(initialFrontText);
  const [backText, setBackText] = useState(initialBackText);
  const [speciesId, setSpeciesId] = useState<string | null>(initialSpeciesId || null);
  const [speciesDisplay, setSpeciesDisplay] = useState<SpeciesDisplayOption>(initialSpeciesDisplay);
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(
    initialSpecies
      ? {
          id: initialSpecies.id,
          scientific_name: initialSpecies.scientificName,
          canonical_name: initialSpecies.canonicalName,
          common_names: initialSpecies.commonNames,
          taxonomy: {},
          gbif_key: initialSpecies.gbifKey ?? null,
          source: "gbif",
          gbif_data: null,
          created_at: "",
          updated_at: "",
        }
      : null
  );

  const handleSpeciesChange = (newSpeciesId: string | null, species: Species | null) => {
    setSpeciesId(newSpeciesId);
    setSelectedSpecies(species);
  };

  const handleSave = () => {
    if (!backText.trim()) return;
    onSave(frontText.trim(), backText.trim(), speciesId, speciesDisplay);
  };

  const canSave = backText.trim().length > 0;

  // GBIF props voor CardSideEditor
  const speciesGbifKey = selectedSpecies?.gbif_key;
  const speciesDisplayName = selectedSpecies?.common_names?.nl ||
    selectedSpecies?.canonical_name ||
    selectedSpecies?.scientific_name ||
    null;

  return (
    <div className="space-y-4">
      {/* Side-by-side layout op desktop, stacked op mobiel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Voorkant - links */}
        <CardSideEditor
          side="front"
          label="Voorkant"
          text={frontText}
          onTextChange={setFrontText}
          media={media}
          cardId={cardId}
          deckId={deckId}
          onMediaAdded={onMediaAdded}
          onMediaDeleted={onMediaDeleted}
          onMediaUpdated={onMediaUpdated}
          placeholder="Vraag, hint of context (optioneel)"
          speciesGbifKey={speciesGbifKey}
          speciesName={speciesDisplayName}
        />

        {/* Achterkant - rechts */}
        <CardSideEditor
          side="back"
          label="Achterkant"
          text={backText}
          onTextChange={setBackText}
          media={media}
          cardId={cardId}
          deckId={deckId}
          onMediaAdded={onMediaAdded}
          onMediaDeleted={onMediaDeleted}
          onMediaUpdated={onMediaUpdated}
          placeholder="Extra informatie (optioneel)"
          speciesGbifKey={speciesGbifKey}
          speciesName={speciesDisplayName}
        />
      </div>

      {/* Species Selector - Primair antwoord */}
      <div className="space-y-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="space-y-2">
          <label className="text-sm font-semibold">Soort (primair antwoord)</label>
          <SpeciesSelector
            value={speciesId}
            onChange={handleSpeciesChange}
            placeholder="Zoek op Nederlandse of wetenschappelijke naam..."
          />
        </div>

        {/* Display options - only show when species is selected */}
        {speciesId && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Soort tonen op
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                { value: "back", label: "Achterkant" },
                { value: "front", label: "Voorkant" },
                { value: "both", label: "Beide" },
                { value: "none", label: "Verborgen" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`species-display-${cardId || "new"}`}
                    value={option.value}
                    checked={speciesDisplay === option.value}
                    onChange={(e) =>
                      setSpeciesDisplay(e.target.value as SpeciesDisplayOption)
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!canSave}
          >
            <Check className="w-4 h-4 mr-1" />
            {isNew ? "Toevoegen" : "Opslaan"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
          >
            <X className="w-4 h-4 mr-1" />
            Annuleren
          </Button>
        </div>

        {onDelete && !isNew && (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Verwijderen
          </Button>
        )}
      </div>
    </div>
  );
}
