console.log('✅ Loaded lib/stateful-scanner.js');

/**
 * Stateful Scanning - zarządzanie historią przetworzonych postów w bazie Supabase
 */
class StatefulScanner {
    constructor(supabaseClient, config) {
        this.supabase = supabaseClient;
        this.config = config.stateTracking || {
            enabled: true,
            consecutiveKnownLimit: 3,
            maxPostAgeHours: 24
        };
        
        // Cache dla wydajności
        this.processedPostsCache = new Map(); // group_id -> Set of external_ids
        this.cacheLoaded = false;
        
        // Statystyki sesji
        this.sessionStats = {
            newPosts: 0,
            skippedPosts: 0,
            consecutiveKnown: 0,
            totalProcessed: 0,
            startTime: Date.now()
        };
    }

    /**
     * Inicjalizuje skaner - ładuje cache z bazy
     */
    async initialize(groupId) {
        if (!this.config.enabled) {
            console.log('📝 Stateful scanning disabled');
            return;
        }

        console.log(`🔄 Inicjalizacja stateful scanning dla grupy: ${groupId}`);
        
        try {
            await this.loadProcessedPostsFromDB(groupId);
            this.cacheLoaded = true;
            console.log(`✅ Załadowano ${this.processedPostsCache.get(groupId)?.size || 0} przetworzonych postów`);
        } catch (error) {
            console.error('❌ Błąd inicjalizacji stateful scanner:', error);
            throw error;
        }
    }

    /**
     * Ładuje przetworzone posty z bazy danych do cache
     */
    async loadProcessedPostsFromDB(groupId) {
        try {
            const { data, error } = await this.supabase
                .from('processed_posts')
                .select('external_id, processed_at')
                .eq('group_id', groupId);

            if (error) {
                throw error;
            }

            // Filtrowanie starych postów jeśli skonfigurowane
            let filteredData = data;
            if (this.config.maxPostAgeHours) {
                const cutoffTime = new Date();
                cutoffTime.setHours(cutoffTime.getHours() - this.config.maxPostAgeHours);
                
                filteredData = data.filter(post => 
                    new Date(post.processed_at) > cutoffTime
                );
            }

            // Ładowanie do cache
            const postIds = new Set(filteredData.map(post => post.external_id));
            this.processedPostsCache.set(groupId, postIds);

            console.log(`📊 Załadowano ${postIds.size} postów z bazy (grupa: ${groupId})`);
            
        } catch (error) {
            console.error('❌ Błąd ładowania postów z bazy:', error);
            throw error;
        }
    }

    /**
     * Sprawdza czy post był już przetworzony
     */
    isPostProcessed(groupId, externalId) {
        if (!this.config.enabled || !this.cacheLoaded) {
            return false;
        }

        const groupPosts = this.processedPostsCache.get(groupId);
        return groupPosts ? groupPosts.has(externalId) : false;
    }

    /**
     * Oznacza post jako przetworzony
     */
    async markPostAsProcessed(groupId, externalId) {
        if (!this.config.enabled) {
            return true;
        }

        try {
            // Dodaj do cache
            const groupPosts = this.processedPostsCache.get(groupId) || new Set();
            groupPosts.add(externalId);
            this.processedPostsCache.set(groupId, groupPosts);

            // Zapisz do bazy
            const { error } = await this.supabase
                .from('processed_posts')
                .insert({
                    group_id: groupId,
                    external_id: externalId
                });

            if (error) {
                // Jeśli to błąd duplikatu, to jest OK - post już istnieje
                if (error.code === '23505') { // unique_violation
                    console.log(`⚠️ Post ${externalId} już istnieje w bazie`);
                    return true;
                }
                throw error;
            }

            console.log(`✅ Zapisano post ${externalId} w bazie (grupa: ${groupId})`);
            return true;

        } catch (error) {
            console.error('❌ Błąd zapisu posta do bazy:', error);
            return false;
        }
    }

    /**
     * Przetwarza pojedynczy post - zwraca czy nowy
     */
    async processPost(groupId, externalId, postData, processorCallback) {
        if (!this.config.enabled) {
            // Jeśli wyłączone, przetwarzaj zawsze
            const result = await processorCallback(postData);
            if (result) {
                this.sessionStats.newPosts++;
            }
            this.sessionStats.totalProcessed++;
            return { isNew: true, processed: true, result };
        }

        const isProcessed = this.isPostProcessed(groupId, externalId);
        
        if (isProcessed) {
            // Post znany - pomiń
            this.sessionStats.skippedPosts++;
            this.sessionStats.consecutiveKnown++;
            this.sessionStats.totalProcessed++;
            
            console.log(`⏭️ Pomijam znany post: ${externalId} (${this.sessionStats.consecutiveKnown}/${this.config.consecutiveKnownLimit})`);
            
            return { 
                isNew: false, 
                processed: false, 
                shouldStop: this.shouldStopScanning(),
                consecutiveKnown: this.sessionStats.consecutiveKnown
            };
        } else {
            // Post nowy - przetwarzaj
            console.log(`🆕 Nowy post: ${externalId}`);
            
            const result = await processorCallback(postData);
            
            if (result) {
                // Jeśli processing się powiódł, zapisz w bazie
                const saved = await this.markPostAsProcessed(groupId, externalId);
                if (saved) {
                    this.sessionStats.newPosts++;
                    this.sessionStats.consecutiveKnown = 0; // Reset licznika
                }
            } else {
                // Jeśli processing się nie powiódł, też zapisz żeby nie przetwarzać ponownie
                await this.markPostAsProcessed(groupId, externalId);
            }
            
            this.sessionStats.totalProcessed++;
            
            return { 
                isNew: true, 
                processed: true, 
                result,
                shouldStop: false,
                consecutiveKnown: 0
            };
        }
    }

