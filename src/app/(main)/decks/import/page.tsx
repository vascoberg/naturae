"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Music, Image, Loader2, Check, X, FileAudio, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { parseAudioFilename } from "@/lib/import/parse-filename";
import { parseImageFilename } from "@/lib/import/parse-image-filename";
import { parseAudioMetadata, embeddedImageToFile } from "@/lib/import/parse-audio-metadata";
import { createDeckWithCards } from "@/lib/actions/import";
import type { ImportCardPreview, ImportProgress, ImportResult } from "@/lib/import/types";

const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|webm|m4a|flac)$/i;
const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|bmp|svg)$/i;

export default function ImportPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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

    // Auto-fill title from first group if available
    if (!title && newCards.length > 0 && newCards[0].group) {
      setTitle(`Nederlandse ${newCards[0].group}`);
    }
  }, [title]);

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
    if (!title.trim()) {
      setError("Titel is verplicht");
      return;
    }

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
          const audioPath = `${user.id}/${uniqueId}-${card.audioFile.name}`;
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
          const imagePath = `${user.id}/${uniqueId}-img-${card.imageFile.name}`;
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

    // Create deck with cards
    setProgress((prev) => ({
      ...prev,
      message: "Leerset aanmaken...",
    }));

    const result = await createDeckWithCards(
      title.trim(),
      description.trim() || null,
      uploadedCards
    );

    if ("error" in result) {
      setError(result.error);
      setProgress((prev) => ({ ...prev, status: "error" }));
      return;
    }

    setProgress({
      current: cards.length,
      total: cards.length,
      status: "done",
      message: "Import voltooid!",
    });

    // Redirect to the new deck
    setTimeout(() => {
      router.push(`/decks/${result.deckId}`);
    }, 1000);
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/my-decks"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Terug naar mijn leersets
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Nieuwe leerset importeren</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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

          {/* Deck info */}
          {cards.length > 0 && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Titel <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="bijv. Nederlandse Trekvogels"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isUploading}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Beschrijving
                  </label>
                  <textarea
                    id="description"
                    className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Korte beschrijving van de leerset..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isUploading}
                    maxLength={500}
                  />
                </div>
              </div>

              {/* Progress */}
              {progress.status !== "idle" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{progress.message}</span>
                    <span>
                      {progress.current} / {progress.total}
                    </span>
                  </div>
                  <Progress
                    value={(progress.current / progress.total) * 100}
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              {/* Action buttons */}
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
                  }}
                  disabled={isUploading}
                >
                  Reset
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview list */}
      {cards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview ({cards.length} kaarten)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  {/* Status indicator */}
                  <div className="w-6 h-6 flex items-center justify-center">
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
                      <span className="text-sm text-muted-foreground">
                        {card.position}.
                      </span>
                    )}
                  </div>

                  {/* Thumbnail / media icons */}
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {card.imagePreviewUrl ? (
                      <img
                        src={card.imagePreviewUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : card.audioFile ? (
                      <Music className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Image className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Card info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{card.dutchName}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {card.scientificName && (
                        <span className="italic">{card.scientificName}</span>
                      )}
                      {card.scientificName && card.artist && " • "}
                      {card.artist && <span>{card.artist}</span>}
                    </p>
                  </div>

                  {/* Media indicators */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {card.audioFile && <Music className="w-4 h-4" />}
                    {card.imageFile && <Image className="w-4 h-4" />}
                  </div>

                  {/* Remove button */}
                  {!isUploading && card.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCard(card.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alternative: Create deck first */}
      {cards.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Je kunt ook eerst een leerset aanmaken en daarna kaarten importeren.
            </p>
            <Link href="/decks/new">
              <Button variant="outline">
                Eerst een leerset aanmaken
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
