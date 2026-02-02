import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getSpeciesById } from "@/lib/actions/species";
import { getSpeciesMediaList } from "@/lib/services/gbif-media";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SpeciesPhotoCarousel } from "@/components/species/species-photo-carousel";
import { SpeciesAudioPlayer } from "@/components/species/species-audio-player";

interface SpeciesPageProps {
  params: Promise<{ speciesId: string }>;
}

export default async function SpeciesPage({ params }: SpeciesPageProps) {
  const { speciesId } = await params;

  // Fetch species from database
  const { data: species, error } = await getSpeciesById(speciesId);

  if (error || !species) {
    notFound();
  }

  // Get display name (Dutch preferred, then canonical, then scientific)
  const displayName =
    species.common_names?.nl ||
    species.canonical_name ||
    species.scientific_name;

  // Fetch GBIF photos if species has a gbif_key
  let photos: Awaited<ReturnType<typeof getSpeciesMediaList>>["media"] = [];
  let totalPhotos = 0;

  if (species.gbif_key) {
    const mediaResult = await getSpeciesMediaList({
      gbifKey: species.gbif_key,
      limit: 20,
    });
    photos = mediaResult.media;
    totalPhotos = mediaResult.total;
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="javascript:history.back()">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <p className="text-muted-foreground italic">
            {species.scientific_name}
          </p>
        </div>
      </div>

      {/* Photo carousel */}
      {photos.length > 0 ? (
        <SpeciesPhotoCarousel photos={photos} totalPhotos={totalPhotos} />
      ) : (
        <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Geen foto&apos;s beschikbaar</p>
        </div>
      )}

      {/* Audio player - alleen tonen voor soorten met wetenschappelijke naam */}
      {species.scientific_name && (
        <SpeciesAudioPlayer
          scientificName={species.scientific_name}
          taxonomyClass={species.taxonomy?.class}
          taxonomyOrder={species.taxonomy?.order}
        />
      )}

      {/* Taxonomy badges */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Taxonomie</h2>
        <div className="flex flex-wrap gap-2">
          {species.taxonomy?.family && (
            <Badge variant="secondary">
              Familie: {species.taxonomy.family}
            </Badge>
          )}
          {species.taxonomy?.order && (
            <Badge variant="outline">Orde: {species.taxonomy.order}</Badge>
          )}
          {species.taxonomy?.class && (
            <Badge variant="outline">Klasse: {species.taxonomy.class}</Badge>
          )}
          {species.taxonomy?.genus && (
            <Badge variant="outline">Geslacht: {species.taxonomy.genus}</Badge>
          )}
        </div>
      </div>

      {/* External links */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Externe links</h2>
        <div className="flex flex-wrap gap-2">
          {species.gbif_key && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://www.gbif.org/species/${species.gbif_key}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                GBIF
                <ExternalLink className="ml-2 h-3 w-3" />
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <a
              href={`https://nl.wikipedia.org/wiki/${encodeURIComponent(species.canonical_name || species.scientific_name)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Wikipedia
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href={`https://waarneming.nl/species/search/?q=${encodeURIComponent(species.canonical_name || species.scientific_name)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Waarneming.nl
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
