# KIJK-275: TanStack Start mit wiederverwendbarem App-Kern

Stand: 24. Oktober 2026. Ursprüngliche Planungsgrundlage: lokaler Commit `9033457`; Umsetzung auf Basis von `ee23636` im Branch `feature/kijk-275`.
Status: Start-Migration, BFF und statischer Wiederverwendungsnachweis implementiert und lokal geprüft. Deployment und Remote-CI werden separat verifiziert. Die folgenden Bestandsbefunde beschreiben den Zustand vor der Migration.

Der Wiederverwendungsnachweis verwendet das bestehende Verbrauchsformular mit einem austauschbaren In-Memory-Transport. Der statische Build blockiert Clerk- und Start-Server-Imports. Ein manueller Browserdurchlauf hat das Erfassen und Anzeigen eines Verbrauchs ohne Start-Server geprüft. Eine Tauri-Paketierung, persistente Offline-Daten und Synchronisation sind weiterhin nicht implementiert. Die aktuelle Betriebsanleitung steht in [apps/client/README.md](../apps/client/README.md).

## 1. Ziel und Umfang

Die bestehende Anwendung in `apps/client` wird auf TanStack Start migriert. Sie bleibt die einzige Web-App im Monorepo: öffentlicher Webauftritt und angemeldete Anwendung werden gemeinsam entwickelt und ausgeliefert.

- Öffentliche Seiten erhalten SSR beziehungsweise statisches Prerendering.
- Der angemeldete Routenzweig bleibt clientseitig gerendert.
- Start übernimmt die Web-Einstiegspunkte, die Authentifizierungsintegration und ein BFF zur bestehenden .NET-API.
- Der private React-App-Kern bleibt unabhängig von Start-Serverfunktionen und kann später in einer lokal gebündelten Tauri-App verwendet werden.
- Die .NET-API bleibt verantwortlich für Geschäftsregeln, Datenhaltung, Jobs und Space-Berechtigungen.

Das Ticket umfasst die Start-Migration, den Web-BFF und einen begrenzten Nachweis der Wiederverwendbarkeit. Eine fertige Tauri-App, eine Sync-Engine, eine lokale Fachdatenbank und vollständige Offlinefunktionen sind Folgevorhaben. Die Migration darf keine dieser Fähigkeiten als bereits vorhanden darstellen.

Bestehende URLs, Suchparameter, Onboarding, Spaces und Funktionen bleiben erhalten. Kein Wechsel von Clerk und kein vollständiges Neuschreiben der Feature-Komponenten als Teil der Migration.

## 2. Befunde aus dem aktuellen Code

