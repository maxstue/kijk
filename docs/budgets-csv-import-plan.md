# Kijk: Budgets mit KI-gestütztem CSV-Import

Stand: 4. Oktober 2026 · Status: Umsetzungsplan, noch nicht implementiert

## 1. Ziel und beschlossene Architektur

Kijk erhält monatliche Budgets pro Kategorie. Nutzer laden Bankexporte manuell hoch; daraus werden Buchungen eingelesen und durch KI kategorisiert. Es gibt keine Verbindung zu Bankkonten, keine Banking-Zugangsdaten und keinen Abruf von Umsätzen bei einer Bank.

Für den Start werden ausschließlich CSV-Dateien unterstützt. Die Architektur bleibt für PDF, Excel und andere Formate erweiterbar. Alle Formate sollen später denselben Nutzerablauf verwenden.

Der CSV-Import kombiniert KI-Formaterkennung mit allgemeiner, deterministischer CSV-Verarbeitung:

- Bei einem unbekannten Format schlägt die KI eine Spaltenzuordnung vor.
- Der Nutzer kann die Zuordnung in der Vorschau prüfen und korrigieren.
- Kijk speichert die bestätigte Zuordnung als Importprofil.
- Bei folgenden Uploads verwendet das Backend das passende Profil und prüft seine Gültigkeit.
- Die KI kategorisiert die Buchungen anschließend anhand freigegebener Buchungsinformationen.

Es werden keine bankspezifischen Parser oder manuell gepflegten Bankformate entwickelt. Das Importprofil speichert das Ergebnis einer bestätigten Formaterkennung. Es spart KI-Aufrufe zur Formaterkennung, nicht automatisch die Aufrufe zur Kategorisierung.

Der Import wird nach dem Upload vollständig asynchron verarbeitet. Unkategorisierte Buchungen sind von Beginn an Bestandteil des Produkts.

## 2. Umfang des MVP

### Enthalten

- Manuell angelegte Kontozuordnungen, beispielsweise „DKB gemeinsam“ und „ING persönlich“.
- Kategorien und monatliche Budgets pro Haushalt.
- EUR als erste unterstützte Währung.
- CSV-Upload mit einheitlicher strenger Bereinigung und Übertragungsvorschau.
- Allgemeiner CSV-Reader für unterschiedliche Encodings, Trennzeichen und mehrzeilige Zellen.
- KI-Formaterkennung, bestätigte Importprofile und manuelle Korrektur der Zuordnung.
- Dauerhafte Hintergrundaufträge mit Fortschritt, Abbruch und Wiederaufnahme nach Neustarts.
- KI-Kategorisierung gegen den vorhandenen Kategorienkatalog.
- Importvorschau mit Validierungsfehlern und Duplikatverdacht.
- Dauerhafte Liste unkategorisierter Buchungen mit Einzel- und Mehrfachzuweisung.
- Kennzeichnung interner Transfers und Erstattungen.
- Kontrollierte Rücknahme eines Imports.

### Spätere Erweiterungen

- PDF- und Excel-Import über zusätzliche Dateireader.
- Weitere Währungen und Umrechnung.
- Aufteilung einer Buchung auf mehrere Kategorien.
- Budgetüberträge, wiederkehrende Budgetpläne und Prognosen.
- Lokale Regel- oder Ähnlichkeitskategorisierung, falls der Nutzen messbar ist.
- Private Sichtbarkeitsbereiche als separates Vorhaben.
- Direkter Upload in Object Storage für größere Dateien.
- Bezahlschranke als separates Vorhaben.

Umbenennungen von `Household` oder `ConsumptionLimit` gehören nicht zu diesem Projekt. „Persönlich“ und „gemeinsam“ sind im MVP Kontozuordnungen und führen nicht automatisch neue private Zugriffsregeln ein. Die Sichtbarkeit innerhalb des Haushalts muss in der Oberfläche klar sein.

## 3. Fachliche Regeln

- Ausgaben verbrauchen das Budget der zugeordneten Kategorie.
- Einnahmen werden getrennt von Ausgaben ausgewertet.
- Bestätigte interne Transfers verbrauchen kein Ausgabenbudget.
- Eine Rückzahlung reduziert die Ausgaben der zugeordneten Kategorie im Buchungsmonat. Eine Zuordnung zu früheren Budgetmonaten ist nicht Teil des MVP.
- Vorgemerkte Umsätze erscheinen getrennt und zählen zunächst nicht zu tatsächlich verbrauchten Budgets.
- Jede Buchung hat zunächst höchstens eine Kategorie.
- Unklare Kategorien bleiben leer; das verhindert die Übernahme einer sonst gültigen Buchung nicht.
- Ungültige oder unklare Beträge, Daten und Währungen müssen vor der Übernahme korrigiert oder die betroffene Zeile ausgeschlossen werden.
- Manuelle Kategoriezuordnungen werden durch spätere KI-Versuche nicht überschrieben.
- Wiederholte Zahlungen an denselben Empfänger sind nicht zwangsläufig dieselbe Kategorie.
- Gleiche Buchungsmerkmale können bei mehreren legitimen Zahlungen auftreten. Ein Hash ist ein Hinweis auf mögliche Duplikate und kein alleiniger Grund für einen eindeutigen Datenbankindex oder automatisches Verwerfen.

