# 🤖 Facebook Anti-Bot Scraping System - Dokumentacja Techniczna

## 📋 Spis Treści

1. [Wprowadzenie](#wprowadzenie)
2. [Architektura Systemu](#architektura-systemu)
3. [Moduły Antybotowe](#moduły-antybotowe)
4. [Konfiguracja](#konfiguracja)
5. [Instalacja i Uruchomienie](#instalacja-i-uruchomienie)
6. [Monitorowanie i Debugowanie](#monitorowanie-i-debugowanie)
7. [Bezpieczeństwo](#bezpieczeństwo)
8. [Roadmap Rozwoju](#roadmap-rozwoju)

---

## 🎯 Wprowadzenie

### Cel Projektu
Stworzenie zaawansowanego systemu scrapingu Facebooka z wielowarstwowym zabezpieczeniem antybotowym, który jest praktycznie niemożliwy do wykrycia przez standardowe systemy detekcji.

### Kluczowe Wyzwania
- **Detekcja automatyzacji** przez Facebook's Anti-Bot Systems
- **Rate limiting** i **IP blocking**
- **Behavioral pattern analysis**
- **Device fingerprinting**
- **CAPTCHA challenges**

---

## 🏗️ Architektura Systemu

```
┌─────────────────────────────────────────────────────────────┐
│                    FB SCRAPING SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│  🎯 Main Controller (fb-scanner-bot.js)                    │
│  ├── 🔄 Session Manager (lib/session-manager.js)           │
│  ├── 🖥️  Device Fingerprinting (lib/device-fingerprint.js)  │
│  ├── 🌐 Proxy Rotation (lib/proxy-rotation.js)            │
│  ├── 🧠 Human Behaviors (lib/human-idle-behaviors.js)     │
│  ├── 🤦 Error Simulation (lib/human-error-simulation.js)   │
│  └── 💾 Cache Manager (lib/cache-manager.js)               │
├─────────────────────────────────────────────────────────────┤
│  📊 Data Processing                                         │
│  ├── 🔍 Keyword Matching (config/keywords.json)            │
│  ├── 📤 n8n Integration (webhook)                          │
│  └── 📈 Analytics & Monitoring                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Moduły Antybotowe

### 1. Device Fingerprinting (`lib/device-fingerprint.js`)
**Cel:** Unikalny fingerprint dla każdej sesji

**Funkcjonalności:**
- ✅ **Losowe User-Agent** (Chrome, Firefox, Safari)
- ✅ **Zmienne rozdzielczości** (1920x1080, 1366x768, etc.)
- ✅ **Różne timezone i języki**
- ✅ **Losowe właściwości sprzętowe** (CPU, memory)

**Implementacja:**
```javascript
const fingerprint = fingerprintManager.generateFingerprint();
await fingerprintManager.applyFingerprint(page, fingerprint);
```

### 2. Human Idle Behaviors (`lib/human-idle-behaviors.js`)
**Cel:** Naturalne zachowania między akcjami

**Funkcjonalności:**
- ✅ **Losowe ruchy myszy** i mikro-ruchy
- ✅ **Naturalne scrollowanie** w różnych kierunkach
- ✅ **Zmiany fokusa** między elementami
- ✅ **Aktywność klawiatury** (strzałki, tab, escape)
- ✅ **Symulacja czytania** i rozmyślania

**Implementacja:**
```javascript
const idleBehaviors = new HumanIdleBehaviors(page);
await idleBehaviors.performIdleAction();
```

### 3. Human Error Simulation (`lib/human-error-simulation.js`)
**Cel:** Symulacja ludzkich błędów i niedoskonałości

**Funkcjonalności:**
- ✅ **Przypadkowe kliknięcia** w złe miejsca
- ✅ **Literówki i poprawki**
- ✅ **Przewinięcie za daleko** i powrót
- ✅ **Zawahanie przed akcjami**
- ✅ **Podwójne kliknięcia** i przeciągnięcia

### 4. Proxy Rotation (`lib/proxy-rotation.js`)
**Cel:** Maskowanie IP i sieci

**Funkcjonalności:**
- ✅ **Rotacja proxy** z fallbackiem
- ✅ **Losowe headers** dla każdej sesji
- ✅ **Symulacja warunków sieciowych** (3G, 4G, broadband)
- ✅ **Testowanie proxy** przed użyciem

### 5. Advanced Session Management (`lib/session-manager.js`)
**Cel:** Inteligentne zarządzanie sesjami

**Funkcjonalności:**
- ✅ **Godziny szczytu** (9-11, 14-16, 19-21)
- ✅ **Dni robocze** z weekendowym ograniczeniem
- ✅ **Dynamiczne interwały** (krótsze w szczycie)
- ✅ **Inteligentne czekanie** do aktywnych godzin

### 6. Cache Management (`lib/cache-manager.js`)
**Cel:** Optymalizacja i unikanie duplikatów

**Funkcjonalności:**
- ✅ **Unikanie duplikatów** postów
- ✅ **Inteligentne filtrowanie** URL
- ✅ **Automatyczne czyszczenie** starego cache
- ✅ **Optymalizacja wydajności**

---

## ⚙️ Konfiguracja

### Główna Konfiguracja (`config/scraper.json`)
```json
{
    "groups": [
        {
            "url": "https://www.facebook.com/groups/mywpolsce",
            "name": "mywpolsce"
        }
    ],
    "proxy": {
        "enabled": false,
        "proxies": [],
        "testOnStartup": true,
        "networkConditions": "4g"
    },
    "safety": {
        "maxPostsPerSession": {
            "min": 5,
            "max": 25
        },
        "intervalMinutes": {
            "min": 10,
            "max": 45
        },
        "activeHours": {
            "start": 8,
            "end": 22,
            "peakHours": [
                { "start": 9, "end": 11, "activityMultiplier": 1.5 },
                { "start": 14, "end": 16, "activityMultiplier": 1.3 },
                { "start": 19, "end": 21, "activityMultiplier": 1.4 }
            ]
        },
        "workingDays": {
            "enabled": true,
            "days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
            "weekendReduction": 0.7
        }
    }
}
```

### Słowa Kluczowe (`config/keywords.json`)
```json
{
    "categories": {
        "legalizacja": {
            "keywords": ["karta pobytu", "visa", "zezwolenie na pobyt"],
            "responseTemplate": "Dzień dobry! Pomagamy w legalizacji pobytu..."
        },
        "tlumaczenia": {
            "keywords": ["tłumacz", "tłumaczenie", "przysięgły"],
            "responseTemplate": "Oferujemy usługi tłumaczeń przysięgłych..."
        }
    }
}
```

---

## 🚀 Instalacja i Uruchomienie

### Wymagania
- Node.js 16+
- Puppeteer
- Chrome/Chromium browser

### Instalacja
```bash
npm install
```

### Uruchomienie
```bash
# Główny bot
node fb-scanner-bot.js

# Bot screenshotów
node fb-screenshot-bot.js

# Test stealth
node test-stealth.js
```

### Struktura Projektu
```
puppeteer-demo/
├── fb-scanner-bot.js          # Główny bot
├── fb-screenshot-bot.js       # Bot screenshotów
├── test-stealth.js           # Test stealth
├── config/
│   ├── scraper.json          # Konfiguracja główna
│   └── keywords.json         # Słowa kluczowe
├── lib/
│   ├── human-behavior.js     # Bazowe zachowania ludzkie
│   ├── session-manager.js    # Zarządzanie sesjami
│   ├── device-fingerprint.js # Fingerprinting urządzenia
│   ├── proxy-rotation.js     # Rotacja proxy
│   ├── human-idle-behaviors.js # Zachowania bezczynności
│   ├── human-error-simulation.js # Symulacja błędów
│   └── cache-manager.js      # Zarządzanie cache
├── cache/                    # Cache postów i URL
├── screenshots/              # Zrzuty ekranu
└── fb-session/              # Sesje Facebooka
```

---

## 📊 Monitorowanie i Debugowanie

### Logi
System generuje szczegółowe logi:
- `🚀` - Uruchomienie systemu
- `🎯` - Cele i sesje
- `🔧` - Konfiguracja fingerprint
- `🌐` - Status proxy
- `🎯` - Trafienia słów kluczowych
- `📊` - Statystyki cache
- `❌` - Błędy i ostrzeżenia

### Debugowanie
```bash
# Włącz szczegółowe logi
DEBUG=* node fb-scanner-bot.js

# Test pojedynczych modułów
node test-stealth.js
```

---

## 🔒 Bezpieczeństwo

### Zaimplementowane Zabezpieczenia
1. **Multi-layer stealth** - 6 warstw maskowania
2. **Behavioral randomization** - losowe wzorce zachowań
3. **Device diversity** - unikalne fingerprinty
4. **Network masking** - proxy rotacja
5. **Error simulation** - ludzkie niedoskonałości
6. **Intelligent timing** - adaptacyjne opóźnienia

### Anti-Detection Techniques
- ✅ **puppeteer-extra-plugin-stealth**
- ✅ **WebDriver property masking**
- ✅ **Canvas fingerprint randomization**
- ✅ **WebRTC protection**
- ✅ **Font enumeration protection**
- ✅ **Audio context spoofing**

---

## 🗺️ Roadmap Rozwoju

### Faza 1: Behavioral Intelligence (Teraz)
- 🧠 **Dynamic pattern learning**
- 📈 **Predictive risk assessment**
- 🎯 **Context-aware behavior**

### Faza 2: Advanced Analytics (Miesiąc 2)
- 📊 **Real-time monitoring dashboard**
- 🤖 **ML-based risk prediction**
- 📱 **Mobile behavior simulation**

### Faza 3: Distributed Architecture (Miesiąc 3)
- 🌐 **Multi-instance coordination**
- ⚖️ **Load balancing**
- 🔄 **Fault tolerance**

### Faza 4: CAPTCHA Defense (Miesiąc 4)
- 🔍 **CAPTCHA prediction**
- 🛡️ **Avoidance strategies**
- ⚡ **Solving integration**

---

## 📞 Wsparcie Techniczne

### Wspólne Problemy
1. **Ban detection** - Sprawdź logi `checkBanRisk()`
2. **Proxy issues** - Testuj połączenie `testProxy()`
3. **Cache overflow** - Czyść cache `removeOldEntries()`
4. **Performance** - Monitoruj `getCacheStats()`

### Kontakt
- **Technical Lead:** [Twoje dane]
- **Documentation:** Aktualizowana regularnie
- **Updates:** Cotygodniowe raporty

---

## 📈 Metryki Sukcesu

### KPI
- **Success Rate:** >95%
- **Ban Rate:** <1%
- **Data Quality:** >90% accuracy
- **Uptime:** >99%

### Monitoring
- Real-time alerts
- Performance metrics
- Risk scoring
- Behavioral analytics

---

*Ostatnia aktualizacja: Styczeń 2026*
*Wersja: 2.0 Advanced Anti-Bot*
