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

Blog:
- `/blog/` — lista wpisów
- `/blog/ile-kosztuje-wycinka-drzewa/`
- `/blog/pozwolenie-na-wycinke-drzew/`
- `/blog/jakie-drewno-na-opal/`
- `/blog/kiedy-przycinac-drzewa-zywoploty/`

Każda strona: meta + OG, schema (Service/Article + Breadcrumb + FAQ), linkowanie wewnętrzne, spójna nawigacja/stopka/FAB. Wpisane w `sitemap.xml`.

## Uruchomienie na nowym komputerze

Minimum, by tylko zobaczyć stronę: **Git** + **Node.js**.

1. Zainstaluj [Git](https://git-scm.com/downloads) i [Node.js](https://nodejs.org) (wersja LTS).
2. Склonuj repo (prywatne — wymaga dostępu do konta / zalogowanego `gh` lub Git):

```bash
git clone https://github.com/barmed555-spec/green-forest.git
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

## Formularz kontaktowy (Web3Forms) — AKTYWACJA

Formularz wysyła zgłoszenia na **green.forest33@op.pl** przez darmowy serwis
[Web3Forms](https://web3forms.com) (działa na statycznym hostingu Cloudflare, bez backendu;
adres e-mail nie jest widoczny w kodzie). **Zanim zacznie wysyłać automatycznie, trzeba wstawić klucz dostępu:**

1. Wejdź na https://web3forms.com → w polu „Email" wpisz **green.forest33@op.pl** → „Create Access Key".
2. Na skrzynkę green.forest33@op.pl przyjdzie **Access Key** (ciąg znaków) — potwierdź/aktywuj wg maila.
3. Podmień w kodzie placeholder `WEB3FORMS_ACCESS_KEY_TUTAJ` na ten klucz — w **dwóch** miejscach:
   `public/index.html` oraz `public/kontakt/index.html` (pole `name="access_key"`).
4. Commit + push → Cloudflare wdroży. Wyślij testowe zgłoszenie i sprawdź skrzynkę.

Dopóki klucz nie jest wstawiony, formularz **działa awaryjnie** — otwiera program pocztowy
użytkownika z gotową treścią (mailto). Po wstawieniu klucza wysyła w tle (AJAX), bez przeładowania strony.
Darmowy plan Web3Forms: 250 zgłoszeń/mies. (z zapasem). Ochrona: honeypot + pole `botcheck`.

## Dane wprowadzone (z Confluence / FB / Fixly)

- [x] Usługi (9 pozycji) + treść sekcji i ton marki
- [x] Kontakt: tel. 694 757 680, e-mail green.forest33@op.pl
- [x] Obszar działania (Puławy + miejscowości, dojazd do 150 km)
- [x] Schema LocalBusiness + SEO meta/keywords
- [x] Link do Facebooka w stopce
- [x] Logo klienta w nagłówku + og-image + favicon
- [x] Realizacje — 4 rolki osadzone z Facebooka
- [x] Opinie — 6 prawdziwych opinii z profilu Fixly (średnia 4,5/5), z linkiem do źródła
- [x] Formularz podpięty pod Web3Forms (wymaga wstawienia klucza — patrz wyżej)

## Do uzupełnienia (materiały od Kuby)

- [ ] Klucz Web3Forms w formularzu (patrz sekcja „Formularz kontaktowy" wyżej)
- [ ] NIP / dane rejestrowe do stopki (placeholder `000-000-00-00`)
- [ ] Godziny pracy (w schema wpisane orientacyjnie Mo-Sa 07:00-19:00)
- [ ] Google Business Profile (pod SEO lokalne)
- [ ] Domena docelowa (aktualizacja `canonical`, `sitemap.xml`, `robots.txt`, schema `url`)
