# Security Audit - 3 februari 2026

> Resultaat van security analyse van de Naturae codebase bij soft launch.

**Status:** Soft Launch
**Auditor:** Claude Code (geautomatiseerde analyse)
**Laatste update:** 3 februari 2026 - diepe analyse server actions, API routes, input validatie

---

## Samenvatting

| Categorie | Status |
|-----------|--------|
| Secrets in Git | ✅ Veilig (niet in git) |
| Environment Variables | ✅ Correct geconfigureerd |
| SQL Injection | ✅ Geen risico (parameterized queries) |
| XSS | ✅ Geen risico (geen dangerouslySetInnerHTML) |
| Authentication | ✅ Server-side met Supabase Auth |
| Row Level Security | ✅ Correct geconfigureerd |
| Server Actions | ✅ Alle mutaties hebben auth checks |
| API Routes | ✅ Correct beveiligd met RLS + validatie |
| File Uploads | ⚠️ Geen per-bestand size validatie |
| Rate Limiting | ⚠️ Niet geïmplementeerd |
| Admin Endpoints | ✅ Gearchiveerd (inactief) |

---

## Diepe Analyse: Server Actions

Alle 9 server action bestanden zijn geanalyseerd op auth en ownership checks.

### Resultaat: ✅ Alle mutaties beveiligd

| Bestand | Auth Pattern | Ownership Check |
|---------|--------------|-----------------|
| `decks.ts` | ✅ `getUser()` op alle mutaties | ✅ `deck.user_id !== user.id` |
| `likes.ts` | ✅ `getUser()` | ✅ Via user.id in insert |
| `profile.ts` | ✅ `getUser()` | ✅ Via user.id in update |
| `annotations.ts` | ✅ `getUser()` | ✅ Deck ownership check |
| `tags.ts` | ✅ `getUser()` op mutaties | ✅ Deck ownership check |
| `import.ts` | ✅ `getUser()` | ✅ Deck ownership check |
| `species.ts` | ✅ `getUser()` op `createManualSpecies` | N/A (public reference data) |
| `quiz.ts` | ✅ Deck access check | ✅ Public OR owner |
| `study.ts` | ✅ Deck access check | ✅ Public OR owner |

**Pattern:** Read-only functies (zoals `getAllTags`, `searchSpecies`) vereisen geen auth omdat ze publieke referentiedata ophalen.

---

## Diepe Analyse: API Routes

Alle 8 actieve API routes zijn geanalyseerd.

### Resultaat: ✅ Alle routes correct beveiligd

| Route | Auth | Validatie | Bescherming |
|-------|------|-----------|-------------|
| `/api/decks/[id]` | Via RLS | UUID in path | RLS: `is_public OR user_id = auth.uid()` |
| `/api/decks/[id]/export` | ✅ Explicit | ✅ UUID check | ✅ `deck.user_id !== user?.id && !deck.is_public` |
| `/api/gbif/media` | Geen (public data) | ✅ `parseInt` check | N/A (externe GBIF API) |
| `/api/image-proxy` | Geen (proxy) | ✅ URL parse | ✅ **Domain allowlist** |
| `/api/wikipedia/[name]` | Geen (public data) | ✅ `decodeURIComponent` | N/A (externe Wikipedia API) |
| `/api/species/[id]` | Geen (public data) | UUID in path | Via RLS (publieke species tabel) |
| `/api/xeno-canto/audio` | Geen (public data) | ✅ scientificName required | N/A (externe Xeno-canto API) |
| `/api/xeno-canto/stream/[id]` | Geen (proxy) | ✅ Regex `/^\d+$/` | ✅ Alleen numerieke IDs |

**Image Proxy Security:** Domain allowlist beperkt tot:
- `observation.org`, `waarneming.nl`
- `inaturalist-open-data.s3.amazonaws.com`
- `static.inaturalist.org`
- `live.staticflickr.com`

---

## Diepe Analyse: Input Validatie

### XSS Preventie: ✅ Veilig
- **Geen** `dangerouslySetInnerHTML` in hele codebase
- **Geen** `innerHTML` assignments
- React escaped automatisch alle content

### SQL Injection: ✅ Veilig
- **Geen** raw SQL queries in TypeScript code
- Alle database access via Supabase client (parameterized queries)
- Database functies gebruiken `SET search_path = ''` (fixed)

### File Upload Validatie: ⚠️ Gedeeltelijk

