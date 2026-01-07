# Deployment & Setup

> Instructies voor het deployen en configureren van Naturae.

## Infrastructuur Overzicht

| Component | Service | Tier |
|-----------|---------|------|
| Frontend/API | Vercel | Free (Hobby) |
| Database | Supabase PostgreSQL | Free |
| Auth | Supabase Auth | Free |
| Storage | Supabase Storage | Free (1GB) |
| Domain | (optioneel) | Eigen beheer |

---

## Lokale Development

### Vereisten
- Node.js 18+
- npm of pnpm
- Supabase account

### Setup

```bash
# Clone en installeer
git clone <repo-url>
cd naturae
npm install

# Environment variables
cp .env.example .env.local
# Vul NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY in

# Start dev server
npm run dev
```

---

## Supabase Setup

### 1. Project aanmaken
1. Ga naar [supabase.com](https://supabase.com)
2. Create new project
3. Noteer de URL en anon key voor `.env.local`

### 2. Database migraties
Voer de SQL uit in **SQL Editor** (zie [architecture/database-architecture.md](../architecture/database-architecture.md)):
- Tabellen: profiles, decks, cards, card_media, user_progress, tags, deck_tags
- RLS policies
- Triggers (updated_at, card_count, profile creation)
- Indexes

### 3. Storage bucket

```sql
-- In SQL Editor:
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', false);
```

Storage RLS policies:
```sql
-- Lezen: eigen media OF media van publieke decks
CREATE POLICY "Users can view media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'media'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM decks
        WHERE decks.id::text = (storage.foldername(name))[2]
        AND decks.is_public = true
        AND decks.deleted_at IS NULL
      )
    )
  );

-- Upload: alleen in eigen folders
CREATE POLICY "Users can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Delete: alleen eigen media
CREATE POLICY "Users can delete own media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 4. Auth configuratie
- **Email confirmations:** Uit voor development, aan voor productie
- **Site URL:** `http://localhost:3000` (dev) of productie URL
- **Redirect URLs:** Voeg productie domein toe

---

## Vercel Deployment

### Via Vercel CLI (aanbevolen)

```bash
# Installeer Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (eerste keer - maakt project aan)
vercel

# Productie deploy
vercel --prod
```

### Via Vercel Dashboard

1. Import GitHub repository
2. Framework preset: Next.js
3. Environment variables toevoegen:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Troubleshooting

**404 na deploy:**
- Check of environment variables zijn ingesteld
- Verifieer dat laatste code is gepushed naar git
- Check Vercel build logs

**Git push HTTP 400:**
```bash
git config http.postBuffer 524288000
git push
```

---

## Environment Variables

| Variable | Beschrijving | Voorbeeld |
|----------|--------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJ...` |

---

## Checklist Productie Deploy

- [ ] Supabase project aangemaakt
- [ ] Database migraties uitgevoerd
- [ ] Storage bucket + RLS policies
- [ ] Auth redirect URLs geconfigureerd
- [ ] Environment variables in Vercel
- [ ] Custom domain (optioneel)
- [ ] Email templates aangepast (optioneel)
