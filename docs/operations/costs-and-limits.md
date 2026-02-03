# Kosten en Limieten

> Overzicht van free tier limieten, huidige usage, en geschatte kosten bij groei.

**Laatste update:** 3 februari 2026 (soft launch)

---

## Supabase Resources Uitleg

### Database Size
De totale grootte van je PostgreSQL database: alle tabellen, indexen, en metadata.
- Bevat: gebruikers, decks, cards, card_media metadata, study progress, etc.
- Groeit met: meer gebruikers, meer kaarten, meer study sessions
- **Naturae:** Vooral tekst data, groeit langzaam

### Storage Size
Bestanden opgeslagen in Supabase Storage buckets.
- Naturae buckets: `media` (kaart foto's) en `avatars` (profielfoto's)
- Groeit met: foto uploads door gebruikers, GBIF foto downloads
- **Naturae:** Dit is de eerste bottleneck bij groei

### Monthly Active Users (MAU)
Unieke gebruikers die in een maand inloggen via Supabase Auth.
- Telt: elke unieke user die authenticated actions uitvoert
- **Naturae:** Ruim binnen limiet, geen zorgen

### Egress (Bandwidth)
Data die Supabase verlaat richting gebruikers.
- Bevat: database queries, storage downloads (foto's laden)
- **Naturae:** Foto-intensieve app, kan oplopen bij veel gebruik

### Cached Egress
Data geserveerd vanuit Supabase's CDN cache (sneller, telt apart).
- Goede caching = lagere egress kosten
- **Naturae:** 1.7 GB cached vs 0.6 GB uncached = caching werkt goed

---

## Huidige Usage (Soft Launch - 3 feb 2026)

| Resource | Gebruikt | Limiet (Free) | Percentage | Status |
|----------|----------|---------------|------------|--------|
| **Storage** | 322 MB | 1 GB | 32% | ⚠️ Monitor |
| **Database** | 32 MB | 500 MB | 6% | ✅ Ruim |
| **MAU** | 9 users | 50.000 | ~0% | ✅ Ruim |
| **Egress** | 623 MB | 2 GB | 31% | ✅ OK |
| **Cached Egress** | 1.7 GB | - | - | ✅ Goed |

### Beschikbare Ruimte
- **Storage:** 678 MB vrij → ~13 gratis users à 50 MB, of ~680 foto's à 1 MB
- **Database:** 468 MB vrij → ~100.000+ extra kaarten

### Aandachtspunt: Storage Limiet vs Per-User Limiet

```
Supabase totaal:     1 GB voor ALLE gebruikers samen
Per-user (free):     50 MB per gebruiker
Per-user (premium):  1 GB per gebruiker

Rekenvoorbeeld:
- 20 gratis users × 50 MB = 1 GB → Supabase limiet bereikt!
- 1 premium user alleen = 1 GB → Supabase limiet bereikt!
```

**Actie:** Monitor storage wekelijks. Bij ~800 MB → upgrade naar Pro.

---

## Supabase Subscription Plans

### Free Plan - $0/maand (huidig)
| Resource | Limiet |
|----------|--------|
| Database | 500 MB |
| Storage | 1 GB |
| Egress | 2 GB/maand |
| MAU | 50.000 |
| Edge Functions | 500.000 calls/maand |
| Realtime connections | 200 |

**Beperkingen:**
- Project pauzeert na 1 week inactiviteit
- Geen automatische backups
- Gedeelde resources (kan trager zijn)
- Max 2 actieve projecten

### Pro Plan - $25/maand
| Resource | Limiet |
|----------|--------|
| Database | 8 GB |
| Storage | 100 GB (daarna $0.12/GB) |
| Egress | Meer (usage-based) |
| MAU | 100.000 |

**Voordelen:**
- Geen pauzering bij inactiviteit
- Dagelijkse backups (7 dagen bewaard)
- Email support
- 7-dagen log retention

### Team Plan - $599/maand
Voor grotere organisaties met SSO, priority support, etc.

---

## Huidige Setup: 100% Gratis

### Vercel (Hobby Tier)
| Resource | Limiet | Naturae gebruik |
|----------|--------|-----------------|
| Bandwidth | 100 GB/maand | Ruim voldoende |
| Serverless Functions | 100 GB-hrs/maand | Ruim voldoende |
| Builds | 6000 min/maand | Ruim voldoende |
| Projects | Unlimited | 1 |
| Deployments | Unlimited | ✓ |

**Beperkingen:**
- Geen commercial use (officieel)
- Geen team features

---

## Bottlenecks bij Groei

### 1. Storage (eerste bottleneck)
1 GB = ~1.000-2.000 foto's (afhankelijk van resolutie)

**Huidige mitigaties:**
- Client-side resize naar max 1200px (geïmplementeerd)
- JPEG compressie 0.8 kwaliteit (geïmplementeerd)
- Per-user limieten: 50 MB gratis (geïmplementeerd)

**Toekomstige oplossingen:**
- WebP compressie toevoegen
- Upgrade naar Pro ($25/maand → 100 GB)

### 2. Database
500 MB is veel voor tekst data. Wordt pas probleem bij:
- ~100.000+ kaarten
- ~10.000+ gebruikers met progress data

### 3. Bandwidth/Egress
2 GB/maand beperkt bij veel media-rijke decks.
- ~20.000 foto loads/maand op free tier
- Audio files zijn groter, sneller op

---

## Geschatte Kosten bij Groei

### Scenario: 100 actieve gebruikers
| Service | Tier | Kosten |
|---------|------|--------|
| Vercel | Pro | $20/maand |
| Supabase | Pro | $25/maand |
| **Totaal** | | **$45/maand** |

### Scenario: 1.000 actieve gebruikers
| Service | Tier | Kosten |
|---------|------|--------|
| Vercel | Pro | $20/maand |
| Supabase | Pro + extra storage | $25-50/maand |
| **Totaal** | | **$45-70/maand** |

### Scenario: 10.000+ gebruikers
Eigen infrastructuur overwegen of enterprise deals.

---

## Monitoring Checklist

### Wekelijks (tijdens soft launch)
- [ ] Check Supabase Usage pagina
- [ ] Noteer Storage Size (target: blijf onder 800 MB)
- [ ] Noteer Database Size
- [ ] Check Egress usage

### Supabase Dashboard
- **Usage pagina:** Alle metrics in één overzicht
- **Database → Database size:** Tabelgroottes
- **Storage → Usage:** Per-bucket breakdown
- **Auth → Users:** MAU statistieken

### Vercel Dashboard
- **Usage:** Bandwidth, function invocations
- **Analytics:** (Pro) Page views, performance

---

## Optimalisaties (Toekomst)

1. **Image CDN** - Cloudflare Images of imgix voor on-the-fly resizing
2. **Caching** - Vercel Edge caching voor publieke decks
3. **Lazy loading** - Foto's pas laden bij scrollen
4. **Audio compressie** - MP3 naar Opus/AAC
5. **WebP conversie** - Kleinere bestandsgroottes

---

## Notities

- Free tier is voldoende voor MVP en early adopters (~20 users)
- Eerste betaalde upgrade waarschijnlijk: Supabase Pro voor storage
- Break-even bij ~50 betalende gebruikers (@ $5/maand) = $250/maand budget
- Upgrade trigger: Storage > 800 MB of Egress > 1.5 GB
