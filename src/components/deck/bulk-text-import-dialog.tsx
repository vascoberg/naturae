"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  FileText,
  Loader2,
  Search,
  Check,
  AlertCircle,
  XCircle,
  ChevronDown,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  parseTextList,
  getSeparatorName,
  type ParsedRow,
} from "@/lib/import/parse-text-list";
import { createCard } from "@/lib/actions/decks";
import {
  matchSpeciesByName,
  searchSpecies,
  getOrCreateSpecies,
} from "@/lib/actions/species";
import type { SpeciesMatchStatus, SpeciesMatch } from "@/lib/import/types";

// Layout options for front/back text
type ColumnOption = "none" | "col1" | "col2" | "both";

interface TextImportRow extends ParsedRow {
  id: string;
  speciesMatchStatus: SpeciesMatchStatus;
  speciesMatch: SpeciesMatch | null;
  speciesSuggestions: SpeciesMatch[];
}

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
  const [isImporting, setIsImporting] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [matchedRows, setMatchedRows] = useState<TextImportRow[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Layout configuration
  const [frontLayout, setFrontLayout] = useState<ColumnOption>("col1");
  const [backLayout, setBackLayout] = useState<ColumnOption>("col2");

  // Parse the text input
  const parseResult = useMemo(() => {
    if (!text.trim()) {
      return { rows: [], detectedSeparator: "\t" as const, errors: [] };
    }
    return parseTextList(text);
  }, [text]);

  // Check if we have 2 columns
  const hasTwoColumns = useMemo(() => {
    return parseResult.rows.some((row) => row.back.trim() !== "");
  }, [parseResult.rows]);

  // Reset layout when switching between 1 and 2 columns
  useEffect(() => {
    if (!hasTwoColumns) {
      setFrontLayout("none");
      setBackLayout("col1");
    }
  }, [hasTwoColumns]);

  // Reset matched rows when text or layout changes
  useEffect(() => {
    if (hasSearched) {
      setMatchedRows([]);
      setHasSearched(false);
    }
  }, [text, frontLayout, backLayout]);

  // Helper to get text based on layout option
  const getLayoutText = (row: ParsedRow, option: ColumnOption): string => {
    switch (option) {
      case "none":
        return "";
      case "col1":
        return row.front;
      case "col2":
        return row.back;
      case "both":
        return [row.front, row.back].filter(Boolean).join(" – ");
      default:
        return "";
    }
  };

  // Match all species
  const handleMatchSpecies = useCallback(async () => {
    if (parseResult.rows.length === 0) return;

    setIsMatching(true);
    setHasSearched(true);

    const rows: TextImportRow[] = parseResult.rows.map((row, index) => ({
      ...row,
      id: `row-${index}`,
      speciesMatchStatus: "pending" as SpeciesMatchStatus,
      speciesMatch: null,
      speciesSuggestions: [],
    }));

    setMatchedRows(rows);

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Update status to searching
      setMatchedRows((prev) =>
        prev.map((r, idx) =>
          idx === i ? { ...r, speciesMatchStatus: "searching" as SpeciesMatchStatus } : r
        )
      );

      try {
        // Try to match by scientific name first (col2 typically has scientific name)
        if (row.back) {
          const scientificResult = await matchSpeciesByName(row.back);

          if (scientificResult.data) {
            setMatchedRows((prev) =>
              prev.map((r, idx) =>
                idx === i
                  ? {
                      ...r,
                      speciesMatchStatus: "matched" as SpeciesMatchStatus,
                      speciesMatch: {
                        speciesId: scientificResult.data!.id,
                        scientificName: scientificResult.data!.scientific_name,
                        dutchName: scientificResult.data!.common_names?.nl || null,
                        gbifKey: scientificResult.data!.gbif_key,
                        confidence: "exact",
                      },
                    }
                  : r
              )
            );
            continue;
          }
        }

        // Fallback: search by common name (col1)
        if (row.front) {
          const searchResult = await searchSpecies(row.front);

          if (searchResult.data && searchResult.data.length > 0) {
            const suggestions: SpeciesMatch[] = searchResult.data.slice(0, 5).map((s) => ({
              speciesId: s.id,
              scientificName: s.scientific_name,
              dutchName: s.dutch_name,
              gbifKey: s.gbif_key,
              confidence: s.source === "local" ? "high" : "low",
            }));

            // Check if first result is exact match (case-insensitive)
            const firstResult = searchResult.data[0];
            const isExactMatch =
              firstResult.dutch_name?.toLowerCase() === row.front.toLowerCase() ||
              firstResult.scientific_name?.toLowerCase() === row.front.toLowerCase() ||
              firstResult.canonical_name?.toLowerCase() === row.front.toLowerCase();

            if (isExactMatch && firstResult.source === "local") {
              setMatchedRows((prev) =>
                prev.map((r, idx) =>
                  idx === i
                    ? {
                        ...r,
                        speciesMatchStatus: "matched" as SpeciesMatchStatus,
                        speciesMatch: suggestions[0],
                        speciesSuggestions: suggestions.slice(1),
                      }
                    : r
                )
              );
            } else {
              setMatchedRows((prev) =>
                prev.map((r, idx) =>
                  idx === i
                    ? {
                        ...r,
                        speciesMatchStatus: "suggested" as SpeciesMatchStatus,
                        speciesMatch: null,
                        speciesSuggestions: suggestions,
                      }
                    : r
                )
              );
            }
            continue;
          }
        }

        // No match found
        setMatchedRows((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? { ...r, speciesMatchStatus: "not_found" as SpeciesMatchStatus }
              : r
          )
        );
      } catch (error) {
        console.error(`Error matching row ${i}:`, error);
        setMatchedRows((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? { ...r, speciesMatchStatus: "not_found" as SpeciesMatchStatus }
              : r
          )
        );
      }
    }

    setIsMatching(false);
  }, [parseResult.rows]);

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback(
    async (rowId: string, suggestion: SpeciesMatch) => {
      let finalSpeciesId = suggestion.speciesId;

      if (suggestion.speciesId.startsWith("gbif-") && suggestion.gbifKey) {
        const createResult = await getOrCreateSpecies(suggestion.gbifKey);
        if (createResult.data) {
          finalSpeciesId = createResult.data.id;
        }
      }

      setMatchedRows((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? {
                ...r,
                speciesMatchStatus: "matched" as SpeciesMatchStatus,
                speciesMatch: { ...suggestion, speciesId: finalSpeciesId },
                speciesSuggestions: [],
              }
            : r
        )
      );
    },
    []
  );

  const handleImport = async () => {
    const rowsToImport = hasSearched ? matchedRows : parseResult.rows;
    if (rowsToImport.length === 0) return;

    setIsImporting(true);

    try {
      let successCount = 0;

      for (let i = 0; i < rowsToImport.length; i++) {
        const row = rowsToImport[i];
        try {
          const matchedRow = row as TextImportRow;
          const speciesId =
            hasSearched && matchedRow.speciesMatch
              ? matchedRow.speciesMatch.speciesId
              : undefined;

          // Build front/back text based on layout
          const frontText = getLayoutText(row, frontLayout) || undefined;
          const backText = getLayoutText(row, backLayout) || undefined;

          await createCard(deckId, {
            frontText,
            backText,
            speciesId,
          });
          successCount++;
        } catch (error) {
          console.error(`Error creating card ${i + 1}:`, error);
        }
      }

      if (successCount === rowsToImport.length) {
        toast.success(`${successCount} kaarten toegevoegd`);
      } else {
        toast.success(
          `${successCount} van ${rowsToImport.length} kaarten toegevoegd`
        );
      }

      // Reset state and close dialog
      setText("");
      setFrontLayout("col1");
      setBackLayout("col2");
      setMatchedRows([]);
      setHasSearched(false);
      setOpen(false);

      onSuccess?.(successCount);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Importeren mislukt. Probeer het opnieuw.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isImporting && !isMatching) {
      setOpen(newOpen);
      if (!newOpen) {
        setText("");
        setFrontLayout("col1");
        setBackLayout("col2");
        setMatchedRows([]);
        setHasSearched(false);
      }
    }
  };

  // Count matches
  const matchCounts = useMemo(() => {
    const matched = matchedRows.filter((r) => r.speciesMatchStatus === "matched").length;
    const suggested = matchedRows.filter((r) => r.speciesMatchStatus === "suggested").length;
    const notFound = matchedRows.filter((r) => r.speciesMatchStatus === "not_found").length;
    return { matched, suggested, notFound };
  }, [matchedRows]);

  // Rows to display in preview
  const rowsForPreview = hasSearched ? matchedRows : parseResult.rows;
  const previewRows = rowsForPreview.slice(0, 8);
  const totalRows = rowsForPreview.length;
  const hasMoreRows = totalRows > previewRows.length;

  // Get column label for select
  const getColumnLabel = (option: ColumnOption): string => {
    switch (option) {
      case "none":
        return "Leeg";
      case "col1":
        return "Kolom 1";
      case "col2":
        return "Kolom 2";
      case "both":
        return "Beide";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
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
              placeholder={`Voorbeeld:\nKoolmees\tParus major\nPimpelmees\tCyanistes caeruleus\nof:\nHouse Sparrow – Passer domesticus`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  const target = e.currentTarget;
                  const start = target.selectionStart;
                  const end = target.selectionEnd;
                  const value = target.value;
                  setText(value.substring(0, start) + "\t" + value.substring(end));
                  setTimeout(() => {
                    target.selectionStart = target.selectionEnd = start + 1;
                  }, 0);
                }
              }}
              disabled={isImporting || isMatching}
            />
          </div>

          {/* Status line */}
          {text.trim() && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {parseResult.rows.length > 0 ? (
                  <>
                    {parseResult.rows.length} kaart
                    {parseResult.rows.length !== 1 && "en"} gevonden (
                    {getSeparatorName(parseResult.detectedSeparator)}-gescheiden)
                  </>
                ) : (
                  <span className="text-destructive">
                    Geen geldige regels gevonden
                  </span>
                )}
              </p>

              {/* Species match button */}
              {parseResult.rows.length > 0 && !hasSearched && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMatchSpecies}
                  disabled={isMatching}
                >
                  {isMatching ? (
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
              )}
            </div>
          )}

          {/* Layout configuration */}
          {parseResult.rows.length > 0 && !hasSearched && (
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-md">
              <span className="text-sm font-medium">Indeling:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Voorkant:</span>
                <Select
                  value={frontLayout}
                  onValueChange={(v) => setFrontLayout(v as ColumnOption)}
                  disabled={isImporting || isMatching}
                >
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Leeg</SelectItem>
                    <SelectItem value="col1">Kolom 1</SelectItem>
                    {hasTwoColumns && <SelectItem value="col2">Kolom 2</SelectItem>}
                    {hasTwoColumns && <SelectItem value="both">Beide</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Achterkant:</span>
                <Select
                  value={backLayout}
                  onValueChange={(v) => setBackLayout(v as ColumnOption)}
                  disabled={isImporting || isMatching}
                >
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Leeg</SelectItem>
                    <SelectItem value="col1">Kolom 1</SelectItem>
                    {hasTwoColumns && <SelectItem value="col2">Kolom 2</SelectItem>}
                    {hasTwoColumns && <SelectItem value="both">Beide</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Match summary */}
          {hasSearched && !isMatching && (
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <Check className="w-4 h-4" />
                {matchCounts.matched} gekoppeld
              </span>
              {matchCounts.suggested > 0 && (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  {matchCounts.suggested} suggesties
                </span>
              )}
              {matchCounts.notFound > 0 && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <XCircle className="w-4 h-4" />
                  {matchCounts.notFound} niet gevonden
                </span>
              )}
            </div>
          )}

          {/* Preview table */}
          {previewRows.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Preview</span>

              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {hasSearched && (
                        <th className="px-2 py-2 text-left font-medium w-8"></th>
                      )}
                      <th className="px-3 py-2 text-left font-medium">
                        {hasSearched ? "Kolom 1" : `Voorkant (${getColumnLabel(frontLayout)})`}
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        {hasSearched ? "Kolom 2" : `Achterkant (${getColumnLabel(backLayout)})`}
                      </th>
                      {hasSearched && (
                        <th className="px-3 py-2 text-left font-medium">
                          Soort koppeling
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewRows.map((row, index) => {
                      const matchedRow = row as TextImportRow;
                      const isMatchedRow = hasSearched && "speciesMatchStatus" in row;

                      // Preview what will be shown based on layout (only in non-search mode)
                      const previewFront = hasSearched ? row.front : getLayoutText(row, frontLayout);
                      const previewBack = hasSearched ? row.back : getLayoutText(row, backLayout);

                      return (
                        <tr key={index}>
                          {hasSearched && (
                            <td className="px-2 py-2">
                              {isMatchedRow && (
                                <>
                                  {matchedRow.speciesMatchStatus === "matched" && (
                                    <Check className="w-4 h-4 text-green-600" />
                                  )}
                                  {matchedRow.speciesMatchStatus === "suggested" && (
                                    <AlertCircle className="w-4 h-4 text-amber-600" />
                                  )}
                                  {matchedRow.speciesMatchStatus === "not_found" && (
                                    <XCircle className="w-4 h-4 text-muted-foreground" />
                                  )}
                                  {matchedRow.speciesMatchStatus === "searching" && (
                                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                  )}
                                </>
                              )}
                            </td>
                          )}
                          <td className="px-3 py-2 truncate max-w-0">
                            {previewFront || (
                              <span className="text-muted-foreground italic">
                                (leeg)
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 truncate max-w-0">
                            {previewBack || (
                              <span className="text-muted-foreground italic">
                                (leeg)
                              </span>
                            )}
                          </td>
                          {hasSearched && isMatchedRow && (
                            <td className="px-3 py-2">
                              {matchedRow.speciesMatchStatus === "matched" &&
                                matchedRow.speciesMatch && (
                                  <span className="text-green-600 text-xs">
                                    {matchedRow.speciesMatch.dutchName ||
                                      matchedRow.speciesMatch.scientificName}
                                  </span>
                                )}
                              {matchedRow.speciesMatchStatus === "suggested" &&
                                matchedRow.speciesSuggestions.length > 0 && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                      >
                                        Kies soort
                                        <ChevronDown className="w-3 h-3 ml-1" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                      {matchedRow.speciesSuggestions.map(
                                        (suggestion, sIdx) => (
                                          <DropdownMenuItem
                                            key={sIdx}
                                            onClick={() =>
                                              handleSelectSuggestion(
                                                matchedRow.id,
                                                suggestion
                                              )
                                            }
                                          >
                                            <div className="flex flex-col">
                                              <span>
                                                {suggestion.dutchName ||
                                                  suggestion.scientificName}
                                              </span>
                                              {suggestion.dutchName && (
                                                <span className="text-xs text-muted-foreground">
                                                  {suggestion.scientificName}
                                                </span>
                                              )}
                                            </div>
                                          </DropdownMenuItem>
                                        )
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              {matchedRow.speciesMatchStatus === "not_found" && (
                                <span className="text-muted-foreground text-xs">
                                  Niet gevonden
                                </span>
                              )}
                              {matchedRow.speciesMatchStatus === "searching" && (
                                <span className="text-muted-foreground text-xs">
                                  Zoeken...
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {hasMoreRows && (
                <p className="text-xs text-muted-foreground text-center">
                  ...en {totalRows - previewRows.length} meer
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isImporting || isMatching}
          >
            Annuleren
          </Button>
          <Button
            onClick={handleImport}
            disabled={parseResult.rows.length === 0 || isImporting || isMatching}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importeren...
              </>
            ) : (
              <>
                {totalRows} kaart{totalRows !== 1 && "en"} toevoegen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
