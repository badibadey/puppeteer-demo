# 🚀 Quick Start Guide - Facebook Anti-Bot System

## 📋 Spis Treści

1. [Instalacja](#instalacja)
2. [Konfiguracja](#konfiguracja)
3. [Uruchomienie](#uruchomienie)
4. [Zalecane Godziny Pracy](#zalecane-godziny-pracy)
5. [Monitorowanie](#monitorowanie)
6. [Rozwiązywanie Problemów](#rozwiązywanie-problemów)
7. [Najlepsze Praktyki](#najlepsze-praktyki)

---

## 🛠️ Instalacja

### Wymagania
- **Node.js** 16+ 
- **Chrome/Chromium** browser
- **Minimum 2GB RAM**
- **Stabilne połączenie internetowe**

### Kroki Instalacji
```bash
# 1. Klonuj repository
git clone https://github.com/badibadey/puppeteer-demo.git
cd puppeteer-demo

# 2. Zainstaluj dependencies
npm install

# 3. Sprawdź instalację
node test-stealth.js
```

---

## ⚙️ Konfiguracja

### 1. Konfiguracja Główna (`config/scraper.json`)

```json
{
    "groups": [
        {
            "url": "https://www.facebook.com/groups/twoja-grupa",
            "name": "twoja-grupa"
        }
    ],
    "n8n": {
        "webhookUrl": "https://twoj-n8n.pl/webhook/fb-scraper"
    },
    "proxy": {
        "enabled": false,
        "proxies": [
            "user:pass@proxy1.com:8080",
            "proxy2.com:8080"
        ],
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

### 2. Słowa Kluczowe (`config/keywords.json`)

```json
{
    "categories": {
        "legalizacja": {
            "keywords": ["karta pobytu", "visa", "zezwolenie"],
            "responseTemplate": "Pomagamy w legalizacji..."
        },
        "tlumaczenia": {
            "keywords": ["tłumacz", "tłumaczenie", "przysięgły"],
            "responseTemplate": "Oferujemy tłumaczenia..."
        }
    }
}
```

---

## 🚀 Uruchomienie

### Podstawowe Uruchomienie
```bash
# Główny bot (zalecane)
node fb-scanner-bot.js

# Bot screenshotów (opcjonalnie)
node fb-screenshot-bot.js

# Test stealth
node test-stealth.js
```

### Uruchomienie w Tle (Linux/macOS)
```bash
# Użyj screen lub tmux
screen -S fb-bot
node fb-scanner-bot.js

# Detach: Ctrl+A, D
# Attach: screen -r fb-bot
```

### Uruchomienie jako Service (Linux)
```bash
# Stwórz service file
sudo nano /etc/systemd/system/fb-bot.service

# Content:
[Unit]
Description=Facebook Bot
After=network.target

[Service]
Type=simple
User=twoj-user
WorkingDirectory=/sciezka/do/puppeteer-demo
ExecStart=/usr/bin/node fb-scanner-bot.js
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target

# Aktywuj service
sudo systemctl enable fb-bot
sudo systemctl start fb-bot
sudo systemctl status fb-bot
```

---

## ⏰ Zalecane Godziny Pracy

### 🌅 **Optymalne Godziny:**
- **Poniedziałek - Piątek:** 8:00 - 22:00
- **Sobota:** 9:00 - 18:00 
- **Niedziela:** 10:00 - 16:00 (redukcja 30%)

### 🎯 **Godziny Szczytu (wyższa aktywność):**
- **9:00 - 11:00** (+50% aktywności)
- **14:00 - 16:00** (+30% aktywności)
- **19:00 - 21:00** (+40% aktywności)

### 📅 **Przykładowy Harmonogram:**
```
Poniedziałek:
- 09:15 - Pierwsza sesja (szczyt)
- 11:45 - Druga sesja 
- 14:30 - Trzecia sesja (szczyt)
- 16:00 - Czwarta sesja
- 19:30 - Piąta sesja (szczyt)
- 21:00 - Ostatnia sesja

Weekend:
- 10:00 - Pierwsza sesja
- 14:00 - Druga sesja
- 16:30 - Ostatnia sesja
```

---

## 📊 Monitorowanie

### Logi w Czasie Rzeczywistym
```bash
# Uruchom z szczegółowymi logami
DEBUG=* node fb-scanner-bot.js

# Monitoruj logi
tail -f /var/log/fb-bot.log
```

### Kluczowe Wskaźniki (Logi)
```
🚀 Uruchomienie systemu
🎯 Sesja: nazwa-grupy (URL)
🔧 Konfiguracja fingerprint: Chrome/Windows
🌐 Status proxy: Direct connection
📊 Cache: 150 postów, 89 URL
🎯 TRAFIENIE: [autor] "tytuł posta"
🧠 Statystyki uczenia: 15 sesji, 92.3% success rate
🚨 Wynik ryzyka: 23.5% (low)
✅ Sesja zakończona sukcesem
⏰ Oczekiwanie 25 minut przed następną sesją
```

### Dashboard (przyszłość)
```bash
# Planowany dashboard
npm run dashboard
# Otwórz http://localhost:3000
```

---

## 🔧 Rozwiązywanie Problemów

### ❌ **Common Issues**

#### 1. "Ban Detection"
```bash
# Symptomy:
⚠️ Nie znaleziono feedu (timeout)
❌ Błąd sesji: Navigation timeout

# Rozwiązanie:
1. Zwiększ opóźnienia w config/scraper.json
2. Włącz proxy rotation
3. Zmień fingerprint urządzenia
4. Odczekaj 2-3 godziny
```

#### 2. "Proxy Issues"
```bash
# Symptomy:
❌ Proxy test failed: proxy1.com:8080
🌐 Używam direct connection

# Rozwiązanie:
1. Sprawdź proxy credentials
2. Testuj proxy manualnie:
curl -x proxy1.com:8080 http://httpbin.org/ip
3. Dodaj więcej proxy do config
4. Wyłącz proxy jeśli niepotrzebne
```

#### 3. "Memory Issues"
```bash
# Symptomy:
JavaScript heap out of memory
FATAL ERROR: Ineffective mark-compacts

# Rozwiązanie:
1. Zwiększ limit pamięci:
node --max-old-space-size=4096 fb-scanner-bot.js
2. Czyść cache regularnie
3. Uruchom cron do czyszczenia:
0 2 * * * rm -rf ./cache/*
```

#### 4. "Chrome Issues"
```bash
# Symptomy:
Failed to launch browser
No usable sandbox!

# Rozwiązanie:
1. Zainstaluj dependencies:
sudo apt-get install -y libgbm-dev
2. Użyj headless mode w development:
headless: "new"
3. Sprawdź Chrome path:
which google-chrome
```

### 🔍 **Debug Mode**
```bash
# Włącz szczegółowe logi
DEBUG=puppeteer:* node fb-scanner-bot.js

# Test pojedynczych modułów
node -e "const bm = require('./lib/behavioral-learning'); console.log('OK')"
```

---

## 🎯 Najlepsze Praktyki

### 🛡️ **Bezpieczeństwo:**
1. **Zawsze używaj stealth** - nigdy nie wyłączaj
2. **Regularnie zmieniaj proxy** - co 1-2 dni
3. **Monitoruj ryzyko** - reaguj na alerty
4. **Backup cache** - regularne kopie
5. **Update dependencies** - co tydzień

### ⚡ **Wydajność:**
1. **Optymalizuj keywords** - usuń zbyt ogólne
2. **Limituj posty** - nie przekraczaj 25/session
3. **Czyść cache** - co 1000 postów
4. **Monitoruj RAM** - restart przy >2GB
5. **Użyj SSD** - szybszy cache

### 📈 **Skuteczność:**
1. **Analizuj logi** - identyfikuj wzorce
2. **Testuj konfigurację** - A/B testy
3. **Adaptuj timingi** - na podstawie wyników
4. **Rotuj grupy** - różne źródła
5. **Monitoruj success rate** - cel >90%

### 🔄 **Konserwacja:**
```bash
# Daily check (cron 0 8 * * *)
cd /sciezka/do/bot && git pull && npm install

# Weekly maintenance (cron 0 2 * * 0)
rm -rf ./cache/* && ./cleanup.sh

# Monthly update (cron 0 3 1 * *)
npm update && npm audit fix
```

---

## 📞 Wsparcie

### 📋 **Przed kontaktem:**
1. Sprawdź logi (`tail -f log.txt`)
2. Przeczytaj troubleshooting
3. Sprawdź GitHub issues
4. Zbierz informacje o błędzie

### 📧 **Contact:**
- **GitHub Issues:** https://github.com/badibadey/puppeteer-demo/issues
- **Documentation:** README.md
- **Emergency:** Check logs first

---

## 🚀 **Quick Start Summary**

```bash
# 1. Setup
git clone https://github.com/badibadey/puppeteer-demo.git
cd puppeteer-demo
npm install

# 2. Configure
nano config/scraper.json  # dodaj swoją grupę
nano config/keywords.json # dodaj słowa kluczowe

# 3. Test
node test-stealth.js

# 4. Run
node fb-scanner-bot.js

# 5. Monitor
tail -f log.txt
```

**✅ Gotowe! Bot będzie działał automatycznie z optymalnymi godzinami i zachowaniami.**

---

*Ostatnia aktualizacja: Styczeń 2026*
*Wersja: 2.0 Advanced Anti-Bot*
