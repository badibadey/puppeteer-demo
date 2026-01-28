#!/bin/bash

# 🌐 Browser Isolation Setup Script
# Implementuje pełną separację przeglądarek dla multi-account architecture

echo "🌐 Browser Isolation Setup Script"
echo "================================="

PROJECT_ROOT="$(pwd)"
ACCOUNTS_ROOT="$PROJECT_ROOT/accounts"

# Sprawdź czy jesteśmy w odpowiednim folderze
if [ ! -f "package.json" ]; then
    echo "❌ Błąd: Nie znaleziono package.json. Przejdź do folderu projektu."
    exit 1
fi

echo "📁 Folder projektu: $PROJECT_ROOT"

# Sprawdź czy istnieje struktura kont
if [ ! -d "$ACCOUNTS_ROOT" ]; then
    echo "❌ Najpierw uruchom: ./setup-multi-account.sh"
    exit 1
fi

# Aktualizacja kont z browser profiles
echo ""
echo "🌐 Dodawanie browser profiles do kont..."

add_browser_profile() {
    local account_name="$1"
    local account_path="$ACCOUNTS_ROOT/$account_name"
    
    echo "🌐 Dodaję browser profile do: $account_name"
    
    # Tworzenie folderu browser-profile
    mkdir -p "$account_path/browser-profile"
    
    # .gitignore dla browser-profile
    cat > "$account_path/browser-profile/.gitignore" << 'EOF'
# Ignore all browser profile data
*
# But track this .gitignore file
!.gitignore
EOF
    
    # Aktualizacja config.json z browserProfile
    if [ -f "$account_path/config.json" ]; then
        # Dodaj browserProfile do paths
        sed -i.tmp 's|"screenshots": "../accounts/'$account_name'/screenshots"|"screenshots": "../accounts/'$account_name'/screenshots",\n        "browserProfile": "../accounts/'$account_name'/browser-profile"|' "$account_path/config.json"
        
        # Dodaj browserConfig
        sed -i.tmp 's|"settings": {|"browserConfig": {\n        "headless": false,\n        "windowSize": { "width": 1366, "height": 768 },\n        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"\n    },\n    "settings": {|' "$account_path/config.json"
        
        # Usuń pliki tymczasowe
        rm -f "$account_path/config.json.tmp"
        
        echo "✅ Zaktualizowano config.json dla: $account_name"
    else
        echo "❌ Nie znaleziono config.json dla: $account_name"
    fi
    
    # Ustaw uprawnienia
    chmod -R 755 "$account_path/browser-profile"
    
    echo "✅ Browser profile dodany do: $account_name"
}

# Dodaj browser profiles do obu kont
add_browser_profile "scanner-account"
add_browser_profile "screenshot-account"

# Enhanced Account Manager
echo ""
echo "🤖 Aktualizacja Account Manager z browser isolation..."

cat > "$PROJECT_ROOT/lib/account-manager.js" << 'EOF'
console.log('✅ Loaded lib/account-manager.js');

const fs = require('fs');
const path = require('path');

