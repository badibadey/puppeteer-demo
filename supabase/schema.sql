-- Tabela postów
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,           -- ID posta z platformy (FB/Reddit)
  author_name TEXT,
  author_url TEXT,
  content TEXT,
  post_url TEXT,
  screenshot_url TEXT,
  matched_keywords TEXT[],           -- Tablica znalezionych słów kluczowych
  category TEXT,                     -- Kategoria (np. legalizacja)
  status TEXT DEFAULT 'new',         -- new | processing | done | rejected
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  human_action_taken BOOLEAN DEFAULT false
);

-- Tabela sesji scrapera (do monitoringu aktywności botów)
CREATE TABLE scraper_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  posts_found INTEGER DEFAULT 0,
  posts_matched INTEGER DEFAULT 0,
  status TEXT DEFAULT 'running',     -- running | completed | error
  error_log TEXT,
  bot_type TEXT DEFAULT 'scanner'    -- scanner | screenshoter
);

-- Indeksy dla szybszego wyszukiwania
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scraped_at ON posts(scraped_at);
CREATE INDEX idx_posts_category ON posts(category);

-- --- STORAGE SETUP ---
-- Wklej to w Supabase -> SQL Editor, aby skonfigurować przechowywanie zdjęć.

-- 1. Utworzenie bucketa
INSERT INTO storage.buckets (id, name, public) 
VALUES ('screenshots', 'screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Polityka: Pozwól na upload (INSERT) dla każdego (anonimowego klucza)
CREATE POLICY "Allow public uploads" 
ON storage.objects 
FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'screenshots');

-- 3. Polityka: Pozwól na podgląd (SELECT) dla każdego
CREATE POLICY "Allow public view" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'screenshots');
