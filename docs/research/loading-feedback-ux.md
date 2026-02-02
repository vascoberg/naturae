# Loading Feedback & UX Research

> Onderzoek naar huidige implementatie, industry best practices, en aanbevelingen voor verbetering.

**Datum:** 30 januari 2026
**Status:** Grotendeels geïmplementeerd (01-02-2026)

---

## Inhoudsopgave

1. [Samenvatting](#samenvatting)
2. [Huidige Implementatie](#huidige-implementatie)
3. [Industry Best Practices](#industry-best-practices)
4. [Probleemgebieden](#probleemgebieden)
5. [Aanbevelingen](#aanbevelingen)
6. [Implementatie Roadmap](#implementatie-roadmap)

---

## Samenvatting

De Naturae app heeft een gemengde implementatie van loading feedback. Sommige componenten gebruiken moderne patterns (optimistic updates, progress tracking), terwijl andere gebieden feedback missen of inconsistent zijn. Dit document identificeert de gaps en biedt concrete aanbevelingen.

### Belangrijkste bevindingen

| Categorie | Status |
|-----------|--------|
| Toast notificaties | ✅ Geïmplementeerd in DeckEditor en CardSideEditor (01-02-2026) |
| Button loading states | ✅ Aanwezig, maar niet uniform (geen LoadingButton component) |
| Optimistic updates | ✅ Goed geïmplementeerd (LikeButton met rollback) |
| Progress indicators | ✅ Uitstekend (BulkImport) |
| Error feedback | ✅ Verbeterd - toast.error() in DeckEditor en CardSideEditor |
| Quiz completion | ✅ Uitstekende visuele feedback (Trophy, score circle) |
| Page transitions | ✅ Geïmplementeerd (View Transitions API + CSS fallback) |
| useTransition pattern | ✅ Gebruikt in 5 componenten (modern React pattern) |

---

## Huidige Implementatie

### Wat goed werkt ✅

#### 1. Optimistic Updates (LikeButton)
```typescript
// src/components/deck/like-button.tsx
const handleToggle = async () => {
  if (!user) {
    toast.error("Log in om leersets te liken");
    return;
  }

  setOptimisticLiked(!optimisticLiked); // Immediate UI update
  setOptimisticCount(optimisticLiked ? optimisticCount - 1 : optimisticCount + 1);

  const result = await toggleLike(deckId);
  if (result.error) {
    // Rollback on error
    setOptimisticLiked(optimisticLiked);
    setOptimisticCount(optimisticCount);
    toast.error("Kon like niet opslaan");
  }
};
```
**Waarom dit goed is:** Directe feedback, graceful error handling met rollback.

#### 2. Progress Tracking (BulkImport)
```typescript
// src/components/deck/bulk-import-dialog.tsx
setStatus({
  stage: "importing",
  processed: index + 1,
  total: validRows.length
});
```
**Waarom dit goed is:** Gebruiker ziet exacte voortgang bij langdurige operaties.

#### 3. Loading Spinners in Buttons
```typescript
// Consistent pattern in veel componenten
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Laden...
    </>
  ) : (
    "Opslaan"
  )}
</Button>
```

#### 4. Skeleton Loading (GBIF Media Picker)
```typescript
{isLoading ? (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <Skeleton key={i} className="aspect-square rounded-lg" />
    ))}
  </div>
) : // content
}
```

### Huidige Toast Implementatie

De app gebruikt `sonner` voor toast notificaties via `@/components/ui/sonner`:

```typescript
import { toast } from "sonner";

// Succesvolle operaties
toast.success("Kaart toegevoegd");

// Foutmeldingen
toast.error("Er ging iets mis");

// Promises (bulk import)
toast.promise(importPromise, {
  loading: "Importeren...",
  success: "Import voltooid",
  error: "Import mislukt"
});
```

---

## Industry Best Practices

### React/Next.js 2025 Patterns

#### 1. useTransition voor Non-Blocking Updates
```typescript
import { useTransition } from 'react';

function SaveButton({ onSave }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await onSave();
    });
  };

  return (
    <Button disabled={isPending}>
      {isPending ? <Loader2 className="animate-spin" /> : "Opslaan"}
    </Button>
  );
}
```
**Voordeel:** UI blijft responsive tijdens async operaties.

#### 2. useActionState (React 19+)
```typescript
import { useActionState } from 'react';

function Form() {
  const [state, formAction, isPending] = useActionState(serverAction, initialState);

  return (
    <form action={formAction}>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Verzenden..." : "Verzenden"}
      </Button>
    </form>
  );
}
```

#### 3. Suspense Boundaries voor Data Fetching
```typescript
<Suspense fallback={<CardSkeleton />}>
  <CardList deckId={deckId} />
</Suspense>
```

#### 4. Reusable LoadingButton Component
```typescript
interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
}

export function LoadingButton({
  isLoading,
  loadingText = "Laden...",
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={isLoading || props.disabled} {...props}>
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {loadingText}
        </>
      ) : children}
    </Button>
  );
}
```

### UX Principes

1. **Immediate Feedback Rule:** Elke actie moet binnen 100ms visuele feedback geven
2. **Progress Indication:** Operaties > 1 seconde moeten progress tonen
3. **Completion Confirmation:** Gebruiker moet weten wanneer een actie klaar is
4. **Error Recovery:** Foutmeldingen moeten duidelijk en actionable zijn
5. **Consistency:** Zelfde patterns in hele app

---

## Probleemgebieden

### 1. DeckEditor - Geen Save Feedback ✅ OPGELOST

**Locatie:** `src/components/deck/deck-editor.tsx`

**Status:** Geïmplementeerd op 01-02-2026

```typescript
// Nieuwe implementatie
const handleSave = async () => {
  setIsSaving(true);
  try {
    await updateDeck(deckId, formData);
    toast.success("Leerset opgeslagen");
  } catch (error) {
    toast.error("Opslaan mislukt. Probeer het opnieuw.");
  } finally {
    setIsSaving(false);
  }
};
```

**Wat is geïmplementeerd:**
- Toast feedback voor deck save/delete
- Toast feedback voor card add/update/delete
- Foutmeldingen bij mislukte operaties

### 2. Silent CRUD Failures ❌

**Probleem:** Sommige delete/update operaties falen stil zonder gebruikersfeedback.

**Voorbeelden:**
- Card deletion in CardGrid
- Tag removal
- Settings updates

### 3. Quiz/Study Completion - Visuele Feedback ✅

**Locatie:** `src/components/study/*`, `src/components/quiz/*`

**Status:** Goed geïmplementeerd met visuele feedback:
- Trophy icon bij voltooiing
- Animated score circle met percentage
- Contextual feedback messages ("Perfect! Je kent alle soorten!")
- Score breakdown (correct/fout grid)

**Opmerking:** Geen toast - dit is intentioneel voor een immersive ervaring. De visuele feedback is voldoende en passend bij de quiz context.

### 4. Page Navigation - Abrupte Transitions ⚠️

**Probleem:** Navigatie naar nieuwe pagina's gebeurt zonder visuele transitie, wat desoriënterend kan zijn.

**Voorbeelden:**
- Deck pagina → Edit pagina
- Discover → Deck detail
- Home → Study sessie

### 5. Inconsistente Error Handling ⚠️

**Huidige situatie:**
- Sommige errors: `toast.error("...")`
- Sommige errors: `console.error(...)` + stil falen
- Sommige errors: inline error state

### 6. Form Validation Feedback ⚠️

**Probleem:** Validatie errors zijn niet altijd zichtbaar of duidelijk.

---

## Aanbevelingen

### Prioriteit 1: Quick Wins (1-2 uur)

#### A. Toast na Save operaties toevoegen

```typescript
// deck-editor.tsx
const handleSave = async () => {
  setIsSaving(true);
  const result = await updateDeck(deckId, formData);
  setIsSaving(false);

  if (result.error) {
    toast.error("Kon wijzigingen niet opslaan");
  } else {
    toast.success("Wijzigingen opgeslagen");
  }
};
```

#### B. Delete bevestigingen met toast

```typescript
const handleDelete = async (cardId: string) => {
  const result = await deleteCard(cardId);

  if (result.error) {
    toast.error("Kon kaart niet verwijderen");
  } else {
    toast.success("Kaart verwijderd");
  }
};
```

#### C. Quiz completion toast

```typescript
// Bij einde quiz
toast.success(`Quiz voltooid! Score: ${score}/${total}`);
```

### Prioriteit 2: Consistentie (4-8 uur)

#### A. Creëer LoadingButton component

```typescript
// src/components/ui/loading-button.tsx
"use client";

import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "./button";

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
}

export function LoadingButton({
  isLoading = false,
  loadingText,
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={isLoading || disabled} {...props}>
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
```

#### B. Standaardiseer error handling

```typescript
// src/lib/utils/feedback.ts
import { toast } from "sonner";

export function showSuccess(message: string) {
  toast.success(message);
}

export function showError(message: string, error?: unknown) {
  console.error(message, error);
  toast.error(message);
}

export function showActionResult(
  result: { error?: string | null },
  successMessage: string,
  errorMessage?: string
) {
  if (result.error) {
    showError(errorMessage || result.error);
    return false;
  }
  showSuccess(successMessage);
  return true;
}
```

### Prioriteit 3: Polish (8-16 uur)

#### A. Page transition animaties ✅ GEÏMPLEMENTEERD

**Geïmplementeerd op 30-01-2026:**
- `src/components/layout/page-transition.tsx` - Fade transition component
- Gebruikt View Transitions API waar ondersteund
- CSS fallback voor oudere browsers
- Geïntegreerd in alle layouts (main, public, auth)

```typescript
// Geïmplementeerde aanpak: hybride CSS + View Transitions API
// src/components/layout/page-transition.tsx
export function PageTransition({ children }: PageTransitionProps) {
  // Detecteert route changes via usePathname
  // Gebruikt View Transitions API waar beschikbaar
  // Valt terug op CSS opacity transition
}
```

**CSS (globals.css):**
```css
@supports (view-transition-name: page) {
  ::view-transition-old(page),
  ::view-transition-new(page) {
    animation-duration: 150ms;
    animation-timing-function: ease-out;
  }
}
```

#### B. Touch feedback verbeteren

```css
/* globals.css */
button, a {
  -webkit-tap-highlight-color: transparent;
}

button:active, a:active {
  transform: scale(0.98);
  transition: transform 0.1s;
}
```

#### C. Inline loading states voor forms

```typescript
// Veld-niveau feedback
<Input
  className={cn(
    isValidating && "border-yellow-500",
    hasError && "border-red-500",
    isValid && "border-green-500"
  )}
/>
```

---

## Implementatie Roadmap

### Fase 1: Foundation ✅ AFGEROND (01-02-2026)
- [ ] Creëer `LoadingButton` component (optioneel - huidige pattern werkt)
- [ ] Creëer `feedback.ts` utility (optioneel - directe toast calls werken)
- [x] Voeg toast toe aan DeckEditor save ✅
- [x] Voeg toast toe aan card delete operaties ✅

### Fase 2: Consistency ✅ GROTENDEELS AFGEROND (01-02-2026)
- [ ] Audit alle async operaties (verbeterd maar niet volledig)
- [ ] Vervang inline loading patterns door LoadingButton (optioneel)
- [x] Standaardiseer error handling (toast in DeckEditor en CardSideEditor) ✅
- [x] Voeg feedback toe aan CardSideEditor uploads ✅

### Fase 3: Polish (Later)
- [x] ~~Onderzoek page transitions~~ ✅ Geïmplementeerd (View Transitions API + CSS fallback)
- [ ] Verbeter touch feedback
- [ ] Voeg inline validation feedback toe
- [ ] A/B test verschillende feedback patterns

---

## Appendix: Componenten Audit

### Componenten met goede loading feedback ✅
- `BulkImportDialog` - Progress tracking
- `LikeButton` - Optimistic updates met rollback
- `GBIFMediaPicker` - Skeleton loading
- `SpeciesSheet` - Loading spinner
- `QuizSession` - Trophy icon, score circle, contextual messages
- `ProfileForm`, `PasswordForm`, `AvatarUpload` - useTransition + toast

### Componenten die verbetering nodig hebben ⚠️
- ~~`DeckEditor` - Geen save/delete toast feedback~~ ✅ Opgelost 01-02-2026
- ~~`CardSideEditor` - Geen upload/delete feedback~~ ✅ Opgelost 01-02-2026
- `CardGrid` - Stille delete operaties (nog te doen indien nodig)

### Pagina's met loading.tsx ✅
- `/dashboard` ✅ Toegevoegd 02-02-2026
- `/my-decks` ✅ Toegevoegd 02-02-2026
- `/decks/[id]` ✅ Toegevoegd 02-02-2026
- `/discover` ✅ Toegevoegd 02-02-2026
- `/settings` ✅ Toegevoegd 02-02-2026

### Active states toegevoegd ✅
- Buttons: `active:scale-[0.98] active:opacity-90`
- Sidebar nav items: `active:scale-[0.98] active:bg-muted`
- Deck cards: `active:scale-[0.98] active:opacity-90`

---

*Laatst bijgewerkt: 2 februari 2026*
