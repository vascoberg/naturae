# Freemium Limieten - Implementatie Plan

> Minimale guardrails voor gratis accounts voordat de app publiek gaat.

**Status:** Klaar voor implementatie
**Datum:** 2 februari 2026

---

## Beslissing

Na overweging kiezen we voor een **eenvoudige aanpak**: alleen een opslaglimiet voor eigen uploads.

| Resource | Gratis | Premium (later) |
|----------|--------|-----------------|
| Decks | Onbeperkt | Onbeperkt |
| Kaarten per deck | Onbeperkt | Onbeperkt |
| Eigen uploads | **50 MB** | 1 GB+ |

### Waarom deze aanpak?

1. **Eenvoud** - Minder code, minder edge cases, minder support
2. **Eerlijk** - Decks/kaarten kosten ons bijna niets, opslag wel
3. **GBIF/Xeno-canto gratis** - Externe links tellen niet mee
4. **Flexibel** - Gebruikers kunnen veel leren zonder te betalen

### Wat telt mee voor opslag?

| Media type | Telt mee? | Reden |
|------------|-----------|-------|
| Eigen foto uploads | ✅ Ja | Opgeslagen in Supabase Storage |
| GBIF media in deck kaarten | ✅ Ja | Wordt gedownload naar Storage |
| GBIF media in quiz modus | ❌ Nee | Externe URL, niet opgeslagen |
| Xeno-canto audio in quiz | ❌ Nee | Externe URL, niet opgeslagen |

---

## Implementatie

### Fase 1: Database Schema

**Bestand:** `supabase/migrations/20260202_add_storage_tracking.sql`

```sql
-- Voeg storage tracking toe aan profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT DEFAULT 0;

-- Optioneel: plan type voor toekomstige upgrade flow
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free';
```

#### ✅ Checkpoint 1: Database Schema

**Waar:** Supabase Dashboard → SQL Editor

**Test:**
```sql
-- 1. Check of kolommen bestaan
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('storage_used_bytes', 'plan_type');

-- Verwacht: 2 rijen met storage_used_bytes (bigint, 0) en plan_type (text, 'free')

-- 2. Check of functies bestaan
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN ('increment_storage_used', 'decrement_storage_used');

-- Verwacht: 2 rijen

-- 3. Test increment functie
SELECT storage_used_bytes FROM profiles WHERE id = '<jouw-user-id>';
SELECT increment_storage_used('<jouw-user-id>', 1000);
SELECT storage_used_bytes FROM profiles WHERE id = '<jouw-user-id>';

-- Verwacht: waarde is 1000 hoger dan eerst
```

---

### Fase 2: Storage Service

**Nieuw bestand:** `src/lib/services/storage-limits.ts`

```typescript
import { createClient } from "@/lib/supabase/server";

export const STORAGE_LIMITS = {
  free: 50 * 1024 * 1024,      // 50 MB
  premium: 1024 * 1024 * 1024, // 1 GB
};

export async function getStorageUsage(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("storage_used_bytes, plan_type")
    .eq("id", userId)
    .single();

  const used = data?.storage_used_bytes || 0;
  const planType = (data?.plan_type || "free") as keyof typeof STORAGE_LIMITS;
  const limit = STORAGE_LIMITS[planType];

  return { used, limit, remaining: limit - used, planType };
}

export async function canUpload(userId: string, sizeBytes: number) {
  const { remaining } = await getStorageUsage(userId);
  return {
    allowed: sizeBytes <= remaining,
    remaining,
    required: sizeBytes,
  };
}

export async function recordUpload(userId: string, sizeBytes: number) {
  const supabase = await createClient();
  // Atomic increment
  await supabase.rpc("increment_storage_used", {
    user_id: userId,
    bytes: sizeBytes,
  });
}

export async function recordDeletion(userId: string, sizeBytes: number) {
  const supabase = await createClient();
  await supabase.rpc("decrement_storage_used", {
    user_id: userId,
    bytes: sizeBytes,
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

#### ✅ Checkpoint 2: Storage Service

**Waar:** Terminal + Browser

**Test:**
```bash
# 1. Check of bestand compileert
npm run build
# Verwacht: geen TypeScript errors

