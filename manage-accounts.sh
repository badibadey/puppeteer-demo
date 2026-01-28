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