/**
 * Account Manager - zarządza wieloma kontami Facebooka z pełną separacją przeglądarek
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
     * 🆕 Pobiera opcje przeglądarki dla konta z pełną separacją
     */
    getBrowserOptions(accountConfig, additionalOptions = {}) {
        const browserProfilePath = path.resolve(__dirname, '..', accountConfig.paths.browserProfile);
        
        // Upewnij się że folder profilu istnieje
        if (!fs.existsSync(browserProfilePath)) {
            fs.mkdirSync(browserProfilePath, { recursive: true });
            console.log(`🌐 Utworzono profil przeglądarki: ${browserProfilePath}`);
        }
        
        const baseOptions = {
            headless: accountConfig.browserConfig?.headless || false,
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            userDataDir: browserProfilePath,  // 🗝️ Kluczowe: oddzielny profil!
            defaultViewport: accountConfig.browserConfig?.windowSize || { width: 1366, height: 768 },
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-background-networking',
                `--user-data-dir=${browserProfilePath}`
            ]
        };
        
        // Dodaj user agent jeśli skonfigurowany
        if (accountConfig.browserConfig?.userAgent) {
            baseOptions.args.push(`--user-agent=${accountConfig.browserConfig.userAgent}`);
        }
        
        return { ...baseOptions, ...additionalOptions };
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

        const browserProfilePath = path.join(account.folderPath, 'browser-profile');
        const browserProfileSize = this.getFolderSize(browserProfilePath);

        return {
            status: hasCookies ? 'ready' : 'needs_cookies',
            hasCookies,
            cacheSize,
            learningSize,
            browserProfileSize,
            accountType: account.accountType,
            email: account.facebookProfile.email,
            browserProfile: browserProfilePath
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
                learningSize: status.learningSize,
                browserProfileSize: status.browserProfileSize,
                browserProfile: status.browserProfile
            });
        });

        return report;
    }

    /**
     * Czyści profile przeglądarek
     */
    cleanBrowserProfiles() {
        const accounts = this.getAllAccounts();
        
        accounts.forEach(account => {
            const browserProfilePath = path.join(account.folderPath, 'browser-profile');
            
            if (fs.existsSync(browserProfilePath)) {
                try {
                    // Usuń zawartość profilu ale zachowaj folder
                    const files = fs.readdirSync(browserProfilePath);
                    files.forEach(file => {
                        const filePath = path.join(browserProfilePath, file);
                        const stats = fs.statSync(filePath);
                        
                        if (stats.isDirectory()) {
                            fs.rmSync(filePath, { recursive: true, force: true });
                        } else {
                            fs.unlinkSync(filePath);
                        }
                    });
                    
                    console.log(`🧹 Wyczyszczono profil przeglądarki: ${account.accountName}`);
                } catch (error) {
                    console.error(`❌ Błąd czyszczenia profilu ${account.accountName}:`, error);
                }
            }
        });
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

# Aktualizacja botów z browser isolation
echo ""
echo "🔧 Aktualizacja botów z browser isolation..."

# Modyfikacja fb-scanner-bot.js
if [ -f "$PROJECT_ROOT/fb-scanner-bot.js" ]; then
    # Backup oryginału
    cp "$PROJECT_ROOT/fb-scanner-bot.js" "$PROJECT_ROOT/fb-scanner-bot.js.backup-$(date +%Y%m%d)"
    
    # Dodaj importy na początku
    sed -i.tmp '1i\
const AccountManager = require("./lib/account-manager");' "$PROJECT_ROOT/fb-scanner-bot.js"
    
    # Zastąp dynamic paths
    sed -i.tmp 's|const accountManager = new AccountManager();|const accountManager = new AccountManager();\
const scannerAccount = accountManager.getScannerAccount();\
if (!scannerAccount) {\
    console.error("❌ Nie znaleziono konfiguracji scanner-account");\
    process.exit(1);\
}\
const SESSION_PATH = path.join(__dirname, scannerAccount.paths.session, '\''cookies.json'\'');|' "$PROJECT_ROOT/fb-scanner-bot.js"
    
    # Zastąp puppeteer.launch z browser options
    sed -i.tmp 's|browser = await puppeteer.launch(puppeteerOptions);|// 🆕 Browser isolation - użyj opcji z konta\
        const browserOptions = accountManager.getBrowserOptions(scannerAccount, puppeteerOptions);\
        browser = await puppeteer.launch(browserOptions);|' "$PROJECT_ROOT/fb-scanner-bot.js"
    
    # Usuń pliki tymczasowe
    rm -f "$PROJECT_ROOT/fb-scanner-bot.js.tmp"
    
    echo "✅ Zaktualizowano fb-scanner-bot.js z browser isolation"
fi

# Modyfikacja fb-screenshot-bot.js
if [ -f "$PROJECT_ROOT/fb-screenshot-bot.js" ]; then
    # Backup oryginału
    cp "$PROJECT_ROOT/fb-screenshot-bot.js" "$PROJECT_ROOT/fb-screenshot-bot.js.backup-$(date +%Y%m%d)"
    
    # Dodaj importy na początku
    sed -i.tmp '1i\
const AccountManager = require("./lib/account-manager");' "$PROJECT_ROOT/fb-screenshot-bot.js"
    
    # Dodaj account manager po require
    sed -i.tmp '/const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);/a\
\
// 🆕 Account manager dla multi-account\
const accountManager = new AccountManager();\
const screenshotAccount = accountManager.getScreenshotAccount();\
if (!screenshotAccount) {\
    console.error("❌ Nie znaleziono konfiguracji screenshot-account");\
    process.exit(1);\
}' "$PROJECT_ROOT/fb-screenshot-bot.js"
    
    # Zastąp SCREENSHOTS_DIR
    sed -i.tmp 's|const SCREENSHOTS_DIR = path.join(__dirname, '\''screenshots'\'');|const SCREENSHOTS_DIR = path.join(__dirname, screenshotAccount.paths.screenshots);|' "$PROJECT_ROOT/fb-screenshot-bot.js"
    
    # Zastąp cookiesPath
    sed -i.tmp 's|const cookiesPath = path.join(__dirname, '\''fb-session'\'', '\''cookies.json'\'');|const cookiesPath = path.join(__dirname, screenshotAccount.paths.session, '\''cookies.json'\'');|' "$PROJECT_ROOT/fb-screenshot-bot.js"
    
    # Zastąp puppeteer.launch z browser options
    sed -i.tmp 's|const browser = await puppeteer.launch({|// 🆕 Browser isolation - użyj opcji z konta\
    const browserOptions = accountManager.getBrowserOptions(screenshotAccount, {|' "$PROJECT_ROOT/fb-screenshot-bot.js"
    
    # Usuń pliki tymczasowe
    rm -f "$PROJECT_ROOT/fb-screenshot-bot.js.tmp"
    
    echo "✅ Zaktualizowano fb-screenshot-bot.js z browser isolation"
