# Facebook Group Scraper - Dokumentacja Techniczna

---

## 1. Architektura Systemu

```
     ┌───────────────────────────────────────────────────────────────┐
     │                    BOTY (działają równolegle)                 │
     │                                                               │
     │  ┌─────────────────────┐                                      │
     │  │  fb-scanner-bot.js  │───► n8n Webhook ───► Supabase INSERT │
     │  │  - Skanuje grupę FB │     (POST)           status='new'    │
     │  │  - Filtruje słowa   │                      screenshot=null │
     │  └─────────────────────┘                                      │
     │                                                               │
     │  ┌─────────────────────┐                                      │
     │  │fb-screenshot-bot.js │◄─── Supabase (poll status='new') ────┤
     │  │  - Robi screenshot  │                                      │
     │  │  - Upload Storage   │───► Supabase UPDATE                  │
     │  │  - Aktualizuje DB   │     status='done', screenshot_url    │
     │  └─────────────────────┘                                      │
     └───────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
     ┌───────────────────────────────────────────────────────────────┐
     │                         SUPABASE                              │
     │  - Tabela: posts (dane postów)                                │
     │  - Storage: screenshots (publiczny bucket)                    │
     └───────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
     ┌───────────────────────────────────────────────────────────────┐
     │                    FRONTEND (Panel)                           │
     │  - Pobiera posty status='done'                                │
     │  - Zmienia status na 'processed' / 'rejected'                 │
     └───────────────────────────────────────────────────────────────┘
```

---

## 2. Schemat Bazy Danych

### Tabela: `posts`

| Kolumna             | Typ              | Opis                                                   |
|---------------------|------------------|--------------------------------------------------------|
| `id`                | UUID (PK)        | Unikalny identyfikator rekordu                         |
| `external_id`       | TEXT             | ID posta z Facebooka (NIE UNIQUE - wiele komentarzy z jednego posta) |
| `author_name`       | TEXT             | Nazwa autora posta/komentarza                          |
| `author_url`        | TEXT             | Link do profilu autora                                 |
| `content`           | TEXT             | Pełna treść posta/komentarza                           |
| `post_url`          | TEXT             | Bezpośredni link do posta na FB                        |
| `screenshot_url`    | TEXT             | Publiczny URL screenshota (Supabase Storage)           |
| `matched_keywords`  | TEXT[]           | Tablica dopasowanych słów kluczowych                   |
| `category`          | TEXT             | Kategoria (`legalizacja`, `tlumaczenia`, `pesel`, ...) |
| `status`            | TEXT             | Status workflow (patrz niżej)                          |
| `scraped_at`        | TIMESTAMPTZ      | Data i czas scrapowania                                |
| `human_action_taken`| BOOLEAN          | Czy pracownik podjął akcję                             |

### Statusy postów

| Status       | Ustawiany przez    | Opis                                      |
|--------------|--------------------|--------------------------------------------|
| `new`        | n8n (insert)       | Czeka na screenshot                        |
| `processing` | screenshot bot     | Bot właśnie przetwarza                     |
| `done`       | screenshot bot     | Gotowy do wyświetlenia (ma screenshot)     |
| `error`      | screenshot bot     | Wystąpił błąd (ban, timeout)               |
| `processed`  | Frontend           | Pracownik oznaczył jako opracowany         |
| `rejected`   | Frontend           | Odrzucony przez pracownika                 |

---

## 3. Supabase - Przykłady Zapytań

### Pobierz posty gotowe do pracy

```typescript
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('status', 'done')
  .order('scraped_at', { ascending: false })
```

### Filtruj po kategorii

```typescript
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('status', 'done')
  .eq('category', 'legalizacja')
```

### Zmień status

```typescript
await supabase
  .from('posts')
  .update({ status: 'processed' })
  .eq('id', postId)
```

### Realtime

```typescript
supabase
  .channel('posts')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, callback)
  .subscribe()
```

---

## 4. Screenshoty (Storage)

Bucket: `screenshots` (publiczny)

Format URL:
```
https://[PROJECT].supabase.co/storage/v1/object/public/screenshots/[filename.png]
```

---

## 5. Kategorie Słów Kluczowych

| Kategoria        | Słowa kluczowe                                    |
|------------------|---------------------------------------------------|
| `legalizacja`    | karta pobytu, visa, zezwolenie na pobyt           |
| `tlumaczenia`    | tłumacz, tłumaczenie, przysięgły                  |
| `uczelnie`       | studia, rekrutacja, uniwersytet                   |
| `pesel`          | pesel, prawo jazdy, wymiana prawa jazdy           |
| `testowe_ogolne` | i, w, z, na, do (testowa - łapie wszystko)        |

Konfiguracja: `config/keywords.json`

---

## 6. Uruchamianie Botów

```bash
# Scanner (skanuje grupę FB, wysyła do n8n)
node fb-scanner-bot.js

# Screenshot (pobiera z DB, robi zdjęcia, uploaduje)
node fb-screenshot-bot.js
```

Wymagane pliki:
- `.env` - dane Supabase
- `fb-session/cookies.json` - ciasteczka zalogowanej sesji FB
- `config/scraper.json` - URL grupy, webhook n8n

---

*Dokumentacja v1.1 - 2026-01-22*
