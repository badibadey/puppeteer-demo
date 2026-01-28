# 📋 Facebook Bot - Checklist Przed Użyciem

## ✅ **Przed Uruchomieniem**

### 🛠️ **System Requirements:**
- [ ] Node.js 16+ zainstalowany (`node -v`)
- [ ] Chrome/Chromium browser (`google-chrome --version`)
- [ ] Minimum 2GB RAM
- [ ] Stabilne połączenie internetowe
- [ ] 1GB wolnego miejsca na dysku

### 📁 **Pliki Konfiguracyjne:**
- [ ] `config/scraper.json` - skonfigurowany
- [ ] `config/keywords.json` - słowa kluczowe dodane
- [ ] `fb-session/` - katalog istnieje
- [ ] `cache/` - katalog istnieje
- [ ] `learning-data/` - katalog istnieje

### 🔗 **Konfiguracja:**
- [ ] URL grupy Facebook dodany
- [ ] Nazwa grupy ustawiona
- [ ] n8n webhook URL (jeśli używany)
- [ ] Proxy skonfigurowane (opcjonalnie)
- [ ] Słowa kluczowe zoptymalizowane

---

## 🚀 **Uruchomienie**

### Testowanie:
```bash
# 1. Test stealth
node test-stealth.js

# 2. Sprawdź config JSON
python3 -c "import json; print('JSON OK')" 2>/dev/null || echo "JSON Error"

# 3. Sprawdź dependencies
npm list puppeteer
```

### Uruchomienie:
```bash
# Development
node fb-scanner-bot.js

# Production
./start-bot.sh

# Background (Linux/macOS)
nohup ./start-bot.sh > bot.log 2>&1 &
```

---

## ⏰ **Harmonogram Pracy**

### 🌅 **Aktywne Godziny:**
- **Poniedziałek - Piątek:** 8:00 - 22:00
- **Sobota:** 9:00 - 18:00
- **Niedziela:** 10:00 - 16:00 (30% mniej aktywności)

### 🎯 **Godziny Szczytu:**
- **9:00 - 11:00** (+50% aktywności)
- **14:00 - 16:00** (+30% aktywności)
- **19:00 - 21:00** (+40% aktywności)

### 📅 **Przykładowy Dzień:**
```
09:15 - Sesja 1 (szczyt)
11:45 - Sesja 2
14:30 - Sesja 3 (szczyt)
16:00 - Sesja 4
19:30 - Sesja 5 (szczyt)
21:00 - Sesja 6
```

---

## 📊 **Monitorowanie**

### 🔍 **Kluczowe Logi:**
```
🚀 Uruchomienie systemu
🎯 Sesja: nazwa-grupy
🔧 Fingerprint: Chrome/Windows
🌐 Proxy: Status
📊 Cache: Statystyki
🎯 TRAFIENIE: Post znaleziony
🧠 Learning: Statystyki
🚨 Ryzyko: Wynik
✅ Sesja zakończona
⏰ Oczekiwanie: X minut
```

### 📈 **Ważne Metryki:**
- **Success Rate:** >90%
- **Risk Score:** <30%
- **Cache Hits:** >50%
- **Session Duration:** 5-30 minut
- **Posts/Session:** 5-25

---

## ⚠️ **Alerty i Reakcje**

### 🚨 **Critical Risk (>80%):**
- [ ] Natychmiast zatrzymaj sesję
- [ ] Zmień proxy IP
- [ ] Odczekaj 2-3 godziny
- [ ] Sprawdź logi błędów

### ⚠️ **High Risk (60-80%):**
- [ ] Zwiększ opóźnienia o 50%
- [ ] Redukuj aktywność o 30%
- [ ] Dodaj więcej losowości
- [ ] Monitoruj ryzyko

### 📊 **Medium Risk (30-60%):**
- [ ] Dodaj naturalne zachowania
- [ ] Krótka przerwa 5-10 minut
- [ ] Sprawdź wzorce akcji
- [ ] Monitoruj trendy

---

## 🔧 **Konserwacja**

### 🔄 **Daily:**
- [ ] Sprawdź logi błędów
- [ ] Monitoruj success rate
- [ ] Sprawdź ryzyko sesji
- [ ] Weryfikuj cache size

### 📅 **Weekly:**
- [ ] Backup config files
- [ ] Czyść stary cache (>7 dni)
- [ ] Update dependencies
- [ ] Analizuj wzorce sukcesu

### 🗓️ **Monthly:**
- [ ] Full system update
- [ ] Security audit
- [ ] Performance review
- [ ] Strategy adjustment

---

## 🆘 **Troubleshooting**

### ❌ **Ban Detection:**
```
Symptoms: ⚠️ Nie znaleziono feedu, Navigation timeout
Solution: 
1. Zwiększ delays w config
2. Włącz proxy rotation
3. Zmień fingerprint
4. Odczekaj 2-3 godziny
```

### 🌐 **Proxy Issues:**
```
Symptoms: ❌ Proxy test failed
Solution:
1. Sprawdź credentials
2. Testuj manualnie: curl -x proxy:port http://httpbin.org/ip
3. Dodaj więcej proxy
4. Wyłącz jeśli niepotrzebne
```

### 💾 **Memory Issues:**
```
Symptoms: JavaScript heap out of memory
Solution:
1. Zwiększ limit: --max-old-space-size=4096
2. Czyść cache regularnie
3. Monitoruj RAM usage
4. Restart co 24h
```

### 🖥️ **Chrome Issues:**
```
Symptoms: Failed to launch browser
Solution:
1. Zainstaluj dependencies: sudo apt-get install libgbm-dev
2. Użyj headless: headless: "new"
3. Sprawdź Chrome path
4. Update Chrome/Chromium
```

---

## 📞 **Kontakt i Wsparcie**

### 📋 **Przed kontaktem:**
- [ ] Sprawdź logi (`tail -f *.log`)
- [ ] Przeczytaj troubleshooting
- [ ] Zbierz error messages
- [ ] Sprawdź GitHub issues

### 📧 **Contact Info:**
- **GitHub Issues:** https://github.com/badibadey/puppeteer-demo/issues
- **Documentation:** README.md
- **Quick Start:** USAGE-GUIDE.md
- **Installation:** ./install.sh

---

## ✅ **Final Checklist**

### 🚀 **Gotowość do Produkcji:**
- [ ] System requirements spełnione
- [ ] Config poprawnie skonfigurowany
- [ ] Test stealth passed
- [ ] Słowa kluczowe zoptymalizowane
- [ ] Proxy skonfigurowane (jeśli potrzebne)
- [ ] Harmonogram godzin ustawiony
- [ ] Monitoring skonfigurowany
- [ ] Backup plan stworzony
- [ ] Dokumentacja przeczytana

### 🎯 **Uruchomienie:**
```bash
# Final check
./test-bot.sh

# Start production
./start-bot.sh

# Monitor
./monitor-bot.sh
```

---

**🏆 Bot jest gotowy do pracy! System automatycznie zarządza sesjami i optymalizuje zachowania.**

---

*Checklist aktualizowany: Styczeń 2026*
*Wersja: 2.0 Advanced Anti-Bot*
