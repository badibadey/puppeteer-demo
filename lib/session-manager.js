const { setTimeout } = require('timers/promises');
console.log('✅ Loaded lib/session-manager.js');

/**
 * Zarządza interwałami między sesjami z losowością
 */
class SessionManager {
    constructor(config) {
        this.config = config;
        this.lastSessionTime = null;
    }

    /**
     * Oblicza losowy interwał między sesjami z uwzględnieniem godzin szczytu
     * @returns {number} - czas w ms
     */
    getRandomInterval() {
        const intervalConfig = this.config.safety.intervalMinutes;
        let baseMin, baseMax;
        
        if (typeof intervalConfig === 'object' && intervalConfig.min && intervalConfig.max) {
            baseMin = intervalConfig.min;
            baseMax = intervalConfig.max;
        } else {
            baseMin = intervalConfig || 15;
            baseMax = intervalConfig || 15;
        }
        
        // Sprawdź czy jesteśmy w godzinach szczytu
        const activityMultiplier = this.getActivityMultiplier();
        
        // W godzinach szczytu - krótsze przerwy, poza szczytem - dłuższe
        const adjustedMin = Math.floor(baseMin / activityMultiplier);
        const adjustedMax = Math.floor(baseMax / activityMultiplier);
        
        const minMs = adjustedMin * 60 * 1000;
        const maxMs = adjustedMax * 60 * 1000;
        
        return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    }

    /**
     * Pobiera mnożnik aktywności na podstawie aktualnej godziny
     * @returns {number} - mnożnik aktywności
     */
    getActivityMultiplier() {
        const now = new Date();
        const currentHour = now.getHours();
        
        if (!this.config.safety.activeHours || !this.config.safety.activeHours.peakHours) {
            return 1.0; // Brak konfiguracji godzin szczytu
        }
        
        // Sprawdź godziny szczytu
        for (const peak of this.config.safety.activeHours.peakHours) {
            if (currentHour >= peak.start && currentHour < peak.end) {
                return peak.activityMultiplier;
            }
        }
        
        return 1.0; // Standardowa aktywność
    }

    /**
     * Sprawdza czy dzisiaj jest dzień roboczy
     * @returns {boolean}
     */
    isWorkingDay() {
        if (!this.config.safety.workingDays || !this.config.safety.workingDays.enabled) {
            return true; // Brak ograniczeń dni roboczych
        }
        
        const now = new Date();
        const dayName = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
        
        return this.config.safety.workingDays.days.includes(dayName);
    }

    /**
     * Pobiera mnożnik aktywności dla weekendu
     * @returns {number}
     */
    getWeekendMultiplier() {
        if (!this.isWorkingDay() && this.config.safety.workingDays) {
            return this.config.safety.workingDays.weekendReduction || 0.7;
        }
        return 1.0;
    }

    /**
     * Czeka losowy czas między sesjami
     * @param {string} reason - powód oczekiwania (log)
     */
    async waitForInterval(reason = 'between sessions') {
        const intervalMs = this.getRandomInterval();
        const weekendMultiplier = this.getWeekendMultiplier();
        const adjustedIntervalMs = Math.floor(intervalMs / weekendMultiplier);
        const minutes = Math.round(adjustedIntervalMs / (60 * 1000));
        
        console.log(`⏰ Oczekiwanie ${minutes} minut przed następną sesją (${reason})...`);
        if (weekendMultiplier < 1.0) {
            console.log(`   📅 Weekend - wydłużony czas oczekiwania (${weekendMultiplier}x)`);
        }
        
        const startTime = Date.now();
        const totalMs = adjustedIntervalMs;
        
        // Pokaż postęp co 30 sekund
        while (Date.now() - startTime < totalMs) {
            const elapsed = Date.now() - startTime;
            const remaining = Math.ceil((totalMs - elapsed) / (60 * 1000));
            
            if (remaining > 0 && elapsed % 30000 < 1000) { // co 30 sekund
                process.stdout.write(`\r⏰ Pozostało: ${remaining} minut...`);
            }
            
            await setTimeout(1000);
        }
        
        console.log('\n✅ Czas oczekiwania zakończony.');
        this.lastSessionTime = Date.now();
    }

    /**
     * Sprawdza czy jesteśmy w aktywnych godzinach
     * @returns {boolean}
     */
    isActiveHours() {
        const now = new Date();
        const currentHour = now.getHours();
        
        const startHour = this.config.safety.activeHours?.start || 8;
        const endHour = this.config.safety.activeHours?.end || 22;
        
        return currentHour >= startHour && currentHour <= endHour;
    }

    /**
     * Sprawdza czy powinno się działać w danym momencie
     * @returns {boolean}
     */
    shouldWork() {
        // Sprawdź dzień roboczy
        if (!this.isWorkingDay()) {
            console.log('📅 Dzień nie roboczy - bot odpoczywa');
            return false;
        }
        
        // Sprawdź aktywne godziny
        if (!this.isActiveHours()) {
            console.log('🌙 Poza aktywnymi godzinami - bot odpoczywa');
            return false;
        }
        
        return true;
    }

    /**
     * Czeka do aktywnych godzin jeśli trzeba
     */
    async waitForActiveHours() {
        if (this.isActiveHours()) {
            return; // Jesteśmy w aktywnych godzinach
        }

        const now = new Date();
        const currentHour = now.getHours();
        const startHour = this.config.safety.activeHoursStart || 8;
        
        let hoursToWait;
        if (currentHour > startHour) {
            // Jest po aktywnych godzinach, czekaj do następnego dnia
            hoursToWait = (24 - currentHour) + startHour;
        } else {
            // Jest przed aktywnymi godzinami
            hoursToWait = startHour - currentHour;
        }

        console.log(`🌙 Poza aktywnymi godzinami. Oczekiwanie ${hoursToWait} godzin do ${startHour}:00...`);
        await setTimeout(hoursToWait * 60 * 60 * 1000);
        console.log('☀️ Aktywne godziny rozpoczęte.');
    }
}

module.exports = SessionManager;