fi

# Aktualizacja manage-accounts.sh
echo ""
echo "📊 Aktualizacja manage-accounts.sh z browser info..."

cat > "$PROJECT_ROOT/manage-accounts.sh" << 'EOF'
#!/bin/bash

# 🔧 Manage Accounts Script z Browser Isolation
# Zarządzanie kontami Facebooka z pełną separacją przeglądarek

echo "🔧 Facebook Bot - Account Manager (Browser Isolation)"
echo "================================================="

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
    console.log(\`   Browser Profile: \${acc.browserProfileSize} bytes\`);
    console.log(\`   Profile Path: \${acc.browserProfile}\`);
    console.log('');
});
"
        ;;
    
    "list")
        echo "📋 Lista kont:"
        ls -la accounts/
        echo ""
        echo "🌐 Browser profiles:"
        find accounts/ -name "browser-profile" -type d
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
        echo ""
        echo "4. Sprawdź separację:"
        echo "   ps aux | grep -i chrome"
        echo ""
        echo "🌐 Każdy bot używa oddzielnego profilu Chrome!"
        ;;
    
    "clean")
        echo "🧹 Czyszczenie:"
        echo "1. Cache:"
        read -p "Czy wyczyścić cache wszystkich kont? (t/N): " confirm_cache
        if [[ $confirm_cache =~ ^[Tt]$ ]]; then
            for account in accounts/*/; do
                if [ -d "$account/cache" ]; then
                    echo "Czyszczę: $account/cache"
                    rm -f "$account/cache"/*.json
                fi
            done
            echo "✅ Cache wyczczony"
        fi
        
        echo ""
        echo "2. Browser profiles:"
        read -p "Czy wyczyścić profile przeglądarek? (t/N): " confirm_browser
        if [[ $confirm_browser =~ ^[Tt]$ ]]; then
            node -e "
const AccountManager = require('./lib/account-manager');
const manager = new AccountManager();
manager.cleanBrowserProfiles();
console.log('✅ Profile przeglądarek wyczyszczone');
"
        fi
        ;;
    
    "test")
        echo "🧪 Testowanie browser isolation:"
        echo ""
        echo "Uruchamiam oba boty w tle..."
        node fb-scanner-bot.js &
        SCANNER_PID=$!
        
        sleep 2
        
        node fb-screenshot-bot.js &
        SCREENSHOT_PID=$!
        
        sleep 3
        
        echo ""
        echo "🌐 Procesy Chrome:"
        ps aux | grep -i chrome | grep -v grep | grep -E "(Google Chrome|chrome)" | head -10
        
        echo ""
        echo "📁 Profile paths:"
        find accounts/ -name "browser-profile" -type d -exec ls -la {} \;
        
        echo ""
        echo "🛑 Zatrzymuję boty..."
        kill $SCANNER_PID $SCREENSHOT_PID 2>/dev/null
        
        echo "✅ Test zakończony"
        ;;
    
    *)
        echo "Użycie: $0 [status|list|setup|clean|test]"
        echo ""
        echo "Komendy:"
        echo "  status  - Pokaż status wszystkich kont z browser profiles"
        echo "  list    - Lista folderów kont i browser profiles"
        echo "  setup   - Instrukcje setup"
        echo "  clean   - Wyczyść cache i/lub browser profiles"
        echo "  test    - Testuj browser isolation"
        ;;
esac
EOF

chmod +x "$PROJECT_ROOT/manage-accounts.sh"

echo ""
echo "🎉 Browser isolation setup zakończony!"
echo ""
echo "🌐 Co zostało zrobione:"
echo "✅ Dodano browser profiles do obu kont"
echo "✅ Enhanced Account Manager z browser options"
echo "✅ Zaktualizowano boty z pełną separacją"
echo "✅ Aktualizowano skrypty zarządzania"
echo ""
echo "📁 Struktura browser profiles:"
find "$ACCOUNTS_ROOT" -name "browser-profile" -type d
echo ""
echo "📋 Następne kroki:"
echo "1. 🍪 Zaloguj się na oba konta i dodaj cookies"
echo "2. 🧪 Przetestuj separację: ./manage-accounts.sh test"
echo "3. 🚀 Uruchom boty:"
echo "   node fb-scanner-bot.js"
echo "   node fb-screenshot-bot.js"
echo "4. 📊 Sprawdź procesy: ps aux | grep -i chrome"
echo ""
echo "🌐 Każdy bot teraz używa własnego profilu Chrome!"
