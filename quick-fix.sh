#!/bin/bash

# 🔧 Quick Fix Script - Facebook Bot Issues
# Rozwiązuje najczęstsze problemy z instalacją i uruchomieniem

echo "🔧 Facebook Bot - Quick Fix Script"
echo "=================================="

# Sprawdź czy jesteśmy w odpowiednim folderze
if [ ! -f "package.json" ]; then
    echo "❌ Błąd: Nie znaleziono package.json. Przejdź do folderu projektu."
    exit 1
fi

echo "📁 Folder projektu: $(pwd)"

# 1. Sprawdź Node.js
echo ""
echo "🔍 Sprawdzanie Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js: $NODE_VERSION"
    
    # Sprawdź wersję
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 16 ]; then
        echo "⚠️ Ostrzeżenie: Zalecane Node.js 16+ (obecnie: $NODE_VERSION)"
    fi
else
    echo "❌ Node.js nie jest zainstalowany!"
    echo "📥 Instalacja: https://nodejs.org/"
    exit 1
fi

# 2. Sprawdź npm
echo ""
echo "🔍 Sprawdzanie npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ npm nie jest zainstalowany!"
    exit 1
fi

# 3. Sprawdź dependencies
echo ""
echo "🔍 Sprawdzanie dependencies..."
if [ ! -d "node_modules" ]; then
    echo "📦 Brak node_modules - instaluję dependencies..."
    npm install
else
    echo "✅ node_modules istnieje"
fi

# 4. Sprawdź kluczowe moduły
echo ""
echo "🔍 Sprawdzanie kluczowych modułów..."

check_module() {
    local module="$1"
    local description="$2"
    
    if [ -d "node_modules/$module" ]; then
        echo "✅ $module - $description"
    else
        echo "❌ $module - BRAKUJE!"
        echo "📦 Instaluję: npm install $module"
        npm install "$module"
    fi
}

check_module "puppeteer" "Główna biblioteka Puppeteer"
check_module "puppeteer-extra" "Rozszerzenia Puppeteer"
check_module "puppeteer-extra-plugin-stealth" "Stealth plugin"
check_module "@supabase/supabase-js" "Supabase client"

# 5. Sprawdź strukturę folderów
echo ""
echo "🔍 Sprawdzanie struktury folderów..."

check_folder() {
    local folder="$1"
    local description="$2"
    
    if [ -d "$folder" ]; then
        echo "✅ $folder - $description"
    else
        echo "❌ $folder - BRAKUJE!"
        echo "🗂️ Tworzę folder..."
        mkdir -p "$folder"
        
        # Dodaj .gitignore
        echo "*" > "$folder/.gitignore"
        echo "!.gitignore" >> "$folder/.gitignore"
    fi
}

check_folder "fb-session" "Sesje Facebooka"
check_folder "cache" "Cache postów"
check_folder "learning-data" "Dane uczenia się"
check_folder "logs" "Logi systemowe"
check_folder "screenshots" "Zrzuty ekranu"
check_folder "shared-state" "Stan współdzielony"

# 6. Sprawdź pliki konfiguracyjne
echo ""
echo "🔍 Sprawdzanie plików konfiguracyjnych..."

check_file() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        echo "✅ $file - $description"
        
        # Sprawdź JSON syntax
        if [[ "$file" == *.json ]]; then
            if python3 -c "import json; json.load(open('$file'))" 2>/dev/null; then
                echo "   ✅ JSON syntax poprawny"
            else
                echo "   ❌ JSON syntax błędny!"
                echo "   🔧 Sprawdź plik: $file"
            fi
        fi
    else
        echo "❌ $file - BRAKUJE!"
    fi
}

check_file "config/scraper.json" "Główna konfiguracja"
check_file "config/keywords.json" "Słowa kluczowe"
check_file "fb-session/cookies.json" "Cookies Facebooka (opcjonalne)"

# 7. Testuj stealth
echo ""
echo "🧪 Testuję stealth plugin..."
if timeout 30 node test-stealth.js 2>/dev/null; then
    echo "✅ Stealth plugin działa"
else
    echo "⚠️ Stealth plugin ma problemy (może być OK dla działania bota)"
fi

# 8. Sprawdź porty
echo ""
echo "🔍 Sprawdzanie portów..."
if command -v lsof &> /dev/null; then
    CHROME_PORT=$(lsof -i :9222 2>/dev/null | wc -l)
    if [ "$CHROME_PORT" -gt 0 ]; then
        echo "⚠️ Port 9222 jest zajęty (Chrome DevTools)"
    else
        echo "✅ Port 9222 wolny"
    fi
else
    echo "ℹ️ Nie można sprawdzić portów (brak lsof)"
fi

# 9. Podsumowanie
echo ""
echo "📊 Podsumowanie:"
echo "==============="

# Sprawdź gotowość
READY=true

# Sprawdź krytyczne elementy
if [ ! -d "node_modules/puppeteer" ]; then
    echo "❌ Puppeteer nie jest zainstalowany"
    READY=false
fi

if [ ! -f "config/scraper.json" ]; then
    echo "❌ Brak konfiguracji scraper.json"
    READY=false
fi

if [ ! -f "config/keywords.json" ]; then
    echo "❌ Brak słów kluczowych keywords.json"
    READY=false
fi

if [ "$READY" = true ]; then
    echo ""
    echo "🎉 System jest gotowy do uruchomienia!"
    echo ""
    echo "🚀 Uruchomienie:"
    echo "   node fb-scanner-bot.js"
    echo ""
    echo "🧪 Testowanie:"
    echo "   node test-stealth.js"
    echo ""
    echo "📋 Jeśli bot nie działa, sprawdź:"
    echo "   1. Czy masz cookies w fb-session/cookies.json"
    echo "   2. Czy konfiguracja jest poprawna"
    echo "   3. Czy grupy Facebooka są publicznie dostępne"
else
    echo ""
    echo "⚠️ System wymaga poprawek przed uruchomieniem!"
    echo ""
    echo "🔧 Uruchom ponownie ten skrypt po poprawkach:"
    echo "   ./quick-fix.sh"
fi

echo ""
echo "✅ Quick fix zakończony!"
