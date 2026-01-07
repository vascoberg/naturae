"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ExportButtonProps {
  deckId: string;
  deckTitle: string;
}

export function ExportButton({ deckId, deckTitle }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const response = await fetch(`/api/decks/${deckId}/export`);

      if (!response.ok) {
        throw new Error("Export mislukt");
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${deckTitle.replace(/[^a-zA-Z0-9]/g, "-")}-export.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Export gedownload");
    } catch {
      toast.error("Export mislukt. Probeer het opnieuw.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleExport}
      disabled={isExporting}
    >
      <Download className="w-4 h-4 mr-2" />
      {isExporting ? "Exporteren..." : "Exporteren"}
    </Button>
  );
}
