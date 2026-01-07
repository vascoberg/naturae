"use client";

import { useState, useCallback } from "react";
import { Upload, Music, Image, Loader2, Check, X, FileAudio, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { parseAudioFilename } from "@/lib/import/parse-filename";
import { parseImageFilename } from "@/lib/import/parse-image-filename";
import { parseAudioMetadata, embeddedImageToFile } from "@/lib/import/parse-audio-metadata";
import { addCardsToDeck } from "@/lib/actions/import";
import type { ImportCardPreview, ImportProgress, ImportResult } from "@/lib/import/types";

interface BulkImportFormProps {
  deckId: string;
  onSuccess?: (addedCount: number) => void;
  onCancel?: () => void;
}

const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|webm|m4a|flac)$/i;
const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|bmp|svg)$/i;

export function BulkImportForm({ deckId, onSuccess, onCancel }: BulkImportFormProps) {
  const supabase = createClient();

  const [cards, setCards] = useState<ImportCardPreview[]>([]);
  const [progress, setProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    status: "idle",
  });
  const [error, setError] = useState<string | null>(null);

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
      setProgress((prev) => ({
        ...prev,
        current: ++processedCount,
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
        id: `import-${Date.now()}-${processedCount}`,
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
        status: "pending",
      });
    }

    // Process image files
    for (const file of imageFiles) {
      setProgress((prev) => ({
        ...prev,
        current: ++processedCount,
        message: `Analyseren: ${file.name}`,
      }));

      const parsed = parseImageFilename(file.name);
      const imagePreviewUrl = URL.createObjectURL(file);

      newCards.push({
        id: `import-${Date.now()}-${processedCount}`,
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

  const audioCount = cards.filter((c) => c.audioFile).length;
  const imageCount = cards.filter((c) => c.imageFile && !c.audioFile).length;
  const embeddedImageCount = cards.filter((c) => c.audioFile && c.imageFile).length;

  return (
    <div className="space-y-6">
      {/* File drop zone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept=".mp3,.wav,.ogg,.webm,.m4a,.flac,.jpg,.jpeg,.png,.gif,.webp"
          onChange={handleFileInput}
          className="hidden"
          disabled={isUploading}
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
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
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
                  </div>

                  {/* Media indicators */}
                  <div className="flex items-center gap-1 text-muted-foreground">
                    {card.audioFile && <Music className="w-3 h-3" />}
                    {card.imageFile && <Image className="w-3 h-3" />}
                  </div>

                  {/* Remove button */}
                  {!isUploading && card.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCard(card.id)}
                      className="h-6 w-6 p-0"
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
            disabled={isUploading || isDone || cards.length === 0}
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
            disabled={isUploading}
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