- `apps/client/src/main.tsx` startet API-Client, Sentry, Tracing und Analytics im Browser und ruft `ReactDOM.createRoot` auf. Start benötigt getrennte Client- und Server-Lebenszyklen.
- `apps/client/src/app.tsx` legt Auth-, Query-, Theme- und UI-Provider um den gesamten Router. `app/root/providers/auth-provider.tsx` zeigt vor dem Laden von Clerk ausschließlich den Init-Loader. Öffentliche Seiten müssen davon unabhängig rendern können.
- `apps/client/src/router.tsx` und `shared/lib/query-client.ts` exportieren jeweils eine globale Instanz. Auf dem Server müssen Router, QueryClient und benutzerbezogener Kontext pro Anfrage entstehen.
- `packages/api/src/client.ts` hält einen global konfigurierten `openapi-fetch`-Client und ergänzt Bearer-Tokens. `shared/lib/api-client.ts` bindet ihn an `globalThis.Clerk`. Dieser browserbezogene Standard darf nicht als gemeinsame Serverinstanz benutzt werden.
- Die öffentliche `/`-Route prüft die Clerk-Sitzung und ermittelt den Start-Space. `shared/lib/spaces.ts` berücksichtigt dafür Browser-Storage. Diese Weiterleitung muss von der anonymen Seitenauslieferung und vom Prerendering getrennt werden.
- `routes/_authenticated/route.tsx` verwendet den Clerk-Browserclient. Die nachfolgenden Layouts laden Benutzer und Feature-Schalter und merken den zuletzt geöffneten Space lokal.
- `app/root/account-menu.tsx` greift direkt auf Clerk zum Abmelden zu. Solche Authentifizierungsaktionen gehören an eine austauschbare Plattformgrenze.
- `packages/api` enthält bereits getrennte Verträge, Requests, Query Keys und Mutation-/Query-Options. Die Feature-Komponenten sind bereits von den Route-Dateien getrennt. Beides ist eine gute Grundlage für Wiederverwendung.
- CSV-Uploads verwenden `FormData`; CSV-Downloads liefern Blobs und Dateinamen. Ein BFF muss diese Fälle unverändert unterstützen und darf nicht ausschließlich JSON weiterreichen.
- `vite.config.ts` verwendet Vite+, Router-Codegenerierung, React Compiler, Tailwind und zwei Sourcemap-Uploader. Start betrifft Plugin-Reihenfolge, Build-Ausgaben und Client-/Server-Artefakte.
- `index.html` enthält Theme-Bootstrap, Manifest, Icons und einen Vollbild-Loader. Diese Inhalte müssen bewusst in die Start-Dokumenthülle beziehungsweise den privaten Ladezustand überführt werden.
- Playwright startet aktuell den Vite-Devserver und fängt API-Aufrufe über einen Browser-Service-Worker ab. Damit werden spätere serverseitige BFF-Aufrufe nicht geprüft.
- Der Release-Workflow deployt bereits getrennte Railway-Services für API und Client. Die effektive Railway-Build-/Start-Konfiguration ist damit noch nicht nachgewiesen und muss vor dem Rollout live geprüft werden.

## 3. Zielarchitektur innerhalb derselben Web-App

### Rendering und Routing

Der Root bleibt SSR-fähig und enthält die Dokumenthülle sowie SSR-verträgliche Provider. Den privaten Bereich unter `/_authenticated` konfigurieren wir mit `ssr: false`. Damit werden seine Komponenten, Loader und `beforeLoad` beim ersten Aufruf im Browser ausgeführt.

Nicht den Root pauschal mit `ssr: false` versehen: Ein deaktivierter Elternzweig kann von öffentlichen Kindrouten nicht wieder zu SSR erweitert werden. Die öffentlichen Seiten und der private Bereich müssen Geschwister im Renderbaum bleiben.

- `/`: öffentliche HTML-Landingpage. Die bisherige Weiterleitung angemeldeter Benutzer bleibt als clientseitige Ergänzung erhalten, einschließlich der Auswahl des zuletzt verwendeten Space. Keine benutzerbezogenen Loader beim Prerendern.
- `/privacy`, `/terms`, `/imprint`: öffentliche, prerenderbare HTML-Seiten.
- `/auth`, `/sso-callback`: zunächst clientseitig, um die bestehenden benutzerdefinierten Clerk-Abläufe zu erhalten.
- `/_authenticated`: bestehende private Routen einschließlich Onboarding, Einstellungen und `/$spaceId`; clientseitiges Rendering.
- BFF-Endpunkte: serverseitige HTTP-Routen innerhalb derselben Start-App; keine React-Seiten und keine implizite Absicherung durch ein Layout.

Selective SSR ist die Konfiguration der gemeinsamen Web-App. Ein späterer statischer Desktop-Build ist ein eigenes Build-Ziel aus demselben App-Code. Ein globaler SPA-Schalter allein ersetzt diese Aufteilung nicht.

### Wiederverwendbarer Kern

Zunächst bleiben die Features in `apps/client/src/app/<feature>` und die Route-Dateien in `src/routes`. Die vorhandenen Grenzen gelten weiter: keine direkten Feature-zu-Feature-Imports und keine Imports von `shared` nach `app`.

Zum später nutzbaren React-Kern gehören:

