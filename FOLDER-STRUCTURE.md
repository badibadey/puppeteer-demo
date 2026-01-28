# 🗂️ Struktura Folderów Facebook Bot v2.0

## 📁 Kompletna Struktura Projektu

```
puppeteer-demo/
├── 📄 fb-scanner-bot.js          # Główny bot
├── 📄 fb-screenshot-bot.js       # Bot screenshotów
├── 📄 test-stealth.js           # Test stealth
├── 📄 setup-folders.sh          # Skrypt tworzenia folderów
│
├── 📁 config/                   # Konfiguracja
│   ├── scraper.json             # Główna konfiguracja bota
│   └── keywords.json            # Słowa kluczowe
│
├── 📁 lib/                      # Moduły bota
│   ├── human-behavior.js        # Zachowania ludzkie
│   ├── session-manager.js       # Zarządzanie sesjami
│   ├── device-fingerprint.js    # Fingerprinting urządzenia
│   ├── proxy-rotation.js        # Rotacja proxy
│   ├── human-idle-behaviors.js  # Zachowania bezczynności
│   ├── human-error-simulation.js # Symulacja błędów
│   ├── cache-manager.js         # Zarządzanie cache
│   ├── behavioral-learning.js    # Uczenie się wzorców
│   ├── risk-prediction.js       # Przewidywanie ryzyka
│   ├── stateful-scanner.js      # Stateful scanning
│   ├── fault-tolerance.js       # Odporność na awarie
│   └── distributed-coordinator.js # Koordynator rozproszony
│
├── 📁 fb-session/               # Sesje Facebooka ⭐
│   ├── .gitignore               # Ignoruj pliki w Git
│   └── cookies.json             # Cookies Facebooka (DO UZUPEŁNIENIA)
│
├── 📁 cache/                    # Cache postów i URL ⭐
│   ├── .gitignore               # Ignoruj pliki w Git
│   ├── processed_posts.json     # Przetworzone posty
│   └── visited_urls.json        # Odwiedzone URL
│
├── 📁 learning-data/            # Dane uczenia się ⭐
│   ├── .gitignore               # Ignoruj pliki w Git
│   ├── behavioral-patterns.json # Wzorce zachowań
│   ├── session-history.json     # Historia sesji
│   └── success-metrics.json     # Metryki sukcesu
│
├── 📁 screenshots/              # Zrzuty ekranu ⭐
│   └── .gitignore               # Ignoruj pliki w Git
│
├── 📁 shared-state/              # Współdzielony stan ⭐
│   ├── .gitignore               # Ignoruj pliki w Git
│   ├── coordinator.lock         # Lock koordynatora
│   └── shared-state.json        # Stan współdzielony
│
├── 📁 logs/                     # Logi systemowe ⭐
│   └── .gitignore               # Ignoruj pliki w Git
│
├── 📁 temp/                     # Pliki tymczasowe ⭐
│   └── .gitignore               # Ignoruj pliki w Git
│
├── 📁 backups/                  # Kopie zapasowe ⭐
│   └── .gitignore               # Ignoruj pliki w Git
│
└── 📁 frontend/                 # Dashboard (opcjonalnie)
    └── ...                      # Pliki frontend
```

---

## 🎯 **Jak Utworzyć Foldery - 3 Sposoby:**

### **1. 🚀 Automatyczny (Zalecane)**
```bash
# Uruchom skrypt
./setup-folders.sh
```

### **2. 🛠️ Manualny**
```bash
# Tworzenie folderów
mkdir -p fb-session cache learning-data screenshots shared-state logs temp backups

# Tworzenie .gitignore
echo "*" > fb-session/.gitignore
echo "*" > cache/.gitignore
echo "*" > learning-data/.gitignore
echo "*" > screenshots/.gitignore
echo "*" > shared-state/.gitignore
echo "*" > logs/.gitignore
echo "*" > temp/.gitignore
echo "*" > backups/.gitignore

# Ustaw uprawnienia
chmod 755 fb-session cache learning-data screenshots shared-state logs temp backups
```

### **3. 📦 Razem z Instalacją**
```bash
# W głównym skrypcie install.sh
# Foldery są tworzone automatycznie
./install.sh
```

---

## 📋 **Co Każdy Folder Zawiera:**

### **🍪 `fb-session/` - Sesje Facebooka**
- **`cookies.json`** - Cookies Facebooka (DO UZUPEŁNIENIA)
- **Stan logowania** - utrzymuje sesję między uruchomieniami
- **Security** - chronione przez .gitignore

