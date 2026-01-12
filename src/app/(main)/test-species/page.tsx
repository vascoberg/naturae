"use client";

import { useState } from "react";
import { searchSpecies, getOrCreateSpecies } from "@/lib/actions/species";
import type { SpeciesSearchResult, Species } from "@/types/species";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Test page for species Server Actions
 * Remove this page after testing!
 */
export default function TestSpeciesPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpeciesSearchResult[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);

    const { data, error: searchError } = await searchSpecies(query);

    if (searchError) {
      setError(searchError);
    } else {
      setResults(data);
    }

    setLoading(false);
  };

  const handleSelect = async (result: SpeciesSearchResult) => {
    if (result.source === "local") {
      // Already in DB, just show it
      setSelectedSpecies({
        id: result.id,
        scientific_name: result.scientific_name,
        canonical_name: result.canonical_name,
        common_names: result.dutch_name ? { nl: result.dutch_name } : {},
        taxonomy: result.taxonomy || {},
        gbif_key: result.gbif_key,
        source: "gbif",
        gbif_data: null,
        created_at: "",
        updated_at: "",
      });
    } else if (result.gbif_key) {
      // Fetch from GBIF and create
      setLoading(true);
      const { data, error: fetchError } = await getOrCreateSpecies(result.gbif_key);

      if (fetchError) {
        setError(fetchError);
      } else {
        setSelectedSpecies(data);
      }
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-6">Test Species Server Actions</h1>

      <div className="flex gap-2 mb-6">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek soort (bijv. 'merel' of 'Turdus merula')"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "Zoeken..." : "Zoeken"}
        </Button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {results.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Resultaten ({results.length})</h2>
          <div className="space-y-2">
            {results.map((result) => (
              <div
                key={result.id}
                className="p-3 border rounded-lg cursor-pointer hover:bg-muted"
                onClick={() => handleSelect(result)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {result.dutch_name || result.canonical_name || result.scientific_name}
                    </p>
                    <p className="text-sm text-muted-foreground italic">
                      {result.scientific_name}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      result.source === "local"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {result.source === "local" ? "Lokaal" : "GBIF"}
                  </span>
                </div>
                {result.taxonomy?.family && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Familie: {result.taxonomy.family}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedSpecies && (
        <div className="p-4 border rounded-lg bg-muted/50">
          <h2 className="font-semibold mb-2">Geselecteerde soort</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(selectedSpecies, null, 2)}
          </pre>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-8">
        Dit is een testpagina. Verwijder na testen!
      </p>
    </div>
  );
}