- Feature-Komponenten, Formulare und ihre lokalen Schemas.
- Clientseitige Darstellungslogik, Filter, Tabellen, Charts und reine Hilfsfunktionen.
- TanStack-Router-Navigation, Suchparameter und plattformunabhängige Routenlogik. Start-Dokumenthülle, Serverrouten und Build-Code gehören nicht dazu.
- Query Keys, Verträge und die vorhandenen Query-/Mutation-Options, soweit sie an einen austauschbaren Transport gebunden sind.
- Die generischen UI-Komponenten in `@kijk/ui` und passende Utilities in `@kijk/core`.

Reine Berechnungen bleiben von Browser-, Clerk-, Start- und Tauri-APIs unabhängig. Bestehende DOM-basierte React-Komponenten dürfen weiterhin DOM und Browser-APIs verwenden: Auch Tauri rendert diesen Code in einer WebView. Browserabhängig ist nicht automatisch ungeeignet für Tauri; problematisch sind feste Server- und Plattformabhängigkeiten.

Die bestehenden Pakete werden weiterverwendet. Noch kein pauschales Verschieben aller Features nach `packages/app-core`. Ein solches Paket entsteht erst mit einem echten zweiten Einstiegspunkt und einer nachgewiesenen Importgrenze. Ein späterer Desktop-Einstieg importiert gemeinsamen Code, niemals eine zweite Kopie der Features.

### Kleine Plattformgrenzen

Gemeinsame Typen und Hooks für benötigte Fähigkeiten liegen unter `src/shared/runtime`; die Web-Implementierungen unter `src/platform/web`. Root und Route-Einstiegspunkte setzen diese Implementierungen zusammen. `src/server` enthält ausschließlich Web-Servercode.

Die Grenzen werden nur dort eingeführt, wo aktuelle Kopplungen bestehen:

- Authentifizierungsstatus, Anmelden und Abmelden statt direkter Clerk-Abhängigkeit in fachlichen Features. Clerk-spezifische Login-Formulare bleiben im Web-Adapter.
- Konfigurierbarer HTTP-Transport für `@kijk/api`, getrennt von der Fachoberfläche.
- Laden/Speichern von Einstellungen wie Theme und letztem Space. Das ist keine lokale Fachdatenbank.
- Datei speichern/öffnen und externe Links dort, wo sich Browser und Desktop tatsächlich unterscheiden.
- Telemetrie-Initialisierung und öffentliche Laufzeitkonfiguration im jeweiligen Einstiegspunkt.

Kein universeller Plattform-Service, keine vorweggenommene Repository-Schicht für alle Entitäten und keine Neuimplementierung der API-Geschäftslogik in TypeScript. Die spätere Sync-Auswahl kann weitere Grenzen erfordern; der HTTP-Adapter wird nicht als fertige Sync-Abstraktion bezeichnet.

## 4. Web-BFF und ehrliches Sicherheitsziel

### Verbindlicher Umfang der Migration

Private Browser-Datenzugriffe gehen über Same-Origin-Endpunkte der Start-App an die .NET-API. Das vorhandene API-Schema und die Query-/Mutation-Options bleiben die Grundlage. Bevorzugt wird ein begrenztes HTTP-Relay unter dem bisherigen `/api`-Präfix, damit JSON, Multipart und Downloads denselben Transport verwenden können. Neue Server Functions werden nur für konkrete Web-Orchestrierung eingeführt.

Das Relay ist kein offener Proxy:

- Fester serverseitig konfigurierter API-Origin und explizit freigegebene Pfad-/Methodengruppen; keine vom Browser gelieferte Ziel-URL.
- Authentifizierung für jede private Anfrage. Benutzeridentität und API-Token werden aus der verifizierten Serversitzung gewonnen.
- Browser-`Authorization`, Cookies und behauptete Benutzer-/Rollenheader nicht unkontrolliert an die API weiterreichen. Nur benötigte Header übernehmen; den API-Authentifizierungsheader selbst setzen.
- CSRF-/Origin-Prüfung für schreibende Relay-Routen. Die Standardabsicherung von Server Functions deckt eigene Serverrouten nicht automatisch ab.
- Korrekte Weitergabe von ProblemDetails, Statuscodes, Downloads, Content-Type, Dateinamen, Abbruchsignalen und Upload-Grenzen. Upstream-Weiterleitungen dürfen keine Tokens an fremde Origins senden.
- Keine privaten Daten oder Tokens in gemeinsamen Caches, HTML-Payloads, Logs oder Fehlermeldungen. Private Antworten mit passender `no-store`-Policy.
- Space- und Ressourcenberechtigungen bleiben in .NET. Feature-Schalter werden weiterhin durch die API entschieden und durchgesetzt.

