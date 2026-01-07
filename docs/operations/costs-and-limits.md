# Kosten en Limieten

> Overzicht van free tier limieten en geschatte kosten bij groei.

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

### Supabase (Free Tier)
| Resource | Limiet | Naturae impact |
|----------|--------|----------------|
| Database | 500 MB | ~50.000+ decks/cards |
| Storage | 1 GB | ~1.000-2.000 foto's |
| Bandwidth | 2 GB/maand | ~20.000 foto loads |
| Auth users | 50.000 MAU | Ruim voldoende |
| Edge Functions | 500.000 calls/maand | Niet gebruikt (nu) |
| Realtime | 200 connections | Niet gebruikt (nu) |

**Beperkingen:**
- Project pauzeert na 1 week inactiviteit
- Geen backups
- Gedeelde resources (kan trager zijn)

---

## Bottlenecks bij Groei

### 1. Storage (eerste bottleneck)
1 GB = ~1.000-2.000 foto's (afhankelijk van resolutie)

**Oplossingen:**
- Client-side resize naar max 1200px (al geïmplementeerd)
- WebP compressie toevoegen
- Upgrade naar Pro ($25/maand → 100 GB)

### 2. Database
500 MB is veel voor tekst data. Wordt pas probleem bij:
- ~100.000+ kaarten
- ~10.000+ gebruikers met progress data

### 3. Bandwidth
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

## Monitoring

### Supabase Dashboard
- **Database:** Usage → Database size
- **Storage:** Usage → Storage size
- **Auth:** Users → Monthly active users

### Vercel Dashboard
- **Usage:** Bandwidth, function invocations
- **Analytics:** (Pro) Page views, performance

---

## Optimalisaties (Toekomst)

1. **Image CDN** - Cloudflare Images of imgix voor on-the-fly resizing
2. **Caching** - Vercel Edge caching voor publieke decks
3. **Lazy loading** - Foto's pas laden bij scrollen
4. **Audio compressie** - MP3 naar Opus/AAC

---

## Notities

- Free tier is voldoende voor MVP en early adopters
- Eerste betaalde upgrade waarschijnlijk: Supabase storage
- Break-even bij ~50 betalende gebruikers (@ $5/maand) = $250/maand budget
