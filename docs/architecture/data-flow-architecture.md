# Data Flow Architectuur - Naturae

> Dit document beschrijft hoe data stroomt door de Naturae applicatie: van database naar UI en terug. Het is een levend document dat we iteratief verfijnen.

## Inhoudsopgave
1. [Design Principes](#design-principes)
2. [Architectuur Overzicht](#architectuur-overzicht)
3. [Authentication Flow](#authentication-flow)
4. [Data Fetching Patterns](#data-fetching-patterns)
5. [API Routes](#api-routes)
6. [Client State Management](#client-state-management)
7. [Caching Strategie](#caching-strategie)
8. [Error Handling](#error-handling)
9. [Open Vragen](#open-vragen)

---

## Design Principes

### Server-First
- **Server Components** als default - alleen Client Components waar interactiviteit nodig is
- **Data fetching op de server** - sneller, veiliger, geen waterfalls
- **Server Actions** voor mutaties - type-safe, progressively enhanced

### Supabase Direct Access
- **RLS policies** zorgen voor security - geen extra API layer nodig voor basis CRUD
- **Supabase client** in Server Components voor reads
- **Server Actions** voor writes (mutations)

### Wanneer Server vs Client?

| Scenario | Server Component | Client Component |
|----------|------------------|------------------|
| Data ophalen | ✅ Default | ❌ Alleen als real-time nodig |
| Formulieren | Server Action | React Hook Form + Server Action |
| Interactieve UI | ❌ | ✅ (flashcard flip, audio player) |
| Auth state | Via cookies/headers | Via Supabase client |
| Optimistic updates | ❌ | ✅ |

---

## Architectuur Overzicht

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────────────────────┐   │
│  │  Server          │    │  Client Components               │   │
│  │  Components      │    │  (Interactive UI)                │   │
│  │                  │    │                                  │   │
│  │  - Page layouts  │    │  - Flashcard interface           │   │
│  │  - Data display  │    │  - Audio player                  │   │
│  │  - Initial fetch │    │  - Forms with validation         │   │
│  │                  │    │  - Optimistic updates            │   │
│  └────────┬─────────┘    └────────────────┬─────────────────┘   │
│           │                               │                      │
│           │ RSC Payload                   │ Client-side          │
│           │                               │ Supabase calls       │
├───────────┼───────────────────────────────┼──────────────────────┤
│           ▼                               ▼                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Server Actions                         │   │
│  │                    (Mutations)                            │   │
│  │  - createDeck()   - updateProgress()   - uploadMedia()    │   │
│  └────────────────────────────┬─────────────────────────────┘   │
│                               │                                  │
└───────────────────────────────┼──────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Supabase                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│  │   Auth     │  │  Database  │  │  Storage   │                 │
│  │            │  │            │  │            │                 │
│  │  - JWT     │  │  - RLS     │  │  - Media   │                 │
│  │  - Session │  │  - Queries │  │  - Avatars │                 │
│  └────────────┘  └────────────┘  └────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

### Supabase Auth Setup

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Login/Signup Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Landing   │────►│   Sign Up   │────►│  Onboarding │
│   Page      │     │   (email)   │     │  (username) │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Dashboard  │
                                        │  (leersets) │
                                        └─────────────┘
```

### Onboarding Flow (Username)

Na signup heeft de user nog geen username (profile record zonder username).

```typescript
// app/(auth)/onboarding/page.tsx
export default async function OnboardingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  // Als username al bestaat, door naar dashboard
  if (profile?.username) redirect('/dashboard')

  return <UsernameForm userId={user.id} />
}
```

### Middleware (Route Protection)

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Protected routes
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect logged-in users away from auth pages
  if (session && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
}
```

---

## Data Fetching Patterns

### Pattern 1: Server Component Direct Fetch

Voor pagina's die data tonen zonder interactiviteit.

```typescript
// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: decks } = await supabase
    .from('decks')
    .select(`
      *,
      tags:deck_tags(tag:tags(*))
    `)
    .eq('user_id', user!.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  return <DeckList decks={decks} />
}
```

### Pattern 2: Server Component met Client Child

Voor pagina's met interactieve elementen.

```typescript
// app/decks/[id]/study/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server'
import { FlashcardSession } from './flashcard-session'

export default async function StudyPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  // Fetch alle data op de server
  const { data: deck } = await supabase
    .from('decks')
    .select(`
      *,
      cards(
        *,
        media:card_media(*)
      )
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  const { data: progress } = await supabase
    .from('user_progress')
    .select('*')
    .in('card_id', deck.cards.map(c => c.id))

  // Pass data naar Client Component
  return (
    <FlashcardSession
      deck={deck}
      cards={deck.cards}
      initialProgress={progress}
    />
  )
}
```

```typescript
// app/decks/[id]/study/flashcard-session.tsx (Client Component)
'use client'

import { useState } from 'react'
import { updateProgress } from './actions'

export function FlashcardSession({ deck, cards, initialProgress }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  async function handleAnswer(rating: 'again' | 'hard' | 'good') {
    // Optimistic update
    // ...

    // Server action aanroepen
    await updateProgress(cards[currentIndex].id, rating)

    // Volgende kaart
    setCurrentIndex(i => i + 1)
    setIsFlipped(false)
  }

  return (
    <div>
      <Flashcard
        card={cards[currentIndex]}
        isFlipped={isFlipped}
        onFlip={() => setIsFlipped(true)}
      />
      {isFlipped && (
        <AnswerButtons onAnswer={handleAnswer} />
      )}
    </div>
  )
}
```

### Pattern 3: Server Actions voor Mutations

```typescript
// app/decks/[id]/study/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProgress(
  cardId: string,
  rating: 'again' | 'hard' | 'good'
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Bereken next review date op basis van rating
  const nextReview = calculateNextReview(rating)

  const { error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: user.id,
      card_id: cardId,
      last_review: new Date().toISOString(),
      next_review: nextReview,
      times_seen: supabase.sql`times_seen + 1`,
      times_correct: rating === 'good'
        ? supabase.sql`times_correct + 1`
        : supabase.sql`times_correct`,
    })

  if (error) throw error

  revalidatePath('/dashboard')
}
```

---

## API Routes

### Wanneer API Routes gebruiken?

| Scenario | Server Action | API Route |
|----------|---------------|-----------|
| Form submission | ✅ | ❌ |
| Mutation vanuit Client Component | ✅ | ❌ |
| Webhook endpoint | ❌ | ✅ |
| Externe API integratie | ❌ | ✅ |
| File upload progress | ❌ | ✅ (met streaming) |

### Voorbeeld: Media Upload met Progress

```typescript
// app/api/upload/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  const deckId = formData.get('deckId') as string
  const cardId = formData.get('cardId') as string

  // Validate file type
  if (!file.type.startsWith('image/') && !file.type.startsWith('audio/')) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  // Upload to Supabase Storage
  const mediaId = crypto.randomUUID()
  const ext = file.name.split('.').pop()
  const path = `${user.id}/${deckId}/${cardId}/${mediaId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(path, file)

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('media')
    .getPublicUrl(path)

  // Create card_media record
  const { data: media, error: dbError } = await supabase
    .from('card_media')
    .insert({
      card_id: cardId,
      type: file.type.startsWith('image/') ? 'image' : 'audio',
      url: publicUrl,
      position: 'front',
    })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ media })
}
```

---

## Client State Management

### Principe: Minimale Client State

- **Server is source of truth** - client state alleen voor UI
- **Geen global state library nodig** voor MVP
- **React useState/useReducer** voor lokale component state
- **URL state** voor filters, pagination (via searchParams)

### Flashcard Session State

```typescript
// Lokale state voor flashcard sessie
interface SessionState {
  currentIndex: number
  isFlipped: boolean
  sessionCards: Card[]  // Gefilterde/gesorteerde cards voor deze sessie
  answers: Map<string, Answer>  // Optimistic updates
}

function useFlashcardSession(cards: Card[], progress: Progress[]) {
  const [state, dispatch] = useReducer(sessionReducer, {
    currentIndex: 0,
    isFlipped: false,
    sessionCards: sortByNextReview(cards, progress),
    answers: new Map(),
  })

  // ...
}
```

### URL State voor Filters

```typescript
// app/discover/page.tsx
export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: { tags?: string; sort?: string; q?: string }
}) {
  const tags = searchParams.tags?.split(',') ?? []
  const sort = searchParams.sort ?? 'popular'
  const query = searchParams.q ?? ''

  const supabase = createClient()

  let queryBuilder = supabase
    .from('decks')
    .select(`*, tags:deck_tags(tag:tags(*))`)
    .eq('is_public', true)
    .is('deleted_at', null)

  if (tags.length > 0) {
    // Filter op tags
    queryBuilder = queryBuilder.contains('deck_tags.tag_id', tags)
  }

  if (query) {
    queryBuilder = queryBuilder.ilike('title', `%${query}%`)
  }

  // Sortering
  if (sort === 'popular') {
    queryBuilder = queryBuilder.order('card_count', { ascending: false })
  } else {
    queryBuilder = queryBuilder.order('created_at', { ascending: false })
  }

  const { data: decks } = await queryBuilder

  return <DiscoverGrid decks={decks} />
}
```

---

## Caching Strategie

### Next.js Caching

```typescript
// Statische data (tags) - cache indefinitely
export const revalidate = false  // of: export const dynamic = 'force-static'

// Dynamische data (user decks) - no cache
export const dynamic = 'force-dynamic'

// Time-based revalidation (publieke decks)
export const revalidate = 60  // 1 minuut
```

### Supabase Query Caching

```typescript
// lib/queries/decks.ts
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export const getPublicDecks = unstable_cache(
  async (tagSlugs?: string[]) => {
    const supabase = createClient()

    let query = supabase
      .from('decks')
      .select(`*, tags:deck_tags(tag:tags(*))`)
      .eq('is_public', true)
      .is('deleted_at', null)

    // ...filters

    return query
  },
  ['public-decks'],
  { revalidate: 60, tags: ['decks'] }
)
```

### Cache Invalidation

```typescript
// Na mutatie
import { revalidatePath, revalidateTag } from 'next/cache'

export async function createDeck(formData: FormData) {
  // ... create deck

  revalidatePath('/dashboard')
  revalidateTag('decks')
}
```

---

## Error Handling

### Server-side Errors

```typescript
// app/decks/[id]/page.tsx
import { notFound } from 'next/navigation'

export default async function DeckPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: deck, error } = await supabase
    .from('decks')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !deck) {
    notFound()
  }

  return <DeckDetail deck={deck} />
}
```

### Server Action Errors

```typescript
// actions.ts
'use server'

import { z } from 'zod'

const createDeckSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

export async function createDeck(formData: FormData) {
  const parsed = createDeckSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: { message: 'Not authenticated' } }
  }

  const { data, error } = await supabase
    .from('decks')
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
    })
    .select()
    .single()

  if (error) {
    return { error: { message: error.message } }
  }

  revalidatePath('/dashboard')
  return { data }
}
```

### Client-side Error Display

```typescript
// components/create-deck-form.tsx
'use client'

import { useFormState } from 'react-dom'
import { createDeck } from './actions'

export function CreateDeckForm() {
  const [state, formAction] = useFormState(createDeck, null)

  return (
    <form action={formAction}>
      <input name="title" required />
      {state?.error?.title && (
        <p className="text-red-500">{state.error.title}</p>
      )}

      <textarea name="description" />

      <button type="submit">Aanmaken</button>

      {state?.error?.message && (
        <p className="text-red-500">{state.error.message}</p>
      )}
    </form>
  )
}
```

---

## BirdID-geïnspireerde Flows

### Quiz Sessie Flow (Toekomst)

Anders dan flashcards waar de client de state beheert, zou een quiz modus server-side scoring hebben:

```
Client                          Server
  │                               │
  │  POST /api/quiz/start         │
  │  {deckId, questionCount}      │
  │ ─────────────────────────────►│
  │                               │  Generate questions
  │  {sessionId, questions[]}     │  (zonder antwoorden)
  │ ◄─────────────────────────────│
  │                               │
  │  POST /api/quiz/answer        │
  │  {sessionId, questionId,      │
  │   answerId}                   │
  │ ─────────────────────────────►│
  │                               │  Validate answer
  │  {correct, correctAnswer,     │  Update progress
  │   explanation}                │
  │ ◄─────────────────────────────│
  │                               │
```

### Species Book Data Flow (Toekomst)

```typescript
// app/species/[scientificName]/page.tsx
export default async function SpeciesPage({
  params
}: {
  params: { scientificName: string }
}) {
  const supabase = createClient()

  const { data: species } = await supabase
    .from('species')
    .select(`
      *,
      media:card_media(*)
    `)
    .eq('scientific_name', decodeURIComponent(params.scientificName))
    .single()

  if (!species) notFound()

  // Bepaal taal op basis van user preference of browser
  const locale = getUserLocale()
  const commonName = species.common_names[locale] ?? species.common_names['en']
  const description = species.descriptions[locale] ?? species.descriptions['en']

  return (
    <SpeciesDetail
      species={species}
      commonName={commonName}
      description={description}
      media={species.media}
    />
  )
}
```

---

## MVP Beslissingen

| Onderwerp | Beslissing | Toelichting |
|-----------|------------|-------------|
| **Real-time sync** | Niet voor MVP | Geen multi-device sync nodig |
| **Offline support** | Niet voor MVP | Vereist internetverbinding |
| **Session state** | Progress verloren | Bij browser sluiten start sessie opnieuw |
| **Media loading** | Prefetch +2 | Laad huidige + volgende 2 kaarten |
| **SRS logica** | Server-side | Via Server Action, ~100ms latency acceptabel |
| **Tags UI** | Presets + nieuw | Gebruiker kan kiezen uit bestaande tags of nieuwe maken |

### Media Prefetch Strategie

```typescript
// Bij laden van studiesessie
function useMediaPrefetch(cards: Card[], currentIndex: number) {
  useEffect(() => {
    // Prefetch volgende 2 kaarten
    const toPreload = cards.slice(currentIndex + 1, currentIndex + 3)

    toPreload.forEach(card => {
      card.media.forEach(m => {
        if (m.type === 'image') {
          const img = new Image()
          img.src = m.url
        }
        if (m.type === 'audio') {
          const audio = new Audio()
          audio.preload = 'metadata'
          audio.src = m.url
        }
      })
    })
  }, [currentIndex])
}
```

### SRS Server Action

De spaced repetition logica draait volledig server-side voor eenvoud:

```typescript
// app/decks/[id]/study/actions.ts
'use server'

export async function recordAnswer(
  cardId: string,
  rating: 'again' | 'hard' | 'good'
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // SRS berekening op server
  const intervals = { again: 0, hard: 1, good: 3 } // dagen
  const nextReview = addDays(new Date(), intervals[rating])

  await supabase.from('user_progress').upsert({
    user_id: user.id,
    card_id: cardId,
    last_review: new Date().toISOString(),
    next_review: nextReview.toISOString(),
    times_seen: sql`times_seen + 1`,
    times_correct: rating === 'good' ? sql`times_correct + 1` : sql`times_correct`,
  })
}
```

---

## Open Vragen

- [x] ~~**Real-time updates**: Nodig voor multi-device sync?~~ Niet voor MVP
- [x] ~~**Offline support**: Service Worker voor PWA?~~ Niet voor MVP
- [ ] **Pagination**: Cursor-based of offset voor deck lists?
- [ ] **Search**: Supabase full-text search of externe service (Algolia)?
- [ ] **Analytics**: Client-side events naar Supabase of externe service?

---

## Changelog

| Datum | Wijziging |
|-------|-----------|
| 2025-01-05 | MVP beslissingen toegevoegd: geen real-time/offline, prefetch +2, server-side SRS |
| 2025-01-05 | Initieel document aangemaakt |
