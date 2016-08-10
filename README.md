# Mammon Analyse
Sammlung an Werkzeugen für das Projekt _Mammon_.

## Verwendung
1. Repository klonen `git clone https://...`
2. Erforderliche Module installieren `npm install`
3. Zum Beispiel `node download.js` ausführen, um ein Skript zu starten.

**Hinweis:** Node.js bekommt standardgemäß nur 512 MB Arbeitsspeicher. Unter Umständen reicht das nicht aus und führ zu einem Fehler *FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - process out of memory*. In diesem Fall kann man den verfügbaren Speicher einmalig auf 4 GB erhöhen: `node --max_old_space_size=4000000 import.js`

## Datenquelle
Joram

## Workflow
1. **download.js** lädt alle PDFs aus dem Unternehmensregister Madeiras (seit 1998) herunter.
2. **extract.js** wandelt alle PDFs in Textdateien um. Bei Scans wird eine Texterkennung (OCR) durchgeführt.
3. **import.js** importiert und indiziert alle Textdateien in Elasticsearch.

### download.js
Lädt alle PDFs aus dem Unternehmensregister [Jornal Oficial da Região Autónoma da Madeira](http://www.gov-madeira.pt/joram/4serie/) herunter. Das Skript verwendet dabei die Biblothek [node-simplecrawler](https://github.com/cgiffard/node-simplecrawler/), die es ermöglicht mehrere Verbindungen gleichzeitig aufzubauen und die Verzeichnisse automatisch zu durchsuchen. Dabei werden nur Dateien mit dem MIME-Typ `application/pdf` heruntergeladen. Die Dateien werden im Verzeichnis `./pdf` gespeichert. 

### extract.js
Speichert alle Inhalte der PDFs als Textdatei. Manche PDFs enthalten Scans von Dokumenten. Die Texte dieser Scans werden mithilfe von [Tesseract](https://github.com/tesseract-ocr/tesseract) ausgelesen (OCR). Das Skript verwendet [Apache Tika](https://tika.apache.org/) und [node-tika](https://github.com/ICIJ/node-tika) als Schnittstelle zwischen Node.js und Tika (Java). Die extrahierten Texte werden im Verzeichnis `./text` abgelegt.

### import.js
Um die extrahierten Dokumente schnell durchsuchen zu können, kommt die Volltextsuchmaschine [Elasticsearch](https://www.elastic.co/products/elasticsearch) zum Einsatz. Das Skript importiert die Dokumente in Elasticsearch und ergänzt die Dokumente um ein paar Metadaten.

```javascript
body: {
  name: 'Jornal Oficial da Região Autónoma da Madeira',
  series: 'IV',           // Serie
  issue: issue,           // Ausgabe
  supplement: supplement, // Ist das Dokument ein Anhang?
  date: date,             // Datum
  file: file,             // Dateiname
  body: body              // Der gesamte Textinhalt
}
```

## Verbesserungen
- Ordner anlegen, falls nicht vorhanden
- Textextrahierung beschleunigen (Mult-Threading)

