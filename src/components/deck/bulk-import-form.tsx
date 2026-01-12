"use client";

import { useState, useCallback } from "react";
import { Upload, Music, Image, Loader2, Check, X, FileAudio, FileImage, Search, AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { parseAudioFilename } from "@/lib/import/parse-filename";
import { parseImageFilename } from "@/lib/import/parse-image-filename";
import { parseAudioMetadata, embeddedImageToFile } from "@/lib/import/parse-audio-metadata";
import { addCardsToDeck } from "@/lib/actions/import";
import { matchSpeciesByName, searchSpecies, getOrCreateSpecies } from "@/lib/actions/species";
import type { ImportCardPreview, ImportProgress, ImportResult, SpeciesMatch, SpeciesMatchStatus } from "@/lib/import/types";

interface BulkImportFormProps {
  deckId: string;
  onSuccess?: (addedCount: number) => void;
  onCancel?: () => void;
}

const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|webm|m4a|flac)$/i;
const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|bmp|svg)$/i;

// Helper om te bepalen of een naam een echte soortnaam is of een bestandsnaam
function looksLikeFilename(name: string): boolean {
  const filenamePatterns = [
    /^IMG_\d+$/i,
    /^DSC_?\d+$/i,
    /^P\d{7,}$/i,
    /^DSCN?\d+$/i,
    /^\d{8}_\d{6}$/,
    /^[A-Z]{2,4}\d{4,}$/i,
  ];
  return filenamePatterns.some(pattern => pattern.test(name));
}

// Counter voor unieke IDs
let idCounter = 0;
function generateUniqueId(): string {
  return `import-${Date.now()}-${++idCounter}-${Math.random().toString(36).substring(2, 8)}`;
}