Die interne Erreichbarkeit der .NET-API wird zunächst in einer Vorschauumgebung geprüft. Öffentliche Ausnahmen wie Webhooks und bestehende Deployment-/Betriebszugriffe werden inventarisiert. Erst nach erfolgreichem BFF-Nachweis wird der öffentliche Zugang der Fach-API entfernt. Eine spätere Desktop-App erhält einen ausdrücklich vorgesehenen öffentlichen Zugang, keine hart codierte Railway-interne Adresse.

### Clerk ist ein Entscheidungspunkt, kein automatischer HttpOnly-BFF

Die offizielle Clerk-Integration unterstützt Start mit Server-Middleware. Clerk dokumentiert aber auch, dass das browserseitige `__session`-Cookie nicht `HttpOnly` ist. Das Einführen von Start und das Weglassen eines Bearer-Headers im eigenen React-Code beweisen deshalb keine ausschließlich serverseitige Tokenhaltung.

Vor dem BFF-Umbau werden zwei Ziele getrennt festgehalten:

1. Same-Origin-BFF, serverseitige Prüfung und interne Fach-API: Bestandteil dieses Plans.
2. Ausschließlich serverseitige API-Tokens und eine gegen JavaScript abgeschirmte Anwendungssitzung: zusätzlicher Sicherheitsanspruch, dessen unterstützter Login-, Refresh-, Logout- und Widerrufsablauf zuerst mit Clerk nachgewiesen werden muss.

Für Ziel 2 darf weder ein zweites Cookie über eine weiterhin browserseitig tokenausgebende Integration gelegt und als Lösung bezeichnet werden noch darf das BFF mit einem privilegierten globalen API-Schlüssel Benutzerberechtigungen umgehen. Falls Clerk das gewünschte Modell in der gewählten Integration nicht unterstützt, wird ein separates Authentifizierungsvorhaben konkretisiert. Ein Anbieterwechsel oder eine eigene Authentifizierungsimplementierung ist keine stillschweigende Nebenänderung der Start-Migration.

## 5. Umsetzung in sechs Phasen

### Phase 1: Kompatibilität und Authentifizierungsmodell nachweisen

Betroffen: `vite.config.ts`, Workspace-Katalog/Lockfile, Runtime-/Build-Konfiguration und ein begrenzter Start-Prototyp innerhalb des bestehenden Clients.

- Passende Versionen von Start, Router und Clerk-Start-SDK gemeinsam festlegen. Vite+ zunächst beibehalten.
- Start mit React Compiler, Tailwind, Route-Codegenerierung und Sourcemap-Plugins prüfen; den bisherigen separaten Router-Plugin-Aufruf durch die Start-Integration ersetzen, statt beide Generatoren parallel laufen zu lassen.
- Einen Produktionsbuild mit öffentlicher HTML-Seite und clientseitigem privaten Zweig starten. Den nach offizieller Hosting-Dokumentation passenden Node-Adapter festlegen; Ausgabepfad und Startkommando aus diesem Build bestätigen.
- Einen echten Clerk-Login samt Refresh, Abmelden und einem serverseitig authentifizierten Aufruf gegen die API erproben. Issuer, Audience/Authorized Parties und das gewünschte Tokenmodell dokumentieren.
- Ermitteln, welche Railway-Konfiguration und Umgebungsvariablen aktuell außerhalb des Repositories liegen.

