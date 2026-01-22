#!/bin/bash

# Facebook Scraper System - Startup Script
# Uruchamia wszystkie komponenty systemu w osobnych terminalach

echo "🚀 Uruchamiam Facebook Scraper System..."
echo ""

# Kolory
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Sprawdź czy .env istnieje
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Brak pliku .env!${NC}"
    echo "Skopiuj .env.example i uzupełnij danymi Supabase:"
    echo "cp .env.example .env"
    exit 1
fi

# Sprawdź czy cookies istnieją
if [ ! -f fb-session/cookies.json ]; then
    echo -e "${YELLOW}⚠️  Brak pliku fb-session/cookies.json!${NC}"
    echo "Musisz najpierw zalogować się do Facebooka i zapisać ciasteczka."
    exit 1
fi

echo -e "${GREEN}✓${NC} Pliki konfiguracyjne OK"
echo ""

# Funkcja do uruchamiania w nowym oknie terminala (macOS)
open_terminal() {
    local title=$1
    local command=$2
    
    osascript <<EOF
tell application "Terminal"
    do script "cd \"$PWD\" && echo \"$title\" && $command"
    activate
end tell
EOF
}

# Uruchom komponenty
echo -e "${BLUE}📡 Uruchamiam Scanner Bot...${NC}"
open_terminal "🔍 FB Scanner Bot" "node fb-scanner-bot.js"
sleep 2

echo -e "${BLUE}📸 Uruchamiam Screenshot Bot...${NC}"
open_terminal "📷 FB Screenshot Bot" "node fb-screenshot-bot.js"
sleep 2

echo -e "${BLUE}🌐 Uruchamiam Frontend Dashboard...${NC}"
open_terminal "🎨 Frontend Dashboard" "cd frontend && npm run dev"
sleep 3

echo ""
echo -e "${GREEN}✓ System uruchomiony!${NC}"
echo ""
echo "📊 Dashboard: http://localhost:3000"
echo ""
echo "Aby zatrzymać system, zamknij wszystkie okna terminali."
