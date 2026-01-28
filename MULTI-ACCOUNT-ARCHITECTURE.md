# 🔄 Multi-Account Architecture - Cache & Session Management

## 🎯 **Problem: Dwa Boty, Jedne Cache**

Masz rację! Obecnie oba boty (`fb-scanner-bot.js` i `fb-screenshot-bot.js`) używają:
- **Tego samego folderu `fb-session/`** - cookies z jednego konta
- **Tego samego folderu `cache/`** - wspólny cache postów
- **Tego samego folderu `learning-data/`** - wspólne uczenie się

To powoduje problemy przy różnych kontach Facebooka.

---

## 🏗️ **Rozwiązanie: Multi-Account Architecture**

### **1. 📁 Struktura Folderów per Konto:**

```
puppeteer-demo/
├── accounts/                    # 🆕 Folder kont
│   ├── scanner-account/        # Konto do skanowania
│   │   ├── fb-session/          # Cookies tego konta
│   │   ├── cache/               # Cache tego konta
│   │   ├── learning-data/       # Learning tego konta
│   │   └── screenshots/         # Screenshots tego konta
│   │
│   └── screenshot-account/      # Konto do screenshotów
│       ├── fb-session/          # Cookies tego konta
│       ├── cache/               # Cache tego konta
│       ├── learning-data/       # Learning tego konta
│       └── screenshots/         # Screenshots tego konta
│
├── shared/                      # 🆕 Współdzielone zasoby
│   ├── config/                  # Konfiguracja wspólna
│   └── logs/                    # Logi systemowe
│
└── lib/                         # Biblioteki (bez zmian)
```

---

### **2. 🔧 Konfiguracja Kont:**

#### **`accounts/scanner-account/config.json`:**
```json
{
    "accountType": "scanner",
    "accountName": "scanner-account",
    "facebookProfile": {
        "email": "scanner@example.com",
        "name": "Scanner Bot"
    },
    "paths": {
        "session": "../accounts/scanner-account/fb-session",
        "cache": "../accounts/scanner-account/cache",
        "learning": "../accounts/scanner-account/learning-data",
        "screenshots": "../accounts/scanner-account/screenshots"
    }
}
```

#### **`accounts/screenshot-account/config.json`:**
```json
{
    "accountType": "screenshot",
    "accountName": "screenshot-account",
    "facebookProfile": {
        "email": "screenshot@example.com",
        "name": "Screenshot Bot"
    },
    "paths": {
        "session": "../accounts/screenshot-account/fb-session",
        "cache": "../accounts/screenshot-account/cache",
        "learning": "../accounts/screenshot-account/learning-data",
        "screenshots": "../accounts/screenshot-account/screenshots"
    }
}
```

---

### **3. 🚀 Modyfikacja Botów:**

#### **`fb-scanner-bot.js` - z kontem:**
```javascript
// Na początku pliku
const accountConfig = require('./accounts/scanner-account/config.json');

// Dynamiczne ścieżki
const SESSION_PATH = path.join(__dirname, accountConfig.paths.session, 'cookies.json');
const CACHE_PATH = path.join(__dirname, accountConfig.paths.cache);
const LEARNING_PATH = path.join(__dirname, accountConfig.paths.learning);

// Inicjalizacja z odpowiednimi ścieżkami
const cacheManager = new CacheManager(CACHE_PATH);
const behavioralLearning = new BehavioralLearning(LEARNING_PATH);
```

#### **`fb-screenshot-bot.js` - z kontem:**
```javascript
// Na początku pliku
const accountConfig = require('./accounts/screenshot-account/config.json');

// Dynamiczne ścieżki
const SCREENSHOTS_DIR = path.join(__dirname, accountConfig.paths.screenshots);
const COOKIES_PATH = path.join(__dirname, accountConfig.paths.session, 'cookies.json');
```

---

### **4. 🔄 Account Manager:**

#### **`lib/account-manager.js`:**
```javascript
class AccountManager {
    constructor() {
        this.accounts = new Map();
        this.loadAccounts();
    }

    loadAccounts() {
        const accountsPath = path.join(__dirname, '../accounts');
        const accountFolders = fs.readdirSync(accountsPath);
        
        for (const folder of accountFolders) {
            const configPath = path.join(accountsPath, folder, 'config.json');
            if (fs.existsSync(configPath)) {
                const config = require(configPath);
                this.accounts.set(config.accountName, config);
            }
        }
    }

    getAccount(accountName) {
        return this.accounts.get(accountName);
    }

    getScannerAccount() {
        return Array.from(this.accounts.values())
            .find(acc => acc.accountType === 'scanner');
    }

    getScreenshotAccount() {
        return Array.from(this.accounts.values())
            .find(acc => acc.accountType === 'screenshot');
    }

    createAccountPaths(accountConfig) {
        Object.values(accountConfig.paths).forEach(folderPath => {
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }
        });
    }
}

module.exports = AccountManager;
```

---

### **5. 📋 Setup Script dla Multi-Account:**