## 4. Architektur in Kijk

Die bestehende Clean Architecture bleibt erhalten:

| Schicht | Verantwortung |
| --- | --- |
| Domain | Kontozuordnungen, Kategorien, Budgets, Buchungen, Importprofile und Zustandsregeln |
| Application | Upload- und Importablauf, Datenschutzprüfung, Validierung, Übernahme und Budgetauswertung |
| Infrastructure | CSV-Verarbeitung, Dateispeicher, lokale Datenschutzprüfung, Mistral und Job-Ausführung |
| API | Berechtigte Endpoints für Upload, Status, Prüfung, Bestätigung und Abbruch |
| Client | Feature-Komponenten, Vorschau, Kategorienzuweisung und Budgetübersicht |

Vorgesehene Schnittstellen:

| Schnittstelle | Zweck |
| --- | --- |
| `IImportFileStore` | Private, verschlüsselte Dateispeicherung und Löschung |
| `IImportDocumentReader` | Inhalte und Quellenreferenzen aus einem unterstützten Dateiformat bereitstellen |
| `IImportPrivacyProcessor` | Lokale Bereinigung und Prüfung vor externen KI-Aufrufen |
| `ICsvFormatDetector` | Aus bereinigten Strukturinformationen ein CSV-Mapping vorschlagen |
| `ITransactionCategorizer` | Vorhandene Kategorien für freigegebene Buchungsinformationen vorschlagen |
| `IAiUsagePolicy` | Bereinigungsstatus, Nutzerfreigabe, Feature-Schalter und Kostenlimits zentral prüfen |

Ein gemeinsamer KI-Adapter kapselt Anbieter und Modell. `Microsoft.Extensions.AI.IChatClient` kann hierfür verwendet werden, sobald der passende Adapter geprüft ist. Ein Anbieterwechsel kann zusätzlich Anpassungen an Authentifizierung, strukturierten Ausgaben und Datenschutzbedingungen erfordern; er ist nicht garantiert nur eine Konfigurationsänderung.

## 5. Datenmodell

Alle fachlichen Daten werden dem zuständigen Haushalt zugeordnet. Ein Auftrag speichert den Haushalt ausdrücklich, damit ein Worker nicht von einem aktuellen HTTP- oder Haushaltwechsel-Kontext abhängt.

| Entität | Wesentliche Felder |
| --- | --- |
| `FinancialAccount` | Haushalt, Anzeigename, Kontozuordnung, Archivierung |
| `FinancialCategory` | Haushalt, Name, Einnahmen-/Ausgabentyp, Archivierung |
| `Budget` | Haushalt, Kategorie, Monat, Betrag |
| `Transaction` | Konto, Buchungsdatum, optional Wertstellung, Betrag, Währung, freigegebener Text, optionale Kategorie, Kategorieherkunft, Status, Transferkennzeichnung, Importreferenz |
| `ImportProfile` | Haushalt, Name, Fingerprint, versioniertes Mapping, Bestätigungsstatus und Zeitpunkte |
| `ImportJob` | Ersteller, Haushalt, Konto, Bereinigungsregelversion, Informationstextversion, Status, Fortschritt, Ablaufzeit, bereinigte Fehlermeldung |
| `ImportChunk` | Auftrag, Abschnitt, Quellenbereich, Bearbeitungsstatus, Versuchszähler und Reservierung |
| `ImportCandidate` | Eingelesene Buchung, Quellenreferenz, Prüfhinweise, Duplikatverdacht, Nutzerkorrekturen und Ausschlussstatus |

Beträge werden als `decimal`, Buchungsdaten als reine Datumswerte gespeichert. Unnötige IBANs, Mandatsreferenzen und Originaldateinamen werden nicht in den fachlichen Buchungen gespeichert.

Das Datenmodell trennt kurzlebige Importartefakte von dauerhaft übernommenen Buchungen. Das Bereinigen eines Importauftrags darf keine bestätigten Buchungen löschen. Für Rücknahme und Herkunft bleibt ein minimales Importprotokoll ohne Dateiinhalte erhalten.

## 6. Importprofile

