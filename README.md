# HTML slides

Een Logius-jasje voor B6-slides, het slidescript van W3C.

## Nieuw slidedeck maken

1. Kopieer het mapje `_example` en geef het de naam van het slidedeck.
2. Gebruik de slides uit het voorbeeld die je nodig hebt

## Over de bestanden

Deze bestanden komen 1:1 van B6-slides:

- `shared/b6plus.js`: JavaScript voor de slidesoftware

Deze bestanden hebben we voor onze use case aangepast:

- `shared/slides.css`: grotendeels overgenomen; aangepast voor kleuren, borders + fonts voor Logius-stijl
- `_example/index.html`: op eerste slide de `<div class="cover__box">` toegevoegd zodat we een achtergrondkleur kunnen toevoegen

Deze bestanden zijn Logius-specifiek: 

- `shared/fonts`: Rijkshuisstijl fonts (let op: kunnen niet extern worden gedeeld)
- `shared/svg`: BZK logo's met zwarte en witte tekst