| Locatie | Type Check | Size Check |
|---------|------------|------------|
| Avatar upload | ✅ Allowlist: jpg, png, webp, gif | ✅ Max 2MB |
| Card media | Via `accept` attribute | ⚠️ Alleen totale storage limiet |

---

## Gearchiveerde Admin Endpoints

**Status:** ✅ Gearchiveerd op 3 feb 2026

**Locatie:** `src/app/api/_admin-archived/`

Door het `_` prefix worden deze mappen genegeerd door Next.js routing.
De bestanden blijven in de repo voor eventueel toekomstig hergebruik, maar zijn niet meer bereikbaar via HTTP.

| Endpoint | Was | Nu |
|----------|-----|-----|
| `/api/admin/check-back-text` | Actief | ❌ Niet bereikbaar |
| `/api/admin/check-species` | Actief | ❌ Niet bereikbaar |
| `/api/admin/fix-dutch-names` | Actief | ❌ Niet bereikbaar |
| `/api/admin/test-update` | Actief | ❌ Niet bereikbaar |

---

## Medium Bevindingen

### 2. Next.js Bekende Vulnerabilities

```bash
npm audit
```

Update naar nieuwste patch versie voor security fixes.

### 3. Ontbrekende Security Headers

Geen CSP, X-Frame-Options, etc. in `next.config.ts`.

**Aanbevolen toevoeging:**
```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ];
}
```

### 4. Geen Rate Limiting

Public APIs kunnen misbruikt worden:
- `/api/gbif/media`
- `/api/xeno-canto/stream/[id]`
- `/api/image-proxy`

**Toekomstige oplossing:** Upstash Redis rate limiting.

### 5. Geen File Size Validatie

Client-side storage limiet check, maar geen maximum per bestand.

**Aanbevolen:**
```typescript
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
```

### 6. Zwakke Wachtwoord Eisen

Huidige: minimaal 6 karakters
Aanbevolen: minimaal 8-12 karakters met complexiteit

---

## Positieve Bevindingen

### Wat Goed Is

| Aspect | Details |
|--------|---------|
| **Secrets Management** | `.env.local` niet in git, `.gitignore` correct |
| **Environment Variables** | `NEXT_PUBLIC_` prefix correct gebruikt |
| **Row Level Security** | RLS policies op alle tabellen met correcte access checks |
| **Parameterized Queries** | Supabase query builder, geen raw SQL in codebase |
| **Server Actions** | Alle 9 bestanden met correcte auth + ownership checks |
| **API Routes** | 8 actieve routes met RLS/validatie, 4 gearchiveerd |
| **Authentication** | Server-side met `getUser()`, middleware route protection |
| **Storage Isolation** | Bestanden in user-specifieke paden |
| **XSS Prevention** | Geen dangerouslySetInnerHTML, React auto-escape |
| **Proxy Security** | Image proxy met domain allowlist |
| **TypeScript** | Type safety door hele codebase |
| **Image Optimization** | Client-side resize naar 1200px |

### Middleware Protection

Middleware beschermt routes server-side:
- `/dashboard`, `/my-decks`, `/decks/new`, `/settings` → redirect naar login
- `/decks/[id]/edit` → redirect naar login
- Auth pages → redirect naar dashboard indien ingelogd

---

## Actieplan

### Afgerond ✅
- [x] Admin endpoints gearchiveerd naar `_admin-archived`
- [x] Function search_path fixed met migratie
- [x] Missing indexes toegevoegd

### Deze Week (Medium)
- [ ] `npm update next` voor security patches
- [ ] Security headers toevoegen aan `next.config.ts`

### Later (Low)
- [ ] Wachtwoord eisen verstrengen (nu: 6 chars, aanbevolen: 8-12)
- [ ] Rate limiting implementeren (Upstash Redis)
- [ ] Per-bestand file size validatie toevoegen

---

## Supabase Security Status

### Opgelost (3 feb 2026)
- [x] Function search_path mutable → Fixed met migratie
- [x] Missing indexes → Toegevoegd voor frequent gebruikte foreign keys

### Bekend (Acceptabel)
- [ ] Leaked Password Protection → Vereist betaald Supabase plan
- [ ] Multiple Permissive Policies → Performance impact minimaal, risico van wijzigen te groot

---

## Volgende Audit

Aanbevolen: Na implementatie van Stripe betalingen (nieuwe auth flows, webhooks).
