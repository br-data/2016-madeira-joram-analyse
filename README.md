# Mammon Analyse
Sammlung an Werkzeugen für das Projekt _Mammon_. Um die extrahierten Dokumente schnell durchsuchen zu können, kommt die Volltextsuchmaschine [Elasticsearch](https://www.elastic.co/products/elasticsearch) zum Einsatz.

## Verwendung
1. Repository klonen `git clone https://...`
2. Erforderliche Module installieren `npm install`
3. Zum Beispiel `node download.js` ausführen, um ein Skript zu starten.

**Hinweis:** Node.js bekommt standardgemäß nur 512 MB Arbeitsspeicher. Unter Umständen reicht das nicht aus und führt zu einem Fehler *FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - process out of memory*. In diesem Fall kann man den verfügbaren Speicher einmalig auf 4 GB erhöhen: `node --max_old_space_size=4000000 import.js`

## Datenquelle
Joram

## Workflow
1. **download.js** lädt alle PDFs aus dem Unternehmensregister Madeiras (seit 1998) herunter.
2. **extract.js** wandelt alle PDFs in Textdateien um. Bei Scans wird eine Texterkennung (OCR) durchgeführt.
3. **prepare.js** bereitet Elasticseach für die Indizierung der Texte vor.
4. **import.js** importiert und indiziert alle Textdateien in Elasticsearch.
5. **api.js** startet eine Interface, um Suchananfragen an Elasticsearch stellen zu können.
6. **search** Webbasierte Suchmaske benutzen.

### download.js
Lädt alle PDFs aus dem Unternehmensregister [Jornal Oficial da Região Autónoma da Madeira](http://www.gov-madeira.pt/joram/4serie/) herunter. Das Skript verwendet dabei die Biblothek [node-simplecrawler](https://github.com/cgiffard/node-simplecrawler/), die es ermöglicht mehrere Verbindungen gleichzeitig aufzubauen und die Verzeichnisse automatisch zu durchsuchen. Dabei werden nur Dateien mit dem MIME-Typ `application/pdf` heruntergeladen. Die Dateien werden im Verzeichnis `./pdf` gespeichert. 

### extract.js
Speichert alle Inhalte der PDFs als Textdatei. Manche PDFs enthalten Scans von Dokumenten. Die Texte dieser Scans werden mithilfe von [Tesseract](https://github.com/tesseract-ocr/tesseract) ausgelesen (OCR). Das Skript verwendet [Apache Tika](https://tika.apache.org/) und [node-tika](https://github.com/ICIJ/node-tika) als Schnittstelle zwischen Node.js und Tika (Java). Die extrahierten Texte werden im Verzeichnis `./text` abgelegt.

**Hinweis:** Tika könnte auch Metadaten aus den Dokumenten extrahieren, diese werden aber in diesem Fall ignoriert, da sie keinen Erkenntnisgewinn versprechen.

### prepare.js
Bereitet einen Elasticsearch-Index für den Import von Dokumenten vor. Der alte Index wird dabei gelöscht. Um nach Begriffen mit diakritischen Zeichen suchen zu können wird eine eigener Analyzer mit [aciifolding](https://www.elastic.co/guide/en/elasticsearch/guide/2.x/asciifolding-token-filter.html) angelegt. Dieser Analyser ersetze diakritische Zeichen mit den entsprechenden ASCII-Zeichen. So wird _Conceição_ im Feld **body** zu _Conceicao_ im Feld **body.folded**. Die betrifft auch das Mapping.

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
Um die extrahierten Dokumente schnell durchsuchen zu können, kommt die Volltextsuchmaschine [Elasticsearch](https://www.elastic.co/products/elasticsearch) zum Einsatz. Das Skript importiert die Dokumente in Elasticsearch und ergänzt die Dokumente um ein paar Metadaten.

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

### searchList.js
Um mehrere Namen zu suchen kann man das Suchskript mit einer Liste füttern. Das Skript verwendet den Elasticsearch-Service und gibt eine CSV-Datei der jeweiligen Anzahl an Treffen pro Name zurück. Gibt es (viele) Treffer für einen Namen, kann das ein Indiz dafür sein, dass die Person auf Madeira eine Unternehmen hat.    

## Verbesserungen
- Globale Konfigurationsdatei anlegen
- API für möglichen Live-Betrieb absichern
- Ordner anlegen, falls nicht vorhanden
- Textextrahierung beschleunigen (Mult-Threading)
