"use client";

import { useState } from "react";
import { Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardSideEditor } from "./card-side-editor";

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

interface WysiwygCardEditorProps {
  frontText: string;
  backText: string;
  media: CardMedia[];
  cardId?: string;
  deckId?: string;
  onSave: (frontText: string, backText: string) => void;
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

  const handleSave = () => {
    if (!backText.trim()) return;
    onSave(frontText.trim(), backText.trim());
  };

  const canSave = backText.trim().length > 0;

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
          placeholder="Het antwoord"
          required
        />
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
