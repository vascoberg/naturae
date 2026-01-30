import { NextRequest, NextResponse } from "next/server";
import { getSpeciesById, getRelatedSpecies } from "@/lib/actions/species";
import { getSpeciesMediaList } from "@/lib/services/gbif-media";
import { getWikipediaSummary, truncateExtract } from "@/lib/services/wikipedia";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch species from database
  const { data: species, error } = await getSpeciesById(id);

  if (error || !species) {
    return NextResponse.json(
      { error: "Species niet gevonden" },
      { status: 404 }
    );
  }

  // Parallel fetch: GBIF photos, Wikipedia summary, related species
  const [mediaResult, wikipediaSummary, relatedSpecies] = await Promise.all([
    // GBIF photos
    species.gbif_key
      ? getSpeciesMediaList({ gbifKey: species.gbif_key, limit: 20 })
      : Promise.resolve({ media: [], total: 0, hasMore: false }),

    // Wikipedia summary
    getWikipediaSummary(
      species.canonical_name || species.scientific_name,
      species.common_names?.nl
    ),

    // Related species (same family)
    species.taxonomy?.family
      ? getRelatedSpecies(species.taxonomy.family, species.id, 6)
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    species,
    photos: mediaResult.media,
    totalPhotos: mediaResult.total,
    wikipedia: wikipediaSummary
      ? {
          title: wikipediaSummary.title,
          extract: truncateExtract(wikipediaSummary.extract, 400),
          pageUrl: wikipediaSummary.pageUrl,
          language: wikipediaSummary.language,
        }
      : null,
    relatedSpecies,
  });
}