### **💾 `cache/` - Cache System**
- **`processed_posts.json`** - ID przetworzonych postów
- **`visited_urls.json`** - Odwiedzone URL
- **Optymalizacja** - unika duplikatów
- **Auto-cleanup** - usuwa stare wpisy

### **🧠 `learning-data/` - Uczenie Się**
- **`behavioral-patterns.json`** - Wzorce zachowań
- **`session-history.json`** - Historia sesji
- **`success-metrics.json`** - Metryki sukcesu
- **AI Integration** - dane dla ML

### **📸 `screenshots/` - Zrzuty Ekranu**
- **Post screenshots** - zrzuty znalezionych postów
- **Debug** - pomocne w analizie problemów
- **Evidence** - dowody przetwarzania

### **🌐 `shared-state/` - Distributed Architecture**
- **`coordinator.lock`** - lock koordynatora
- **`shared-state.json`** - stan współdzielony
- **Multi-instance** - synchronizacja między botami

### **📝 `logs/` - Logi Systemowe**
- **Debug logs** - szczegółowe logi bota
- **Error logs** - logi błędów
- **Performance logs** - metryki wydajności

### **🗂️ `temp/` - Pliki Tymczasowe**
- **Temporary files** - pliki tymczasowe
- **Auto-cleanup** - czyszczone przy starcie
- **Working files** - pliki robocze

### **💿 `backups/` - Kopie Zapasowe**
- **Config backups** - kopie konfiguracji
- **Data backups** - kopie ważnych danych
- **Recovery** - przywracanie po awarii

---

## 🔐 **Bezpieczeństwo i Git:**

### **.gitignore w każdym folderze:**
```gitignore
# Ignore all files in this directory
*
# But track this .gitignore file
!.gitignore
```

### **Dlaczego to ważne:**
- **🍪 Cookies** - dane logowania NIGDY w repozytorium
- **🧠 Learning data** - dane osobowe i wzorce
- **💾 Cache** - dane użytkowników
- **📸 Screenshots** - prywatne treści
- **📝 Logs** - mogą zawierać wrażliwe dane

---

## 🚀 **Szybki Start:**

### **1. Uruchom skrypt:**
```bash
./setup-folders.sh
```

### **2. Zdobądź cookies:**
```bash
# 1. Zaloguj się na Facebooka w Chrome
# 2. Zainstaluj rozszerzenie "Get cookies.txt LOCALLY"
# 3. Eksportuj cookies
# 4. Zapisz jako: fb-session/cookies.json
```

### **3. Skonfiguruj bota:**
```bash
# Edytuj konfigurację
nano config/scraper.json
nano config/keywords.json
```

### **4. Uruchom bota:**
```bash
node fb-scanner-bot.js
```

---

## 📊 **Monitorowanie Folderów:**

### **Sprawdź rozmiary:**
```bash
du -sh fb-session/ cache/ learning-data/ screenshots/ logs/
```

### **Czyszczenie:**
```bash
# Cache (starsze niż 7 dni)
find cache/ -name "*.json" -mtime +7 -delete

# Logi (starsze niż 30 dni)
find logs/ -name "*.log" -mtime +30 -delete

# Temp (wszystkie)
rm -rf temp/*
```

### **Backup:**
```bash
# Backup konfiguracji
cp config/ scraper.json backups/scraper-$(date +%Y%m%d).json

# Backup learning data
cp -r learning-data/ backups/learning-data-$(date +%Y%m%d)/
```

---

## ⚠️ **Ważne Uwagi:**

### **🚫 NIGDY w repozytorium:**
- `fb-session/cookies.json` - dane logowania
- `cache/` - dane użytkowników
- `learning-data/` - wzorce zachowań
- `screenshots/` - prywatne treści
- `logs/` - może zawierać wrażliwe dane

### **✅ ZAWSZE w repozytorium:**
- `config/` - pliki konfiguracyjne (bez danych osobowych)
- `lib/` - kod źródłowy
- `*.md` - dokumentacja
- `package.json` - dependencies

### **🔄 Regularne czynności:**
- **Dzienny:** sprawdź rozmiary folderów
- **Tygodniowy:** backup konfiguracji
- **Miesięczny:** czyszczenie starych danych
- **Kwartalny:** archiwizacja logów

---

## 🎯 **Gotowe!**

**✅ Wszystkie foldery utworzone z odpowiednimi uprawnieniami i .gitignore!**

**Teraz możesz:**
1. Uzupełnić `fb-session/cookies.json`
2. Skonfigurować `config/`
3. Uruchomić bota

**System jest w pełni przygotowany do pracy!** 🚀