#### **`setup-multi-account.sh`:**
```bash
#!/bin/bash

echo "🔄 Multi-Account Setup Script"
echo "============================"

PROJECT_ROOT="$(pwd)"

# Tworzenie struktury kont
create_account() {
    local account_name="$1"
    local account_type="$2"
    local email="$3"
    
    local account_path="$PROJECT_ROOT/accounts/$account_name"
    
    echo "📁 Tworzę konto: $account_name ($account_type)"
    
    # Tworzenie folderów
    mkdir -p "$account_path"/{fb-session,cache,learning-data,screenshots}
    
    # .gitignore dla każdego folderu
    for folder in fb-session cache learning-data screenshots; do
        echo "*" > "$account_path/$folder/.gitignore"
        echo "!.gitignore" >> "$account_path/$folder/.gitignore"
    done
    
    # Config konta
    cat > "$account_path/config.json" << EOF
{
    "accountType": "$account_type",
    "accountName": "$account_name",
    "facebookProfile": {
        "email": "$email",
        "name": "$account_name"
    },
    "paths": {
        "session": "../accounts/$account_name/fb-session",
        "cache": "../accounts/$account_name/cache",
        "learning": "../accounts/$account_name/learning-data",
        "screenshots": "../accounts/$account_name/screenshots"
    }
}
EOF
    
    # Przykładowy cookies
    cat > "$account_path/fb-session/cookies.json.example" << EOF
{
    "example": "To jest przykładowy plik cookies dla konta: $account_name",
    "instructions": [
        "1. Zaloguj się na Facebooka na koncie: $email",
        "2. Wyeksportuj cookies",
        "3. Zapisz jako cookies.json w tym folderze"
    ]
}
EOF
    
    echo "✅ Utworzono konto: $account_name"
}

# Tworzenie kont
create_account "scanner-account" "scanner" "scanner@example.com"
create_account "screenshot-account" "screenshot" "screenshot@example.com"

# Współdzielony folder
mkdir -p "$PROJECT_ROOT/shared/logs"
echo "*" > "$PROJECT_ROOT/shared/logs/.gitignore"
echo "!.gitignore" >> "$PROJECT_ROOT/shared/logs/.gitignore"

echo ""
echo "🎉 Multi-Account setup gotowy!"
echo ""
echo "📋 Następne kroki:"
echo "1. Zaloguj się na konto scanner@example.com"
echo "2. Zapisz cookies jako: accounts/scanner-account/fb-session/cookies.json"
echo "3. Zaloguj się na konto screenshot@example.com"
echo "4. Zapisz cookies jako: accounts/screenshot-account/fb-session/cookies.json"
echo "5. Uruchom boty:"
echo "   node fb-scanner-bot.js"
echo "   node fb-screenshot-bot.js"
```

---

### **6. 🔄 Distributed Architecture z Multi-Account:**

#### **Każdy bot używa swojego konta:**
```javascript
// W fb-scanner-bot.js
const accountManager = new AccountManager();
const scannerAccount = accountManager.getScannerAccount();

// Inicjalizacja z kontem
const cacheManager = new CacheManager(scannerAccount.paths.cache);
const statefulScanner = new StatefulScanner(supabase, CONFIG, scannerAccount);
```

#### **Współdzielony stan tylko dla critical danych:**
```javascript
// Tylko critical data jest współdzielone
const sharedState = {
    distributed: true,  // Koordynacja między botami
    learning: false,   // Każde konto uczy się osobno
    cache: false       // Każde konto ma własny cache
};
```

---

### **7. 📊 Zalety Multi-Account:**

#### **✅ Bezpieczeństwo:**
- **Separacja cookies** - każde konto ma własne sesje
- **Izolacja cache** - brak konfliktów między kontami
- **Niezależne learning** - każde konto uczy się osobno

#### **✅ Wydajność:**
- **Równoległość** - oba boty mogą działać jednocześnie
- **Brak konfliktów** - żadne współdzielone zasoby
- **Skalowalność** - łatwo dodać więcej kont

#### **✅ Zarządzanie:**
- **Clear separation** - każde konto ma własną konfigurację
- **Independent operation** - awaria jednego konta nie wpływa na drugie
- **Easy monitoring** - osobne logi per konto

---

### **8. 🚀 Quick Start z Multi-Account:**

#### **1. Setup:**
```bash
# Uruchom setup
./setup-multi-account.sh

# Zaloguj się na oba konta i zapisz cookies
```

#### **2. Uruchomienie:**
```bash
# Bot skanujący (używa scanner-account)
node fb-scanner-bot.js

# Bot screenshotów (używa screenshot-account)
node fb-screenshot-bot.js
```

#### **3. Monitorowanie:**
```bash
# Logi scanner-account
tail -f accounts/scanner-account/logs/*.log

# Logi screenshot-account
tail -f accounts/screenshot-account/logs/*.log
```

---

## 🎯 **Podsumowanie:**

**Problem:** Oba boty używają tych samych zasobów → konflikty

**Rozwiązanie:** Multi-Account Architecture:
- 📁 Oddzielne foldery per konto
- 🔧 Oddzielne cookies per konto
- 💾 Oddzielny cache per konto
- 🧠 Oddzielne learning per konto
- 🤝 Współdzielone tylko critical elements

**Korzyści:**
- ✅ Bezpieczeństwo i izolacja
- ✅ Brak konfliktów cache
- ✅ Równoległa praca
- ✅ Łatwe zarządzanie

**Chcesz żebym zaimplementował tę architekturę?**
