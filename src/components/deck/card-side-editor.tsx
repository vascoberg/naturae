"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Image as ImageIcon, Music, X, Loader2, RefreshCw, Pencil, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { addCardMedia, deleteCardMedia, updateCardMediaAttribution } from "@/lib/actions/decks";

interface CardMedia {
  id: string;
  type: "image" | "audio";
  url: string;
  position: "front" | "back" | "both";
  displayOrder: number;
  attributionName?: string | null;
  attributionSource?: string | null;
  license?: string | null;
  annotatedUrl?: string | null;
}

interface CardSideEditorProps {
  side: "front" | "back";
  label: string;
  text: string;
  onTextChange: (text: string) => void;
  media: CardMedia[];
  cardId?: string;
  deckId?: string;
  onMediaAdded?: (media: CardMedia) => void;
  onMediaDeleted?: (mediaId: string) => void;
  onMediaUpdated?: (mediaId: string, attribution: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function CardSideEditor({
  side,
  label,
  text,
  onTextChange,
  media,
  cardId,
  deckId,
  onMediaAdded,
  onMediaDeleted,
  onMediaUpdated,
  placeholder,
  required = false,
}: CardSideEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"image" | "audio" | null>(null);
  const [attribution, setAttribution] = useState("");
  const [showAttribution, setShowAttribution] = useState(false);
  const [replacingMediaId, setReplacingMediaId] = useState<string | null>(null);
  const [editingAttributionId, setEditingAttributionId] = useState<string | null>(null);
  const [editingAttributionValue, setEditingAttributionValue] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  // Filter media voor deze zijde
  const sideMedia = media.filter(
    (m) => m.position === side || m.position === "both"
  );
  const imageMedia = sideMedia.filter((m) => m.type === "image");
  const audioMedia = sideMedia.filter((m) => m.type === "audio");

  const handleFileUpload = async (file: File, type: "image" | "audio", replaceMediaId?: string) => {
    if (!cardId || !deckId || !onMediaAdded) return;

    setIsUploading(true);
    setUploadType(type);

    try {
      // Als we vervangen, eerst de oude verwijderen
      if (replaceMediaId && onMediaDeleted) {
        await deleteCardMedia(replaceMediaId);
        onMediaDeleted(replaceMediaId);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Niet ingelogd");
      }

      const ext = file.name.split(".").pop();
      const filename = `${crypto.randomUUID()}.${ext}`;
      const path = `${user.id}/${deckId}/${cardId}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error("Upload mislukt");
      }

      const { data: urlData } = supabase.storage
        .from("media")
        .getPublicUrl(path);

      const result = await addCardMedia(cardId, {
        type,
        url: urlData.publicUrl,
        position: side,
        attributionSource: attribution || undefined,
      });

      onMediaAdded({
        id: result.id,
        type,
        url: urlData.publicUrl,
        position: side,
        displayOrder: sideMedia.length,
        attributionName: null,
        attributionSource: attribution || null,
        license: null,
      });

      setAttribution("");
      setShowAttribution(false);
      setReplacingMediaId(null);
    } catch (error) {
      console.error("Error uploading media:", error);
      alert("Er ging iets mis bij het uploaden");
    } finally {
      setIsUploading(false);
      setUploadType(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      resizeImage(file, 1200).then((resizedFile) => {
        handleFileUpload(resizedFile, "image", replacingMediaId || undefined);
      });
    }
    e.target.value = "";
    setReplacingMediaId(null);
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, "audio", replacingMediaId || undefined);
    }
    e.target.value = "";
    setReplacingMediaId(null);
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!onMediaDeleted) return;
    if (!confirm("Media verwijderen?")) return;
    try {
      await deleteCardMedia(mediaId);
      onMediaDeleted(mediaId);
    } catch (error) {
      console.error("Error deleting media:", error);
    }
  };

  const handleReplaceImage = (mediaId: string) => {
    setReplacingMediaId(mediaId);
    imageInputRef.current?.click();
  };

  const handleReplaceAudio = (mediaId: string) => {
    setReplacingMediaId(mediaId);
    audioInputRef.current?.click();
  };

  const handleStartEditAttribution = (mediaItem: CardMedia) => {
    setEditingAttributionId(mediaItem.id);
    setEditingAttributionValue(mediaItem.attributionSource || mediaItem.attributionName || "");
  };

  const handleSaveAttribution = async () => {
    if (!editingAttributionId) return;
    try {
      await updateCardMediaAttribution(editingAttributionId, editingAttributionValue);
      onMediaUpdated?.(editingAttributionId, editingAttributionValue);
      setEditingAttributionId(null);
      setEditingAttributionValue("");
    } catch (error) {
      console.error("Error updating attribution:", error);
    }
  };

  const canUpload = cardId && deckId && onMediaAdded;
  const hasImage = imageMedia.length > 0;
  const hasAudio = audioMedia.length > 0;
  const hasAnyMedia = hasImage || hasAudio;

  // Attribution display component met edit functionaliteit
  const AttributionDisplay = ({ mediaItem, variant }: { mediaItem: CardMedia; variant: "image" | "audio" }) => {
    const currentAttribution = mediaItem.attributionSource || mediaItem.attributionName;
    const isEditing = editingAttributionId === mediaItem.id;

    if (isEditing) {
      return (
        <div className={`flex gap-1 ${variant === "image" ? "absolute bottom-2 left-2 right-2" : "mt-1 w-full"}`}>
          <Input
            value={editingAttributionValue}
            onChange={(e) => setEditingAttributionValue(e.target.value)}
            placeholder="© Naam, bron"
            className="h-7 text-xs flex-1 bg-background/95"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveAttribution();
              if (e.key === "Escape") setEditingAttributionId(null);
            }}
          />
          <Button size="sm" className="h-7 px-2" onClick={handleSaveAttribution}>
            OK
          </Button>
        </div>
      );
    }

    if (variant === "image") {
      return (
        <button
          onClick={() => handleStartEditAttribution(mediaItem)}
          className="absolute bottom-1 left-1 flex items-center gap-1 text-[10px] text-white/90 bg-black/50 px-1.5 py-0.5 rounded max-w-[90%] hover:bg-black/70 transition-colors group"
          title="Bronvermelding bewerken"
        >
          <span className="truncate">{currentAttribution || "Bronvermelding toevoegen"}</span>
          <Pencil className="w-2.5 h-2.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      );
    }

    // Audio variant
    return (
      <button
        onClick={() => handleStartEditAttribution(mediaItem)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1 hover:text-foreground transition-colors group"
        title="Bronvermelding bewerken"
      >
        <span className="truncate">{currentAttribution || "Bronvermelding toevoegen"}</span>
        <Pencil className="w-2.5 h-2.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  };

  return (
    <div className="flex-1 min-w-0">
      <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </div>

      {/* Card preview container */}
      <div className="border rounded-lg bg-card overflow-hidden">
        {/* Media area - boven de tekst */}
        <div className="bg-muted">
          {/* Afbeelding sectie */}
          {hasImage && (
            <div className="relative aspect-[4/3] group">
              <img
                src={imageMedia[0].annotatedUrl || imageMedia[0].url}
                alt=""
                className="w-full h-full object-cover"
              />
              {/* Badge voor geannoteerde afbeelding */}
              {imageMedia[0].annotatedUrl && (
                <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-medium">
                  Geannoteerd
                </span>
              )}
              {/* Controls - zichtbaar bij hover */}
              {canUpload && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/annotate/${imageMedia[0].id}?deckId=${deckId}&cardId=${cardId}`}
                    className="w-7 h-7 bg-background/90 hover:bg-background rounded-full flex items-center justify-center shadow-sm"
                    title="Annoteren"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleReplaceImage(imageMedia[0].id)}
                    className="w-7 h-7 bg-background/90 hover:bg-background rounded-full flex items-center justify-center shadow-sm"
                    title="Vervangen"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteMedia(imageMedia[0].id)}
                    className="w-7 h-7 bg-background/90 hover:bg-destructive hover:text-destructive-foreground rounded-full flex items-center justify-center shadow-sm"
                    title="Verwijderen"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {/* Attribution - klikbaar om te bewerken */}
              {canUpload && <AttributionDisplay mediaItem={imageMedia[0]} variant="image" />}
              {/* Alleen weergeven als niet bewerkbaar */}
              {!canUpload && (imageMedia[0].attributionSource || imageMedia[0].attributionName) && (
                <p className="absolute bottom-1 left-1 text-[10px] text-white/90 bg-black/50 px-1.5 py-0.5 rounded max-w-[90%] truncate">
                  {imageMedia[0].attributionSource || imageMedia[0].attributionName}
                </p>
              )}
              {/* Loading overlay */}
              {isUploading && uploadType === "image" && (
                <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
            </div>
          )}

          {/* Audio sectie - onder de afbeelding of als enige media */}
          {hasAudio && (
            <div className={`p-3 ${hasImage ? "border-t bg-background/50" : "aspect-[4/3] flex flex-col items-center justify-center"}`}>
              {!hasImage && <Music className="w-10 h-10 text-muted-foreground mb-2" />}
              <div className="flex items-center gap-2 w-full">
                <audio
                  src={audioMedia[0].url}
                  controls
                  className="flex-1 h-8"
                />
                {canUpload && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleReplaceAudio(audioMedia[0].id)}
                      className="w-7 h-7 bg-muted hover:bg-muted/80 rounded-full flex items-center justify-center"
                      title="Vervangen"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDeleteMedia(audioMedia[0].id)}
                      className="w-7 h-7 bg-muted hover:bg-destructive hover:text-destructive-foreground rounded-full flex items-center justify-center"
                      title="Verwijderen"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              {/* Audio attribution - klikbaar om te bewerken */}
              {canUpload && <AttributionDisplay mediaItem={audioMedia[0]} variant="audio" />}
              {/* Alleen weergeven als niet bewerkbaar */}
              {!canUpload && (audioMedia[0].attributionSource || audioMedia[0].attributionName) && (
                <p className="text-[10px] text-muted-foreground mt-1 truncate w-full">
                  {audioMedia[0].attributionSource || audioMedia[0].attributionName}
                </p>
              )}
              {/* Loading indicator */}
              {isUploading && uploadType === "audio" && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploaden...
                </div>
              )}
            </div>
          )}

          {/* Upload knoppen - als er nog ruimte is voor media */}
          {canUpload && (!hasImage || !hasAudio) && (
            <div className={`p-3 ${hasAnyMedia ? "border-t" : "aspect-[4/3] flex flex-col items-center justify-center"}`}>
              <div className={`flex gap-2 ${hasAnyMedia ? "" : "mb-2"}`}>
                {!hasImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading && uploadType === "image" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 mr-1" />
                        Foto
                      </>
                    )}
                  </Button>
                )}
                {!hasAudio && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => audioInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading && uploadType === "audio" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Music className="w-4 h-4 mr-1" />
                        Audio
                      </>
                    )}
                  </Button>
                )}
              </div>

              {!hasAnyMedia && (
                <>
                  <p className="text-xs text-muted-foreground text-center mb-2">
                    Voeg media toe
                  </p>
                  <button
                    onClick={() => setShowAttribution(!showAttribution)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {showAttribution ? "Verberg bronvermelding" : "+ Bronvermelding"}
                  </button>
                  {showAttribution && (
                    <Input
                      value={attribution}
                      onChange={(e) => setAttribution(e.target.value)}
                      placeholder="© Naam, bron"
                      className="h-7 text-xs max-w-[200px] mt-2"
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* Geen upload mogelijkheid en geen media */}
          {!canUpload && !hasAnyMedia && (
            <div className="aspect-[4/3] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Geen media</p>
            </div>
          )}
        </div>

        {/* Text area - onder de media */}
        <div className="p-3 border-t">
          <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="w-full resize-none bg-transparent border-0 p-0 text-sm focus:outline-none focus:ring-0 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleAudioSelect}
      />
    </div>
  );
}

// Helper function to resize images client-side
async function resizeImage(file: File, maxWidth: number): Promise<File> {
  return new Promise((resolve) => {
    const img = document.createElement("img");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(
              new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
            );
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.8
      );
    };

    img.src = URL.createObjectURL(file);
  });
}
