# Test Scenario: Nieuwe Gebruiker Journey

> Handmatig test script voor het testen van de complete gebruikerservaring.

**Testdatum:** ___________
**Tester:** ___________
**Testaccount:** vasco@wijngaardhetbuitenland.nl

---

## Voorbereiding

- [ ] Open een incognito/private browser window
- [ ] Ga naar de productie URL of localhost:3000
- [ ] Zorg dat je NIET ingelogd bent

---

## Fase 1: Gastgebruiker Ervaring (Uitgelogd)

### 1.1 Landing Page
- [ ] Landing page laadt correct
- [ ] Hero sectie is zichtbaar met CTA
- [ ] Navigatie toont "Inloggen" en "Aanmelden" knoppen
- [ ] Footer is zichtbaar

**Notities:**
```
_________________________________________________
```

### 1.2 Discover Pagina
- [ ] Klik op "Ontdekken" of navigeer naar `/discover`
- [ ] Publieke decks worden getoond
- [ ] Deck cards tonen: titel, beschrijving, kaarten aantal, auteur
- [ ] Tags zijn zichtbaar en klikbaar
- [ ] Zoekfunctie werkt (zoek op "vogels" of andere term)

**Notities:**
```
_________________________________________________
```

### 1.3 Publiek Deck Bekijken
- [ ] Klik op een publiek deck
- [ ] Deck detail pagina laadt (`/decks/[id]`)
- [ ] Titel en beschrijving zijn zichtbaar
- [ ] Kaarten preview is zichtbaar
- [ ] "Leren" knop is zichtbaar (maar vraagt om login)
- [ ] "Quiz" knop is zichtbaar (maar vraagt om login)

**Notities:**
```
_________________________________________________
```

### 1.4 Flashcard Study Proberen (Uitgelogd)
- [ ] Klik op "Leren" knop
- [ ] Wordt doorgestuurd naar login OF krijgt melding om in te loggen
- [ ] Terug navigeren werkt

**Notities:**
```
_________________________________________________
```

### 1.5 Quiz Proberen (Uitgelogd)
- [ ] Klik op "Quiz" knop
- [ ] Wordt doorgestuurd naar login OF krijgt melding om in te loggen

**Notities:**
```
_________________________________________________
```

---

## Fase 2: Account Aanmaken

### 2.1 Signup Flow
- [ ] Klik op "Aanmelden" in navigatie
- [ ] Signup pagina laadt (`/signup`)
- [ ] Formulier bevat: email, wachtwoord, gebruikersnaam
- [ ] Vul in:
  - Email: `vasco@wijngaardhetbuitenland.nl`
  - Wachtwoord: [kies sterk wachtwoord]
  - Gebruikersnaam: `testuser` (of beschikbare naam)
- [ ] Klik "Account aanmaken"
- [ ] Bevestigingsmelding verschijnt (email verificatie nodig)

**Notities:**
```
_________________________________________________
```

### 2.2 Email Verificatie (HANDMATIG)
- [ ] Check inbox voor verificatie email
- [ ] Klik verificatie link
- [ ] Account is geactiveerd

**Notities:**
```
_________________________________________________
```

---

## Fase 3: Ingelogde Gebruiker Ervaring

### 3.1 Login
- [ ] Ga naar `/login`
- [ ] Vul credentials in
- [ ] Klik "Inloggen"
- [ ] Wordt doorgestuurd naar dashboard

**Notities:**
```
_________________________________________________
```

### 3.2 Dashboard
- [ ] Dashboard laadt correct (`/dashboard`)
- [ ] Welkomstbericht is zichtbaar
- [ ] "Mijn Leersets" sectie is zichtbaar (leeg voor nieuwe user)
- [ ] "Recent bekeken" sectie is zichtbaar
- [ ] Navigatie toont nu: Dashboard, Mijn Leersets, Ontdekken, Instellingen

**Notities:**
```
_________________________________________________
```

### 3.3 Settings Pagina
- [ ] Ga naar `/settings`
- [ ] Account info is correct (email, gebruikersnaam)
- [ ] **Opslag sectie** is zichtbaar met progress bar
- [ ] Toont "0 B gebruikt van 50.0 MB"
- [ ] Profielfoto upload optie is zichtbaar
- [ ] Wachtwoord wijzigen optie is zichtbaar

**Notities:**
```
_________________________________________________
```

---

## Fase 4: Deck Aanmaken

### 4.1 Nieuwe Leerset
- [ ] Klik op "Nieuwe leerset" of ga naar `/decks/new`
- [ ] Formulier laadt met: titel, beschrijving, publiek/privé toggle
- [ ] Vul in:
  - Titel: "Test Deck - Vogels"
  - Beschrijving: "Een test deck voor vogels herkenning"
  - Publiek: Nee (privé)
- [ ] Klik "Aanmaken"
- [ ] Wordt doorgestuurd naar deck edit pagina

**Notities:**
```
_________________________________________________
```

