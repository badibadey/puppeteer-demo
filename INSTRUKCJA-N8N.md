# 🔗 Instrukcja: Integracja Puppeteer z n8n

## Co zbudujemy?

```
PUPPETEER                      N8N                           WYNIK
    │                           │                              │
    │  1. Scrolluje stronę      │                              │
    │  2. Robi screenshot       │                              │
    │  3. Wysyła przez ────────▶│  4. Odbiera webhook          │
    │     webhook               │  5. Dekoduje obrazek         │
    │                           │  6. (opcja) OCR              │
    │                           │  7. Zapisuje do ────────────▶│ Google Sheets
    │                           │                              │ lub Email
    │                           │                              │ lub Baza danych
```

---

## 📋 WYMAGANIA

- **n8n** zainstalowany (lokalnie lub w chmurze)
- **Node.js** (do uruchomienia Puppeteer)
- Pliki z tego demo (`scraper-with-n8n.js`, `package.json`)

---

## 🔧 CZĘŚĆ 1: Konfiguracja n8n

### Krok 1.1: Uruchom n8n

Jeśli masz n8n lokalnie:
```bash
n8n start
```

Lub przez Docker:
```bash
docker run -it --rm -p 5678:5678 n8nio/n8n
```

Otwórz przeglądarkę: **http://localhost:5678**

---

### Krok 1.2: Stwórz nowy Workflow

1. Kliknij **"Add workflow"** (lub + w lewym panelu)
2. Nazwij go np. **"Scraper Demo"**

---

### Krok 1.3: Dodaj node "Webhook"

1. Kliknij **"+"** żeby dodać node
2. Wyszukaj **"Webhook"**
3. Wybierz **"Webhook"** (nie "Webhook Trigger" jeśli jest osobno)

#### Konfiguracja Webhook:

| Pole | Wartość |
|------|---------|
| **HTTP Method** | POST |
| **Path** | `scraper-demo` |
| **Response Mode** | Immediately (lub "When Last Node Finishes") |
| **Response Code** | 200 |

4. Kliknij **"Listen for Test Event"** (lub "Test webhook")
5. **SKOPIUJ URL WEBHOOKA** - będzie wyglądał tak:
   ```
   http://localhost:5678/webhook-test/scraper-demo
   ```
   
   ⚠️ **WAŻNE:** 
   - W trybie testowym URL zawiera `/webhook-test/`
   - Po aktywacji workflow URL zmieni się na `/webhook/`

---

### Krok 1.4: Dodaj node "Code" (do przetworzenia danych)

1. Kliknij **"+"** przy Webhook → dodaj **"Code"**
2. Wybierz język: **JavaScript**
3. Wklej ten kod:

```javascript
// Odbieramy dane z Puppeteer
const items = $input.all();

// Przetwarzamy każdy item (każdy screenshot)
const processedItems = items.map(item => {
  const data = item.json;
  
  return {
    json: {
      // Podstawowe info
      scrollNumber: data.scrollNumber,
      totalScrolls: data.totalScrolls,
      timestamp: data.timestamp,
      sourceUrl: data.sourceUrl,
      pageTitle: data.pageTitle,
      
      // Info o ustawienia
      viewportWidth: data.viewport?.width,
      viewportHeight: data.viewport?.height,
      
      // Screenshot info (bez samego base64 - za duży)
      screenshotFilename: data.screenshot?.filename,
      hasScreenshot: !!data.screenshot?.base64,
      
      // Status
      processedAt: new Date().toISOString(),
      status: 'received'
    },
    // Zachowujemy binary data osobno (screenshot)
    binary: data.screenshot?.base64 ? {
      screenshot: {
        data: data.screenshot.base64,
        mimeType: 'image/png',
        fileName: data.screenshot.filename
      }
    } : undefined
  };
});

return processedItems;
```

---

### Krok 1.5: Dodaj node do zapisu (wybierz jeden)

#### OPCJA A: Google Sheets (najprostsza)

1. Dodaj node **"Google Sheets"**
2. Skonfiguruj:
   - **Operation:** Append Row
   - **Document:** (wybierz swój arkusz)
   - **Sheet:** (wybierz zakładkę)
   - **Columns:** Mapuj pola:
     - `scrollNumber` → kolumna A
     - `timestamp` → kolumna B
     - `sourceUrl` → kolumna C
     - `pageTitle` → kolumna D
     - `status` → kolumna E

#### OPCJA B: Zapisz screenshot do pliku

1. Dodaj node **"Write Binary File"**
2. Skonfiguruj:
   - **File Name:** `={{ $json.screenshotFilename }}`
   - **Property Name:** `screenshot`

#### OPCJA C: Wyślij email z powiadomieniem

1. Dodaj node **"Send Email"** (Gmail, SMTP, itp.)
2. Skonfiguruj:
   - **To:** twój@email.com
   - **Subject:** `Scraper: Nowy screenshot #{{ $json.scrollNumber }}`
   - **Body:** `Pobrano screenshot ze strony: {{ $json.sourceUrl }}`

---

### Krok 1.6: Aktywuj Workflow

1. Kliknij przełącznik **"Inactive"** → **"Active"** (prawy górny róg)
2. URL webhooka zmieni się z `/webhook-test/` na `/webhook/`
3. **Skopiuj PRODUKCYJNY URL:**
   ```
   http://localhost:5678/webhook/scraper-demo
   ```

