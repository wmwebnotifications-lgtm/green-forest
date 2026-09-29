# Green Forest — strona wizytówka

Strona wizytówkowa dla firmy **Green Forest** (Kuba Szczerba) — arborystyka, wycinka drzew, zagospodarowanie terenów zielonych i sprzedaż drewna na opał. Puławy i okolice, dojazd do 150 km.

Projekt WM Web Solutions — autorski kod, WebGL/scroll-driven, deploy na Cloudflare Workers.

## Zakres

- Pakiet podstawowy (wizytówka) + utrzymanie
- Pozycjonowanie / SEO lokalne (Puławy, arborysta, wycinka drzew, drewno opałowe)

## Stack

- Statyczny front (HTML / CSS / vanilla JS)
- WebGL / Three.js dla hero (opcjonalnie, ładowane leniwie)
- Hosting: Cloudflare Workers (static assets, `wrangler`)

## Struktura

```
green-forest/
├── public/            # to, co serwuje Worker (static assets)
│   ├── index.html
│   ├── styles.css
│   ├── main.js
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── img/           # zdjęcia, logo, OG image
│   └── assets/        # rolki / wideo z pracy Kuby
├── wrangler.jsonc
├── package.json
└── README.md
```

## Strony (zbudowane wg SEO-plan-tresci.md)

Usługi:
- `/` — wizytówka (strona główna)
- `/wycinka-drzew/` — wycinka drzew Puławy
- `/drewno-opalowe/` — drewno opałowe Puławy
- `/pielegnacja-zieleni/` — pielęgnacja zieleni i ogrodów
- `/tereny-zielone/` — karczowanie i zagospodarowanie terenów
- `/drewno-tartaczne/` — skup/sprzedaż drewna tartacznego + zrębkowanie
- `/wycinka-drzew-lublin/` — geo-landing (Lublin)
- `/obszar-dzialania/` — obszar usług, warunki dojazdu i dowozu drewna

Blog:
- `/blog/` — lista wpisów
- `/blog/ile-kosztuje-wycinka-drzewa/`
- `/blog/pozwolenie-na-wycinke-drzew/`
- `/blog/jakie-drewno-na-opal/`
- `/blog/kiedy-przycinac-drzewa-zywoploty/`

Każda strona: meta + OG, schema (Service/Article + Breadcrumb + FAQ), linkowanie wewnętrzne, spójna nawigacja/stopka/FAB. Wpisane w `sitemap.xml`.

Podstrony usług są dostępne z kart na stronie głównej i sekcji „Usługi” w stopce.
Docelowa domena w canonical, Open Graph, danych strukturalnych, robots.txt i mapie witryny: `https://greenforest-pulawy.pl`.
`npm run check:seo` sprawdza unikalne tytuły, H1, adresy canonical i OG, poprawność JSON-LD, lokalne linki i zasoby oraz mapę witryny.
Strony wycinki, opału i karczowania zawierają informacje potrzebne do zamówienia lub wyceny; ceny pozostają w jednym cenniku.

## SEO i pomiar

Plan fraz, reguły indeksowania, stan integracji z Google i procedura comiesięcznej analizy: [docs/seo-plan.md](docs/seo-plan.md).
Wyniki audytu wdrożenia: [docs/seo-audit-2026-09-16.md](docs/seo-audit-2026-09-16.md).

`npm run check:seo` wykonuje 17 kontroli technicznych i redakcyjnych, a `npm test` sprawdza przekierowania, zgodę na GA4, odnośniki telefonu oraz wysyłkę formularza z atrapą odpowiedzi API. Testy nie wysyłają wiadomości do firmy. Kontrole uruchamiają się też w GitHub Actions.
GA4 `G-6GWRFWXP2H` działa po zgodzie tylko na domenie produkcyjnej. Przed zgodą Google tag nie jest ładowany. Cofnięcie zgody jest dostępne w stopce. Formularz emituje zdarzenie `generate_lead` po potwierdzonym wysłaniu; kliknięcia telefonu, e-maila i WhatsAppa emitują `contact_click`.