Das Mapping beschreibt beispielsweise Kopfzeilenposition, Datums- und Betragsspalten, getrennte Soll-/Haben-Spalten, Datumsformat, Dezimal- und Tausendertrennzeichen, Währung und Textspalten. Es darf nur deklarative, zugelassene Optionen enthalten; kein von der KI erzeugter ausführbarer Code.

Profile werden zunächst innerhalb eines Haushalts gespeichert. Der Nutzer bestätigt ein Profil erst nach erfolgreicher Prüfung einer Vorschau. Änderungen erzeugen eine neue Version.

Der Fingerprint der Kopfzeile ist ein Suchmerkmal, keine Garantie für identische Formate. Vor Wiederverwendung prüft Kijk das tatsächliche Parsing, Pflichtfelder und Zahlen-/Datumsformate. Mehrdeutige Daten werden nicht stillschweigend interpretiert. Bei Abweichungen wird das Profil neu geprüft oder die KI erneut aufgerufen.

Für KI-Formaterkennung werden bereinigte Überschriften und maskierte Wertmuster verwendet. Auch Überschriften und Metadaten können persönliche Angaben enthalten und müssen geprüft werden. Das Ergebnis wird nicht pauschal als vollständig anonym bezeichnet.

## 7. Datenschutz und temporäre Speicherung

### Einheitliche Bereinigung

Der Modus „Mehr Kontext“ entfällt. Jeder Import verwendet dieselbe konservative Bereinigung: Identifikatoren und erkannte persönliche Angaben werden entfernt oder ersetzt; zweifelhafte Texte werden entfernt oder vor externer Übertragung zur Prüfung markiert. Es wird nicht versucht, Angaben dem Uploadenden, dessen Partner oder einer anderen Person zuzuordnen.

Die Oberfläche benennt die Übermittlung bereinigter Inhalte an Mistral, ihren Zweck und die betroffenen Felder. Die Bestätigung des Importablaufs ist keine pauschale Einwilligung für sämtliche Personenangaben. Ein vollständiges Abschalten externer KI ist zusätzlich möglich. Dann können bekannte Profile weiterhin lokal importiert werden, unbekannte Formate benötigen eine manuelle Zuordnung, und Kategorien bleiben manuell zuweisbar.

Auch bereinigte Daten werden weiterhin als personenbezogen behandelt. Bereits das Empfangen, Speichern und Bereinigen der Originaldatei ist eine Verarbeitung. Die Entscheidung des Uploaders ersetzt keine erforderliche Rechtsgrundlage für Angaben anderer Personen. Besonders sensible Angaben benötigen ein eigenes, vor Freigabe geprüftes Verfahren; einfache Stichwortlisten allein reichen dafür nicht. Bei ungeklärter Rechtsgrundlage werden entsprechende Inhalte nicht an Mistral übertragen.

### Verwendungszweck trotz Bereinigung nutzen

Strenge Bereinigung bedeutet nicht, den gesamten Verwendungszweck zu entfernen. Allgemeine Zahlungsbegriffe und hilfreiche Händlerhinweise dürfen erhalten bleiben, sofern die Datenschutzprüfung sie zulässt. Persönliche Angaben und unnötige Referenzen werden gezielt ersetzt. Bei unklarem oder sensiblem Inhalt hat die Bereinigung Vorrang; die Kategorie bleibt dann gegebenenfalls offen.

Beispiele (erfunden):

| Ursprünglicher Inhalt | Mögliche bereinigte Fassung | Nutzen |
| --- | --- | --- |
| Erika Beispiel, Miete Oktober, IBAN … | [PERSON], Miete Oktober, [IBAN] | Hinweis auf Wohnen/Miete bleibt erhalten |
| PayPal, Händlerbezeichnung, Bestellreferenz … | PayPal, freigegebene Händlerbezeichnung, [REFERENZ] | Händler kann die Kategorie eingrenzen |
| Kreditkartenabrechnung September | Kreditkartenabrechnung September | Hinweis auf Sammelabrechnung; keine Einzelkäufe erfinden |

Bei PayPal, Amazon oder Klarna können hilfreiche Hinweise im Verwendungszweck stehen; ihre Verfügbarkeit hängt vom Export und der Zahlung ab. Ein Zahlungsdienstleister oder Marktplatz allein bestimmt keine verlässliche Kategorie. Ein Händlername verrät außerdem nicht zwangsläufig den gekauften Artikel.

Eine Sammelabrechnung enthält häufig keine Einzelkäufe. Auch zusätzlicher Kontext oder eine KI kann fehlende Einzelposten nicht rekonstruieren. Die Buchung wird zur Prüfung gekennzeichnet. Wenn später auch die Einzelumsätze importiert werden, muss die Abrechnung als Ausgleich behandelt werden, damit Ausgaben nicht doppelt zählen. Automatische Buchungssplits bleiben außerhalb des MVP.

