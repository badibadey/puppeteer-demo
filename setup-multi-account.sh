#!/bin/bash

# 🔄 Multi-Account Setup Script - Facebook Bot
# Tworzy oddzielną architekturę dla każdego konta

echo "🔄 Multi-Account Setup Script"
echo "============================"

PROJECT_ROOT="$(pwd)"
ACCOUNTS_ROOT="$PROJECT_ROOT/accounts"

# Sprawdź czy jesteśmy w odpowiednim folderze
if [ ! -f "package.json" ]; then
    echo "❌ Błąd: Nie znaleziono package.json. Przejdź do folderu projektu."
    exit 1
fi

echo "📁 Folder projektu: $PROJECT_ROOT"

# Tworzenie głównej struktury
echo ""
echo "🏗️ Tworzenie struktury kont..."

mkdir -p "$ACCOUNTS_ROOT"
mkdir -p "$PROJECT_ROOT/shared/logs"

# Tworzenie folderów współdzielonych
echo "*" > "$PROJECT_ROOT/shared/logs/.gitignore"
echo "!.gitignore" >> "$PROJECT_ROOT/shared/logs/.gitignore"

# Funkcja tworzenia konta
create_account() {
    local account_name="$1"
    local account_type="$2"
    local email="$3"
    local description="$4"
    
    local account_path="$ACCOUNTS_ROOT/$account_name"
    
    echo "📁 Tworzę konto: $account_name ($account_type) - $description"
    
    # Tworzenie folderów konta
    mkdir -p "$account_path"/{fb-session,cache,learning-data,screenshots,logs}
    
    # .gitignore dla każdego folderu z danymi
    for folder in fb-session cache learning-data screenshots logs; do
        cat > "$account_path/$folder/.gitignore" << EOF
# Ignore all files in this directory
*
# But track this .gitignore file
!.gitignore
EOF
    done
    
    # Config konta
    cat > "$account_path/config.json" << EOF
{
    "accountType": "$account_type",
    "accountName": "$account_name",
    "accountDescription": "$description",
    "facebookProfile": {
        "email": "$email",
        "name": "$account_name"
    },
    "paths": {
        "session": "../accounts/$account_name/fb-session",
        "cache": "../accounts/$account_name/cache",
        "learning": "../accounts/$account_name/learning-data",
        "screenshots": "../accounts/$account_name/screenshots",
        "logs": "../accounts/$account_name/logs"
    },
    "capabilities": [
        "scraping",
        "processing"
    ],
    "settings": {
        "maxSessionsPerHour": 10,
        "maxPostsPerSession": 25,
        "enableScreenshots": true,
        "enableLearning": true
    }
}
EOF
    
    # Przykładowy cookies
    cat > "$account_path/fb-session/cookies.json.example" << EOF
{
    "example": "To jest przykładowy plik cookies dla konta: $account_name",
    "account": "$account_name",
    "email": "$email",
    "instructions": [
        "1. Zaloguj się na Facebooka na koncie: $email",
        "2. Użyj rozszerzenia 'Get cookies.txt LOCALLY'",
        "3. Wyeksportuj cookies",
        "4. Zapisz jako cookies.json w tym folderze",
        "5. Upewnij się że cookies zawierają ważne sesje Facebooka"
    ],
    "warning": "Nigdy nie umieszczaj tego pliku w repozytorium Git!"
}
EOF
    
    # README konta
    cat > "$account_path/README.md" << EOF
# Konto: $account_name

## Typ konta
- **Typ:** $account_type
- **Email:** $email
- **Opis:** $description

## Struktura folderów

### 🍪 fb-session/
- \`cookies.json\` - Cookies Facebooka (DO UZUPEŁNIENIA)
- Utrzymuje sesję logowania

### 💾 cache/
- \`processed_posts.json\` - Cache przetworzonych postów
- \`visited_urls.json\` - Cache odwiedzonych URL
- Unika duplikatów i optymalizuje wydajność

### 🧠 learning-data/
- \`behavioral-patterns.json\` - Wzorce zachowań
- \`session-history.json\` - Historia sesji
- \`success-metrics.json\` - Metryki sukcesu

### 📸 screenshots/
- Zrzuty ekranu znalezionych postów
- Pomocne w analizie i debugowaniu

### 📝 logs/
- Logi systemowe i debugowe
- Błędy i ostrzeżenia

## Użycie

1. **Zaloguj się** na Facebooka używając: $email
2. **Zapisz cookies** jako \`fb-session/cookies.json\`
3. **Uruchom odpowiedniego bota:**
   - \`node fb-scanner-bot.js\` (dla scanner-account)
   - \`node fb-screenshot-bot.js\` (dla screenshot-account)

## Bezpieczeństwo

- ✅ Wszystkie foldery są chronione przez .gitignore
- ✅ Cookies nigdy nie trafiają do repozytorium
- ✅ Każde konto ma oddzielne dane
- ✅ Brak konfliktów między kontami

## Monitorowanie

\`\`\`bash
# Sprawdź logi
tail -f logs/*.log

# Sprawdź rozmiar cache
du -sh cache/

# Sprawdź learning data
ls -la learning-data/
\`\`\`
EOF
    
    # Ustaw uprawnienia
    chmod -R 755 "$account_path"
    
    echo "✅ Utworzono konto: $account_name"
}

# Tworzenie kont
echo ""
echo "👥 Tworzenie kont..."

create_account "scanner-account" "scanner" "scanner@example.com" "Główne konto do skanowania grup Facebooka"
create_account "screenshot-account" "screenshot" "screenshot@example.com" "Konto do robienia screenshotów postów"

# Tworzenie Account Manager
echo ""
echo "🤖 Tworzenie Account Manager..."

cat > "$PROJECT_ROOT/lib/account-manager.js" << 'EOF'
console.log('✅ Loaded lib/account-manager.js');

const fs = require('fs');
const path = require('path');

/**
 * Account Manager - zarządza wieloma kontami Facebooka
 */
class AccountManager {
    constructor() {
        this.accounts = new Map();
        this.accountsPath = path.join(__dirname, '../accounts');
        this.loadAccounts();
    }

    /**
     * Ładuje wszystkie konta z folderu accounts/
     */
    loadAccounts() {
        try {
            if (!fs.existsSync(this.accountsPath)) {
                console.log('⚠️ Folder accounts/ nie istnieje');
                return;
            }

            const accountFolders = fs.readdirSync(this.accountsPath);
            
            for (const folder of accountFolders) {
                const configPath = path.join(this.accountsPath, folder, 'config.json');
                if (fs.existsSync(configPath)) {
                    try {
                        const config = require(configPath);
                        this.accounts.set(config.accountName, {
                            ...config,
                            folderPath: path.join(this.accountsPath, folder)
                        });
                        console.log(`✅ Załadowano konto: ${config.accountName}`);
                    } catch (error) {
                        console.error(`❌ Błąd ładowania konta ${folder}:`, error.message);
                    }
                }
            }
            
            console.log(`📊 Załadowano ${this.accounts.size} kont`);
            
        } catch (error) {
            console.error('❌ Błąd ładowania kont:', error);
        }
    }

    /**
     * Pobiera konto po nazwie
     */
    getAccount(accountName) {
        return this.accounts.get(accountName);
    }

    /**
     * Pobiera konto do skanowania
     */
    getScannerAccount() {
        return Array.from(this.accounts.values())
            .find(acc => acc.accountType === 'scanner');
    }

    /**
     * Pobiera konto do screenshotów
     */
    getScreenshotAccount() {
        return Array.from(this.accounts.values())
            .find(acc => acc.accountType === 'screenshot');
    }

    /**
     * Pobiera wszystkie konta
     */
    getAllAccounts() {
        return Array.from(this.accounts.values());
    }

    /**
     * Pobiera aktywne konta
     */
    getActiveAccounts() {
        return this.getAllAccounts().filter(account => {
            const cookiesPath = path.join(account.folderPath, 'fb-session', 'cookies.json');
            return fs.existsSync(cookiesPath);
        });
    }

    /**
     * Tworzy foldery dla konta
     */
    createAccountFolders(accountConfig) {
        Object.values(accountConfig.paths).forEach(folderPath => {
            const fullPath = path.resolve(__dirname, '..', folderPath);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
                console.log(`📁 Utworzono folder: ${fullPath}`);
            }
        });
    }

    /**
     * Sprawdza status konta
     */
    getAccountStatus(accountName) {
        const account = this.getAccount(accountName);
        if (!account) {
            return { status: 'not_found', message: 'Konto nie znalezione' };
        }

        const cookiesPath = path.join(account.folderPath, 'fb-session', 'cookies.json');
        const hasCookies = fs.existsSync(cookiesPath);
        
        const cachePath = path.join(account.folderPath, 'cache');
        const cacheSize = this.getFolderSize(cachePath);
        
        const learningPath = path.join(account.folderPath, 'learning-data');
        const learningSize = this.getFolderSize(learningPath);

        return {
            status: hasCookies ? 'ready' : 'needs_cookies',
            hasCookies,
            cacheSize,
            learningSize,
            accountType: account.accountType,
            email: account.facebookProfile.email
        };
    }

    /**
     * Pobiera rozmiar folderu
     */
    getFolderSize(folderPath) {
        try {
            if (!fs.existsSync(folderPath)) {
                return 0;
            }
            
            const files = fs.readdirSync(folderPath);
            let totalSize = 0;
            
            files.forEach(file => {
                const filePath = path.join(folderPath, file);
                const stats = fs.statSync(filePath);
                totalSize += stats.size;
            });
            
            return totalSize;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Generuje raport wszystkich kont
     */
    generateAccountReport() {
        const accounts = this.getAllAccounts();
        const report = {
            totalAccounts: accounts.length,
            activeAccounts: this.getActiveAccounts().length,
            accounts: []
        };

        accounts.forEach(account => {
            const status = this.getAccountStatus(account.accountName);
            report.accounts.push({
                name: account.accountName,
                type: account.accountType,
                email: account.facebookProfile.email,
                status: status.status,
                hasCookies: status.hasCookies,
                cacheSize: status.cacheSize,
                learningSize: status.learningSize
            });
        });

        return report;
    }

    /**
     * Przeładowuje konta
     */
    reloadAccounts() {
        this.accounts.clear();
        this.loadAccounts();
    }
}

module.exports = AccountManager;
EOF

# Tworzenie skryptu zarządzania kontami
echo ""
echo "🔧 Tworzenie skryptu zarządzania kontami..."

cat > "$PROJECT_ROOT/manage-accounts.sh" << 'EOF'
#!/bin/bash

# 🔧 Manage Accounts Script
# Zarządzanie kontami Facebooka

echo "🔧 Facebook Bot - Account Manager"
echo "==============================="

PROJECT_ROOT="$(pwd)"
cd "$PROJECT_ROOT"

case "$1" in
    "status")
        echo "📊 Status kont:"
        node -e "
const AccountManager = require('./lib/account-manager');
const manager = new AccountManager();
const report = manager.generateAccountReport();
console.log('Total accounts:', report.totalAccounts);
console.log('Active accounts:', report.activeAccounts);
console.log('');
report.accounts.forEach(acc => {
    console.log(\`📁 \${acc.name} (\${acc.type})\`);
    console.log(\`   Email: \${acc.email}\`);
    console.log(\`   Status: \${acc.status}\`);
    console.log(\`   Cookies: \${acc.hasCookies ? '✅' : '❌'}\`);
    console.log(\`   Cache: \${acc.cacheSize} bytes\`);
    console.log(\`   Learning: \${acc.learningSize} bytes\`);
    console.log('');
});
"
        ;;
    
    "list")
        echo "📋 Lista kont:"
        ls -la accounts/
        ;;
    
    "setup")
        echo "🔧 Setup指南:"
        echo ""
        echo "1. Zaloguj się na konto scanner:"
        echo "   Email: scanner@example.com"
        echo "   Zapisz cookies: accounts/scanner-account/fb-session/cookies.json"
        echo ""
        echo "2. Zaloguj się na konto screenshot:"
        echo "   Email: screenshot@example.com"
        echo "   Zapisz cookies: accounts/screenshot-account/fb-session/cookies.json"
        echo ""
        echo "3. Uruchom boty:"
        echo "   node fb-scanner-bot.js"
        echo "   node fb-screenshot-bot.js"
        ;;
    
    "clean")
        echo "🧹 Czyszczenie cache:"
        read -p "Czy na pewno wyczyścić cache wszystkich kont? (t/N): " confirm
        if [[ $confirm =~ ^[Tt]$ ]]; then
            for account in accounts/*/; do
                if [ -d "$account/cache" ]; then
                    echo "Czyszczę: $account/cache"
                    rm -f "$account/cache"/*.json
                fi
            done
            echo "✅ Cache wyczczony"
        fi
        ;;
    
    *)
        echo "Użycie: $0 [status|list|setup|clean]"
        echo ""
        echo "Komendy:"
        echo "  status  - Pokaż status wszystkich kont"
        echo "  list    - Lista folderów kont"
        echo "  setup   - Instrukcje setup"
        echo "  clean   - Wyczyść cache"
        ;;
esac
EOF

chmod +x "$PROJECT_ROOT/manage-accounts.sh"

# Modyfikacja głównych botów
echo ""
echo "🔧 Modyfikacja botów dla multi-account..."

# Modyfikacja fb-scanner-bot.js
if [ -f "$PROJECT_ROOT/fb-scanner-bot.js" ]; then
    # Dodaj import account manager na początku pliku
    sed -i.bak '1i\
const AccountManager = require("./lib/account-manager");' "$PROJECT_ROOT/fb-scanner-bot.js"
    
    # Zastąp ścieżki cookies dynamicznymi
    sed -i.bak 's|const SESSION_PATH = path.join(__dirname, '\''fb-session'\'', '\''cookies.json'\'');|// Dynamic paths from account manager\
const accountManager = new AccountManager();\
const scannerAccount = accountManager.getScannerAccount();\
if (!scannerAccount) {\
    console.error("❌ Nie znaleziono konfiguracji scanner-account");\
    process.exit(1);\
}\
const SESSION_PATH = path.join(__dirname, scannerAccount.paths.session, '\''cookies.json'\'');|' "$PROJECT_ROOT/fb-scanner-bot.js"
    
    echo "✅ Zmodyfikowano fb-scanner-bot.js"
fi

# Modyfikacja fb-screenshot-bot.js
if [ -f "$PROJECT_ROOT/fb-screenshot-bot.js" ]; then
    # Dodaj import account manager
    sed -i.bak '1i\
const AccountManager = require("./lib/account-manager");' "$PROJECT_ROOT/fb-screenshot-bot.js"
    
    # Zastąp ścieżki screenshots
    sed -i.bak 's|const SCREENSHOTS_DIR = path.join(__dirname, '\''screenshots'\'');|// Dynamic paths from account manager\
const accountManager = new AccountManager();\
const screenshotAccount = accountManager.getScreenshotAccount();\
if (!screenshotAccount) {\
    console.error("❌ Nie znaleziono konfiguracji screenshot-account");\
    process.exit(1);\
}\
const SCREENSHOTS_DIR = path.join(__dirname, screenshotAccount.paths.screenshots);|' "$PROJECT_ROOT/fb-screenshot-bot.js"
    
    # Zastąp ścieżkę cookies
    sed -i.bak 's|const cookiesPath = path.join(__dirname, '\''fb-session'\'', '\''cookies.json'\'');|const cookiesPath = path.join(__dirname, screenshotAccount.paths.session, '\''cookies.json'\'');|' "$PROJECT_ROOT/fb-screenshot-bot.js"
    
    echo "✅ Zmodyfikowano fb-screenshot-bot.js"
fi

echo ""
echo "🎉 Multi-Account setup zakończony!"
echo ""
echo "📁 Struktura folderów:"
tree "$ACCOUNTS_ROOT" -L 2 2>/dev/null || find "$ACCOUNTS_ROOT" -type d | head -10

echo ""
echo "📋 Następne kroki:"
echo "1. 🍪 Zaloguj się na oba konta:"
echo "   - scanner@example.com → accounts/scanner-account/fb-session/cookies.json"
echo "   - screenshot@example.com → accounts/screenshot-account/fb-session/cookies.json"
echo ""
echo "2. 🚀 Uruchom boty:"
echo "   node fb-scanner-bot.js"
echo "   node fb-screenshot-bot.js"
echo ""
echo "3. 📊 Zarządzaj kontami:"
echo "   ./manage-accounts.sh status"
echo "   ./manage-accounts.sh setup"
echo ""
echo "✅ Gotowe! Każdy bot używa teraz własnego konta."