Cloudflare uruchamia `src/worker.mjs` przed zasobami, żeby obsłużyć HTTPS i stałe przekierowania adresów. Lokalny `node server.js` służy do podglądu wyglądu; routing produkcyjny sprawdzaj przez `npm run dev`.

## Uruchomienie na nowym komputerze

Minimum, by tylko zobaczyć stronę: **Git** + **Node.js**.

1. Zainstaluj [Git](https://git-scm.com/downloads) i [Node.js](https://nodejs.org) (wersja LTS).
2. Склonuj repo (prywatne — wymaga dostępu do konta / zalogowanego `gh` lub Git):

```bash
git clone https://github.com/wmwebnotifications-lgtm/green-forest.git
cd green-forest
```

3. Odpal podgląd — patrz sekcja niżej. Do samego podglądu **nie trzeba** `npm install`
   (`server.js` nie ma zależności). `npm install` jest potrzebne dopiero dla drogi z wranglerem/deployem.

| Cel | Co potrzebne |
|---|---|
| Склonować repo | Git + dostęp do repo |
| Tylko zobaczyć stronę | Node.js → `node server.js` |
| Środowisko Cloudflare / deploy | Node.js + npm → `npm install`, potem `npm run dev` / `npm run deploy` (+ `wrangler login`) |

## Podgląd lokalny (najprościej — bez instalacji)

Kliknij dwukrotnie **`start-preview.cmd`** (albo w terminalu `node server.js`).
Serwer wystartuje na **http://localhost:8080** i sam otworzy przeglądarkę.
Obsługuje „ładne" adresy (`/wycinka-drzew/`, `/blog/...`). Wymaga tylko Node.js.
Zatrzymanie: `Ctrl+C` lub zamknij okno.

## Uruchomienie przez wrangler (jak na produkcji)

```bash
npm install
npm run dev      # wrangler dev -> podgląd zgodny z Cloudflare Workers
```

## Deploy

```bash
npm run deploy   # wrangler deploy
```

## Formularz kontaktowy (Web3Forms)

Formularze na stronie głównej i `/kontakt/` mają skonfigurowany publiczny klucz Web3Forms i wysyłają zapytania przez AJAX. Po potwierdzonej odpowiedzi sukcesu pokazują komunikat oraz emitują `generate_lead`, jeśli użytkownik zgodził się na statystyki. Kliknięcie numeru telefonu jest osobnym zdarzeniem `contact_click`, nie potwierdzoną rozmową.

W czasie wysyłania blokowane są kolejne zgłoszenia tego samego formularza. Błąd API lub sieci zachowuje wpisane dane i wyświetla alternatywny telefon oraz e-mail. Sam obecny klucz nie potwierdza doręczania poczty; audyt nie wysyła próbnych wiadomości do firmy.

Przy zmianie konfiguracji zaktualizuj oba formularze i uruchom `npm test`. Nie dodawaj prywatnych eksportów klientów ani danych kont do repozytorium.

## Dane wprowadzone (z Confluence / FB / Fixly)

- [x] Usługi (9 pozycji) + treść sekcji i ton marki
- [x] Kontakt: tel. 694 757 680, e-mail green.forest33@op.pl
- [x] Obszar działania (Puławy + miejscowości, dojazd do 150 km)
- [x] Schema LocalBusiness + SEO meta/keywords
- [x] Link do Facebooka w stopce
- [x] Logo klienta w nagłówku + og-image + favicon
- [x] Realizacje — 4 rolki osadzone z Facebooka
- [x] Opinie — 6 prawdziwych opinii z profilu Fixly (średnia 4,5/5), z linkiem do źródła
- [x] Formularz podpięty pod Web3Forms (obsługa przetestowana z atrapą API)

## Do uzupełnienia (materiały od Kuby)

- [x] Klucz Web3Forms obecny w obu formularzach (stan kodu 29.09.2026)
- [ ] NIP / dane rejestrowe do stopki (placeholder `000-000-00-00`)
- [ ] Potwierdzić godziny pracy u właściciela przed ponownym dodaniem ich do strony i schema
- [ ] Google Business Profile (pod SEO lokalne)
- [x] Domena docelowa: greenforest-pulawy.pl (`canonical`, `sitemap.xml`, `robots.txt`, schema `url`)