### Lokale Pipeline

1. CSV technisch korrekt lesen, einschließlich Metadaten vor der Tabelle.
2. Alle Zellen auf IBANs, Karten-, E-Mail-, Telefon- und weitere erkennbare Identifikatoren prüfen.
3. Namen und Adressen durch lokale Entitätserkennung ergänzend suchen.
4. Nach einheitlichen strengen Regeln ersetzen oder entfernen; stabile Platzhalter innerhalb eines Imports verwenden.
5. Bereinigte Ausgabe erneut prüfen und bei Auffälligkeiten zur Nutzerprüfung pausieren.
6. In der Vorschau genau die Inhalte zeigen, die übertragen werden sollen; einzelne Buchungen ausschließbar machen.

Es gibt keine vollständige Erkennungsgarantie. Der Machbarkeitstest muss die Grenzen der lokalen Erkennung offenlegen. Ungeprüfte Originaldaten werden nicht zur Bereinigung an eine externe KI geschickt.

### Speicherung und Löschung

- Upload wird gestreamt; keine vollständige Datei im Arbeitsspeicher voraussetzen.
- Originaldatei wird für die asynchrone lokale Verarbeitung kurzzeitig verschlüsselt in einem privaten Speicher abgelegt.
- Original wird unmittelbar nach erfolgreicher Bereinigung gelöscht.
- Bereinigte Datei wird ebenfalls verschlüsselt gespeichert und nach Abschluss oder Abbruch gelöscht.
- Vorgeschlagene maximale Lebensdauer der Dateikopien: 24 Stunden; keine gesetzliche Frist.
- Abgelaufene Dateien beenden den Auftrag kontrolliert; keine weitere Verarbeitung ohne erneuten Upload.
- Cleanup erfasst auch verwaiste Uploads, Fehlerfälle und Neustarts.
- Speicher-Versionierung, Backups, Multipart-Reste, ASP.NET-Spooling und Proxy-Puffer werden ausdrücklich geprüft.
- Schlüsselverwaltung und Zugriffsrechte werden getrennt vom Dateiinhalt konfiguriert; keine selbst entwickelte Kryptografie.
- Keine CSV-Inhalte, Prompts, Antworten oder Buchungstexte in Logs, Sentry oder Telemetrie.
- Temporäre Vorschauergebnisse erhalten ebenfalls eine feste, vor Freigabe festgelegte Löschfrist. Übernommene Buchungen folgen dem fachlichen Löschkonzept.

## 8. Asynchroner Ablauf

```text
Upload und sichere Ablage
  -> HTTP 202 mit Import-ID und Status-URL
  -> Wartend
  -> Lokale Bereinigung
  -> Profilprüfung / Formaterkennung
  -> gegebenenfalls Zuordnung und Übertragungsfreigabe durch Nutzer
  -> deterministisches Einlesen
  -> KI-Kategorisierung
  -> Ergebnisprüfung
  -> Vorschau bereit
  -> Bestätigung und Übernahme
  -> temporäre Daten löschen
```

Weitere Zustände: `Prüfung erforderlich`, `Fehlgeschlagen`, `Abgebrochen`, `Abgelaufen`. Nutzerprüfung gibt die Worker-Reservierung frei; es wartet kein laufender Worker auf eine Eingabe.

Aufträge werden dauerhaft in PostgreSQL gespeichert. Die Job-Lösung wird in einem kurzen technischen Test ausgewählt: Anforderungen sind atomare Reservierung, zeitlich begrenzte Leases, Wiederaufnahme, begrenzte Wiederholungen und idempotente Ergebnisse. Eine bewährte Bibliothek wird gegenüber einer unnötigen Eigenentwicklung bevorzugt.

Ein Worker kann zunächst in der API laufen und später getrennt betrieben werden. Bei Queue-Nachrichten werden Zustandsänderung und Nachricht zuverlässig gekoppelt, beispielsweise mit einer Outbox. Ein reines `Task.Run` oder ausschließlich flüchtige Queue genügt nicht.

CSV-Verarbeitung erfolgt in begrenzten Abschnitten aus vollständigen Datensätzen. KI-Kategorisierung erhält gebündelte Buchungen innerhalb festgelegter Tokenlimits. Fehlgeschlagene Abschnitte können gezielt wiederholt werden.

Ein KI-Ausfall darf bereits korrekt eingelesene Buchungen nicht verwerfen. Diese können nach Nutzerbestätigung unkategorisiert übernommen werden; Kategorien lassen sich später nachholen.

## 9. KI-Anbindung

