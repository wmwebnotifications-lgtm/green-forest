# Green Forest — wdrożenie SEO i dalszy pomiar

Data audytu: 16 września 2026. Domena kanoniczna: https://greenforest-pulawy.pl (bez www).

## Dobór treści i fraz

Strona lokalnej firmy usługowej ze sprzedażą drewna, nie sklep z zamówieniem online. Dane strukturalne opisują jedną firmę LocalBusiness, usługi Service, poradniki Article oraz BreadcrumbList. Dane firmy mają wspólny identyfikator `https://greenforest-pulawy.pl/#business`. Nie dopisujemy adresu ulicznego, ocen Google ani niepotwierdzonych godzin. Godziny wcześniej oznaczone w README jako orientacyjne zostały usunięte z kontaktu i schema.

Poniższe grupy wynikają z oferty firmy oraz przeglądu wyników wyszukiwania dla drewna opałowego i wycinki w Puławach. To mapa intencji do dalszej weryfikacji w Search Console, a nie dane o wolumenie, konkurencyjności lub gwarantowanej pozycji. Nie mamy potwierdzonych danych GSC.

| Intencja klienta / frazy | Docelowa strona | Rola treści |
|---|---|---|
| Green Forest Puławy, usługi ogrodnicze Puławy | `/` | Firma, przegląd oferty, dowody realizacji, kontakt |
| drewno opałowe Puławy, drewno kominkowe Puławy, drewno z dowozem | `/drewno-opalowe/` | Gatunki, dostępność, warunki zamówienia, zdjęcia, link do ceny |
| cena drewna opałowego Puławy, cennik wycinki | `/cennik/` | Jedno miejsce z cenami i jednostkami |
| wycinka drzew Puławy, arborysta Puławy, wycinka alpinistyczna | `/wycinka-drzew/` | Metoda, zakres, przygotowanie do wyceny |
| pielęgnacja ogrodów Puławy, przycinanie tui i żywopłotów | `/pielegnacja-zieleni/` | Prace jednorazowe i stałe, co wpływa na cenę |
| karczowanie działek Puławy, koszenie nieużytków | `/tereny-zielone/` | Porządkowanie terenu i wycena |
| skup drewna tartacznego Puławy, zrębkowanie gałęzi | `/drewno-tartaczne/` | Parametry surowca i zamówienie usługi rębakiem |
| wycinka drzew Lublin | `/wycinka-drzew-lublin/` | Istniejąca oferta dojazdu z Puław; odblokowane linkowanie |
| dojazd Green Forest, obszar usług, dostawa drewna | `/obszar-dzialania/` | Rzeczywisty zasięg, przykładowe miejscowości i warunki |
| jakie drewno na opał, koszt wycinki, terminy przycinania, formalności | Istniejące artykuły `/blog/` | Odpowiedzi na pytania i przejście do odpowiedniej usługi |

Nie tworzymy katalogu tagów ani osobnych stron będących kopiami z podmienioną nazwą miasta. Nowa strona zasięgu wykorzystuje miejscowości już wskazane w ofercie firmy. Nie rozszerza bezpłatnego dowozu: **Transport gratis do 15 km od Puław**; dalszy transport jest wyceniany. Zasięg usług do 150 km i warunki przewozu drewna to różne informacje.

## Techniczne zasady utrzymania

- Każda indeksowalna strona ma własny tytuł, opis, H1, canonical i og:url. Cele redakcyjne 60 znaków dla tytułu i 70–160 dla opisu nie są limitami Google ani gwarancją wyglądu wyniku.
- Wszystkie treści i linki są dostępne w HTML. Bez JavaScriptu sekcje oferty pozostają widoczne; JavaScript dodaje animacje, mapę i galerie.
- Sitemap zawiera wszystkie 15 indeksowalnych adresów. 404 i polityka prywatności są noindex i pozostają poza mapą. Nie wpisujemy sztucznych dat lastmod; changefreq i priority usunięto jako zbędne.
- Nie zmieniono istniejących adresów podstron. Worker przekierowuje HTTP na HTTPS i utrwala przekierowania wariantów adresów do 301, zachowując parametry. Nieistniejący adres nadal daje 404.
- Nazwa z www nie rozwiązywała się w DNS w audycie przed wdrożeniem. Kod obsłuży przekierowanie www po podpięciu tej nazwy do Workera w Cloudflare i wystawieniu certyfikatu. Sam commit nie tworzy rekordu DNS.
- Hreflang pomijamy, ponieważ strona ma tylko wersję polską.
- FAQ w JSON-LD odpowiada widocznym pytaniom i odpowiedziom. Nie obiecujemy rozszerzonych wyników FAQ — Google ogranicza ich dostępność.
- Tło lasu i pliki zdjęć drewna zostały zachowane. Obrazy mają wymiary; zdjęcia i filmy poniżej pierwszego ekranu są ładowane leniwie.

## Pomiar GA4

Identyfikator przekazany przez właściciela: `G-6GWRFWXP2H`.

