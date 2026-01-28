#!/bin/bash

# 🗂️ Struktura Folderów - Facebook Bot Setup Script
# Tworzy wszystkie potrzebne foldery i pliki

echo "🗂️ Tworzenie struktury folderów dla Facebook Bot v2.0..."

# Główny katalog projektu
PROJECT_ROOT="$(pwd)"
echo "📁 Root directory: $PROJECT_ROOT"

# Tworzenie folderów
create_folder() {
    local folder_path="$1"
    local description="$2"
    
    if [ ! -d "$folder_path" ]; then
        mkdir -p "$folder_path"
        echo "✅ Utworzono: $folder_path ($description)"
    else
        echo "📁 Istnieje: $folder_path ($description)"
    fi
}

# 1. Folder sesji Facebooka
create_folder "$PROJECT_ROOT/fb-session" "Sesje Facebooka - cookies i stan logowania"

# 2. Folder cache
create_folder "$PROJECT_ROOT/cache" "Cache postów i URL - unikanie duplikatów"

# 3. Folder learning data
create_folder "$PROJECT_ROOT/learning-data" "Dane uczenia się - wzorce zachowań"

# 4. Folder screenshots
create_folder "$PROJECT_ROOT/screenshots" "Zrzuty ekranu postów"

# 5. Folder shared state (dla distributed architecture)
create_folder "$PROJECT_ROOT/shared-state" "Współdzielony stan między instancjami"

# 6. Folder logs
create_folder "$PROJECT_ROOT/logs" "Logi systemowe i debugowe"

# 7. Folder temp
create_folder "$PROJECT_ROOT/temp" "Pliki tymczasowe"

# 8. Folder backups
create_folder "$PROJECT_ROOT/backups" "Kopie zapasowe konfiguracji i danych"

echo ""
echo "📋 Tworzenie plików konfiguracyjnych..."

# Tworzenie .gitignore dla folderów
create_gitignore() {
    local folder="$1"
    local gitignore_file="$folder/.gitignore"
    
    if [ ! -f "$gitignore_file" ]; then
        cat > "$gitignore_file" << EOF
# Ignore all files in this directory
*
# But track this .gitignore file
!.gitignore
EOF
        echo "✅ Utworzono: $gitignore_file"
    fi
}

# Dodaj .gitignore do każdego folderu z danymi
create_gitignore "$PROJECT_ROOT/fb-session"
create_gitignore "$PROJECT_ROOT/cache"
create_gitignore "$PROJECT_ROOT/learning-data"
create_gitignore "$PROJECT_ROOT/screenshots"
create_gitignore "$PROJECT_ROOT/shared-state"
create_gitignore "$PROJECT_ROOT/logs"
create_gitignore "$PROJECT_ROOT/temp"

# Tworzenie przykładowych plików
create_sample_files() {
    # Przykładowy plik cookies
    if [ ! -f "$PROJECT_ROOT/fb-session/cookies.json.example" ]; then
        cat > "$PROJECT_ROOT/fb-session/cookies.json.example" << 'EOF'
{
    "example": "To jest przykładowy plik cookies. Zastąp go rzeczywistymi cookies po zalogowaniu.",
    "instructions": [
        "1. Zaloguj się na Facebooka w przeglądarce",
        "2. Wyeksportuj cookies (użyj rozszerzenia typu 'Get cookies.txt LOCALLY')",
        "3. Zapisz jako cookies.json w tym folderze",
        "4. Upewnij się że plik zawiera ważne sesje Facebooka"
    ]
}
EOF
        echo "✅ Utworzono: fb-session/cookies.json.example"
    fi

    # Przykładowy plik konfiguracyjny learning
    if [ ! -f "$PROJECT_ROOT/learning-data/README.md" ]; then
        cat > "$PROJECT_ROOT/learning-data/README.md" << 'EOF'
# Learning Data Folder

Ten folder zawiera dane uczenia się bota:

## Pliki:
- `behavioral-patterns.json` - Wzorce zachowań
- `session-history.json` - Historia sesji
- `success-metrics.json` - Metryki sukcesu

## Uwagi:
- Pliki są generowane automatycznie
- Nie edytuj ręcznie unless you know what you're doing
- Folder jest synchronizowany między sesjami
- Backup regularnie tworzone w `../backups/`
EOF
        echo "✅ Utworzono: learning-data/README.md"
    fi

    # Plik informacyjny o cache
    if [ ! -f "$PROJECT_ROOT/cache/README.md" ]; then
        cat > "$PROJECT_ROOT/cache/README.md" << 'EOF'
# Cache Folder

Ten folder przechowuje cache postów i URL:

## Struktura:
- `processed_posts.json` - ID przetworzonych postów
- `visited_urls.json` - Odwiedzone URL

## Zarządzanie:
- Automatyczne czyszczenie starych wpisów
- Ograniczenie rozmiaru do 10,000 wpisów
- Backup przed czyszczeniem

## Nie usuwaj ręcznie!
EOF
        echo "✅ Utworzono: cache/README.md"
    fi
}

create_sample_files

echo ""
echo "🔧 Sprawdzanie uprawnień..."

# Sprawdź i ustaw uprawnienia
set_permissions() {
    local folder="$1"
    local perms="$2"
    
    if [ -d "$folder" ]; then
        chmod "$perms" "$folder"
        echo "🔐 Ustawiono uprawnienia $perms dla: $folder"
    fi
}

# Ustaw uprawnienia (755 = rwxr-xr-x)
set_permissions "$PROJECT_ROOT/fb-session" "755"
set_permissions "$PROJECT_ROOT/cache" "755"
set_permissions "$PROJECT_ROOT/learning-data" "755"
set_permissions "$PROJECT_ROOT/screenshots" "755"
set_permissions "$PROJECT_ROOT/shared-state" "755"
set_permissions "$PROJECT_ROOT/logs" "755"
set_permissions "$PROJECT_ROOT/temp" "755"
set_permissions "$PROJECT_ROOT/backups" "755"

echo ""
echo "📊 Struktura folderów:"

tree_output() {
    local dir="$1"
    if command -v tree >/dev/null 2>&1; then
        tree "$dir" -L 2 -I 'node_modules|.git'
    else
        find "$dir" -type d | head -20
    fi
}

tree_output "$PROJECT_ROOT"

echo ""
echo "🎯 Następne kroki:"
echo ""
echo "1. 🍪 Zdobądź cookies Facebooka:"
echo "   - Zaloguj się na Facebooka w Chrome"
echo "   - Użyj rozszerzenia 'Get cookies.txt LOCALLY'"
echo "   - Zapisz jako: $PROJECT_ROOT/fb-session/cookies.json"
echo ""
echo "2. 🔧 Skonfiguruj bota:"
echo "   - Edytuj: $PROJECT_ROOT/config/scraper.json"
echo "   - Dodaj swoje grupy Facebooka"
echo "   - Skonfiguruj słowa kluczowe"
echo ""
echo "3. 🚀 Uruchom bota:"
echo "   - cd $PROJECT_ROOT"
echo "   - node fb-scanner-bot.js"
echo ""
echo "4. 📊 Monitoruj:"
echo "   - Logi: $PROJECT_ROOT/logs/"
echo "   - Cache: $PROJECT_ROOT/cache/"
echo "   - Learning: $PROJECT_ROOT/learning-data/"
echo ""
echo "✅ Struktura folderów gotowa!"