    /**
     * Sprawdza czy należy przerwać skanowanie
     */
    shouldStopScanning() {
        return this.sessionStats.consecutiveKnown >= this.config.consecutiveKnownLimit;
    }

    /**
     * Resetuje statystyki sesji
     */
    resetSessionStats() {
        this.sessionStats = {
            newPosts: 0,
            skippedPosts: 0,
            consecutiveKnown: 0,
            totalProcessed: 0,
            startTime: Date.now()
        };
    }

    /**
     * Pobiera statystyki sesji
     */
    getSessionStats() {
        const duration = Date.now() - this.sessionStats.startTime;
        const minutes = Math.floor(duration / 60000);
        
        return {
            ...this.sessionStats,
            duration: `${minutes}m`,
            postsPerMinute: this.sessionStats.totalProcessed > 0 ? 
                (this.sessionStats.totalProcessed / (minutes || 1)).toFixed(1) : 0,
            efficiency: this.sessionStats.totalProcessed > 0 ? 
                ((this.sessionStats.newPosts / this.sessionStats.totalProcessed) * 100).toFixed(1) + '%' : '0%'
        };
    }

    /**
     * Generuje raport sesji
     */
    generateSessionReport(groupId) {
        const stats = this.getSessionStats();
        
        let report = `📊 Raport sesji (${groupId}): `;
        report += `Nowe: ${stats.newPosts}, `;
        report += `Pominięte: ${stats.skippedPosts}, `;
        report += `Razem: ${stats.totalProcessed}, `;
        report += `Efektywność: ${stats.efficiency}`;
        
        if (stats.consecutiveKnown >= this.config.consecutiveKnownLimit) {
            report += ` [Zatrzymano po ${stats.consecutiveKnown} znanych]`;
        }
        
        return report;
    }

    /**
     * Czyści cache dla grupy
     */
    clearGroupCache(groupId) {
        this.processedPostsCache.delete(groupId);
        console.log(`🧹 Wyczyszczono cache dla grupy: ${groupId}`);
    }

    /**
     * Czyści stary cache (starszy niż X godzin)
     */
    async cleanupOldPosts() {
        if (!this.config.maxPostAgeHours) {
            return;
        }

        try {
            const cutoffTime = new Date();
            cutoffTime.setHours(cutoffTime.getHours() - this.config.maxPostAgeHours);
            
            const { error } = await this.supabase
                .from('processed_posts')
                .delete()
                .lt('processed_at', cutoffTime.toISOString());

            if (error) {
                throw error;
            }

            console.log(`🧹 Usunięto posty starsze niż ${this.config.maxPostAgeHours} godzin`);
            
            // Przeładuj cache dla wszystkich grup
            for (const groupId of this.processedPostsCache.keys()) {
                await this.loadProcessedPostsFromDB(groupId);
            }

        } catch (error) {
            console.error('❌ Błąd czyszczenia starych postów:', error);
        }
    }

    /**
     * Pobiera statystyki z bazy danych
     */
    async getDatabaseStats() {
        try {
            const { data, error } = await this.supabase
                .from('processed_posts')
                .select('group_id')
                .select('group_id, processed_at');

            if (error) {
                throw error;
            }

            const groupStats = {};
            data.forEach(post => {
                if (!groupStats[post.group_id]) {
                    groupStats[post.group_id] = 0;
                }
                groupStats[post.group_id]++;
            });

            const totalPosts = data.length;
            const uniqueGroups = Object.keys(groupStats).length;

            return {
                totalPosts,
                uniqueGroups,
                groupStats,
                cacheSize: Array.from(this.processedPostsCache.values())
                    .reduce((total, posts) => total + posts.size, 0)
            };

        } catch (error) {
            console.error('❌ Błąd pobierania statystyk bazy:', error);
            return null;
        }
    }

    /**
     * Testuje połączenie z bazą
     */
    async testDatabaseConnection() {
        try {
            const { data, error } = await this.supabase
                .from('processed_posts')
                .select('count')
                .limit(1);

            if (error) {
                throw error;
            }

            console.log('✅ Połączenie z bazą Supabase działa');
            return true;

        } catch (error) {
            console.error('❌ Błąd połączenia z bazą:', error);
            return false;
        }
    }
}

module.exports = StatefulScanner;
