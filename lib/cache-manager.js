const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
console.log('✅ Loaded lib/cache-manager.js');

/**
 * Zarządza cache i unikaniem duplikatów
 */
class CacheManager {
    constructor(cacheDir = './cache') {
        this.cacheDir = path.resolve(cacheDir);
        this.processedPostsFile = path.join(this.cacheDir, 'processed_posts.json');
        this.visitedUrlsFile = path.join(this.cacheDir, 'visited_urls.json');
        
        // Upewnij się że katalog cache istnieje
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
        
        // Wczytaj istniejące dane
        this.processedPosts = this.loadProcessedPosts();
        this.visitedUrls = this.loadVisitedUrls();
        
        // Ograniczenia cache
        this.maxCacheSize = 10000; // Maksymalna liczba postów w cache
        this.cacheCleanupInterval = 1000; // Co ile postów czyścić cache
        this.processedCount = 0;
    }

    /**
     * Wczytuje przetworzone posty z pliku
     */
    loadProcessedPosts() {
        try {
            if (fs.existsSync(this.processedPostsFile)) {
                const data = fs.readFileSync(this.processedPostsFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (e) {
            console.warn('⚠️ Nie udało się wczytać cache postów:', e.message);
        }
        return {};
    }

    /**
     * Wczysta odwiedzone URL z pliku
     */
    loadVisitedUrls() {
        try {
            if (fs.existsSync(this.visitedUrlsFile)) {
                const data = fs.readFileSync(this.visitedUrlsFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (e) {
            console.warn('⚠️ Nie udało się wczytać cache URL:', e.message);
        }
        return {};
    }

    /**
     * Zapisuje cache do plików
     */
    saveCache() {
        try {
            // Zapisz przetworzone posty
            fs.writeFileSync(
                this.processedPostsFile, 
                JSON.stringify(this.processedPosts, null, 2), 
                'utf8'
            );
            
            // Zapisz odwiedzone URL
            fs.writeFileSync(
                this.visitedUrlsFile, 
                JSON.stringify(this.visitedUrls, null, 2), 
                'utf8'
            );
            
        } catch (e) {
            console.error('❌ Błąd zapisu cache:', e.message);
        }
    }

    /**
     * Generuje hash posta do identyfikacji
     */
    generatePostHash(postData) {
        const content = postData.textContent || postData.content || '';
        const author = postData.author || '';
        const url = postData.url || postData.post_url || '';
        
        // Użyj kluczowych pól do generowania hash
        const hashInput = `${author}|${content.substring(0, 200)}|${url}`.toLowerCase();
        return crypto.createHash('md5').update(hashInput).digest('hex');
    }

    /**
     * Sprawdza czy post był już przetwarzany
     */
    isPostProcessed(postData) {
        const hash = this.generatePostHash(postData);
        return this.processedPosts.hasOwnProperty(hash);
    }

    /**
     * Oznacza post jako przetworzony
     */
    markPostProcessed(postData) {
        const hash = this.generatePostHash(postData);
        this.processedPosts[hash] = {
            processedAt: new Date().toISOString(),
            author: postData.author,
            url: postData.url || postData.post_url,
            contentPreview: (postData.textContent || postData.content || '').substring(0, 100)
        };
        
        this.processedCount++;
        
        // Czyść cache co jakiś czas
        if (this.processedCount % this.cacheCleanupInterval === 0) {
            this.cleanupCache();
        }
    }

    /**
     * Sprawdza czy URL był już odwiedzony
     */
    isUrlVisited(url) {
        if (!url) return false;
        return this.visitedUrls.hasOwnProperty(url);
    }

    /**
     * Oznacza URL jako odwiedzony
     */
    markUrlVisited(url) {
        if (!url) return;
        this.visitedUrls[url] = {
            visitedAt: new Date().toISOString()
        };
    }

    /**
     * Czyści stary cache (usuwa najstarsze wpisy)
     */
    cleanupCache() {
        const maxEntries = this.maxCacheSize;
        
        // Sprawdź rozmiar cache postów
        const postEntries = Object.entries(this.processedPosts);
        if (postEntries.length > maxEntries) {
            // Sortuj po dacie i usuń najstarsze
            postEntries.sort((a, b) => 
                new Date(a[1].processedAt) - new Date(b[1].processedAt)
            );
            
            const toRemove = postEntries.slice(0, postEntries.length - maxEntries);
            toRemove.forEach(([hash]) => {
                delete this.processedPosts[hash];
            });
            
            console.log(`🧹 Usunięto ${toRemove.length} starych wpisów z cache postów`);
        }
        
        // Sprawdź rozmiar cache URL
        const urlEntries = Object.entries(this.visitedUrls);
        if (urlEntries.length > maxEntries) {
            urlEntries.sort((a, b) => 
                new Date(a[1].visitedAt) - new Date(b[1].visitedAt)
            );
            
            const toRemove = urlEntries.slice(0, urlEntries.length - maxEntries);
            toRemove.forEach(([url]) => {
                delete this.visitedUrls[url];
            });
            
            console.log(`🧹 Usunięto ${toRemove.length} starych wpisów z cache URL`);
        }
    }

    /**
     * Filtruje posty usuwając duplikaty
     */
    filterDuplicatePosts(posts) {
        const uniquePosts = [];
        const duplicateCount = { posts: 0, urls: 0 };
        
        for (const post of posts) {
            // Sprawdź duplikaty po treści
            if (this.isPostProcessed(post)) {
                duplicateCount.posts++;
                continue;
            }
            
            // Sprawdź duplikaty po URL
            const postUrl = post.url || post.post_url;
            if (postUrl && this.isUrlVisited(postUrl)) {
                duplicateCount.urls++;
                continue;
            }
            
            uniquePosts.push(post);
        }
        
        if (duplicateCount.posts > 0 || duplicateCount.urls > 0) {
            console.log(`🚫 Usunięto duplikaty: ${duplicateCount.posts} postów, ${duplicateCount.urls} URL`);
        }
        
        return uniquePosts;
    }

    /**
     * Przetwarza posty z filtrowaniem duplikatów
     */
    async processPostsWithDuplicateFilter(posts, processorCallback) {
        const filteredPosts = this.filterDuplicatePosts(posts);
        const results = [];
        
        for (const post of filteredPosts) {
            try {
                const result = await processorCallback(post);
                results.push(result);
                
                // Oznacz jako przetworzone tylko po sukcesie
                if (result) {
                    this.markPostProcessed(post);
                    
                    const postUrl = post.url || post.post_url;
                    if (postUrl) {
                        this.markUrlVisited(postUrl);
                    }
                }
                
            } catch (e) {
                console.error('❌ Błąd przetwarzania posta:', e.message);
            }
        }
        
        // Zapisz cache po przetworzeniu
        this.saveCache();
        
        return results;
    }

    /**
     * Statystyki cache
     */
    getCacheStats() {
        return {
            processedPosts: Object.keys(this.processedPosts).length,
            visitedUrls: Object.keys(this.visitedUrls).length,
            cacheDir: this.cacheDir,
            maxCacheSize: this.maxCacheSize
        };
    }

    /**
     * Czyści cały cache
     */
    clearCache() {
        this.processedPosts = {};
        this.visitedUrls = {};
        this.saveCache();
        console.log('🧹 Cache wyczyszczony');
    }

    /**
     * Usuwa stare wpisy (starsze niż指定 dni)
     */
    removeOldEntries(daysOld = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        let removedPosts = 0;
        let removedUrls = 0;
        
        // Czyść posty
        for (const [hash, data] of Object.entries(this.processedPosts)) {
            if (new Date(data.processedAt) < cutoffDate) {
                delete this.processedPosts[hash];
                removedPosts++;
            }
        }
        
        // Czyści URL
        for (const [url, data] of Object.entries(this.visitedUrls)) {
            if (new Date(data.visitedAt) < cutoffDate) {
                delete this.visitedUrls[url];
                removedUrls++;
            }
        }
        
        if (removedPosts > 0 || removedUrls > 0) {
            console.log(`🧹 Usunięto wpisy starsze niż ${daysOld} dni: ${removedPosts} postów, ${removedUrls} URL`);
            this.saveCache();
        }
    }
}

module.exports = CacheManager;
