# Konto: screenshot-account

## Typ konta
- **Typ:** screenshot
- **Email:** screenshot@example.com
- **Opis:** Konto do robienia screenshotów postów

## Struktura folderów

### 🍪 fb-session/
- `cookies.json` - Cookies Facebooka (DO UZUPEŁNIENIA)
- Utrzymuje sesję logowania

### 💾 cache/
- `processed_posts.json` - Cache przetworzonych postów
- `visited_urls.json` - Cache odwiedzonych URL
- Unika duplikatów i optymalizuje wydajność

### 🧠 learning-data/
- `behavioral-patterns.json` - Wzorce zachowań
- `session-history.json` - Historia sesji
- `success-metrics.json` - Metryki sukcesu

### 📸 screenshots/
- Zrzuty ekranu znalezionych postów
- Pomocne w analizie i debugowaniu

### 📝 logs/
- Logi systemowe i debugowe
- Błędy i ostrzeżenia

## Użycie

1. **Zaloguj się** na Facebooka używając: screenshot@example.com
2. **Zapisz cookies** jako `fb-session/cookies.json`
3. **Uruchom odpowiedniego bota:**
   - `node fb-scanner-bot.js` (dla scanner-account)
   - `node fb-screenshot-bot.js` (dla screenshot-account)

## Bezpieczeństwo

- ✅ Wszystkie foldery są chronione przez .gitignore
- ✅ Cookies nigdy nie trafiają do repozytorium
- ✅ Każde konto ma oddzielne dane
- ✅ Brak konfliktów między kontami

## Monitorowanie

```bash
# Sprawdź logi
tail -f logs/*.log

# Sprawdź rozmiar cache
du -sh cache/

# Sprawdź learning data
ls -la learning-data/
```