Startkandidat ist Mistral über den regionalen Endpunkt `api.eu.mistral.ai`. Modell und Verfügbarkeit werden gegen diesen Endpunkt geprüft; im Machbarkeitstest wird eine feste Modellversion verwendet.

- Strukturierte Antworten mit festem Schema und nachfolgender fachlicher Validierung.
- Nur erlaubte Kategorie-IDs; bei Unsicherheit keine Kategorie.
- Quellenreferenz beziehungsweise Kandidaten-ID für jede Antwort.
- Dateiinhalte sind Daten und dürfen keine Systemanweisungen überschreiben.
- Keine unnötigen Tools, Websuche oder zustandsbehafteten Anbieterfunktionen.
- Timeout, begrenzte Wiederholungen, Kostenlimit und serverseitiger Notschalter.
- Kategorie-Vorschläge dürfen freigegebenen Kontext nutzen, aber nicht ungeprüft pro Gegenpartei dauerhaft übernommen werden.
- Formaterkennung und Kategorisierung sind technisch getrennte Aufgaben innerhalb eines einzigen Importablaufs.

Vor dem produktiven Einsatz werden Auftragsverarbeitung, Training Opt-out, Aufbewahrung und beantragtes Zero Data Retention geprüft. ZDR wird erst nach bestätigter Aktivierung als aktiv behandelt. Der regionale Endpunkt umfasst laut Dokumentation EU-/EFTA-Infrastruktur; streng ausschließliche EU-Verarbeitung und Betriebsmetadaten müssen gesondert geklärt werden.

## 10. API, Frontend und Berechtigungen

Vorgesehene API-Aktionen: Upload, Status, paginierte Kandidatenliste, Mapping bestätigen, Übertragungsfreigabe, Kandidaten korrigieren/ausschließen, Import bestätigen, abbrechen und Kategorien erneut vorschlagen lassen.

Upload liefert `202 Accepted` erst, wenn Datei und Auftrag sicher gespeichert sind. Limits für Dateigröße, Zeilenzahl, gleichzeitige Aufträge und KI-Verbrauch werden nach dem Machbarkeitstest festgelegt. Statusabfrage zunächst per TanStack Query Polling.

Feature-Komponenten liegen unter `app/budgets`, `app/transactions` und `app/imports`. Routen bleiben für Seitenstruktur zuständig; Requests, Options und Query Keys liegen in `shared/api`. Feature-übergreifende Direktimporte werden vermieden. Generierter Route Tree wird nicht manuell bearbeitet.

Neue Berechtigungen werden im bestehenden Haushalt-Katalog definiert und gesät, beispielsweise `finances:view`, `finances:record`, `finances:import`, `finances:configure` und `budgets:plan`. Endpoints und Handler prüfen Permissions und Haushaltszuordnung, keine Rollennamen. Auch der Worker prüft relevante Berechtigungen vor externer Übertragung und Übernahme erneut.

## 11. Umsetzungspakete und Abnahme

### Paket 1: Machbarkeit und verbindliche Regeln

- Unterschiedliche synthetische CSVs sowie freigegebene, bereinigte Beispiele prüfen.
- DKB-Struktur ist vorhanden; repräsentative ING-CSV noch ergänzen.
- Profilmodell, allgemeines Parsing, lokale Datenschutzprüfung und Mistral testen.
- Fehler, Laufzeit, Kosten und Erkennungsgrenzen dokumentieren.
- Dateilimits, Löschfristen, Kategorieumfang und Budgetregeln festlegen.

**Abnahme:** Unterstützte CSV-Varianten und Rückfallverhalten sind dokumentiert. Keine stillen Betrags-/Datumsfehler in den freigegebenen Testfällen. Private Originaldateien gelangen nicht ins Repository.

### Paket 2: Finanzmodell und Berechtigungen

- Entitäten, EF-Konfigurationen und Migrationen ergänzen.
- Kategorien, Kontozuordnungen und monatliche Budgets verwalten.
- Budgetauswertung einschließlich Transfers, Erstattungen und unzugeordneten Ausgaben entwickeln.
- Neue Permissions und Rolle-Zuordnungen ergänzen.

**Abnahme:** Budgetberechnung ist nachvollziehbar; echte HTTP-Tests prüfen 403/200-Verhalten und Isolation zwischen Haushalten.

### Paket 3: Sicherer Upload und dauerhafte Aufträge

- Streaming-Upload, private verschlüsselte Ablage und zentrale Limits.
- Persistierter Auftrag, Worker-Reservierung, Wiederaufnahme und Abbruch.
- Löschmechanismen und vollständige Behandlung von Upload-/Speicherfehlern.

**Abnahme:** Neustarts verursachen weder verlorene Aufträge noch doppelte Ergebnisse. Verwaiste und abgelaufene Dateien werden entfernt.

