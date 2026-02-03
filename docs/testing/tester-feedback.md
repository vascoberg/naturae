# Tester Feedback

> Systematisch verzamelde feedback van testers.

---

## Rosanne Raaijman

**Datum:** 2 februari 2026
**Context:** Leerset aanmaken voor oude boskernen (planten en bomen) voor opleiding Bert Maes

### Bugs

| # | Issue | Status | Details |
|---|-------|--------|---------|
| 1 | Annotaties worden niet opgeslagen | ✅ Fixed | Error feedback toegevoegd + CORS handling verbeterd. Werkt nu correct. |
| 11 | Annotaties vereisen hard refresh | Open | Na annotatie opslaan worden annotaties niet direct zichtbaar in deck overview. Hard refresh (Cmd+Shift+R) nodig. Waarschijnlijk cache/revalidation issue. |

### Performance

| # | Issue | Status | Details |
|---|-------|--------|---------|
| 2 | Media picker laadt langzaam | Open | Bij GBIF foto selectie scherm - vraagt om kleinere preview formaten |
| 3 | Algemene image DPI check | Open | "Ik zou overal waar je afbeeldingen laad even heel goed checken welke dpi je daadwerkelijk nodig hebt" |

### Feature Requests

| # | Feature | Status | Prioriteit | Details |
|---|---------|--------|------------|---------|
| 4 | Typ-modus (spelling) | Backlog | Hoog | "Ik vond dat altijd de chilste optie bij Quizlet" - antwoord typen i.p.v. meerkeuze |
| 5 | Bulk import vanuit Excel | ✅ Done | Hoog | MVP: tekst plakken. Zie [bulk-text-import.md](../features/bulk-text-import.md) |
| 6 | Meer opties quiz aantal | Backlog | Medium | "veel meer kunnen aanklikken bij aantal vragen bij quiz" |
| 7 | Voor/achter omdraaien | Backlog | Medium | Leren met NL naam eerst, dan Latijn - zonder nieuwe set te maken |
| 8 | Lijsten samenvoegen/adopteren | Backlog | Laag | Bestaande lijsten overnemen en eigen draai geven |

### UX Verbeteringen

| # | Verbetering | Status | Details |
|---|-------------|--------|---------|
| 9 | Annotatie modal sluiten na opslaan | Open | "En dat als die annotatie is opgeslagen je foto verdwijnt en je door kunt gaan" |
| 10 | Annotaties bekijken op flashcard | Backlog | "als je op de afbeelding van je flashcard drukt wil je eigenlijk ook dat hij 'oppopt'" |
| 12 | Annotatie tool opties uitbreiden | Backlog | Verschillende diktes cirkels/pijlen, achtergrondkleur tekstblokjes, meer kleuren |

### Positieve Feedback

- "Het is zo vet!!!!" / "Wat siiiiiick"
- Annotatie tool: "zooooo coooool" / "die vrijheid is fantastisch"
- Xeno-canto geluiden: "Omggg zelfs sprinkhanen op geluid, fantastisch"
- "gebruiksvriendelijkheid kunnen we aan werken, maar dit is echt zo tof"
- Boekje feature: "Vind dat boekje ook echt een heel leuke feature"
- Wil app delen met collega's voor DIB bomenlijst

---

## Template voor nieuwe testers

```markdown
## [Naam Tester]

**Datum:** [datum]
**Context:** [wat ze aan het testen waren]

### Bugs
| # | Issue | Status | Details |
|---|-------|--------|---------|

### Performance
| # | Issue | Status | Details |
|---|-------|--------|---------|

### Feature Requests
| # | Feature | Status | Prioriteit | Details |
|---|---------|--------|------------|---------|

### UX Verbeteringen
| # | Verbetering | Status | Details |
|---|-------------|--------|---------|

### Positieve Feedback
-
```