- Basic consent mode: Google tag nie ładuje się przed zgodą i po odmowie. Ustawienia w stopce pozwalają wycofać zgodę. Wybór jest zapamiętywany przez 180 dni, a zmiany synchronizowane między kartami przez zdarzenie storage.
- Wyłączone sygnały Google i personalizacja reklam. Parametry zapytania usuwane z przekazywanego adresu strony i referrera. Formularz nie przesyła swoich pól w dodanych zdarzeniach GA4.
- `page_view`: wejście na stronę po zgodzie.
- `contact_click` z `contact_method` równym `phone`, `email` lub `whatsapp`: kliknięcie kontaktu, nie potwierdzona rozmowa ani sprzedaż.
- `generate_lead` z `contact_method=form`: dopiero potwierdzone powodzenie Web3Forms, nie samo kliknięcie przycisku.
- Podgląd localhost i domeny testowe nie wysyłają pomiarów do produkcyjnej usługi.
- Właściciel może odrzucić statystyki we własnej przeglądarce. Dodatkowo obsługiwany jest znacznik lokalny `greenforest-internal-traffic=1`. Docelowo w GA4 należy zdefiniować ruch wewnętrzny i przetestować filtr przed jego aktywacją.

Do wykonania w panelu GA4 po uzyskaniu dostępu: sprawdzić zgodność strumienia z domeną, odbiór zdarzeń, ustawienia pomiaru zaawansowanego, okres przechowywania danych i filtry ruchu wewnętrznego. Oznaczyć `generate_lead` jako kluczowe zdarzenie; kliknięcia kontaktu analizować oddzielnie. Połączyć odpowiednią usługę Search Console. Nie podajemy liczby odwiedzin bez odczytania raportów.

W obecnej sesji konto `wmwebnotifications@gmail.com` wyświetlało ekran „Rozpocznij pomiary”, bez dostępnych raportów. Identyfikator pomiaru nie jest uprawnieniem do ich odczytu. GA4 nie odzyska wejść sprzed uruchomienia pomiaru. Dane czasu rzeczywistego i standardowe raporty mają różny czas aktualizacji.

## Search Console i Profil Firmy

1. Na koncie właściciela zweryfikować zasób domenowy `greenforest-pulawy.pl` przez DNS albo zasób prefiksu `https://greenforest-pulawy.pl/`. Istniejącego zasobu nie dublować bez potrzeby.
2. Zgłosić `https://greenforest-pulawy.pl/sitemap.xml`; sprawdzić stronę główną, ofertę drewna, wycinkę, stronę Lublina i obszar działania narzędziem inspekcji URL. Prośba o indeksowanie nie gwarantuje indeksacji.
3. Odróżniać poprawne wykluczenia 404/noindex/alternatywnych adresów od błędów blokujących ofertę. Nie usuwać noindex z polityki tylko po to, żeby liczba wykluczeń spadła do zera.
4. Zweryfikować istniejący Profil Firmy Google lub utworzyć profil, jeśli firma jeszcze go nie ma. Używać rzeczywistej nazwy Green Forest, telefonu 694 757 680 i domeny. Nie tworzyć fikcyjnych oddziałów w miastach obsługi.
5. Potwierdzić kategorię główną, prawdziwe godziny i sposób obsługi klientów. Jeśli firma nie przyjmuje klientów pod adresem, skonfigurować obszar usług zgodnie z zasadami profilu. Dodać prawdziwe zdjęcia realizacji i prosić klientów o autentyczne opinie.

## Comiesięczna analiza

To procedura do wykonywania na rzeczywistych danych; niniejsze wdrożenie nie tworzy cyklicznego zadania ani nie deklaruje samoczynnego monitorowania kont.

1. Wyeksportować GSC: ostatnie 28 dni kontra poprzednie 28, Polska, osobno mobile i desktop; zapytania, strony, kliknięcia, wyświetlenia, CTR i średnia pozycja. Przy danych sezonowych porównać także rok do roku, jeśli jest historia.
2. Rozdzielić frazy marki i usługowe. Wybrać strony o istotnej liczbie wyświetleń i pasujące do oferty. Pozycje 8–20 to jedna z heurystyk, nie automatyczny priorytet.
3. Sprawdzić trafność strony docelowej, treści, tytułu, linków oraz zapytań klientów. Poprawiać konkretny problem; nie dopisywać masowo miast lub synonimów.
4. Zapisać datę, zmienione URL-e i hipotezę. Po wdrożeniu uruchomić `npm run check:seo`, `npm test`, sprawdzić produkcyjne odpowiedzi HTTP i ważne strony na telefonie.
5. Po kolejnym okresie ocenić kliknięcia i zapytania kontaktowe z GA4. CTR interpretować razem z pozycją, urządzeniem i składem zapytań. Nie przypisywać całego wzrostu pojedynczej zmianie.

## Źródła

- [Google: tytuły wyników](https://developers.google.com/search/docs/appearance/title-link)
- [Google: zasady antyspamowe](https://developers.google.com/search/docs/essentials/spam-policies)
- [Google: dane firmy lokalnej](https://developers.google.com/search/docs/appearance/structured-data/local-business)
- [Google: wdrożenie zgody](https://developers.google.com/tag-platform/security/guides/consent)
- [Google: konfiguracja GA4](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
- [Google: wykluczenie ruchu wewnętrznego](https://support.google.com/analytics/answer/10104470?hl=pl)
- [Cloudflare: routing zasobów](https://developers.cloudflare.com/workers/static-assets/binding/)
