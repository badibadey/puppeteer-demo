# 🚀 Quick Start - Facebook Scraper System

Szybki przewodnik uruchomienia kompletnego systemu.

## ⚡ Szybkie uruchomienie (macOS)

```bash
./start-system.sh
```

Ten skrypt automatycznie uruchomi:
- 🔍 Scanner Bot (skanuje Facebook)
- 📷 Screenshot Bot (robi zrzuty ekranu)
- 🎨 Frontend Dashboard (http://localhost:3000)

## 📋 Wymagania wstępne

### 1. Konfiguracja Supabase

Stwórz plik `.env` z danymi Supabase:

```bash
cp .env.example .env
```

Uzupełnij:
```env
SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_KEY=twoj-anon-key
```

### 2. Sesja Facebook

Musisz mieć zapisane ciasteczka zalogowanej sesji FB:
- Plik: `fb-session/cookies.json`
- Zaloguj się do Facebooka w przeglądarce
- Wyeksportuj ciasteczka (np. przez rozszerzenie "Cookie Editor")
- Zapisz jako `fb-session/cookies.json`

### 3. Konfiguracja n8n (opcjonalne)

Jeśli używasz n8n do przetwarzania:
- Skonfiguruj webhook w n8n
- Zaktualizuj URL w `config/scraper.json`

## 🎯 Ręczne uruchomienie

Jeśli wolisz uruchomić komponenty ręcznie:

### Terminal 1 - Scanner Bot
```bash
node fb-scanner-bot.js
```

### Terminal 2 - Screenshot Bot
```bash
node fb-screenshot-bot.js
```

### Terminal 3 - Frontend
```bash
cd frontend
npm run dev
```

Otwórz: **http://localhost:3000**

## 📊 Dashboard

Po uruchomieniu frontendu zobaczysz:

### Zakładki:
- **Wszystkie** - wszystkie posty w bazie
- **Gotowe** - posty ze screenshotami do opracowania
- **W trakcie** - posty przetwarzane przez bota
- **Błędy** - posty z błędami
- **Opracowane** - posty już przetworzone
- **Boty** - panel kontrolny i instrukcje

### Akcje:
- 👁️ **Podgląd** - zobacz szczegóły i screenshot
- ✅ **Opracuj** - oznacz jako przetworzony
- ❌ **Odrzuć** - odrzuć post

## 🔄 Workflow systemu

```
1. Scanner Bot
   ↓ Skanuje grupę FB
   ↓ Filtruje po słowach kluczowych
   ↓ Wysyła do n8n
   
2. n8n Webhook
   ↓ Przetwarza dane
   ↓ Zapisuje do Supabase (status: 'new')
   
3. Screenshot Bot
   ↓ Pobiera posty 'new'
   ↓ Robi screenshot
   ↓ Uploaduje do Storage
   ↓ Aktualizuje status na 'done'
   
4. Frontend Dashboard
   ↓ Wyświetla posty 'done'
   ↓ Pracownik opracowuje
   ↓ Status: 'processed' lub 'rejected'
```

## 🛠️ Troubleshooting

### Problem: Boty nie łączą się z Supabase
**Rozwiązanie:** Sprawdź czy `.env` zawiera poprawne dane

### Problem: Scanner nie znajduje postów
**Rozwiązanie:** 
- Sprawdź czy ciasteczka są aktualne
- Sprawdź czy URL grupy jest poprawny w `config/scraper.json`

### Problem: Screenshot bot nie działa
**Rozwiązanie:**
- Sprawdź czy Chrome jest zainstalowany w `/Applications/Google Chrome.app`
- Sprawdź czy są posty ze statusem 'new' w bazie

### Problem: Frontend nie łączy się z Supabase
**Rozwiązanie:**
- Sprawdź czy `frontend/.env.local` istnieje
- Zmienne muszą zaczynać się od `NEXT_PUBLIC_`

## 📚 Dodatkowa dokumentacja

- [Pełna dokumentacja techniczna](DOCUMENTATION.md)
- [Instrukcja n8n](INSTRUKCJA-N8N.md)
- [Frontend README](frontend/README.md)

## 🎨 Stack technologiczny

**Backend (Boty):**
- Node.js
- Puppeteer + Stealth Plugin
- Supabase Client

**Frontend:**
- Next.js 15
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase Realtime

**Infrastruktura:**
- Supabase (Database + Storage + Realtime)
- n8n (Workflow automation)

## 📞 Wsparcie

W razie problemów sprawdź:
1. Logi w terminalach botów
2. Konsola przeglądarki (F12)
3. Supabase Dashboard - sprawdź czy dane są zapisywane
4. n8n Executions - sprawdź czy webhook działa
