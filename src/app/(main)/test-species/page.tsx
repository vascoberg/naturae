"use client";

import { useState } from "react";
import { searchSpecies, getOrCreateSpecies, debugDeckTaxonomy, fixMissingGenus, debugAllSpeciesTaxonomy } from "@/lib/actions/species";
import type { SpeciesSearchResult, Species } from "@/types/species";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Test page for species Server Actions
 * Remove this page after testing!
 */
export default function TestSpeciesPage() {
  const [query, setQuery] = useState("");
  const [deckId, setDeckId] = useState("");
  const [results, setResults] = useState<SpeciesSearchResult[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [taxonomyDebug, setTaxonomyDebug] = useState<{
    species: Array<{
      id: string;
      scientific_name: string;
      taxonomy: Record<string, string> | null;
      hasGenus: boolean;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fixResult, setFixResult] = useState<{ updated: number; errors: string[] } | null>(null);
  const [allSpeciesDebug, setAllSpeciesDebug] = useState<{
    total: number;
    withGenus: number;
    withoutGenus: number;
    sample: Array<{ scientific_name: string; genus: string | null; family: string | null }>;
  } | null>(null);

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

      {/* Fix Missing Genus */}
      <div className="mt-8 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
        <h2 className="font-semibold mb-4">Fix Missing Genus Data</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This will scan all species and fill in missing genus from gbif_data.
        </p>
        <Button
          onClick={async () => {
            setLoading(true);
            setFixResult(null);
            const result = await fixMissingGenus();
            setFixResult(result);
            setLoading(false);
          }}
          disabled={loading}
          variant="outline"
        >
          Fix Missing Genus
        </Button>
        {fixResult && (
          <div className="mt-4 p-3 rounded bg-background">
            <p className="font-medium">Updated: {fixResult.updated} species</p>
            {fixResult.errors.length > 0 && (
              <div className="mt-2 text-sm text-red-600">
                <p>Errors:</p>
                <ul className="list-disc ml-4">
                  {fixResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Debug All Species Taxonomy */}
      <div className="mt-8 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
        <h2 className="font-semibold mb-4">Debug All Species Taxonomy</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Check how many species in the database have genus data.
        </p>
        <Button
          onClick={async () => {
            setLoading(true);
            setAllSpeciesDebug(null);
            const result = await debugAllSpeciesTaxonomy();
            setAllSpeciesDebug(result);
            setLoading(false);
          }}
          disabled={loading}
          variant="outline"
        >
          Check All Species
        </Button>
        {allSpeciesDebug && (
          <div className="mt-4 p-3 rounded bg-background">
            <p><strong>Total species:</strong> {allSpeciesDebug.total}</p>
            <p className="text-green-600"><strong>With genus:</strong> {allSpeciesDebug.withGenus}</p>
            <p className="text-red-600"><strong>Without genus:</strong> {allSpeciesDebug.withoutGenus}</p>
            <div className="mt-3">
              <p className="font-medium mb-2">Sample (first 10):</p>
              <table className="text-xs w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-1">Species</th>
                    <th className="text-left p-1">Genus</th>
                    <th className="text-left p-1">Family</th>
                  </tr>
                </thead>
                <tbody>
                  {allSpeciesDebug.sample.map((s, i) => (
                    <tr key={i} className={s.genus ? "" : "bg-red-50 dark:bg-red-950"}>
                      <td className="p-1">{s.scientific_name}</td>
                      <td className="p-1">{s.genus || "❌ MISSING"}</td>
                      <td className="p-1">{s.family || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Debug Deck Taxonomy */}
      <div className="mt-8 p-4 border rounded-lg">
        <h2 className="font-semibold mb-4">Debug Deck Taxonomy</h2>
        <div className="flex gap-2 mb-4">
          <Input
            value={deckId}
            onChange={(e) => setDeckId(e.target.value)}
            placeholder="Deck ID (bijv. 8cc9e351-7b9e-4d2e-9c3a-6c4a96945389)"
          />
          <Button
            onClick={async () => {
              if (!deckId) return;
              setLoading(true);
              const result = await debugDeckTaxonomy(deckId);
              setTaxonomyDebug(result);
              setLoading(false);
            }}
            disabled={loading}
          >
            Check Taxonomy
          </Button>
        </div>
        {taxonomyDebug && (
          <div>
            <p className="mb-2">
              Species in deck: {taxonomyDebug.species.length} |
              With genus: {taxonomyDebug.species.filter(s => s.hasGenus).length} |
              Missing genus: {taxonomyDebug.species.filter(s => !s.hasGenus).length}
            </p>
            <div className="max-h-96 overflow-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-1">Species</th>
                    <th className="text-left p-1">Genus</th>
                    <th className="text-left p-1">Family</th>
                    <th className="text-left p-1">Class</th>
                  </tr>
                </thead>
                <tbody>
                  {taxonomyDebug.species.map(s => (
                    <tr key={s.id} className={s.hasGenus ? "" : "bg-red-50 dark:bg-red-950"}>
                      <td className="p-1">{s.scientific_name}</td>
                      <td className="p-1">{s.taxonomy?.genus || "❌ MISSING"}</td>
                      <td className="p-1">{s.taxonomy?.family || "-"}</td>
                      <td className="p-1">{s.taxonomy?.class || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-8">
        Dit is een testpagina. Verwijder na testen!
      </p>
    </div>
  );
}