export function BulkImportForm({ deckId, onSuccess, onCancel }: BulkImportFormProps) {
  const supabase = createClient();

  const [cards, setCards] = useState<ImportCardPreview[]>([]);
  const [progress, setProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    status: "idle",
  });
  const [error, setError] = useState<string | null>(null);
  const [isMatchingSpecies, setIsMatchingSpecies] = useState(false);

  // Species matching voor alle kaarten uitvoeren
  const matchAllSpecies = useCallback(async () => {
    if (cards.length === 0) return;

    setIsMatchingSpecies(true);
    setProgress({
      current: 0,
      total: cards.length,
      status: "processing",
      message: "Soorten zoeken...",
    });

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];

      setProgress((prev) => ({
        ...prev,
        current: i + 1,
        message: `Zoeken: ${card.dutchName}`,
      }));

      // Update status naar searching
      setCards((prev) =>
        prev.map((c) =>
          c.id === card.id
            ? { ...c, speciesMatchStatus: "searching" as SpeciesMatchStatus }
            : c
        )
      );

      // Skip als naam eruitziet als bestandsnaam
      if (looksLikeFilename(card.dutchName)) {
        setCards((prev) =>
          prev.map((c) =>
            c.id === card.id
              ? { ...c, speciesMatchStatus: "skipped" as SpeciesMatchStatus }
              : c
          )
        );
        continue;
      }

      try {
        let match: SpeciesMatch | null = null;
        let suggestions: SpeciesMatch[] = [];

        // 1. Als wetenschappelijke naam aanwezig, probeer exacte match
        if (card.scientificName) {
          const result = await matchSpeciesByName(card.scientificName);
          if (result.data) {
            match = {
              speciesId: result.data.id,
              scientificName: result.data.scientific_name,
              dutchName: result.data.common_names?.nl || null,
              gbifKey: result.data.gbif_key,
              confidence: "exact",
            };
          }
        }

        // 2. Als geen exacte match, zoek op Nederlandse naam
        if (!match && card.dutchName) {
          const searchResult = await searchSpecies(card.dutchName);
          if (searchResult.data && searchResult.data.length > 0) {
            // Converteer naar SpeciesMatch format
            suggestions = searchResult.data.slice(0, 5).map((s) => ({
              speciesId: s.id,
              scientificName: s.scientific_name,
              dutchName: s.dutch_name,
              gbifKey: s.gbif_key,
              confidence: s.source === "local" ? "high" as const : "low" as const,
            }));

            // Als eerste suggestie een hoge confidence heeft, gebruik als match
            const firstResult = searchResult.data[0];
            const dutchNameMatch = firstResult.dutch_name?.toLowerCase() === card.dutchName.toLowerCase();

            if (dutchNameMatch || firstResult.source === "local") {
              // Haal volledige species op als het een GBIF result is
              if (firstResult.source === "gbif" && firstResult.gbif_key) {
                const speciesResult = await getOrCreateSpecies(firstResult.gbif_key);
                if (speciesResult.data) {
                  match = {
                    speciesId: speciesResult.data.id,
                    scientificName: speciesResult.data.scientific_name,
                    dutchName: speciesResult.data.common_names?.nl || null,
                    gbifKey: speciesResult.data.gbif_key,
                    confidence: dutchNameMatch ? "exact" : "high",
                  };
                }
              } else {
                match = {
                  speciesId: firstResult.id,
                  scientificName: firstResult.scientific_name,
                  dutchName: firstResult.dutch_name,
                  gbifKey: firstResult.gbif_key,
                  confidence: dutchNameMatch ? "exact" : "high",
                };
              }
            }
          }
        }

        // Update card met resultaat
        setCards((prev) =>
          prev.map((c) => {
            if (c.id !== card.id) return c;

            if (match) {
              return {
                ...c,
                speciesMatchStatus: "matched" as SpeciesMatchStatus,
                speciesMatch: match,
                speciesSuggestions: [],
              };
            } else if (suggestions.length > 0) {
              return {
                ...c,
                speciesMatchStatus: "suggested" as SpeciesMatchStatus,
                speciesMatch: null,
                speciesSuggestions: suggestions,
              };
            } else {
              return {
                ...c,
                speciesMatchStatus: "not_found" as SpeciesMatchStatus,
                speciesMatch: null,
                speciesSuggestions: [],
              };
            }
          })
        );
      } catch (err) {
        console.error("Species match error:", err);
        setCards((prev) =>
          prev.map((c) =>
            c.id === card.id
              ? { ...c, speciesMatchStatus: "not_found" as SpeciesMatchStatus }
              : c
          )
        );
      }
    }

    setIsMatchingSpecies(false);
    setProgress({
      current: cards.length,
      total: cards.length,
      status: "idle",
      message: "Soorten zoeken voltooid",
    });
  }, [cards]);

  // Selecteer een suggestie voor een kaart
  const selectSuggestion = useCallback(async (cardId: string, suggestion: SpeciesMatch) => {
    if (suggestion.speciesId.startsWith("gbif-") && suggestion.gbifKey) {
      const result = await getOrCreateSpecies(suggestion.gbifKey);
      if (result.data) {
        setCards((prev) =>
          prev.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  speciesMatchStatus: "matched" as SpeciesMatchStatus,
                  speciesMatch: {
                    speciesId: result.data!.id,
                    scientificName: result.data!.scientific_name,
                    dutchName: result.data!.common_names?.nl || null,
                    gbifKey: result.data!.gbif_key,
                    confidence: "high",
                  },
                  speciesSuggestions: [],
                }
              : c
          )
        );
      }
    } else {
      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId
            ? {
                ...c,
                speciesMatchStatus: "matched" as SpeciesMatchStatus,
                speciesMatch: suggestion,
                speciesSuggestions: [],
              }
            : c
        )
      );
    }
  }, []);

  // Verwijder species koppeling
  const clearSpeciesMatch = useCallback((cardId: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? {
              ...c,
              speciesMatchStatus: "not_found" as SpeciesMatchStatus,
              speciesMatch: null,
              speciesSuggestions: [],
            }
          : c
      )
    );
  }, []);

  const handleFilesDrop = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    const audioFiles = fileArray.filter((file) => AUDIO_EXTENSIONS.test(file.name));
    const imageFiles = fileArray.filter((file) => IMAGE_EXTENSIONS.test(file.name));

    if (audioFiles.length === 0 && imageFiles.length === 0) {
      setError("Geen audio- of afbeeldingsbestanden gevonden.");
      return;
    }

    setError(null);
    const totalFiles = audioFiles.length + imageFiles.length;
    setProgress({
      current: 0,
      total: totalFiles,
      status: "processing",
      message: "Bestanden analyseren...",
    });

    const newCards: ImportCardPreview[] = [];
    let processedCount = 0;

    // Process audio files
    for (const file of audioFiles) {
      processedCount++;
      setProgress((prev) => ({
        ...prev,
        current: processedCount,
        message: `Analyseren: ${file.name}`,
      }));

      const parsed = parseAudioFilename(file.name);
      const metadata = await parseAudioMetadata(file);

      let imageFile: File | null = null;
      let imagePreviewUrl: string | null = null;

      if (metadata.embeddedImage) {
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        imageFile = embeddedImageToFile(metadata.embeddedImage, baseName);
        imagePreviewUrl = URL.createObjectURL(imageFile);
      }

      newCards.push({
        id: generateUniqueId(),
        filename: file.name,
        position: parsed?.position || processedCount,
        dutchName: parsed?.dutchName || file.name.replace(/\.[^/.]+$/, ""),
        scientificName: parsed?.scientificName || null,
        group: parsed?.group || null,
        subgroup: parsed?.subgroup || null,
        audioFile: file,
        artist: metadata.artist,
        copyright: metadata.copyright,
        sourceUrl: metadata.sourceUrl,
        imageFile,
        imagePreviewUrl,
        speciesMatchStatus: "pending",
        speciesMatch: null,
        speciesSuggestions: [],
        status: "pending",
      });
    }

    // Process image files
    for (const file of imageFiles) {
      processedCount++;
      setProgress((prev) => ({
        ...prev,
        current: processedCount,
        message: `Analyseren: ${file.name}`,
      }));

      const parsed = parseImageFilename(file.name);
      const imagePreviewUrl = URL.createObjectURL(file);

      newCards.push({
        id: generateUniqueId(),
        filename: file.name,
        position: parsed?.position || processedCount,
        dutchName: parsed?.dutchName || file.name.replace(/\.[^/.]+$/, ""),
        scientificName: parsed?.scientificName || null,
        group: parsed?.group || null,
        subgroup: parsed?.subgroup || null,
        audioFile: null,
        artist: null,
        copyright: null,
        sourceUrl: null,
        imageFile: file,
        imagePreviewUrl,
        speciesMatchStatus: "pending",
        speciesMatch: null,
        speciesSuggestions: [],
        status: "pending",
      });
    }

    // Sort by position
    newCards.sort((a, b) => a.position - b.position);

    setCards(newCards);
    setProgress({
      current: totalFiles,
      total: totalFiles,
      status: "idle",
      message: `${newCards.length} bestanden geanalyseerd`,
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleFilesDrop(e.dataTransfer.files);
    },
    [handleFilesDrop]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFilesDrop(e.target.files);
      }
    },
    [handleFilesDrop]
  );

  const handleImport = async () => {
    if (cards.length === 0) {
      setError("Selecteer eerst bestanden om te importeren");
      return;
    }

    setError(null);
    setProgress({
      current: 0,
      total: cards.length,
      status: "uploading",
      message: "Bestanden uploaden...",
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Je bent niet ingelogd");
      return;
    }

    const uploadedCards: ImportResult[] = [];

    // Upload files
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];

      setProgress((prev) => ({
        ...prev,
        current: i + 1,
        message: `Uploaden: ${card.dutchName}`,
      }));

      setCards((prev) =>
        prev.map((c) =>
          c.id === card.id ? { ...c, status: "uploading" as const } : c
        )
      );

      try {
        let audioUrl: string | null = null;
        let imageUrl: string | null = null;

        // Generate unique timestamp for this card
        const timestamp = Date.now();
        const uniqueId = `${timestamp}-${i}-${Math.random().toString(36).substring(2, 8)}`;

        // Upload audio if available
        if (card.audioFile) {
          const audioPath = `${user.id}/${deckId}/${uniqueId}-${card.audioFile.name}`;
          const { error: audioError } = await supabase.storage
            .from("media")
            .upload(audioPath, card.audioFile);

          if (audioError) {
            throw new Error(`Audio upload failed: ${audioError.message}`);
          }

          const { data: audioUrlData } = supabase.storage
            .from("media")
            .getPublicUrl(audioPath);
          audioUrl = audioUrlData.publicUrl;
        }

        // Upload image if available
        if (card.imageFile) {
          const imagePath = `${user.id}/${deckId}/${uniqueId}-img-${card.imageFile.name}`;
          const { error: imageError } = await supabase.storage
            .from("media")
            .upload(imagePath, card.imageFile);

          if (!imageError) {
            const { data: imageUrlData } = supabase.storage
              .from("media")
              .getPublicUrl(imagePath);
            imageUrl = imageUrlData.publicUrl;
          }
        }

        uploadedCards.push({
          position: card.position,
          dutchName: card.dutchName,
          scientificName: card.scientificName,
          artist: card.artist,
          copyright: card.copyright,
          sourceUrl: card.sourceUrl,
          audioUrl,
          imageUrl,
          speciesId: card.speciesMatch?.speciesId || null,
        });

        setCards((prev) =>
          prev.map((c) =>
            c.id === card.id ? { ...c, status: "done" as const } : c
          )
        );
      } catch (err) {
        console.error("Upload error:", err);
        setCards((prev) =>
          prev.map((c) =>
            c.id === card.id
              ? { ...c, status: "error" as const, error: String(err) }
              : c
          )
        );
      }
    }

    // Add cards to deck
    setProgress((prev) => ({
      ...prev,
      message: "Kaarten toevoegen aan leerset...",
    }));

    const result = await addCardsToDeck(deckId, uploadedCards);

    if ("error" in result) {
      setError(result.error);
      setProgress((prev) => ({ ...prev, status: "error" }));
      return;
    }

    setProgress({
      current: cards.length,
      total: cards.length,
      status: "done",
      message: `${result.addedCount} kaarten toegevoegd!`,
    });

    if (onSuccess) {
      setTimeout(() => onSuccess(result.addedCount), 1000);
    }
  };

  const removeCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const isUploading = progress.status === "uploading";
  const isDone = progress.status === "done";
  const isProcessing = progress.status === "processing";

  const audioCount = cards.filter((c) => c.audioFile).length;
  const imageCount = cards.filter((c) => c.imageFile && !c.audioFile).length;
  const embeddedImageCount = cards.filter((c) => c.audioFile && c.imageFile).length;

  // Species matching statistieken
  const matchedCount = cards.filter((c) => c.speciesMatchStatus === "matched").length;
  const suggestedCount = cards.filter((c) => c.speciesMatchStatus === "suggested").length;
  const notFoundCount = cards.filter((c) => c.speciesMatchStatus === "not_found").length;

  // Species status icon component
  const SpeciesStatusIcon = ({ status }: { status: SpeciesMatchStatus }) => {
    switch (status) {
      case "matched":
        return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      case "suggested":
        return <HelpCircle className="w-3 h-3 text-amber-500" />;
      case "searching":
        return <Loader2 className="w-3 h-3 animate-spin text-primary" />;
      case "not_found":
        return <AlertCircle className="w-3 h-3 text-muted-foreground" />;
      case "skipped":
        return <X className="w-3 h-3 text-muted-foreground" />;
      default:
        return <Search className="w-3 h-3 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* File drop zone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
        onClick={() => document.getElementById("bulk-file-input")?.click()}
      >
        <input
          id="bulk-file-input"
          type="file"
          multiple
          accept=".mp3,.wav,.ogg,.webm,.m4a,.flac,.jpg,.jpeg,.png,.gif,.webp"
          onChange={handleFileInput}
          className="hidden"
          disabled={isUploading || isProcessing}
        />
        <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-2">
          Sleep bestanden hierheen
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          of klik om te selecteren
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileAudio className="w-4 h-4" />
            MP3, WAV, OGG, M4A
          </span>
          <span className="flex items-center gap-1">
            <FileImage className="w-4 h-4" />
            JPG, PNG, GIF, WebP
          </span>
        </div>
      </div>

      {/* File summary */}
      {cards.length > 0 && progress.status === "idle" && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {audioCount > 0 && (
            <span className="flex items-center gap-1">
              <Music className="w-4 h-4" />
              {audioCount} audio{audioCount > 1 ? "bestanden" : "bestand"}
              {embeddedImageCount > 0 && ` (${embeddedImageCount} met afbeelding)`}
            </span>
          )}
          {imageCount > 0 && (
            <span className="flex items-center gap-1">
              <Image className="w-4 h-4" />
              {imageCount} afbeelding{imageCount > 1 ? "en" : ""}
            </span>
          )}
        </div>
      )}

      {/* Species matching section */}
      {cards.length > 0 && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Soorten koppelen</h3>
              <p className="text-xs text-muted-foreground">
                Automatisch soorten herkennen uit bestandsnamen
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={matchAllSpecies}
              disabled={isUploading || isMatchingSpecies || cards.length === 0}
            >
              {isMatchingSpecies ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Zoeken...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Soorten zoeken
                </>
              )}
            </Button>
          </div>

          {/* Species matching stats */}
          {(matchedCount > 0 || suggestedCount > 0 || notFoundCount > 0) && (
            <div className="flex items-center gap-4 text-xs">
              {matchedCount > 0 && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="w-3 h-3" />
                  {matchedCount} gekoppeld
                </span>
              )}
              {suggestedCount > 0 && (
                <span className="flex items-center gap-1 text-amber-600">
                  <HelpCircle className="w-3 h-3" />
                  {suggestedCount} suggesties
                </span>
              )}
              {notFoundCount > 0 && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <AlertCircle className="w-3 h-3" />
                  {notFoundCount} niet gevonden
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Progress */}
      {progress.status !== "idle" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{progress.message}</span>
            <span>
              {progress.current} / {progress.total}
            </span>
          </div>
          <Progress value={(progress.current / progress.total) * 100} />
        </div>
      )}

      {/* Error */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Preview list */}
      {cards.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">
              Preview ({cards.length} kaarten)
            </CardTitle>
          </CardHeader>
          <CardContent className="py-0 pb-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-start gap-3 p-2 rounded-lg bg-muted/50"
                >
                  {/* Status indicator */}
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                    {card.status === "uploading" && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    )}
                    {card.status === "done" && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                    {card.status === "error" && (
                      <X className="w-4 h-4 text-destructive" />
                    )}
                    {card.status === "pending" && (
                      <span className="text-xs text-muted-foreground">
                        {card.position}.
                      </span>
                    )}
                  </div>

                  {/* Thumbnail / media icons */}
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {card.imagePreviewUrl ? (
                      <img
                        src={card.imagePreviewUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : card.audioFile ? (
                      <Music className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Image className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Card info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{card.dutchName}</p>
                    {card.scientificName && (
                      <p className="text-xs text-muted-foreground truncate italic">
                        {card.scientificName}
                      </p>
                    )}

                    {/* Species match result */}
                    {card.speciesMatchStatus === "matched" && card.speciesMatch && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          {card.speciesMatch.dutchName || card.speciesMatch.scientificName}
                        </span>
                        <button
                          onClick={() => clearSpeciesMatch(card.id)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Suggestions dropdown */}
                    {card.speciesMatchStatus === "suggested" && card.speciesSuggestions.length > 0 && (
                      <div className="mt-1 space-y-1">
                        <p className="text-xs text-amber-600">Kies een soort:</p>
                        <div className="flex flex-wrap gap-1">
                          {card.speciesSuggestions.slice(0, 3).map((suggestion) => (
                            <button
                              key={suggestion.speciesId}
                              onClick={() => selectSuggestion(card.id, suggestion)}
                              className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
                            >
                              {suggestion.dutchName || suggestion.scientificName}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Species status icon */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <SpeciesStatusIcon status={card.speciesMatchStatus} />
                  </div>

                  {/* Media indicators */}
                  <div className="flex items-center gap-1 text-muted-foreground flex-shrink-0">
                    {card.audioFile && <Music className="w-3 h-3" />}
                    {card.imageFile && <Image className="w-3 h-3" />}
                  </div>

                  {/* Remove button */}
                  {!isUploading && card.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCard(card.id)}
                      className="h-6 w-6 p-0 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      {cards.length > 0 && (
        <div className="flex gap-3">
          <Button
            onClick={handleImport}
            disabled={isUploading || isDone || cards.length === 0 || isMatchingSpecies}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importeren...
              </>
            ) : isDone ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Voltooid
              </>
            ) : (
              `${cards.length} kaarten importeren`
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setCards([]);
              setProgress({ current: 0, total: 0, status: "idle" });
              if (onCancel) onCancel();
            }}
            disabled={isUploading || isMatchingSpecies}
          >
            {cards.length > 0 ? "Reset" : "Annuleren"}
          </Button>
        </div>
      )}

      {cards.length === 0 && onCancel && (
        <Button variant="outline" onClick={onCancel}>
          Annuleren
        </Button>
      )}
    </div>
  );
}