---

## 🖥️ CZĘŚĆ 2: Konfiguracja Puppeteer

### Krok 2.1: Zaktualizuj URL webhooka w skrypcie

Otwórz plik `scraper-with-n8n.js` i znajdź linię:

```javascript
n8nWebhookUrl: 'http://localhost:5678/webhook/scraper-demo',
```

Zmień na URL z Twojego n8n (skopiowany w kroku 1.6).

---

### Krok 2.2: Zainstaluj zależności

```bash
cd puppeteer-n8n-demo
npm install
```

---

### Krok 2.3: Uruchom scraper!

```bash
npm start
```

---

## ✅ CZĘŚĆ 3: Sprawdź czy działa

### W konsoli Puppeteer zobaczysz:

```
🚀 ========================================
🚀 PUPPETEER + N8N DEMO
🚀 ========================================

📡 Webhook n8n: http://localhost:5678/webhook/scraper-demo

🌐 Uruchamiam przeglądarkę...
🔗 Wchodzę na: https://old.reddit.com/r/popular/
✅ Strona załadowana!

📜 Rozpoczynam scrollowanie...

[1/3] ⏳ Czekam 2341ms...
   📸 Screenshot: screenshot_1_2025-01-17...png
   📡 Wysyłam do n8n...
   ✅ Wysłano do n8n!

[2/3] ⏳ Czekam 1876ms...
   📸 Screenshot: screenshot_2_2025-01-17...png
   📡 Wysyłam do n8n...
   ✅ Wysłano do n8n!

...

🎉 GOTOWE! Sprawdź n8n - dane powinny tam być
```

### W n8n zobaczysz:

1. Wejdź w **Executions** (lewy panel)
2. Zobaczysz wykonania workflow
3. Kliknij w wykonanie → zobaczysz dane z każdego screenshota

---

## 🔄 CZĘŚĆ 4: Rozbudowa (następne kroki)

### Dodaj OCR (wyciąganie tekstu ze screenshotów)

1. Dodaj node **"HTTP Request"** po Code
2. Wyślij screenshot do API OCR (np. Google Cloud Vision):

```javascript
// W node Code - przygotuj request do OCR
return [{
  json: {
    requests: [{
      image: { content: $json.screenshot.base64 },
      features: [{ type: 'TEXT_DETECTION' }]
    }]
  }
}];
```

### Dodaj kategoryzację (słowa kluczowe)

```javascript
// W node Code - szukaj słów kluczowych
const text = $json.ocrText || '';
const keywords = {
  tlumaczenia: ['tłumacz', 'tłumaczenie', 'przysięgły'],
  legalizacja: ['karta pobytu', 'legalizacja', 'pobyt'],
  pesel: ['pesel', 'numer pesel']
};

let category = 'inne';
for (const [cat, words] of Object.entries(keywords)) {
  if (words.some(word => text.toLowerCase().includes(word))) {
    category = cat;
    break;
  }
}

return [{ json: { ...$json, category } }];
```

### Dodaj filtrowanie (tylko interesujące posty)

Dodaj node **"IF"**:
- Condition: `{{ $json.category }}` is not equal to `inne`
- True → zapisz do bazy
- False → pomiń

---

## 📊 Schemat pełnego workflow

```
[Webhook] 
    │
    ▼
[Code: Przetwórz dane]
    │
    ▼
[HTTP Request: OCR] ──── (opcjonalnie)
    │
    ▼
[Code: Kategoryzacja] ── (opcjonalnie)
    │
    ▼
[IF: Czy interesujące?]
    │
    ├─── TAK ──▶ [Google Sheets: Zapisz]
    │                    │
    │                    ▼
    │            [Email: Powiadom]
    │
    └─── NIE ──▶ [No Operation]
```

---

## ❓ Rozwiązywanie problemów

### Problem: "Błąd połączenia z n8n"

**Sprawdź:**
1. Czy n8n jest uruchomiony? (`http://localhost:5678`)
2. Czy workflow jest **AKTYWNY** (nie tylko zapisany)?
3. Czy URL webhooka jest poprawny (z `/webhook/` nie `/webhook-test/`)?

### Problem: "Webhook nie odbiera danych"

**Sprawdź:**
1. W n8n: czy widzisz wykonania w "Executions"?
2. Czy HTTP Method to POST (nie GET)?
3. Spróbuj najpierw "Listen for Test Event" i wyślij ręcznie przez Postman/curl

### Problem: "Screenshot jest za duży"

Base64 screenshota może mieć 1-2 MB. Rozwiązania:
1. Zmniejsz rozmiar okna przeglądarki w CONFIG
2. Kompresuj obrazki przed wysłaniem
3. Zapisuj screenshoty lokalnie, wysyłaj tylko metadane

---

## 🎯 Podsumowanie

Masz teraz działającą integrację:

| Komponent | Rola |
|-----------|------|
| **Puppeteer** | Scrolluje, robi screenshoty, wysyła do n8n |
| **n8n Webhook** | Odbiera dane |
| **n8n Code** | Przetwarza dane |
| **n8n Output** | Zapisuje do Sheets/Email/Bazy |

To jest **fundament** pod większy system scrapingowy dla Pana Petro!
