"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, GripVertical, Image, Music, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createCard,
  updateCard,
  deleteCard,
  updateDeck,
  deleteDeck,
} from "@/lib/actions/decks";
import { CardMediaUpload } from "./card-media-upload";
import { BulkImportForm } from "./bulk-import-form";

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

interface CardData {
  id: string;
  frontText: string;
  backText: string;
  position: number;
  media: CardMedia[];
}

interface DeckData {
  id: string;
  title: string;
  description: string;
  isPublic: boolean;
}

interface DeckEditorProps {
  deck: DeckData;
  cards: CardData[];
}

export function DeckEditor({ deck, cards: initialCards }: DeckEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(deck.title);
  const [description, setDescription] = useState(deck.description);
  const [isPublic, setIsPublic] = useState(deck.isPublic);
  const [cards, setCards] = useState(initialCards);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [newCardBackText, setNewCardBackText] = useState("");
  const [newCardFrontText, setNewCardFrontText] = useState("");
  const [showBulkImport, setShowBulkImport] = useState(false);

  const handleSaveDeck = async () => {
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      await updateDeck(deck.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        isPublic,
      });
    } catch (error) {
      console.error("Error saving deck:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDeck = async () => {
    if (!confirm("Weet je zeker dat je deze leerset wilt verwijderen?")) return;

    setIsDeleting(true);
    try {
      await deleteDeck(deck.id);
      router.push("/my-decks");
    } catch (error) {
      console.error("Error deleting deck:", error);
      setIsDeleting(false);
    }
  };

  const handleAddCard = async () => {
    if (!newCardBackText.trim()) return;

    try {
      const result = await createCard(deck.id, {
        frontText: newCardFrontText.trim() || undefined,
        backText: newCardBackText.trim(),
      });

      setCards((prev) => [
        ...prev,
        {
          id: result.id,
          frontText: newCardFrontText.trim(),
          backText: newCardBackText.trim(),
          position: prev.length,
          media: [],
        },
      ]);

      setNewCardFrontText("");
      setNewCardBackText("");
    } catch (error) {
      console.error("Error adding card:", error);
    }
  };

  const handleUpdateCard = async (
    cardId: string,
    frontText: string,
    backText: string
  ) => {
    try {
      await updateCard(cardId, {
        frontText: frontText || undefined,
        backText,
      });

      setCards((prev) =>
        prev.map((card) =>
          card.id === cardId ? { ...card, frontText, backText } : card
        )
      );

      setEditingCardId(null);
    } catch (error) {
      console.error("Error updating card:", error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Weet je zeker dat je deze kaart wilt verwijderen?")) return;

    try {
      await deleteCard(cardId);
      setCards((prev) => prev.filter((card) => card.id !== cardId));
    } catch (error) {
      console.error("Error deleting card:", error);
    }
  };

  const handleMediaAdded = (cardId: string, media: CardMedia) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, media: [...card.media, media] } : card
      )
    );
  };

  const handleMediaDeleted = (cardId: string, mediaId: string) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? { ...card, media: card.media.filter((m) => m.id !== mediaId) }
          : card
      )
    );
  };

  return (
    <div className="space-y-8">
      {/* Deck Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leerset instellingen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Titel
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leerset titel"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Beschrijving
            </label>
            <textarea
              id="description"
              className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Korte beschrijving..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="isPublic" className="text-sm">
              Openbaar (zichtbaar voor anderen)
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSaveDeck} disabled={isSaving || !title.trim()}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Opslaan..." : "Opslaan"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDeck}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? "Verwijderen..." : "Verwijderen"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Kaarten ({cards.length})</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkImport(!showBulkImport)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk importeren
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bulk Import Form */}
          {showBulkImport && (
            <div className="border-2 border-primary/20 bg-primary/5 rounded-lg p-4">
              <BulkImportForm
                deckId={deck.id}
                onSuccess={(addedCount) => {
                  setShowBulkImport(false);
                  // Full page reload om nieuwe kaarten te tonen
                  // router.refresh() werkt niet omdat cards in lokale state zitten
                  window.location.reload();
                }}
                onCancel={() => setShowBulkImport(false)}
              />
            </div>
          )}
          {/* Existing cards */}
          {cards.map((card, index) => (
            <div
              key={card.id}
              className="border rounded-lg p-4 space-y-3 bg-muted/30"
            >
              <div className="flex items-start gap-3">
                <div className="text-muted-foreground pt-2">
                  <GripVertical className="w-4 h-4" />
                </div>
                <span className="text-sm text-muted-foreground pt-2 w-6">
                  {index + 1}.
                </span>

                {editingCardId === card.id ? (
                  <EditCardForm
                    card={card}
                    onSave={(frontText, backText) =>
                      handleUpdateCard(card.id, frontText, backText)
                    }
                    onCancel={() => setEditingCardId(null)}
                  />
                ) : (
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        {card.frontText && (
                          <p className="text-sm text-muted-foreground">
                            {card.frontText}
                          </p>
                        )}
                        <p className="font-medium">{card.backText}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingCardId(card.id)}
                        >
                          Bewerken
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCard(card.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Media preview */}
                    {card.media.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {card.media.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded"
                          >
                            {m.type === "image" ? (
                              <img
                                src={m.url}
                                alt=""
                                className="w-6 h-6 object-cover rounded"
                              />
                            ) : (
                              <Music className="w-4 h-4" />
                            )}
                            <span>
                              {m.position === "front"
                                ? "Voorkant"
                                : m.position === "back"
                                ? "Achterkant"
                                : "Beide"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Media upload */}
                    <CardMediaUpload
                      cardId={card.id}
                      deckId={deck.id}
                      onMediaAdded={(media) => handleMediaAdded(card.id, media)}
                      onMediaDeleted={(mediaId) =>
                        handleMediaDeleted(card.id, mediaId)
                      }
                      existingMedia={card.media}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add new card */}
          <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Nieuwe kaart toevoegen
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Voorkant (optioneel)
                </label>
                <Input
                  value={newCardFrontText}
                  onChange={(e) => setNewCardFrontText(e.target.value)}
                  placeholder="Vraag of hint..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Achterkant (antwoord) *
                </label>
                <Input
                  value={newCardBackText}
                  onChange={(e) => setNewCardBackText(e.target.value)}
                  placeholder="Antwoord..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newCardBackText.trim()) {
                      handleAddCard();
                    }
                  }}
                />
              </div>
            </div>
            <Button
              onClick={handleAddCard}
              disabled={!newCardBackText.trim()}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Kaart toevoegen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EditCardForm({
  card,
  onSave,
  onCancel,
}: {
  card: CardData;
  onSave: (frontText: string, backText: string) => void;
  onCancel: () => void;
}) {
  const [frontText, setFrontText] = useState(card.frontText);
  const [backText, setBackText] = useState(card.backText);

  return (
    <div className="flex-1 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Voorkant</label>
          <Input
            value={frontText}
            onChange={(e) => setFrontText(e.target.value)}
            placeholder="Vraag of hint..."
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Achterkant *</label>
          <Input
            value={backText}
            onChange={(e) => setBackText(e.target.value)}
            placeholder="Antwoord..."
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onSave(frontText, backText)}
          disabled={!backText.trim()}
        >
          Opslaan
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Annuleren
        </Button>
      </div>
    </div>
  );
}
