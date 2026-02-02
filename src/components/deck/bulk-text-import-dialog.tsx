"use client";

import { useState, useMemo } from "react";
import { ArrowLeftRight, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  parseTextList,
  swapColumns,
  getSeparatorName,
  type ParsedRow,
} from "@/lib/import/parse-text-list";
import { createCard } from "@/lib/actions/decks";

interface BulkTextImportDialogProps {
  deckId: string;
  currentCardCount: number;
  trigger: React.ReactNode;
  onSuccess?: (addedCount: number) => void;
}

export function BulkTextImportDialog({
  deckId,
  currentCardCount,
  trigger,
  onSuccess,
}: BulkTextImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [isSwapped, setIsSwapped] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Parse the text input
  const parseResult = useMemo(() => {
    if (!text.trim()) {
      return { rows: [], detectedSeparator: "\t" as const, errors: [] };
    }
    return parseTextList(text);
  }, [text]);

  // Apply swap if needed
  const displayRows = useMemo(() => {
    return isSwapped ? swapColumns(parseResult.rows) : parseResult.rows;
  }, [parseResult.rows, isSwapped]);

  // Preview shows first 5 rows
  const previewRows = displayRows.slice(0, 5);
  const hasMoreRows = displayRows.length > 5;

  const handleImport = async () => {
    if (displayRows.length === 0) return;

    setIsImporting(true);

    try {
      // Create cards one by one
      let successCount = 0;
      const startPosition = currentCardCount;

      for (let i = 0; i < displayRows.length; i++) {
        const row = displayRows[i];
        try {
          await createCard(deckId, {
            frontText: row.front || undefined,
            backText: row.back || undefined,
          });
          successCount++;
        } catch (error) {
          console.error(`Error creating card ${i + 1}:`, error);
          // Continue with other cards
        }
      }

      if (successCount === displayRows.length) {
        toast.success(`${successCount} kaarten toegevoegd`);
      } else {
        toast.success(
          `${successCount} van ${displayRows.length} kaarten toegevoegd`
        );
      }

      // Reset state and close dialog
      setText("");
      setIsSwapped(false);
      setOpen(false);

      // Callback
      onSuccess?.(successCount);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Importeren mislukt. Probeer het opnieuw.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isImporting) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset state when closing
        setText("");
        setIsSwapped(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Kaarten importeren
          </DialogTitle>
          <DialogDescription>
            Plak een lijst met tekst (uit Excel, Word, etc.). Elke regel wordt
            een kaart.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Text input */}
          <div className="space-y-2">
            <label htmlFor="import-text" className="text-sm font-medium">
              Plak je lijst hier
            </label>
            <textarea
              id="import-text"
              className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono"
              placeholder={`Voorbeeld:\nKoolmees\tParus major\nPimpelmees\tCyanistes caeruleus`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isImporting}
            />
          </div>

          {/* Status line */}
          {text.trim() && (
            <p className="text-sm text-muted-foreground">
              {displayRows.length > 0 ? (
                <>
                  ✓ {displayRows.length} kaart
                  {displayRows.length !== 1 && "en"} gevonden (
                  {getSeparatorName(parseResult.detectedSeparator)}-gescheiden)
                </>
              ) : (
                <span className="text-destructive">
                  Geen geldige regels gevonden
                </span>
              )}
            </p>
          )}

          {/* Preview table */}
          {previewRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Preview</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSwapped(!isSwapped)}
                  disabled={isImporting}
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Wissel kolommen
                </Button>
              </div>

              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium w-1/2">
                        Voorkant
                      </th>
                      <th className="px-3 py-2 text-left font-medium w-1/2">
                        Achterkant
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewRows.map((row, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 truncate max-w-0">
                          {row.front || (
                            <span className="text-muted-foreground italic">
                              (leeg)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 truncate max-w-0">
                          {row.back || (
                            <span className="text-muted-foreground italic">
                              (leeg)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {hasMoreRows && (
                <p className="text-xs text-muted-foreground text-center">
                  ...en {displayRows.length - 5} meer
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isImporting}
          >
            Annuleren
          </Button>
          <Button
            onClick={handleImport}
            disabled={displayRows.length === 0 || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importeren...
              </>
            ) : (
              <>
                {displayRows.length} kaart{displayRows.length !== 1 && "en"}{" "}
                toevoegen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