### Paket 4: Datenschutz, Profile und deterministischer Import

- Einheitliche strenge Bereinigung und lokale Erkennung implementieren.
- Profilvorschlag, Validierung, Bestätigung und Versionierung.
- Parsing der gesamten Datei und paginierte Kandidatenansicht.
- Duplikatverdacht und Nutzerkorrekturen abbilden.

**Abnahme:** Bekannte Profile werden ohne erneute KI-Formaterkennung verwendet. Abweichungen werden erkannt. Unfreigegebene Inhalte erreichen keine externe API.

### Paket 5: KI-Kategorisierung und Übernahme

- Zentraler KI-Adapter und Policy-Prüfung.
- Übertragungsvorschau und Nutzerfreigabe.
- Kategorisierung in begrenzten Abschnitten, fachliche Antwortprüfung und Wiederholungen.
- Idempotente, transaktionale Übernahme nach Bestätigung.
- Rücknahme eines Imports mit Warnung bei nachträglichen Änderungen.

**Abnahme:** KI-Ausfall erlaubt manuelle Weiterarbeit. Unklare Kategorien bleiben leer. Wiederholungen und doppelte Bestätigung erzeugen keine doppelten Buchungen.

### Paket 6: Vollständiger Nutzerablauf

- Budgetübersicht, Upload, Fortschritt, wiederaufrufbare Vorschau und Abschluss.
- Dauerhafte Liste „Unkategorisiert“, Einzel- und Mehrfachzuweisung.
- Verständliche Anzeige von Bereinigung, übermittelten Daten, Fehlern, Ablauf und Kostenlimits.

**Abnahme:** Nutzer können den vollständigen Ablauf nach Seitenwechsel wieder aufnehmen. Manuelle Kategorien bleiben bei späteren KI-Versuchen erhalten.

### Paket 7: Freigabeprüfung

- Reale HTTP-/PostgreSQL-Integrationstests, Worker-Neustarts und parallele Aufträge.
- Große synthetische CSVs, Encodingvarianten, mehrzeilige Zellen und geänderte Formate.
- Identische legitime Zahlungen, wiederholte Uploads und idempotente Bestätigung.
- Datenschutzprüfung, Logging, Telemetrie, Dateilöschung und Zugriffsgrenzen.
- Separate Modellbewertung; externe KI wird in regulären automatisierten Tests ersetzt.
- Backend-/Frontendchecks gemäß Repository, einschließlich React Doctor nach Frontendänderungen; CI-Reihenfolge build -> format -> lint -> audit beachten.
- Rechtsgrundlage, Informationspflichten, Dienstleisterbedingungen, Betroffenenrechte und Notwendigkeit einer Datenschutz-Folgenabschätzung prüfen.

**Abnahme:** Prüfergebnisse und Grenzen sind dokumentiert. EU-Hosting oder Nutzerwahl werden nicht als alleiniger Nachweis von DSGVO-Konformität dargestellt.

## 12. Aufwand und nächste Entscheidung

Planungsrahmen: etwa vier bis sechs Wochen für einen Entwickler einschließlich Tests und Datenschutzintegration. Keine verbindliche Zusage; insbesondere lokale Entitätserkennung, Job-Infrastruktur und Anbieterbedingungen müssen zuerst geprüft werden.

Importprofile reduzieren KI-Aufwand und Extraktionsrisiken. Sie beseitigen nicht den Aufwand für sichere Dateiverarbeitung, Datenschutz, Nutzerprüfung und robuste Hintergrundaufträge.

Start mit Paket 1, anschließend Schätzung aktualisieren und die übrigen Pakete in überschaubare PRs zerlegen. Dieser Plan führt noch keine Umsetzung, Anbieterregistrierung oder Übertragung privater Dateien aus.

## 13. Referenzen für die Anbieter- und Datenschutzprüfung