Abnahme: Produktionsserver startet reproduzierbar; die Rendering-Aufteilung funktioniert; Clerk-/BFF-Sicherheitsziel und verbleibende Grenzen sind eindeutig. Ein Vite+-Problem führt zu einer dokumentierten Kompatibilitätsentscheidung, nicht zu einer ungeplanten Toolchain-Migration.

### Phase 2: Client-/Serverzustand und Plattformgrenzen vorbereiten

Betroffen: `src/router.tsx`, `shared/lib/query-client.ts`, `packages/api/src/client.ts`, Auth-/Root-Provider, Laufzeitkonfiguration und die betroffenen Aufrufer.

- Router als Factory entsprechend Starts Einstiegspunkt; QueryClient pro Routerinstanz und damit auf dem Server pro Anfrage erzeugen. Im Browser über die Lebenszeit der Anwendung stabil halten.
- API-Client-Factory mit konfigurierbarem Fetch-/Auth-Verhalten ergänzen. Die bisherige Einmal-Konfiguration darf vorübergehend browserseitig bestehen bleiben; Servercode erhält ausschließlich anfragegebundene Instanzen und verwendet keinen globalen Token-Getter.
- Öffentliche Client-Konfiguration und geheime Server-Konfiguration trennen. Interner API-Origin und Server-Schlüssel dürfen weder `VITE_`-Variablen noch Client-Exports werden.
- Gemeinsamen Route-Kontext von `LoadedClerk` entkoppeln. Fachliche Komponenten erhalten nur die benötigten Sitzungsinformationen und Aktionen; der Clerk-Provider bleibt eine Web-Implementierung.
- Logout und Benutzerwechsel löschen den Query-Zustand und unterbrechen laufende Requests. Letzter Space bleibt benutzerbezogen; vorhandene Theme-/Consent-Einstellungen werden nicht unnötig zurückgesetzt.
- Browserseitige Init-Effekte aus Modulimporten herauslösen. Consent wird auf dem Server nicht aus Browser-Storage gelesen.

Abnahme: Zwei parallele authentifizierte Serveranfragen teilen weder Token noch Query-Daten. Bestehende API-/Feature-Tests bleiben gültig; die neue Client-Factory und die Auth-Lebenszyklen werden gezielt geprüft.

### Phase 3: Bestehende Web-App auf Start umstellen

Betroffen: `main.tsx`, `app.tsx`, `routes/__root.tsx`, Start-/Client-Einstieg, `index.html`, private und öffentliche Routen sowie Test-Renderhilfen.

- Start-Dokumenthülle mit Head-Inhalten, Styles und Skripten einführen. Manifest-/Icon-URLs müssen auch bei tiefen Seitenaufrufen stimmen.
- Den privaten Routenzweig mit `ssr: false` versehen. Route-Tree weiterhin generieren lassen; bestehende Tests bleiben von der Routenerkennung ausgeschlossen.
- Provider so zusammensetzen, dass öffentliche HTML-Inhalte nicht auf Clerk, private Daten oder den bisherigen Vollbild-Bootstrap warten.
- Landingpage und Rechtstexte prerendern; Titel, Beschreibung, Canonical-/Social-Metadaten sowie echte 404-Antworten berücksichtigen. Keine privaten Routen crawlen oder prerendern.
- Die bisherige anmeldeabhängige Start-Weiterleitung als clientseitige Ergänzung erhalten. `from`-Weiterleitungen auf zulässige interne Ziele begrenzen.
- Theme-Bootstrap und Ladezustände an die neue Hülle anpassen: kein Hydration-Fehler, kein dauerhaft über öffentlichem HTML liegender Loader.
- Test-Helfer auf Router-/QueryClient-Factories umstellen. Bestehende Feature-Struktur und URL-Suche unverändert erhalten.

Abnahme: Öffentliche Seiten enthalten ohne JavaScript ihren Hauptinhalt; private Seiten funktionieren nach Hydration einschließlich direkter Links, Onboarding, Standard-/letztem Space und Einstellungen. Inhalte und Interaktionen bleiben bei schmalen Viewports erreichbar.

