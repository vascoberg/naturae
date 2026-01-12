"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, GripVertical, Image, Music, Upload, ChevronDown, ChevronUp } from "lucide-react";
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
import { BulkImportForm } from "./bulk-import-form";
import { TagSelector } from "./tag-selector";
import { WysiwygCardEditor } from "./wysiwyg-card-editor";
import { type Tag } from "@/lib/actions/tags";

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

interface CardSpecies {
  id: string;
  scientificName: string;
  canonicalName: string;
  commonNames: { nl?: string };
}

interface CardData {
  id: string;
  frontText: string;
  backText: string;
  position: number;
  media: CardMedia[];
  speciesId: string | null;
  speciesDisplay: "front" | "back" | "both" | "none";
  species: CardSpecies | null;
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
  initialTags?: Tag[];
}

export function DeckEditor({ deck, cards: initialCards, initialTags = [] }: DeckEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(deck.title);
  const [description, setDescription] = useState(deck.description);
  const [isPublic, setIsPublic] = useState(deck.isPublic);
  const [cards, setCards] = useState(initialCards);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [showNewCardEditor, setShowNewCardEditor] = useState(false);
  const [newCardFrontText, setNewCardFrontText] = useState("");
  const [newCardBackText, setNewCardBackText] = useState("");
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

  const handleAddCard = async (
    frontText: string,
    backText: string,
    speciesId: string | null,
    speciesDisplay: "front" | "back" | "both" | "none"
  ) => {
    if (!backText.trim()) return;

    try {
      const result = await createCard(deck.id, {
        frontText: frontText.trim() || undefined,
        backText: backText.trim(),
      });

      setCards((prev) => [
        ...prev,
        {
          id: result.id,
          frontText: frontText.trim(),
          backText: backText.trim(),
          position: prev.length,
          media: [],
          speciesId: null,
          speciesDisplay: "back",
          species: null,
        },
      ]);

      setNewCardFrontText("");
      setNewCardBackText("");
      setShowNewCardEditor(false);
    } catch (error) {
      console.error("Error adding card:", error);
    }
  };

  const handleUpdateCard = async (
    cardId: string,
    frontText: string,
    backText: string,
    speciesId: string | null,
    speciesDisplay: "front" | "back" | "both" | "none"
  ) => {
    try {
      await updateCard(cardId, {
        frontText: frontText || undefined,
        backText,
        speciesId,
        speciesDisplay,
      });

      setCards((prev) =>
        prev.map((card) =>
          card.id === cardId
            ? { ...card, frontText, backText, speciesId, speciesDisplay }
            : card
        )
      );

      setExpandedCardId(null);
    } catch (error) {
      console.error("Error updating card:", error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Weet je zeker dat je deze kaart wilt verwijderen?")) return;

    try {
      await deleteCard(cardId);
      setCards((prev) => prev.filter((card) => card.id !== cardId));
      setExpandedCardId(null);
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

  const handleMediaUpdated = (cardId: string, mediaId: string, attribution: string) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? {
              ...card,
              media: card.media.map((m) =>
                m.id === mediaId ? { ...m, attributionSource: attribution } : m
              ),
            }
          : card
      )
    );
  };

  const toggleCardExpanded = (cardId: string) => {
    setExpandedCardId(expandedCardId === cardId ? null : cardId);
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <TagSelector
              deckId={deck.id}
              initialTags={initialTags}
            />
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
                  window.location.reload();
                }}
                onCancel={() => setShowBulkImport(false)}
              />
            </div>
          )}

          {/* Existing cards */}
          {cards.map((card, index) => {
            const isExpanded = expandedCardId === card.id;
            const imageMedia = card.media.find((m) => m.type === "image");
            const audioMedia = card.media.find((m) => m.type === "audio");

            return (
              <div
                key={card.id}
                className="border rounded-lg overflow-hidden bg-muted/30"
              >
                {/* Collapsed view - clickable to expand */}
                <button
                  onClick={() => toggleCardExpanded(card.id)}
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="text-muted-foreground">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-muted-foreground w-6 flex-shrink-0">
                    {index + 1}.
                  </span>

                  {/* Media thumbnail */}
                  {imageMedia ? (
                    <img
                      src={imageMedia.annotatedUrl || imageMedia.url}
                      alt=""
                      className="w-10 h-10 object-cover rounded flex-shrink-0"
                    />
                  ) : audioMedia ? (
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      <Music className="w-5 h-5 text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      <Image className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {card.frontText && (
                      <p className="text-xs text-muted-foreground truncate">
                        {card.frontText}
                      </p>
                    )}
                    <p className="font-medium truncate">{card.backText}</p>
                  </div>

                  <div className="flex-shrink-0 text-muted-foreground">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>

                {/* Expanded view - WYSIWYG editor */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t bg-background">
                    <WysiwygCardEditor
                      frontText={card.frontText}
                      backText={card.backText}
                      media={card.media}
                      cardId={card.id}
                      deckId={deck.id}
                      speciesId={card.speciesId}
                      speciesDisplay={card.speciesDisplay}
                      species={card.species}
                      onSave={(frontText, backText, speciesId, speciesDisplay) =>
                        handleUpdateCard(card.id, frontText, backText, speciesId, speciesDisplay)
                      }
                      onCancel={() => setExpandedCardId(null)}
                      onDelete={() => handleDeleteCard(card.id)}
                      onMediaAdded={(media) => handleMediaAdded(card.id, media)}
                      onMediaDeleted={(mediaId) =>
                        handleMediaDeleted(card.id, mediaId)
                      }
                      onMediaUpdated={(mediaId, attribution) =>
                        handleMediaUpdated(card.id, mediaId, attribution)
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Add new card */}
          {showNewCardEditor ? (
            <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 bg-primary/5">
              <p className="text-sm font-medium text-muted-foreground mb-4">
                Nieuwe kaart toevoegen
              </p>
              <WysiwygCardEditor
                frontText={newCardFrontText}
                backText={newCardBackText}
                media={[]}
                onSave={handleAddCard}
                onCancel={() => {
                  setShowNewCardEditor(false);
                  setNewCardFrontText("");
                  setNewCardBackText("");
                }}
                isNew
              />
              <p className="text-xs text-muted-foreground mt-3">
                Media kan worden toegevoegd na het opslaan van de kaart.
              </p>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => setShowNewCardEditor(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe kaart toevoegen
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