- [Mistral Regional Inference](https://docs.mistral.ai/inference/regional-inference)
- [Mistral Zero Data Retention](https://help.mistral.ai/en/articles/347612-can-i-activate-zero-data-retention-zdr)
- [Mistral Training-Einstellungen](https://help.mistral.ai/en/articles/347617-do-you-use-my-user-data-to-train-your-artificial-intelligence-models)
- [EDPB: Rechtmäßige Verarbeitung](https://www.edpb.europa.eu/sme/be-compliant/process-personal-data-lawfully_en)
- [EDPB: Einwilligung](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en)
- [EDPB: Anonymisierung und Pseudonymisierung](https://www.edpb.europa.eu/topics/ai-and-technology/anonymisation-pseudonymisation_en)

Anbieterbedingungen und Modellverfügbarkeit werden vor Umsetzung und produktiver Freigabe erneut geprüft.


## 14. Datenschutzanforderungen vor öffentlicher Freigabe

Diese Punkte sind Freigabeanforderungen, keine bereits erreichte Konformitätszusage. Verantwortliche, Nachweise und offene Entscheidungen werden im Projekt dokumentiert.


### Einfache Checkliste: Was vor dem öffentlichen Start erledigt sein muss

Jeden Punkt erst abhaken, wenn die Entscheidung dokumentiert oder die Funktion umgesetzt und geprüft ist. Die ausführlichen Anforderungen stehen darunter.

**Rechtlich klären**

- [ ] Festhalten, wer Kijk betreibt und für die Daten verantwortlich ist.
- [ ] Fachkundig prüfen lassen, warum Kijk Bankdateien verarbeiten darf – auch Angaben der Freundin und anderer Zahlungspartner. Eine Upload-Checkbox allein genügt nicht.
- [ ] Klären, wie mit Buchungen umgegangen wird, die etwa Gesundheit, Religion oder Gewerkschaftszugehörigkeit verraten. Das gilt bereits für den Rohupload, nicht erst für Mistral.
- [ ] Verträge und Datenwege von Mistral, Hosting, Dateispeicher und tatsächlich eingesetzter Telemetrie prüfen, einschließlich Zugriffen außerhalb des EWR.
- [ ] Eine verständliche Datenschutzerklärung und einen kurzen Importhinweis veröffentlichen: Was wird verarbeitet, wofür, von wem, wie lange und welche Rechte bestehen? Auch Informationspflichten für Angaben Dritter klären.

**Technisch umsetzen und testen**

- [ ] Persönliche Angaben lokal bereinigen; vor Mistral nochmals prüfen. Zweifelhafte Inhalte zurückhalten und die tatsächlich übertragenen Texte anzeigen.
- [ ] Dateispeicher verschlüsseln und gegen fremde Zugriffe schützen. Nutzer dürfen nur Daten sehen, für die sie berechtigt sind.
- [ ] Originaldateien nach Bereinigung löschen; alle temporären Kopien spätestens nach der festgelegten Frist entfernen. Auch Fehlerfälle, Puffer, Backups und Dateiversionen prüfen.
- [ ] Keine Banktexte, Dateien, Prompts oder KI-Antworten in Logs und Sentry aufnehmen.
- [ ] Mistral-Region und Modell prüfen, Training deaktivieren und Datenaufbewahrung nachweislich festlegen. Beantragtes ZDR gilt erst nach bestätigter Aktivierung.
- [ ] Datenexport, Korrektur und Löschung anbieten; festlegen, wie Anfragen betroffener Personen sicher bearbeitet werden.

**Betrieb vorbereiten**

- [ ] Aufschreiben, welche Daten Kijk wo verarbeitet und wann löscht; Änderungen daran nachhalten.
- [ ] Prüfen und dokumentieren, ob eine Datenschutz-Folgenabschätzung oder ein Datenschutzbeauftragter erforderlich ist. Falls ja, vor Start erledigen.
- [ ] Festlegen, wer bei einem Datenleck handelt, wie es eingedämmt wird und wann Aufsicht und Betroffene informiert werden müssen.
- [ ] Offene rechtliche und technische Punkte vor Freigabe schließen oder den Funktionsumfang entsprechend begrenzen.

**Nicht als erledigt abhaken:** „Alle Daten sind anonym“, nur weil Namen und IBANs entfernt wurden. Buchungen können weiterhin personenbezogen oder sensibel sein.

### Ausführliche Anforderungen und Nachweise

- [ ] **Verantwortlichkeit und Datenfluss:** Betreiber von Kijk und dessen datenschutzrechtliche Rolle festlegen. Verarbeitung vom Eingang der Originaldatei über Bereinigung und KI bis zu Buchungen, Logs, Backups und Löschung dokumentieren. Die Haushaltsausnahme privater Nutzer befreit einen öffentlich angebotenen Dienst nicht automatisch von seinen eigenen Pflichten.
- [ ] **Rechtsgrundlagen:** Für Upload, lokale Bereinigung, dauerhafte Buchungen und externe Kategorisierung passende Grundlagen nach Artikel 6 DSGVO dokumentieren. Angaben von Mitkontoinhabern und Zahlungspartnern ausdrücklich berücksichtigen. Vertragserfüllung oder berechtigtes Interesse nicht pauschal voraussetzen; falls verwendet, Notwendigkeit beziehungsweise Interessenabwägung begründen. Einwilligungen nur dort einsetzen, wo sie geeignet und wirksam sind.
- [ ] **Sensible Inhalte:** Prüfen, ob Buchungen besondere Kategorien nach Artikel 9 offenbaren, beispielsweise Gesundheit, Religion oder Gewerkschaftszugehörigkeit. Geeignete zusätzliche Voraussetzung oder wirksame Vermeidung definieren. Namen zu entfernen beseitigt solche Rückschlüsse nicht automatisch. Auch der Rohupload gehört zur Prüfung.
- [ ] **Informationen:** Datenschutzerklärung und kurzen Importhinweis ergänzen: Verantwortlicher, Zwecke, Datenarten, Grundlagen, Empfänger, Transfers, Fristen und Rechte. Für indirekt erhobene Angaben Artikel 14 einschließlich möglicher Ausnahmen prüfen und die Entscheidung dokumentieren. Keine Zusage vollständiger Anonymität oder pauschal ausschließlicher EU-Verarbeitung.
- [ ] **Dienstleister:** Passende Auftragsverarbeitungsverträge nach Artikel 28 mit den jeweiligen Auftragsverarbeitern und deren Unterauftragnehmern prüfen. Mistral, Hosting, Dateispeicher und eingesetzte Telemetrie berücksichtigen. Regionen, Supportzugriffe und mögliche Drittlandtransfers nach Artikel 44 ff. prüfen; EU-Speicher allein genügt nicht als Nachweis.
- [ ] **Mistral-Einstellungen:** Regionalen Endpunkt und zugelassenes Modell kontrollieren. Training Opt-out dokumentieren. ZDR beantragen und Aktivierung verifizieren; andernfalls eine ausdrücklich geprüfte Aufbewahrungsregel festlegen. Die bisherigen Architekturannahmen verlangen vor Freigabe eine Entscheidung hierzu.
- [ ] **Technische Schutzmaßnahmen:** TLS, Verschlüsselung, Schlüsselverwaltung, Least-Privilege-Zugriffe, Haushalt-Isolation, Worker-Berechtigungen, Uploadlimits und ausgeschlossene Inhaltsprotokollierung implementieren und testen. Bereinigung anhand synthetischer Tests bewerten; bei unklaren Ergebnissen externe Übertragung stoppen.
- [ ] **Löschkonzept:** Fristen für Originaldateien, bereinigte Dateien, Vorschauen, fehlgeschlagene Jobs, Buchungen und Backups separat festlegen. Automatische Löschung einschließlich Fehlerfällen nachweisen. Export und Löschung eines Kontos beziehungsweise Haushalts mit abhängigen Daten umsetzen; erforderliche Aufbewahrung und Ausnahmen dokumentieren.
- [ ] **Betroffenenrechte:** Verfahren für Auskunft, Berichtigung, Löschung, Einschränkung und gegebenenfalls Datenübertragbarkeit, Widerspruch oder Einwilligungswiderruf einrichten. Die anwendbaren Rechte hängen von Rechtsgrundlage und Verarbeitung ab. Sichere Identitätsprüfung und grundsätzlich einmonatige Antwortfrist berücksichtigen.
- [ ] **Dokumentation und Risiko:** Verzeichnis der Verarbeitungstätigkeiten führen und die Notwendigkeit einer Datenschutz-Folgenabschätzung nach Artikel 35 schriftlich prüfen. Bei voraussichtlich hohem Risiko DSFA vor Start durchführen; verbleibendes hohes Risiko gegebenenfalls nach Artikel 36 mit der Aufsicht klären. Pflicht zu Datenschutzbeauftragtem nach Artikel 37 und anwendbarem nationalen Recht prüfen.
- [ ] **Sicherheitsvorfälle:** Zuständigkeiten und Ablauf für Erkennung, Eindämmung, Dokumentation und Meldung festlegen. Meldepflichtige Verletzungen grundsätzlich innerhalb von 72 Stunden nach Bekanntwerden an die Aufsicht melden; bei hohem Risiko betroffene Personen gemäß Artikel 34 informieren.
- [ ] **Freigabeentscheidung:** Besonders Rechtsgrundlage für Drittpersonendaten und Artikel-9-Inhalte vor öffentlichem Start fachkundig prüfen lassen. Offene Freigabepunkte schließen oder den Funktionsumfang entsprechend begrenzen.

Zusätzliche Referenzen:

- [DSGVO, amtlicher Text](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng/)
- [EDPB: Datenschutz durch Technikgestaltung und Dokumentation](https://www.edpb.europa.eu/sme/be-compliant/be-compliant_en)
- [EDPB: Schutz personenbezogener Daten](https://www.edpb.europa.eu/sme/be-compliant/secure-personal-data_en)
- [EDPB: Datenschutz-Folgenabschätzung](https://www.edpb.europa.eu/topics/accountability-and-compliance-tools/data-protection-impact-assessment_en)