### Phase 4: API-Verkehr über das Web-BFF führen

Betroffen: `src/server`, Start-Serverrouten/Middleware, `shared/lib/api-client.ts`, `@kijk/api`-Transport und Server-Integrationstests.

- Authentifizierten, begrenzten API-Transport aus Abschnitt 4 implementieren. Der Browser verwendet Same-Origin-Requests und keinen eigenen Bearer-Token-Getter für Fach-API-Aufrufe mehr.
- Die interne API-Adresse nur serverseitig konfigurieren. Die API erhält weiterhin eine verifizierbare Benutzeridentität; ein vom Client mitgeschickter Benutzer-/Space-Bezeichner ist kein Berechtigungsnachweis.
- Vorhandene Request-/Query-Module und zentrale Query Keys erhalten. Nicht für jeden bestehenden CRUD-Aufruf zusätzlich eine Server Function schreiben.
- Ressourcen/Verbrauchswerte, Finanzen, Import-Upload/-Status/-Abbruch, CSV-Export, Feedback und Benutzer-/Space-Verwaltung über denselben abgesicherten Weg prüfen.
- Clerk-Middleware und CSRF-Middleware bewusst zusammensetzen. Bei eigener `src/start.ts` die benötigte Server-Function-CSRF-Middleware explizit einbinden; Relay-Serverrouten gesondert schützen.
- Erst nach erfolgreichen Tests die Fach-API in der Vorschau intern stellen und danach den Produktionsrollout vorbereiten.

Abnahme: Browser-Netzwerkverkehr erreicht nur den vorgesehenen Web-Datenzugang. Nicht angemeldete, fremde Space-, private Konto- und Cross-Origin-Schreibzugriffe werden abgewiesen. Upload und Export bleiben funktional. Eine Behauptung über serverexklusive Tokens ist nur mit dem Nachweis aus Phase 1 zulässig.

### Phase 5: Wiederverwendbaren Tauri-Kern anhand eines Features belegen

Betroffen: gemeinsame Feature-Imports, `shared/runtime`, `platform/web`, Import-Grenzen und eine kleine statische Build-Prüfung.

- Einen vorhandenen privaten Ablauf als Beispiel wählen: Ressource öffnen, Verbrauchswert erfassen und Liste aktualisieren.
- Dieselben Feature-Komponenten mit TanStack Router in einem statischen Einstieg laden, ohne Start-Server, Clerk-Server-SDK oder Node-Builtins im Client-Abhängigkeitsbaum.
- Dafür innerhalb des vorhandenen Clients eine Build-Fixture beziehungsweise einen kleinen zusätzlichen Prüf-Einstieg verwenden; keine zweite produktive Web-App und keine Feature-Kopie anlegen.
- Authentifizierung und Datenzugriff in dieser Prüfung über begrenzte Testadapter bereitstellen. Ein In-Memory-Adapter ist nur ein Nachweis der Entkopplung, keine lokale Persistenz und keine fertige Offlinefunktion.
- Die tatsächlich benötigten Grenzen für Session, Transport, Einstellungen und Dateiausgabe festhalten. Noch nicht benötigte Abstraktionen weglassen.
- Start-Serverimporte im gemeinsamen App-Kern per Lint-/Import-Regeln verbieten. Bestehende Feature-Grenzen weiter durchsetzen.

Abnahme: Dasselbe Feature kompiliert und funktioniert im statischen Prüf-Einstieg ohne laufenden Start-Server. Dokumentiert ist, was später für Desktop-Login, Deep Links, Persistenz, Sync und native Funktionen hinzukommen muss. Dies ist noch kein Nachweis auf macOS/Windows-WebViews.

### Phase 6: Produktionsbetrieb, Telemetrie und Rollout absichern

Betroffen: Client-Skripte, Railway-Client-Service, bestehende CI-Bausteine, E2E-Konfiguration und Telemetrie-Einstiege.

