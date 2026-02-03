"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AnnotationCanvas } from "@/components/annotation";
import { saveAnnotations } from "@/lib/actions/annotations";
import type { AnnotationData } from "@/types/annotations";

interface Props {
  mediaId: string;
  imageUrl: string;
  initialAnnotations: AnnotationData | null;
  deckId: string;
  cardId: string;
}

export function AnnotationPageClient({
  mediaId,
  imageUrl,
  initialAnnotations,
  deckId,
  cardId,
}: Props) {
  const router = useRouter();

  async function handleSave(data: AnnotationData, pngBase64: string) {
    console.log("handleSave called:", {
      mediaId,
      dataAnnotations: data.annotations?.length ?? 0,
      pngBase64Length: pngBase64?.length ?? 0,
      pngBase64Start: pngBase64?.substring(0, 30),
    });

    const result = await saveAnnotations(mediaId, data, pngBase64);
    console.log("saveAnnotations result:", result);

    if (result.success) {
      // Show success feedback
      toast.success("Annotaties opgeslagen");
      // Navigate back to deck editor with the card selected
      // Use refresh() to ensure the page re-fetches fresh data from server
      // This fixes the issue where annotated images don't show without hard refresh
      router.push(`/decks/${deckId}/edit?card=${cardId}`);
      router.refresh();
    } else {
      console.error("Failed to save annotations:", result.error);
      toast.error(`Opslaan mislukt: ${result.error}`);
    }
  }

  function handleCancel() {
    router.back();
  }

  return (
    <div className="h-screen">
      <AnnotationCanvas
        imageUrl={imageUrl}
        initialAnnotations={initialAnnotations}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