### 4.2 Kaart Toevoegen (Handmatig)
- [ ] Klik "Kaart toevoegen"
- [ ] Vul voorkant in: "Welke vogel is dit?"
- [ ] Vul achterkant in: "Koolmees"
- [ ] Kaart wordt opgeslagen
- [ ] Kaart verschijnt in kaarten lijst

**Notities:**
```
_________________________________________________
```

### 4.3 Kaart met GBIF Media
- [ ] Klik "Kaart toevoegen"
- [ ] Zoek een soort via GBIF zoekbalk (bijv. "Parus major")
- [ ] Selecteer de soort
- [ ] Klik op "Zoek foto's" (GBIF media picker)
- [ ] Selecteer een foto
- [ ] Foto wordt toegevoegd aan kaart
- [ ] Check in Settings of storage is toegenomen

**Notities:**
```
_________________________________________________
```

### 4.4 Eigen Foto Upload
- [ ] Voeg nieuwe kaart toe
- [ ] Klik op foto upload knop
- [ ] Selecteer een foto van je computer
- [ ] Foto wordt geüpload
- [ ] Check in Settings of storage is toegenomen

**Notities:**
```
_________________________________________________
```

---

## Fase 5: Leren & Quiz

### 5.1 Flashcard Study Mode
- [ ] Ga naar je deck
- [ ] Klik "Leren"
- [ ] Flashcard sessie start
- [ ] Kaart toont voorkant
- [ ] Klik om achterkant te zien
- [ ] Rating knoppen werken (Opnieuw, Moeilijk, Goed, Makkelijk)
- [ ] Sessie kan worden beëindigd

**Notities:**
```
_________________________________________________
```

### 5.2 Quiz Mode (Eigen Media)
- [ ] Ga naar je deck (met minimaal 4 kaarten met media)
- [ ] Klik "Quiz"
- [ ] Selecteer "Eigen media"
- [ ] Quiz laadt met multiple choice vragen
- [ ] Antwoord klikken werkt
- [ ] Feedback (correct/incorrect) wordt getoond
- [ ] Score wordt bijgehouden
- [ ] Eindscore wordt getoond

**Notities:**
```
_________________________________________________
```

### 5.3 Quiz Mode (GBIF Foto's)
- [ ] Ga naar een deck met GBIF-gekoppelde soorten
- [ ] Klik "Quiz"
- [ ] Selecteer "GBIF Foto's"
- [ ] Quiz laadt (kan even duren)
- [ ] Foto's worden getoond van GBIF
- [ ] Distractors zijn logisch (zelfde familie/orde)

**Notities:**
```
_________________________________________________
```

### 5.4 Quiz Mode (Xeno-canto Audio)
- [ ] Ga naar een deck met vogels
- [ ] Klik "Quiz"
- [ ] Selecteer "Vogelgeluiden"
- [ ] Audio player werkt
- [ ] Geluid speelt af
- [ ] Antwoorden werken correct

**Notities:**
```
_________________________________________________
```

---

## Fase 6: Edge Cases & Fouten

### 6.1 Storage Limiet (Optioneel)
- [ ] Upload meerdere grote foto's
- [ ] Check of storage indicator update in settings
- [ ] (Als je de limiet wilt testen: zet storage_used_bytes hoog in database)

### 6.2 Foutafhandeling
- [ ] Probeer een niet-bestaande URL (bijv. `/decks/niet-bestaand`)
- [ ] Error pagina wordt getoond (niet een crash)
- [ ] Terug navigeren werkt

**Notities:**
```
_________________________________________________
```

---

## Eindresultaat

| Onderdeel | Status | Opmerkingen |
|-----------|--------|-------------|
| Landing Page | ⬜ Pass / ⬜ Fail | |
| Discover | ⬜ Pass / ⬜ Fail | |
| Deck Detail (uitgelogd) | ⬜ Pass / ⬜ Fail | |
| Signup | ⬜ Pass / ⬜ Fail | |
| Login | ⬜ Pass / ⬜ Fail | |
| Dashboard | ⬜ Pass / ⬜ Fail | |
| Settings | ⬜ Pass / ⬜ Fail | |
| Deck Aanmaken | ⬜ Pass / ⬜ Fail | |
| Kaart Toevoegen | ⬜ Pass / ⬜ Fail | |
| GBIF Media | ⬜ Pass / ⬜ Fail | |
| Eigen Upload | ⬜ Pass / ⬜ Fail | |
| Flashcard Study | ⬜ Pass / ⬜ Fail | |
| Quiz (Eigen) | ⬜ Pass / ⬜ Fail | |
| Quiz (GBIF) | ⬜ Pass / ⬜ Fail | |
| Quiz (Audio) | ⬜ Pass / ⬜ Fail | |
| Error Handling | ⬜ Pass / ⬜ Fail | |

**Algemene Opmerkingen:**
```
_________________________________________________
_________________________________________________
_________________________________________________
```

---

## Na de Test

- [ ] Verwijder test account (optioneel)
- [ ] Reset storage_used_bytes als je die had aangepast
- [ ] Noteer alle gevonden bugs in issues

**Gevonden Bugs:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________
