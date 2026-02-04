"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ImportSettings,
  PhotoPosition,
  NameLanguage,
  NamePosition,
} from "@/lib/import/types";

interface ImportSettingsProps {
  settings: ImportSettings;
  onChange: (settings: ImportSettings) => void;
  disabled?: boolean;
}

export function ImportSettingsPanel({
  settings,
  onChange,
  disabled = false,
}: ImportSettingsProps) {
  return (
    <div className="p-4 bg-muted/50 rounded-lg space-y-4">
      <h3 className="text-sm font-semibold">Import instellingen</h3>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Photo Position */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Foto positie</label>
          <Select
            value={settings.photoPosition}
            onValueChange={(v) =>
              onChange({ ...settings, photoPosition: v as PhotoPosition })
            }
            disabled={disabled}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="front">Voorkant</SelectItem>
              <SelectItem value="back">Achterkant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Name Language */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Naam tonen als</label>
          <Select
            value={settings.nameLanguage}
            onValueChange={(v) =>
              onChange({ ...settings, nameLanguage: v as NameLanguage })
            }
            disabled={disabled}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nl">Nederlands</SelectItem>
              <SelectItem value="scientific">Latijn</SelectItem>
              <SelectItem value="en">Engels</SelectItem>
              <SelectItem value="nl_scientific">NL + Latijn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Name Position */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Naam op</label>
          <Select
            value={settings.namePosition}
            onValueChange={(v) =>
              onChange({ ...settings, namePosition: v as NamePosition })
            }
            disabled={disabled}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="front">Voorkant</SelectItem>
              <SelectItem value="back">Achterkant</SelectItem>
              <SelectItem value="both">Beide</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Help text based on current settings */}
      <p className="text-xs text-muted-foreground">
        {getSettingsDescription(settings)}
      </p>
    </div>
  );
}

function getSettingsDescription(settings: ImportSettings): string {
  const photoSide = settings.photoPosition === "front" ? "voorkant" : "achterkant";
  const nameSide =
    settings.namePosition === "front"
      ? "voorkant"
      : settings.namePosition === "back"
        ? "achterkant"
        : "beide kanten";

  const langName =
    settings.nameLanguage === "nl"
      ? "Nederlandse naam"
      : settings.nameLanguage === "scientific"
        ? "wetenschappelijke naam"
        : settings.nameLanguage === "en"
          ? "Engelse naam"
          : "Nederlandse + wetenschappelijke naam";

  return `Foto op ${photoSide}, ${langName} op ${nameSide}.`;
}