- Einen echten Node-Produktionsprozess mit Port-/Host-Bindung, Healthcheck und bestätigten Asset-/Server-Ausgabepfaden konfigurieren; keinen Vite-Previewserver als Produktionsserver verwenden.
- Bestehende Release-Metadaten, Infisical-Einbindung und den getrennten API-/Client-Deploy erhalten. Erforderliche CI-Checks in die vorhandenen wiederverwendbaren Workflows integrieren; keine parallele eigene CI-Struktur aufbauen.
- Einen Testlauf gegen den gebauten Start-Server ergänzen. Browser-MSW-Tests für UI-Verhalten erhalten, aber durch serverseitige Test-Upstreams und einen echten Clerk/.NET-Integrationslauf ergänzen. Ein erfolgreicher Browser-Mock beweist keine funktionierende BFF-Authentifizierung.
- Sentry und PostHog für die neue Serverlaufzeit gleichwertig konfigurieren; bestehende Scrubber und Consent-Grenzen beibehalten. Cookies, Tokens, Finanzinhalte und Request-Bodies nicht in neue Serverlogs übernehmen.
- Browser-Tracing, initiale Seitenspans und Source Maps für beide Tools prüfen. Client- und Server-Artefakte korrekt zuordnen; Uploader dürfen benötigte Maps nicht vorzeitig löschen.
- Vorschauumgebung mit echter API prüfen, dann Produktionsrollout. Alte statische Auslieferung und dazu passende Konfiguration als Rückfalloption bereithalten. Keine destruktiven Datenbankänderungen für diese Migration voraussetzen.

Abnahme: Öffentlicher Aufruf, Login, privater Deep Link, Upload, Export und Logout funktionieren über den tatsächlichen Hostingpfad. Healthcheck und Start/Neustart bestehen. Remote-CI einschließlich Sonar und E2E ist für den konkreten Commit geprüft; lokale Tests allein sind kein Release-Nachweis.

## 6. Übergreifende Abnahmekriterien für KIJK-275

- Genau eine produktive Web-App in `apps/client`, mit gemeinsamem öffentlichen und privaten Routing.
- Öffentliche Hauptinhalte im ausgelieferten HTML und ohne Abhängigkeit von geladenem Clerk-JavaScript.
- Private Features bleiben clientseitig; bestehende URLs, Space-Auswahl, Berechtigungen und Feature-Schalter funktionieren.
- Anfragegebundener Serverzustand; Isolation mit zwei Benutzern und parallelen Requests nachgewiesen.
- Abgesicherter Same-Origin-Web-Datenzugang; bekannte Clerk-Token-Grenzen ausdrücklich festgehalten.
- Persönliche, gemeinsame und darin private Finanzdaten bleiben auch über den BFF getrennt.
- Multipart-Upload, Fehlerantworten und Downloads einschließlich Dateinamen funktionieren.
- Gemeinsames Pilot-Feature im statischen Build ohne Start-Serverabhängigkeit nachgewiesen.
- Vorhandene Format-, Lint-, Type-/Build-, Unit-, Browser- und E2E-Prüfungen erfolgreich; React Doctor für geänderten React-Code ausgeführt und Ergebnis berichtet.
- Zusätzliche BFF-/SSR-Tests prüfen echte Servergrenzen, nicht nur Komponenten-Mocks.
- API-Änderungen erhalten die .NET-Prüfungen und erfordern gegebenenfalls `pnpm api:generate`.
- Keine niedrigeren Coverage-Grenzen oder pauschalen Sonar-Ausschlüsse zur Erfüllung der Migration.
- Vorschau-/Produktionsprüfung und gegebenenfalls noch ausstehende Remote-Schritte mit tatsächlichem Status dokumentiert.

## 7. Anschlussvorhaben nach der Migration

### Gemeinsame lokale Datenhaltung und Sync

