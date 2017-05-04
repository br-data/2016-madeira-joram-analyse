# Steuerparadies Madeira – Analyse
Sammlung an Werkzeugen um das Amtsblatt von Madeira ([Joram](http://www.gov-madeira.pt/joram/4serie/)) zu durchsuchen und analysieren. Madeira ist ein Steuerparadies mit Segen der EU-Kommission. Die Analyse dient dazu, bekannte Privatpersonen und internationale Großkonzerne zu finden, die auf Madeira tätig sind. Außerdem helfen die Werkzeuge dabei Scheinarbeitsplätze und Briefkastenfirmen aufzudecken.

- **Suchmaschine**: http://ddj.br.de/mammon (Benutzer: jedermann, Passwort: ab.auf.die.insel!)
- **Artikel**: http://br.de/madeira/artikel

Die Inhalte der Veröffentlichung finden sich im Repo [mammon-website](https://github.com/digitalegarage/mammon-website).

## Verwendung
1. Repository klonen `git clone https://...`
2. Erforderliche Module installieren `npm install`
3. Zum Beispiel `node download.js` ausführen, um ein Skript zu starten.

**Hinweis:** Node.js bekommt standardgemäß nur 512 MB Arbeitsspeicher. Unter Umständen reicht das nicht aus und führt zu einem Fehler *FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - process out of memory*. In diesem Fall kann man den verfügbaren Speicher einmalig auf 4 GB erhöhen: `node --max_old_space_size=4000000 import.js`

## Abhängigkeiten
Um die extrahierten Dokumente schnell durchsuchen zu können, kommt die Volltextsuchmaschine [Elasticsearch](https://www.elastic.co/products/elasticsearch) zum Einsatz. Um die Dokumentensuche nutzen zu können, muss Elasticsearch in der Version 2.3 installiert sein. 

## Datenquelle
Die Regionalregierung Madeiras veröffentlicht nahezu täglich das Amtsblatt [Jornal Oficial da Região Autónoma da Madeira](http://www.gov-madeira.pt/joram/4serie/), kurz Joram. Dort werden alle Firmeneintragungen, Änderungen der Geschäftsführung oder Umbenennungen veröffentlicht. Viele Ausgaben des Joram liegen jedoch nur als eingescannte Dokumente vor und waren für Suchmaschinen nicht lesbar. Der Dokumenten-Workflow schafft hier Abhilfe.

## Dokumente durchsuchen
1. **download.js** lädt alle PDFs aus dem Unternehmensregister Madeiras (seit 1998) herunter.
2. **extract.js** wandelt alle PDFs in Textdateien um. Bei Scans wird eine Texterkennung (OCR) durchgeführt.
3. **prepare.js** bereitet Elasticseach für die Indizierung der Texte vor.
4. **import.js** importiert und indiziert alle Textdateien in Elasticsearch.
5. **api.js** startet eine Interface, um Suchananfragen an Elasticsearch stellen zu können.
6. **search** Webbasierte Suchmaske benutzen.

### download.js
Lädt alle PDFs aus dem Joram herunter. Das Skript verwendet dabei die Biblothek [node-simplecrawler](https://github.com/cgiffard/node-simplecrawler/), die es ermöglicht mehrere Verbindungen gleichzeitig aufzubauen und die Verzeichnisse automatisch zu durchsuchen. Dabei werden nur Dateien mit dem MIME-Typ `application/pdf` heruntergeladen. Die Dateien werden im Verzeichnis `./pdf` gespeichert. 

### extract.js
Speichert alle Inhalte der PDFs als Textdatei. Manche PDFs enthalten Scans von Dokumenten. Die Texte dieser Scans werden mithilfe von [Tesseract](https://github.com/tesseract-ocr/tesseract) ausgelesen (OCR). Das Skript verwendet [Apache Tika](https://tika.apache.org/) und [node-tika](https://github.com/ICIJ/node-tika) als Schnittstelle zwischen Node.js und Tika (Java). Die extrahierten Texte werden im Verzeichnis `./text` abgelegt.

**Hinweis:** Tika könnte auch Metadaten aus den Dokumenten extrahieren, diese werden aber in diesem Fall ignoriert, da sie keinen Erkenntnisgewinn versprechen.

### prepare.js
Das Skript bereitet einen Elasticsearch-Index für den Import von Dokumenten vor. Der alte Index wird dabei gelöscht. Um nach Begriffen mit diakritischen Zeichen suchen zu können wird eine eigener Analyzer mit [ASCII-Folding](https://www.elastic.co/guide/en/elasticsearch/guide/2.x/asciifolding-token-filter.html) angelegt. Dieser Analyser ersetze diakritische Zeichen mit den entsprechenden ASCII-Zeichen. So wird _Conceição_ im Feld **body** zu _Conceicao_ im Feld **body.folded**.

```
curl -XPUT localhost:9200/joram -d '
{
  settings: {
    analysis: {
      analyzer: {
        folding: {
          tokenizer: "standard",
          filter: ["lowercase", "asciifolding"]
        }
      }
    }
  }
}'
```

Das ASCII-Folding betrifft auch das Mapping:

```
curl -XPUT localhost:9200/joram/_mapping/doc -d '
{
  properties: {
    body: {
      type: "string",
      analyzer: "standard",
      fields: {
        folded: {
          type: "string",
          analyzer: "folding"
        }
      }
    }
  }
}'
```

Für die Entwicklung wird die Anzahl der Replicas auf 0 gesetzt, um _Unassigned shards_-Warnungen zu vermeiden. 

```
url -XPUT 'localhost:9200/_settings' -d '         
{                  
  index: {
    number_of_replicas : 0
  }
}'
```

### import.js
Das Skript importiert die Dokumente in Elasticsearch und ergänzt die Dokumente um ein paar Metadaten.

```javascript
{
  name: 'Jornal Oficial da Região Autónoma da Madeira',
  series: 'IV',           // Serie
  issue: issue,           // Ausgabe
  supplement: supplement, // Ist das Dokument ein Anhang?
  date: date,             // Datum
  file: file,             // Dateiname
  body: body              // Der gesamte Textinhalt
}
```

### api.js
Die Daten des Elasticsearch-Clusters kann man über eine API-Service abfragen. Es gibt verschiedene Möglichkeiten einen Anfrage zustellen:

- `GET http://localhost:3003/match/:query` Findet exakte Suchausdrücke wie **John Doe** [(mehr Infos)](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html).
- `GET http://localhost:3003/custom/:query` Findet alle Wörter eines Suchausdrucks: **"John" AND "Doe"**. Unterstützt außerdem Wildcards und einfache Suchoperatoren [(mehr Infos)](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-simple-query-string-query.html).
- `GET http://localhost:3003/fuzzy/:query` Fuzzy-Suche, welche einzelne Begriffe findet, auch wenn sie Buchstabendreher enthalten **Jhon** [(mehr Infos)](// https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-fuzzy-query.html).
- `GET http://localhost:3003/regexp/:query` Regex-Suche für einzelne Begriffe **J.hn*** [(mehr Infos)](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-regexp-query.html).

Der Elasticsearch-Service wird auch von der Suche verwendet. Die Optionen in der Suchmaske (Standard, Custom, Fuzzy, Regex) bilden genau diese Routen ab. 

Der Elasticsearch-Service kann mit `node api.js POR` gestarten werden.

### Suchmaske /search
Die Suche ist eine Webanwendung, welche auf den Elasticsearch-Service zugreift. Für jede Suchanfrage bekommt man eine Liste von Dokumenten zurück in denen der Suchbegriff gefunden wurde. Über zwei Buttons kann man dann schnell auf das Original-PDF oder die Text-Version des Dokuments zugreifen.

Die Suchmaske ist dafür gedacht, dass ein Team von Journalisten einfach in den Dokumente des JORAM recherchieren kann. 

## Dokumente analysieren

### findNames.js
Um nach mehreren Namen zu suchen, kann man eine Listensuche durchführen. Das Skript verwendet den Elasticsearch-Service und gibt eine CSV-Datei der jeweiligen Anzahl an Treffen pro Name zurück. Gibt es (viele) Treffer für einen Namen, kann das ein Indiz dafür sein, dass die Person auf Madeira ein Unternehmen hat.

```
$ node findNames.js ./names.csv ./results.csv
Finished processing 48 names
Saved file results.csv
```

### findUnique.js
Findet alle eindeutigen Unternehmen und Personen. Dazu werden die Dokumente nach den neunstelligen portugiesischen Steuernummern (NIFs und NIPCs) durchsucht. Hierfür kommen folgende reguläre Ausdrücke zum Einsatz:

- persönliche Steuernummer NIF: `\\s[12][\\d|\\s]{7,9}\\d\\s`
- Steuernummer eines Unternehmens NIPC: `\\s[5678][\\d|\\s]{7,9}\\d\\s`

```
$ node findUnique.js ./text 
Completed search for 2950 documents
Found 5140 unique NIFs 22610
Found 7795 unique NIPCs 40904
Saved file results/uniqueNIFs.txt
Saved file results/uniqueNIPCs.txt
```

### findRelated.js
Findet alle Unternehmen für die eine Person gearbeitet hat. Erst werden die Dokumenten nach Vorkommen der Person durchsucht, dann werden jeweils damit verbunden Unternehmen aufgelistet (**total matches**). Im Gegensatz dazu gibt **unique matches** die Anzahl aller eindeutigen Unternehmen wieder. Hat eine Person also mehrfach für das gleiche Unternehmen gearbeitet, wir das Unternehmen nur einmal gezählt.

```
$ node findRelated.js ./text "Roberto Luiz Homem"
Completed search for Roberto Luiz Homem
Found 323 unique matches from 526 total matches
Saved file results/roberto-luiz-homem.txt
```

### findRelatedBatch.js
Siehe **findRelated.js**. Findet für eine Liste von Personen die (Anzahl der) zugehörigen Unternehmen.

```
$ node findRelatedBatch.js ./nifs.txt ./nifs-result.txt
...
Found 1 unique matches from 1 total matches
Saved file result/289971330.txt
Completed search for 289965543
Found 1 unique matches from 1 total matches
Saved file result/289965543.txt
```

### getCompanyInfo.js
Findet für die Steuernummer eines Unternehmens den zugehörigen Namen, Stadt und Aktivitäten der letzten Jahre. Kann umgekehrt auch dazu verwendet werden, Namen zu Steuernummern aufzulösen. Das Skript verwendet die [Schnittstelle](https://www.racius.com/app/searchsolr/autocomplete/?q=511136706) des portugiesischen Dienstleisters [Racius](https://www.racius.com/).

```
$ node getCompanyInfo.js "511136706"
[ { id: 619078,
    title: 'Ciboule - Trading e Marketing Lda (Zona Franca da Madeira)',
    value: 'Ciboule - Trading e Marketing Lda (Zona Franca da Madeira)',
    nif: 511136706,
    city: 'Funchal',
    url: 'ciboule-trading-e-marketing-lda-zona-franca-da-madeira',
    years: [ 2015, 2014, 2013 ],
    last_year: true } ]
```

### getCompanyInfoBatch.js
Siehe **getCompanyInfo.js**. Findet für eine Liste von NIPCs oder Firmenname den jeweiligen Auszug aus dem [Racius](https://www.racius.com/)-Unternehmensregister und speichert diesen als CSV.

```
$ node getCompanyInfoBatch.js ./nipcs.txt ./nipcs-result.csv
...
Found Vox Populi - Comércio Internacional e Serviços Lda (Zona Franca da Madeira)
Found Cyrus - Comercio, Serviços de Consultoria e Investimentos Lda (Zona Franca da Madeira)
Found Fidumar - Management, Comércio e Serviços S.A. (Zona Franca da Madeira)
Finished processing 3 names
```

### countPages.sh
Kleines Skript um die Anzahl aller Seiten mehrerer PDF-Dokumente zu ermitteln.

## Entitäten
Eine Liste aller Unternehmen in Freihandelszone Madeira liegt unter `entities/madeira-ibc-companies.csv`. Die Daten kommen zum einem Teil aus dem Amtsblatt Joram und zum anderem von [Racius](https://www.racius.com/).

Die Liste enthält folgende Merkmale:
- **nipc**: portugiesische Steuernummer
- **name**: Name des Unternehmens
- **originial-address**: letzte Adresse
- **merged-address**: normalisierte letzte Adresse
- **address-count**: Anzahl der gleichen Adressen
- **zip-code**: Postleitzahl
- **city**: Stadt
- **form**: Gesellschaftform
- **cae-code**: Tätigkeitsfeld
- **active-2016**: Anzahl der Aktivitäten im Jahr 2016
- **active-2015**: Anzahl der Aktivitäten im Jahr 2015
- **active-2014**: Anzahl der Aktivitäten im Jahr 2014
- **active-2013**: Anzahl der Aktivitäten im Jahr 2013
- **active-2012**: Anzahl der Aktivitäten im Jahr 2012
- **active-2012-2016**: Anzahl der Aktivitäten in den Jahr 2012 bis 2016

Die Anzahl der Aktivitäten ist wichtig, um herauszufinden, ob das Unternehmen noch auf Madeira tätig ist.

Eine Liste der Management-Firmen findet sich unter `entities/madeira-managment-companies.csv`. Bemerkenswert ist, dass die meisten Unternehmen genau unter diesen zwanzig Adressen registriert sind.

## Verbesserungen
- Globale Konfigurationsdatei anlegen
- API für möglichen Live-Betrieb absichern
- Ordner anlegen, falls nicht vorhanden
- Textextrahierung beschleunigen (Mult-Threading)
