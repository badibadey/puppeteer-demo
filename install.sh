#!/bin/bash

# 🚀 Facebook Bot - Installation & Setup Script
# Autor: Anti-Bot System v2.0
# Data: Styczeń 2026

echo "🚀 Facebook Anti-Bot System v2.0 - Installation Script"
echo "=================================================="

# Sprawdź system
check_system() {
    echo "🔍 Sprawdzanie systemu..."
    
    # Sprawdź Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js nie jest zainstalowany!"
        echo "📥 Instalacja Node.js:"
        echo "   Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
        echo "   macOS: brew install node"
        echo "   Windows: Pobierz z https://nodejs.org"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        echo "❌ Node.js v16+ wymagany! Aktualna wersja: $(node -v)"
        exit 1
    fi
    
    echo "✅ Node.js $(node -v) - OK"
    
    # Sprawdź Chrome
    if command -v google-chrome &> /dev/null; then
        echo "✅ Google Chrome - OK"
    elif command -v chromium-browser &> /dev/null; then
        echo "✅ Chromium - OK"
    else
        echo "⚠️ Chrome/Chromium nie znaleziony - zainstaluj ręcznie"
    fi
    
    # Sprawdź RAM
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        RAM=$(free -m | awk 'NR==2{printf "%.0f", $2/1024}')
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        RAM=$(sysctl -n hw.memsize | awk '{printf "%.0f", $1/1024/1024/1024}')
    fi
    
    if [ "$RAM" -lt 2 ]; then
        echo "⚠️ Ostrzeżenie: Zalecane minimum 2GB RAM (obecnie: ${RAM}GB)"
    else
        echo "✅ RAM: ${RAM}GB - OK"
    fi
}

# Instalacja projektu
install_project() {
    echo ""
    echo "📦 Instalacja projektu..."
    
    # Sprawdź czy już istnieje
    if [ -d "puppeteer-demo" ]; then
        echo "📁 Projekt już istnieje - aktualizacja..."
        cd puppeteer-demo
        git pull origin main
    else
        echo "📥 Klonowanie projektu..."
        git clone https://github.com/badibadey/puppeteer-demo.git
        cd puppeteer-demo
    fi
    
    # Instalacja dependencies
    echo "📚 Instalacja dependencies..."
    npm install
    
    # Sprawdź instalację
    echo "🧪 Testowanie instalacji..."
    if node test-stealth.js > /dev/null 2>&1; then
        echo "✅ Test stealth - OK"
    else
        echo "❌ Test stealth nieudany"
        exit 1
    fi
}

# Konfiguracja
configure_project() {
    echo ""
    echo "⚙️ Konfiguracja projektu..."
    
    # Backup oryginalnych configów
    if [ ! -f "config/scraper.json.backup" ]; then
        cp config/scraper.json config/scraper.json.backup
        cp config/keywords.json config/keywords.json.backup
        echo "✅ Backup configów stworzony"
    fi
    
    # Pytaj o konfigurację
    echo ""
    echo "📝 Konfiguracja - wciśnij Enter aby użyć domyślnych wartości"
    
    # Grupa Facebook
    read -p "🔗 URL grupy Facebook (np. https://www.facebook.com/groups/twoja-grupa): " FB_GROUP_URL
    read -p "📝 Nazwa grupy (np. twoja-grupa): " FB_GROUP_NAME
    
    # n8n Webhook
    read -p "🔗 n8n Webhook URL (opcjonalnie): " N8N_WEBHOOK
    
    # Proxy
    read -p "🌐 Czy włączyć proxy? (t/N): " ENABLE_PROXY
    if [[ $ENABLE_PROXY =~ ^[Tt]$ ]]; then
        read -p "🌐 Proxy (format: user:pass@host:port lub host:port): " PROXY_URL
    fi
    
    # Aktualizuj config
    echo "📝 Aktualizacja konfiguracji..."
    
    # Użyj Python do edycji JSON
    python3 << EOF
import json

# Wczytaj config
with open('config/scraper.json', 'r') as f:
    config = json.load(f)

# Aktualizuj grupę
if '$FB_GROUP_URL':
    config['groups'][0]['url'] = '$FB_GROUP_URL'
if '$FB_GROUP_NAME':
    config['groups'][0]['name'] = '$FB_GROUP_NAME'

# Aktualizuj n8n
if '$N8N_WEBHOOK':
    config['n8n']['webhookUrl'] = '$N8N_WEBHOOK'

# Aktualizuj proxy
if '$ENABLE_PROXY' in ['t', 'T'] and '$PROXY_URL':
    config['proxy']['enabled'] = True
    config['proxy']['proxies'] = ['$PROXY_URL']

# Zapisz
with open('config/scraper.json', 'w') as f:
    json.dump(config, f, indent=2)

print("✅ Konfiguracja zaktualizowana")
EOF
    
    # Słowa kluczowe
    echo ""
    read -p "🔍 Czy chcesz skonfigurować słowa kluczowe? (T/n): " CONFIG_KEYWORDS
    if [[ ! $CONFIG_KEYWORDS =~ ^[Nn]$ ]]; then
        echo "📝 Przykładowe słowa kluczowe:"
        echo "   - legalizacja: karta pobytu, visa, zezwolenie"
        echo "   - tłumaczenia: tłumacz, tłumaczenie, przysięgły"
        echo "   - transport: przewóz, transport, kierowca"
        echo ""
        read -p "🔍 Dodaj słowa kluczowe (oddzielone przecinkami): " KEYWORDS
        
        if [ ! -z "$KEYWORDS" ]; then
            python3 << EOF
import json

# Wczytaj keywords
with open('config/keywords.json', 'r') as f:
    keywords = json.load(f)

# Dodaj nową kategorię
keywords['categories']['wlasne'] = {
    'keywords': [kw.strip() for kw in '$KEYWORDS'.split(',')],
    'responseTemplate': 'Dziękujemy za zainteresowanie - skontaktujemy się wkrótce.'
}

# Zapisz
with open('config/keywords.json', 'w') as f:
    json.dump(keywords, f, indent=2)

print("✅ Słowa kluczowe dodane")
EOF
        fi
    fi
}