Zuerst einen fachlichen Ablauf mit dauerhaftem lokalem Speicher, einer Upload-Warteschlange und Wiederaufnahme nach Neustart umsetzen. Als Pilot eignen sich Verbrauchswerte. Auswahl einer Engine anhand PostgreSQL-/Backend-Kompatibilität, Tauri-/Web-Unterstützung, Lizenz/Betrieb, Datenumfang und berechtigungsabhängiger Teilmengen treffen; Swift-Unterstützung berücksichtigen, falls ein nativer Client ein ernsthaftes Ziel wird.

Vor einer Ausweitung auf Finanzen sind Duplikaterkennung, Konflikte, Löschungen, entzogene Rechte, benutzerbezogene lokale Datentrennung und Export/Backup festzulegen. Serverberechnungen und CSV-Verarbeitung werden durch Sync nicht automatisch offline verfügbar. Rein lokale Nutzung ohne Konto ist ein eigenes Produktziel.

TanStack Query kann für Onlinefunktionen bestehen bleiben. Ein persistierter Query-Cache allein ist keine Sync-Engine. Die spätere lokale Datenschicht kann Query-Funktionen und lokale Auswertungen verändern; diese Arbeit wird nicht durch die Start-Migration als erledigt betrachtet.

### Tauri-Auslieferung

Die gemeinsame Oberfläche statisch bauen und lokal bündeln. Separater Desktop-Bootstrap für Anmeldung, Deep Links, sichere native Tokenablage, Dateizugriff, Updates und Betriebssystemintegration. Öffentliche Start-Seiten und der BFF bleiben auf dem Server. Es entsteht keine zweite Web-App.

Der statische Prüf-Einstieg aus Phase 5 wird dann durch einen echten Desktop-Verbraucher ersetzt. Erst bei diesem Schritt gemeinsame Features bei Bedarf in ein Workspace-Paket verschieben. Desktop-, Sync- und Offlinefähigkeit werden auf den Zielbetriebssystemen getestet; der Browsernachweis ersetzt diese Prüfung nicht.

## 8. Reihenfolge und Arbeitspakete

Phasen 1 bis 6 sind die Reihenfolge für KIJK-275. Phase 5 wird vor dem finalen Rollout abgeschlossen, damit die Wiederverwendung bereits bei der Migration überprüft und nicht nur behauptet wird.

Sinnvolle getrennte, aufeinander aufbauende Änderungen sind: Kompatibilitäts-/Auth-Nachweis; Factories und Plattformgrenzen; Start und Rendering; BFF; statischer Wiederverwendungsnachweis; Hosting und vollständige Abnahme. Vorbereitende Änderungen können unabhängig geprüft werden; der vollständige Wechsel wird erst nach der Gesamtprüfung ausgeliefert. Sync und Tauri folgen als eigene Tickets.

## 9. Quellen und verbleibende Prüfungen

Repository-Befunde wurden am genannten Commit gelesen. Kompatibilität und Aufwand sind daraus abgeleitet; es wurde noch kein Start-/Clerk-/Tauri-Prototyp ausgeführt und keine Railway-Konfiguration geändert. Die Linear-Feldnotizen konnten wegen `Tool get_agent_context not found` nicht geladen werden.

- [TanStack Start: Aufbau und Router-Factory](https://tanstack.com/start/latest/docs/framework/react/build-from-scratch)
- [Selective SSR: Ausführung und Vererbung](https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr)
- [SPA Mode und weiterhin vorhandene Serverabhängigkeiten](https://tanstack.com/start/latest/docs/framework/react/guide/spa-mode)
- [Start Server Functions und CSRF](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)
- [Start Import Protection](https://tanstack.com/start/latest/docs/framework/react/guide/import-protection)
- [Start Hosting und Node-Betrieb](https://tanstack.com/start/latest/docs/framework/react/guide/hosting)
- [Clerk-Start-Integration](https://clerk.com/docs/tanstack-react-start/getting-started/quickstart)
- [Clerk: Cookie-/Tokenmodell einschließlich nicht-HttpOnly-Sitzungstoken](https://clerk.com/docs/guides/how-clerk-works/overview)
- [Tauri: statisch gebündelte Frontends](https://v2.tauri.app/start/frontend/)
