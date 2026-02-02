"use client";

import { useState, useRef } from "react";
import { Upload, Image, Music, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import {
  addCardMedia,
  deleteCardMedia,
  checkStorageLimit,
  recordStorageUpload,
} from "@/lib/actions/decks";

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

interface CardMediaUploadProps {
  cardId: string;
  deckId: string;
  onMediaAdded: (media: CardMedia) => void;
  onMediaDeleted: (mediaId: string) => void;
  existingMedia: CardMedia[];
}

export function CardMediaUpload({
  cardId,
  deckId,
  onMediaAdded,
  onMediaDeleted,
  existingMedia,
}: CardMediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPosition, setUploadPosition] = useState<"front" | "back" | "both">("front");
  const [showAttribution, setShowAttribution] = useState(false);
  const [attribution, setAttribution] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const handleFileUpload = async (
    file: File,
    type: "image" | "audio"
  ) => {
    setIsUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Niet ingelogd");
      }

      // Check storage limiet vóór upload
      const storageCheck = await checkStorageLimit(file.size);
      if (!storageCheck.allowed) {
        throw new Error(storageCheck.error || "Opslaglimiet bereikt");
      }

      // Generate unique filename
      const ext = file.name.split(".").pop();
      const filename = `${crypto.randomUUID()}.${ext}`;
      const path = `${user.id}/${deckId}/${cardId}/${filename}`;

      // Upload to Supabase Storage
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

      // Registreer upload in storage tracking
      await recordStorageUpload(file.size);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("media")
        .getPublicUrl(path);

      // Add media record - store attribution in attribution_source field
      const result = await addCardMedia(cardId, {
        type,
        url: urlData.publicUrl,
        position: uploadPosition,
        attributionSource: attribution || undefined,
      });

      onMediaAdded({
        id: result.id,
        type,
        url: urlData.publicUrl,
        position: uploadPosition,
        displayOrder: existingMedia.filter((m) => m.position === uploadPosition || m.position === "both")
          .length,
        attributionName: null,
        attributionSource: attribution || null,
        license: null,
      });

      // Reset form
      setAttribution("");
      setShowAttribution(false);
    } catch (error) {
      console.error("Error uploading media:", error);
      const message = error instanceof Error ? error.message : "Er ging iets mis bij het uploaden";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Client-side image resize for performance
      resizeImage(file, 1200).then((resizedFile) => {
        handleFileUpload(resizedFile, "image");
      });
    }
    e.target.value = "";
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, "audio");
    }
    e.target.value = "";
  };

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      await deleteCardMedia(mediaId);
      onMediaDeleted(mediaId);
    } catch (error) {
      console.error("Error deleting media:", error);
    }
  };

  const frontMedia = existingMedia.filter((m) => m.position === "front" || m.position === "both");
  const backMedia = existingMedia.filter((m) => m.position === "back" || m.position === "both");
  const bothMedia = existingMedia.filter((m) => m.position === "both");

  return (
    <div className="space-y-3">
      {/* Existing media */}
      {(frontMedia.length > 0 || backMedia.length > 0) && (
        <div className="space-y-2">
          {frontMedia.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Voorkant media:</p>
              <div className="flex gap-2 flex-wrap">
                {frontMedia.map((media) => (
                  <MediaPreview
                    key={media.id}
                    media={media}
                    onDelete={() => handleDeleteMedia(media.id)}
                  />
                ))}
              </div>
            </div>
          )}
          {backMedia.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Achterkant media:</p>
              <div className="flex gap-2 flex-wrap">
                {backMedia.map((media) => (
                  <MediaPreview
                    key={media.id}
                    media={media}
                    onDelete={() => handleDeleteMedia(media.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload controls */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={uploadPosition}
          onChange={(e) => setUploadPosition(e.target.value as "front" | "back" | "both")}
          className="text-xs border rounded px-2 py-1"
        >
          <option value="front">Voorkant</option>
          <option value="back">Achterkant</option>
          <option value="both">Beide zijden</option>
        </select>

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

        <Button
          variant="outline"
          size="sm"
          onClick={() => imageInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Image className="w-4 h-4 mr-1" />
          )}
          Foto
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => audioInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Music className="w-4 h-4 mr-1" />
          )}
          Audio
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAttribution(!showAttribution)}
          className="text-xs"
        >
          {showAttribution ? "Verberg" : "Bronvermelding..."}
        </Button>
      </div>

      {/* Attribution field */}
      {showAttribution && (
        <div className="text-xs">
          <Input
            value={attribution}
            onChange={(e) => setAttribution(e.target.value)}
            placeholder="Bijv. © Jan Jansen, waarneming.nl"
            className="h-8 text-xs max-w-sm"
          />
        </div>
      )}
    </div>
  );
}

function MediaPreview({
  media,
  onDelete,
}: {
  media: CardMedia;
  onDelete: () => void;
}) {
  return (
    <div className="relative group">
      {media.type === "image" ? (
        <img
          src={media.url}
          alt=""
          className="w-16 h-16 object-cover rounded"
        />
      ) : (
        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
          <Music className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      <button
        onClick={onDelete}
        className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>
      {(media.attributionSource || media.attributionName) && (
        <p className="text-[10px] text-muted-foreground truncate w-16 mt-0.5">
          {media.attributionSource || media.attributionName}
        </p>
      )}
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