# 2. Check of imports werken
# Voeg tijdelijk toe aan een server component:
# import { getStorageUsage, formatBytes } from "@/lib/services/storage-limits";
# console.log(await getStorageUsage("<jouw-user-id>"));
```

**Browser test (na build):**
- Open app, check console voor storage output
- Verwacht: `{ used: 0, limit: 52428800, remaining: 52428800, planType: 'free' }`

---

### Fase 3: Database Functions

**Toevoegen aan migratie:**

```sql
-- Atomic increment voor storage tracking
CREATE OR REPLACE FUNCTION increment_storage_used(user_id UUID, bytes BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET storage_used_bytes = COALESCE(storage_used_bytes, 0) + bytes
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic decrement (met floor op 0)
CREATE OR REPLACE FUNCTION decrement_storage_used(user_id UUID, bytes BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET storage_used_bytes = GREATEST(0, COALESCE(storage_used_bytes, 0) - bytes)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### Fase 4: Enforcement Points

#### 4.1 Eigen Media Upload
**Bestand:** `src/lib/actions/decks.ts` - `uploadCardMedia()`

```typescript
// Vóór storage upload
const uploadCheck = await canUpload(user.id, file.size);
if (!uploadCheck.allowed) {
  return {
    error: `Opslaglimiet bereikt. Je hebt nog ${formatBytes(uploadCheck.remaining)} vrij.`
  };
}

// Na succesvolle upload
await recordUpload(user.id, file.size);
```

#### 4.2 GBIF Media Download (deck kaarten)
**Bestand:** `src/lib/actions/decks.ts` - `addGBIFMediaToCard()`

```typescript
// Na image fetch, vóór storage upload
const uploadCheck = await canUpload(user.id, imageBlob.size);
if (!uploadCheck.allowed) {
  return {
    error: `Opslaglimiet bereikt. Deze afbeelding is ${formatBytes(imageBlob.size)}.`
  };
}

// Na succesvolle upload
await recordUpload(user.id, imageBlob.size);
```

#### 4.3 Media Verwijdering
**Bestand:** `src/lib/actions/decks.ts` - `deleteCardMedia()`

```typescript
// Haal bestandsgrootte op vóór verwijdering
const { data: mediaInfo } = await supabase.storage
  .from("card-media")
  .list(path);

// Na succesvolle verwijdering
if (mediaInfo?.[0]?.metadata?.size) {
  await recordDeletion(user.id, mediaInfo[0].metadata.size);
}
```

#### ✅ Checkpoint 3: Enforcement Points

**Waar:** Browser + Supabase Dashboard

**Test 1 - Eigen upload tracking:**
1. Check huidige storage in Supabase: `SELECT storage_used_bytes FROM profiles WHERE id = '<jouw-id>'`
2. Ga naar een deck → Kaart bewerken → Upload een foto (noteer bestandsgrootte)
3. Check storage opnieuw in Supabase
4. **Verwacht:** `storage_used_bytes` is toegenomen met ~bestandsgrootte

**Test 2 - GBIF download tracking:**
1. Check huidige storage in Supabase
2. Ga naar een kaart → Zoek GBIF media → Selecteer een foto
3. Check storage opnieuw
4. **Verwacht:** `storage_used_bytes` is toegenomen

**Test 3 - Limiet blokkering:**
1. Zet tijdelijk een lage limiet in code: `free: 1 * 1024 * 1024` (1 MB)
2. Upload een foto groter dan 1 MB
3. **Verwacht:** Toast error "Opslaglimiet bereikt..."
4. Check dat storage NIET is toegenomen
5. Zet limiet terug naar 50 MB

**Test 4 - Verwijdering tracking:**
1. Check huidige storage
2. Verwijder een kaart met media (of alleen de media)
3. Check storage opnieuw
4. **Verwacht:** `storage_used_bytes` is afgenomen

---

### Fase 5: UI Feedback

#### 5.1 Settings Pagina
**Bestand:** `src/app/(main)/settings/page.tsx`

Voeg storage usage indicator toe:

```tsx
import { getStorageUsage, formatBytes } from "@/lib/services/storage-limits";

// In component
const { used, limit } = await getStorageUsage(user.id);
const percentage = Math.round((used / limit) * 100);

<Card>
  <CardHeader>
    <CardTitle>Opslag</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{formatBytes(used)} gebruikt</span>
        <span>{formatBytes(limit)} totaal</span>
      </div>
      <Progress value={percentage} />
      {percentage >= 80 && (
        <p className="text-sm text-warning">
          Je opslag raakt bijna vol
        </p>
      )}
    </div>
  </CardContent>
</Card>
```

#### 5.2 Toast Messages

| Situatie | Melding |
|----------|---------|
| Limiet bereikt | "Opslaglimiet bereikt. Je hebt nog X MB vrij." |
| Bijna vol (80%) | "Je opslag raakt bijna vol (X MB over)" |

#### ✅ Checkpoint 4: UI Feedback (Eindtest)

**Waar:** Browser

**Test 1 - Settings pagina:**
1. Ga naar Instellingen (`/settings`)
2. **Verwacht:** Opslag sectie met progress bar
3. Check dat "X MB gebruikt van 50 MB" klopt met database waarde

**Test 2 - Progress bar percentage:**
1. In Supabase, zet `storage_used_bytes = 40000000` (40 MB, ~80%)
2. Refresh settings pagina
3. **Verwacht:** Progress bar ~80% vol + gele waarschuwing tekst

**Test 3 - Volledige flow:**
1. Reset storage naar 0: `UPDATE profiles SET storage_used_bytes = 0 WHERE id = '<jouw-id>'`
2. Upload 3 foto's, check dat progress bar toeneemt
3. Verwijder 1 foto, check dat progress bar afneemt
4. **Verwacht:** UI blijft in sync met werkelijke storage

---

## Bestanden te Wijzigen/Maken

| Bestand | Actie |
|---------|-------|
| `supabase/migrations/20260202_add_storage_tracking.sql` | Nieuw |
| `src/lib/services/storage-limits.ts` | Nieuw |
| `src/lib/actions/decks.ts` | Wijzigen (3 locaties) |
| `src/app/(main)/settings/page.tsx` | Wijzigen |

---

## Verificatie

1. **Database:** Run migratie, check dat `storage_used_bytes` kolom bestaat
2. **Test upload limiet:** Upload >50MB aan media, moet falen met duidelijke melding
3. **Test GBIF download:** Voeg GBIF media toe aan kaart, check storage increment
4. **Test verwijdering:** Verwijder media, check storage decrement
5. **Settings pagina:** Bekijk usage indicator, check percentage berekening

---

## Migratie Bestaande Gebruikers

Bestaande accounts krijgen automatisch `storage_used_bytes = 0` en `plan_type = 'free'`.

Om bestaande storage usage te berekenen (optioneel, kan later):

```sql
-- Tel bestaande uploads per gebruiker (als nodig)
UPDATE profiles p
SET storage_used_bytes = COALESCE((
  SELECT SUM((metadata->>'size')::bigint)
  FROM storage.objects o
  WHERE o.owner = p.id::text
  AND o.bucket_id = 'card-media'
), 0);
```

---

## Niet in Scope (Later)

- Premium upgrade flow (Stripe integratie)
- Gedetailleerde usage analytics
- Media optimalisatie (WebP conversie)
- Email notificaties bij limiet