# Testowanie
test_setup() {
    echo ""
    echo "🧪 Testowanie konfiguracji..."
    
    # Sprawdź config JSON
    if python3 -c "import json; json.load(open('config/scraper.json'))" 2>/dev/null; then
        echo "✅ Config scraper.json - poprawny"
    else
        echo "❌ Config scraper.json - błąd JSON"
        exit 1
    fi
    
    if python3 -c "import json; json.load(open('config/keywords.json'))" 2>/dev/null; then
        echo "✅ Config keywords.json - poprawny"
    else
        echo "❌ Config keywords.json - błąd JSON"
        exit 1
    fi
    
    # Test stealth
    echo "🔍 Test stealth plugin..."
    if timeout 30 node test-stealth.js > /dev/null 2>&1; then
        echo "✅ Stealth plugin - działa"
    else
        echo "❌ Stealth plugin - problem"
        echo "💡 Spróbuj: npm install puppeteer-extra-plugin-stealth"
    fi
    
    echo "✅ Testy zakończone"
}

# Tworzenie skryptów startowych
create_scripts() {
    echo ""
    echo "📜 Tworzenie skryptów startowych..."
    
    # Skrypt startowy
    cat > start-bot.sh << 'EOF'
#!/bin/bash
echo "🚀 Uruchamianie Facebook Bota..."
cd "$(dirname "$0")"
node fb-scanner-bot.js
EOF
    chmod +x start-bot.sh
    
    # Skrypt testowy
    cat > test-bot.sh << 'EOF'
#!/bin/bash
echo "🧪 Testowanie Facebook Bota..."
cd "$(dirname "$0")"
node test-stealth.js
EOF
    chmod +x test-bot.sh
    
    # Skrypt monitorowania
    cat > monitor-bot.sh << 'EOF'
#!/bin/bash
echo "📊 Monitorowanie Facebook Bota..."
cd "$(dirname "$0")"
tail -f *.log 2>/dev/null || echo "Brak plików log do monitorowania"
EOF
    chmod +x monitor-bot.sh
    
    echo "✅ Skrypty stworzone:"
    echo "   🚀 ./start-bot.sh - uruchom bota"
    echo "   🧪 ./test-bot.sh - testuj bota"
    echo "   📊 ./monitor-bot.sh - monitoruj logi"
}

# Informacje końcowe
final_info() {
    echo ""
    echo "🎉 Instalacja zakończona!"
    echo "=================================="
    echo ""
    echo "📁 Lokalizacja: $(pwd)"
    echo ""
    echo "🚀 Uruchomienie:"
    echo "   ./start-bot.sh"
    echo "   lub"
    echo "   node fb-scanner-bot.js"
    echo ""
    echo "📊 Monitorowanie:"
    echo "   ./monitor-bot.sh"
    echo ""
    echo "⚙️ Konfiguracja:"
    echo "   config/scraper.json - główna konfiguracja"
    echo "   config/keywords.json - słowa kluczowe"
    echo ""
    echo "📚 Dokumentacja:"
    echo "   README.md - pełna dokumentacja"
    echo "   USAGE-GUIDE.md - przewodnik użytkowania"
    echo "   ROADMAP.md - plan rozwoju"
    echo ""
    echo "⚠️ Ważne:"
    echo "   - Bot działa automatycznie w godzinach 8:00-22:00"
    echo "   - Monitoruj logi regularnie"
    echo "   - Nie wyłączaj stealth protection"
    echo "   - Backupuj config przed zmianami"
    echo ""
    echo "🆘 Wsparcie:"
    echo "   GitHub: https://github.com/badibadey/puppeteer-demo/issues"
    echo ""
    echo "🎯 Gotowe do pracy! Bot uruchomi się automatycznie o odpowiednich godzinach."
}

# Główna funkcja
main() {
    check_system
    install_project
    configure_project
    test_setup
    create_scripts
    final_info
}

# Uruchom
main
