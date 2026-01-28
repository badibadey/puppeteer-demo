# 🚀 Oficjalna Instrukcja Instalacji i Konfiguracji

## 📋 Spis Treści

1. [Wymagania Wstępne](#wymagania-wstępne)
2. [Instalacja Krok po Kroku](#instalacja-krok-po-kroku)
3. [Konfiguracja Kont Facebook](#konfiguracja-kont-facebook)
4. [Uruchomienie Botów](#uruchomienie-botów)
5. [Monitorowanie i Zarządzanie](#monitorowanie-i-zarządzanie)
6. [Rozwiązywanie Problemów](#rozwiązywanie-problemów)

---

## 🔧 Wymagania Wstępne

### System Requirements:
- **Node.js 16+** (zalecane 18+)
- **Chrome/Chromium** browser
- **Minimum 2GB RAM**
- **Stabilne połączenie internetowe**
- **macOS/Linux/Windows**

### Sprawdź Wymagania:
```bash
# Sprawdź Node.js
node -v  # Powinno pokazać v16.0.0+

# Sprawdź Chrome
google-chrome --version  # Linux
# lub otwórz Chrome na macOS/Windows

# Sprawdź RAM
free -h  # Linux
# lub Activity Monitor (macOS)
```

---

## 📦 Instalacja Krok po Kroku

### Krok 1: Klonuj Projekt
```bash
git clone https://github.com/badibadey/puppeteer-demo.git
cd puppeteer-demo
```

### Krok 2: Zainstaluj Dependencies
```bash
npm install
```

### Krok 3: Uruchom Setup Automatyczny
```bash
# Kompletny setup wszystkich folderów i kont
./setup-multi-account.sh

# Następnie setup browser isolation
./setup-browser-isolation.sh
```

### Krok 4: Sprawdź Instalację
```bash
# Quick fix sprawdza wszystko
./quick-fix.sh

# Status kont powinien pokazać:
# Total accounts: 2
# Active accounts: 0 (brak cookies - normalne)
```

---

## 🍪 Konfiguracja Kont Facebook

### Krok 5: Zdobądź Cookies dla Scanner Account

#### 5.1 Zaloguj się na Facebooka:
1. **Otwórz Chrome** w trybie incognito
2. **Zaloguj się** na konto: `scanner@example.com`
3. **Zainstaluj rozszerzenie**: "Get cookies.txt LOCALLY"
4. **Przejdź na Facebooka** i upewnij się że jesteś zalogowany

#### 5.2 Eksportuj Cookies:
1. **Kliknij ikonę rozszerzenia** "Get cookies.txt LOCALLY"
2. **Wybierz "Current Site"**
3. **Kliknij "Export"**
4. **Zapisz plik** jako `cookies.txt`

#### 5.3 Umieść Cookies:
```bash
# Skopiuj plik cookies do odpowiedniego folderu
cp ~/Downloads/cookies.txt accounts/scanner-account/fb-session/cookies.json
```

### Krok 6: Zdobądź Cookies dla Screenshot Account

#### 6.1 Zaloguj się na Drugie Konto:
1. **Otwórz nowe okno Chrome** (tryb incognito)
2. **Zaloguj się** na konto: `screenshot@example.com`
3. **Zainstaluj "Get cookies.txt LOCALLY"** (jeśli nie masz)

#### 6.2 Eksportuj i Umieść Cookies:
```bash
# Eksportuj cookies i zapisz jako
cp ~/Downloads/cookies.txt accounts/screenshot-account/fb-session/cookies.json
```

### Krok 7: Sprawdź Konfigurację
```bash
./manage-accounts.sh status
```

**Powinieneś pokazać:**
```
Total accounts: 2
Active accounts: 2  # ✅ Oba konta mają cookies
📁 scanner-account (scanner)
   Status: ready
   Cookies: ✅
📁 screenshot-account (screenshot)
   Status: ready  
   Cookies: ✅
```

---

## ⚙️ Konfiguracja Botów

### Krok 8: Skonfiguruj Grupy Facebooka

#### 8.1 Edytuj `config/scraper.json`:
```bash
nano config/scraper.json
```

#### 8.2 Dodaj swoje grupy:
```json
{
    "groups": [
        {
            "url": "https://www.facebook.com/groups/twoja-grupa-1",
            "name": "twoja-grupa-1"
        },
        {
            "url": "https://www.facebook.com/groups/twoja-grupa-2", 
            "name": "twoja-grupa-2"
        }
    ],
    "n8n": {
        "webhookUrl": "https://twoj-n8n.pl/webhook/fb-scraper"
    }
}
```

### Krok 9: Skonfiguruj Słowa Kluczowe

#### 9.1 Edytuj `config/keywords.json`:
```bash
nano config/keywords.json
```

#### 9.2 Dodaj słowa kluczowe:
```json
{
    "categories": {
        "legalizacja": {
            "keywords": [
                "karta pobytu",
                "visa", 
                "zezwolenie na pobyt",
                "legalizacja",
                "residence card"
            ]
        },
        "tlumaczenia": {
            "keywords": [
                "tłumacz",
                "tłumaczenie",
                "przysięgły",
                "certified translation"
            ]
        }
    }
}
```

---

## 🚀 Uruchomienie Botów

### Krok 10: Test Stealth
```bash
node test-stealth.js
```

**Może pokazać ostrzeżenia - to normalne.**

### Krok 11: Uruchom Boty

#### 11.1 Uruchom Scanner Bot:
```bash
# Terminal 1
node fb-scanner-bot.js
```

#### 11.2 Uruchom Screenshot Bot:
```bash
# Terminal 2  
node fb-screenshot-bot.js
```

#### 11.3 Obserwuj Logi:
```
🚀 Uruchamianie Facebook Bot v2.0 z Distributed Architecture...
🔄 Initializing Distributed Coordinator (Instance: bot_1234567890_abc)
✅ Distributed Coordinator initialized - Coordinator
🎯 Sesja: twoja-grupa-1 (https://www.facebook.com/groups/twoja-grupa-1)
🌐 Utworzono profil przeglądarki: accounts/scanner-account/browser-profile
🔧 Fingerprint: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
📱 Rozdzielczość: 1366x768
🍪 Załadowano cookies dla: scanner-account
🎯 TRAFIENIE: [Jan Kowalski] "Potrzebuję pomocy z wizą"
📊 Raport sesji (twoja-grupa-1): Nowe: 2, Pominięte: 15, Razem: 17, Efektywność: 11.8%
✅ Sesja zakończona sukcesem
```

---

## 📊 Monitorowanie i Zarządzanie

### Krok 12: Monitoruj Status Kont
```bash
./manage-accounts.sh status
```

### Krok 13: Sprawdź Procesy Chrome
```bash
ps aux | grep -i chrome | grep -v grep
```

**Powinieneś pokazać 2 oddzielne procesy Chrome:**
```
/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --user-data-dir=.../scanner-account/browser-profile
/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --user-data-dir=.../screenshot-account/browser-profile
```

### Krok 14: Zarządzaj Kontami
```bash
# Pokaż wszystkie komendy
./manage-accounts.sh

# Status kont
./manage-accounts.sh status

# Instrukcje setup
./manage-accounts.sh setup

# Czyszczenie cache
./manage-accounts.sh clean

# Test browser isolation
./manage-accounts.sh test
```

---

## 🔧 Rozwiązywanie Problemów

### Problem 1: "Nie znaleziono modułu"
```bash
# Rozwiązanie:
npm install
./quick-fix.sh
```

### Problem 2: "Brak cookies"
```bash
# Sprawdź status:
./manage-accounts.sh status

# Dodaj cookies:
cp ~/Downloads/cookies.txt accounts/scanner-account/fb-session/cookies.json
cp ~/Downloads/cookies.txt accounts/screenshot-account/fb-session/cookies.json
```

### Problem 3: "Stealth plugin failed"
```bash
# To normalne, bot będzie działał mimo to
# Jeśli bot się nie uruchamia:
npm update puppeteer puppeteer-extra-plugin-stealth
```

### Problem 4: "Błąd ścieżki folderu"
```bash
# Sprawdź strukturę:
ls -la accounts/
ls -la accounts/scanner-account/
ls -la accounts/screenshot-account/

# Jeśli brakuje folderów:
./setup-multi-account.sh
```

### Problem 5: "Bot się zamyka"
```bash
# Sprawdź logi błędów:
tail -f logs/*.log

# Sprawdź status kont:
./manage-accounts.sh status

# Wyczyść i spróbuj ponownie:
./manage-accounts.sh clean
```

---

## 🎯 Wskazówki Optymalizacji

### Czas Pracy Botów:
- **Poniedziałek - Piątek:** 8:00 - 22:00
- **Sobota:** 9:00 - 18:00  
- **Niedziela:** 10:00 - 16:00

### Limity Bezpieczeństwa:
- **Max postów na sesję:** 5-25 (losowo)
- **Interwały między sesjami:** 10-45 minut (losowo)
- **Maksymalna aktywność:** 3 sesje na godzinę

### Monitorowanie Ryzyka:
- **Green (<30%):** Normalna praca
- **Yellow (30-60%):** Zwiększaj przerwy
- **Red (>60%):** Zatrzymaj na 2-3 godziny

---

## 📞 Wsparcie i Pomoc

### Dokumentacja:
- **README.md** - Pełna dokumentacja techniczna
- **USAGE-GUIDE.md** - Przewodnik użytkowania
- **CHECKLIST.md** - Checklist przed wdrożeniem
- **ROADMAP.md** - Plan rozwoju

### Skrypty Pomocnicze:
```bash
./quick-fix.sh          # Diagnoza i naprawa
./manage-accounts.sh     # Zarządzanie kontami
./setup-multi-account.sh # Ponowna instalacja
```

### GitHub Issues:
- **Report bugs:** https://github.com/badibadey/puppeteer-demo/issues
- **Feature requests:** https://github.com/badibadey/puppeteer-demo/issues/new

---

## 🎉 Gratulacje!

Jeśli dotarłeś do tego miejsca i wszystko działa, masz:

✅ **Pełny system multi-account** z oddzielnymi przeglądarkami  
✅ **Enterprise-grade anti-bot protection** z behavioral intelligence  
✅ **Stateful scanning** z bazą Supabase  
✅ **Fault tolerance** i distributed architecture  
✅ **Kompletne narzędzia zarządzania** i monitoringu  

**Twój system jest teraz gotowy do produkcji!** 🚀

---

*Instrukcja aktualizowana: Styczeń 2026*  
*Wersja: 2.0 Multi-Account Browser Isolation*
