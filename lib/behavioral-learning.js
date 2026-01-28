const fs = require('fs');
const path = require('path');
const { setTimeout } = require('timers/promises');
console.log('✅ Loaded lib/behavioral-learning.js');

/**
 * System uczenia się wzorców zachowań w czasie rzeczywistym
 */
class BehavioralLearning {
    constructor(learningDataPath = './learning-data') {
        this.learningDataPath = learningDataPath;
        this.patternsFile = path.join(learningDataPath, 'behavioral-patterns.json');
        this.sessionsFile = path.join(learningDataPath, 'session-history.json');
        this.successMetricsFile = path.join(learningDataPath, 'success-metrics.json');
        
        // Upewnij się że katalog istnieje
        if (!fs.existsSync(learningDataPath)) {
            fs.mkdirSync(learningDataPath, { recursive: true });
        }
        
        // Wczytaj istniejące dane
        this.patterns = this.loadPatterns();
        this.sessionHistory = this.loadSessionHistory();
        this.successMetrics = this.loadSuccessMetrics();
        
        // Aktualna sesja
        this.currentSession = {
            startTime: Date.now(),
            actions: [],
            timingPatterns: [],
            successEvents: [],
            riskEvents: []
        };
    }

    /**
     * Wczytuje wzorce zachowań
     */
    loadPatterns() {
        try {
            if (fs.existsSync(this.patternsFile)) {
                return JSON.parse(fs.readFileSync(this.patternsFile, 'utf8'));
            }
        } catch (e) {
            console.warn('⚠️ Nie udało się wczytać wzorców:', e.message);
        }
        return this.getDefaultPatterns();
    }

    /**
     * Domyślne wzorce zachowań
     */
    getDefaultPatterns() {
        return {
            mouseMovements: {
                averageSpeed: { min: 50, max: 200, current: 100 },
                pauseFrequency: { min: 0.1, max: 0.3, current: 0.2 },
                microMovements: { min: 2, max: 8, current: 5 }
            },
            scrolling: {
                scrollSpeed: { min: 100, max: 400, current: 200 },
                scrollDirection: { up: 0.3, down: 0.7, current: 0.7 },
                scrollPauses: { min: 500, max: 2000, current: 1000 }
            },
            typing: {
                typingSpeed: { min: 50, max: 150, current: 100 },
                errorRate: { min: 0.01, max: 0.05, current: 0.02 },
                backspaceFrequency: { min: 0.05, max: 0.15, current: 0.1 }
            },
            timing: {
                actionDelay: { min: 500, max: 3000, current: 1500 },
                readingTime: { min: 1000, max: 5000, current: 2500 },
                thinkingTime: { min: 2000, max: 8000, current: 4000 }
            },
            navigation: {
                pathVariety: { min: 3, max: 8, current: 5 },
                backtrackFrequency: { min: 0.1, max: 0.3, current: 0.2 },
                explorationRate: { min: 0.2, max: 0.6, current: 0.4 }
            }
        };
    }

    /**
     * Wczytuje historię sesji
     */
    loadSessionHistory() {
        try {
            if (fs.existsSync(this.sessionsFile)) {
                return JSON.parse(fs.readFileSync(this.sessionsFile, 'utf8'));
            }
        } catch (e) {
            console.warn('⚠️ Nie udało się wczytać historii sesji:', e.message);
        }
        return [];
    }

    /**
     * Wczytuje metryki sukcesu
     */
    loadSuccessMetrics() {
        try {
            if (fs.existsSync(this.successMetricsFile)) {
                return JSON.parse(fs.readFileSync(this.successMetricsFile, 'utf8'));
            }
        } catch (e) {
            console.warn('⚠️ Nie udało się wczytać metryk sukcesu:', e.message);
        }
        return {
            totalSessions: 0,
            successfulSessions: 0,
            bannedSessions: 0,
            averageSuccessRate: 0,
            patternEffectiveness: {}
        };
    }

    /**
     * Zapisuje wzorce zachowań
     */
    savePatterns() {
        try {
            fs.writeFileSync(this.patternsFile, JSON.stringify(this.patterns, null, 2));
        } catch (e) {
            console.error('❌ Błąd zapisu wzorców:', e.message);
        }
    }

    /**
     * Zapisuje historię sesji
     */
    saveSessionHistory() {
        try {
            // Ogranicz historię do ostatnich 100 sesji
            const limitedHistory = this.sessionHistory.slice(-100);
            fs.writeFileSync(this.sessionsFile, JSON.stringify(limitedHistory, null, 2));
        } catch (e) {
            console.error('❌ Błąd zapisu historii sesji:', e.message);
        }
    }

    /**
     * Zapisuje metryki sukcesu
     */
    saveSuccessMetrics() {
        try {
            fs.writeFileSync(this.successMetricsFile, JSON.stringify(this.successMetrics, null, 2));
        } catch (e) {
            console.error('❌ Błąd zapisu metryk sukcesu:', e.message);
        }
    }

    /**
     * Rejestruje akcję w sesji
     */
    recordAction(actionType, details = {}) {
        const action = {
            type: actionType,
            timestamp: Date.now(),
            details: details,
            sessionTime: Date.now() - this.currentSession.startTime
        };
        
        this.currentSession.actions.push(action);
        
        // Analizuj timing wzorców
        this.analyzeTimingPattern(action);
        
        // Aktualizuj wzorce w czasie rzeczywistym
        this.updatePatternsFromAction(action);
    }

    /**
     * Analizuje wzorce timingów
     */
    analyzeTimingPattern(action) {
        if (this.currentSession.actions.length < 2) return;
        
        const prevAction = this.currentSession.actions[this.currentSession.actions.length - 2];
        const timeDiff = action.timestamp - prevAction.timestamp;
        
        this.currentSession.timingPatterns.push({
            fromType: prevAction.type,
            toType: action.type,
            timeDiff: timeDiff,
            timestamp: action.timestamp
        });
    }

    /**
     * Aktualizuje wzorce na podstawie akcji
     */
    updatePatternsFromAction(action) {
        // Dynamiczna adaptacja wzorców
        const adaptationRate = 0.01; // Jak szybko się uczymy
        
        switch (action.type) {
            case 'mouse_move':
                this.adaptPattern('mouseMovements', 'averageSpeed', action.details.speed || 100, adaptationRate);
                break;
            case 'scroll':
                this.adaptPattern('scrolling', 'scrollSpeed', action.details.speed || 200, adaptationRate);
                break;
            case 'type':
                this.adaptPattern('typing', 'typingSpeed', action.details.speed || 100, adaptationRate);
                break;
            case 'click':
                this.adaptPattern('timing', 'actionDelay', action.details.delay || 1500, adaptationRate);
                break;
        }
    }

    /**
     * Adaptuje pojedynczy wzorzec
     */
    adaptPattern(category, parameter, value, rate) {
        if (!this.patterns[category] || !this.patterns[category][parameter]) return;
        
        const pattern = this.patterns[category][parameter];
        const currentValue = pattern.current || (pattern.min + pattern.max) / 2;
        
        // Smooth adaptation
        const newValue = currentValue + (value - currentValue) * rate;
        
        // Ogranicz do zakresu
        pattern.current = Math.max(pattern.min, Math.min(pattern.max, newValue));
    }

    /**
     * Rejestruje sukces
     */
    recordSuccess(successType, details = {}) {
        const success = {
            type: successType,
            timestamp: Date.now(),
            details: details
        };
        
        this.currentSession.successEvents.push(success);
        
        // Wzmocnij wzorce które doprowadziły do sukcesu
        this.reinforceSuccessfulPatterns();
    }

    /**
     * Wzmocnia skuteczne wzorce
     */
    reinforceSuccessfulPatterns() {
        const reinforcementRate = 0.05; // Wzmocnienie sukcesu
        
        // Znajdź ostatnie akcje które doprowadziły do sukcesu
        const recentActions = this.currentSession.actions.slice(-5);
        
        recentActions.forEach(action => {
            this.reinforceActionPattern(action, reinforcementRate);
        });
    }

    /**
     * Wzmacnia wzorzec konkretnej akcji
     */
    reinforceActionPattern(action, rate) {
        // Zwiększ skuteczność danego wzorca
        if (!this.successMetrics.patternEffectiveness[action.type]) {
            this.successMetrics.patternEffectiveness[action.type] = {
                uses: 0,
                successes: 0,
                effectiveness: 0
            };
        }
        
        const effectiveness = this.successMetrics.patternEffectiveness[action.type];
        effectiveness.uses++;
        effectiveness.successes++;
        effectiveness.effectiveness = effectiveness.successes / effectiveness.uses;
    }

    /**
     * Rejestruje zdarzenie ryzyka
     */
    recordRisk(riskType, severity = 'medium', details = {}) {
        const risk = {
            type: riskType,
            severity: severity,
            timestamp: Date.now(),
            details: details
        };
        
        this.currentSession.riskEvents.push(risk);
        
        // Dostosuj wzorce aby unikać ryzyka
        this.adaptPatternsToAvoidRisk(risk);
    }

    /**
     * Adaptuje wzorce aby unikać ryzyka
     */
    adaptPatternsToAvoidRisk(risk) {
        const avoidanceRate = 0.1; // Szybka adaptacja przy ryzyku
        
        switch (risk.type) {
            case 'too_fast':
                // Zwiększ opóźnienia
                this.adaptPattern('timing', 'actionDelay', 2000, avoidanceRate);
                break;
            case 'too_repetitive':
                // Zwiększ różnorodność
                this.adaptPattern('navigation', 'pathVariety', 7, avoidanceRate);
                break;
            case 'detected_pattern':
                // Zmień wzorce
                this.randomizeCurrentPatterns();
                break;
        }
    }

    /**
     * Losuje aktualne wzorce
     */
    randomizeCurrentPatterns() {
        Object.keys(this.patterns).forEach(category => {
            Object.keys(this.patterns[category]).forEach(parameter => {
                const pattern = this.patterns[category][parameter];
                if (pattern.min !== undefined && pattern.max !== undefined) {
                    pattern.current = Math.random() * (pattern.max - pattern.min) + pattern.min;
                }
            });
        });
    }

    /**
     * Kończy sesję i zapisuje dane
     */
    endSession(success = true, banned = false) {
        this.currentSession.endTime = Date.now();
        this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
        this.currentSession.success = success;
        this.currentSession.banned = banned;
        
        // Dodaj do historii
        this.sessionHistory.push(this.currentSession);
        
        // Aktualizuj metryki
        this.updateSuccessMetrics(success, banned);
        
        // Zapisz dane
        this.saveSessionHistory();
        this.saveSuccessMetrics();
        this.savePatterns();
        
        // Resetuj sesję
        this.currentSession = {
            startTime: Date.now(),
            actions: [],
            timingPatterns: [],
            successEvents: [],
            riskEvents: []
        };
    }

    /**
     * Aktualizuje metryki sukcesu
     */
    updateSuccessMetrics(success, banned) {
        this.successMetrics.totalSessions++;
        
        if (success) {
            this.successMetrics.successfulSessions++;
        }
        
        if (banned) {
            this.successMetrics.bannedSessions++;
        }
        
        this.successMetrics.averageSuccessRate = 
            this.successMetrics.successfulSessions / this.successMetrics.totalSessions;
    }

    /**
     * Pobiera optymalne parametry dla danej akcji
     */
    getOptimalParameters(actionType) {
        const parameters = {};
        
        switch (actionType) {
            case 'mouse_move':
                parameters.speed = this.patterns.mouseMovements.averageSpeed.current;
                parameters.pauseFrequency = this.patterns.mouseMovements.pauseFrequency.current;
                parameters.microMovements = Math.floor(this.patterns.mouseMovements.microMovements.current);
                break;
            case 'scroll':
                parameters.speed = this.patterns.scrolling.scrollSpeed.current;
                parameters.direction = Math.random() < this.patterns.scrolling.scrollDirection.current ? 'down' : 'up';
                parameters.pause = this.patterns.scrolling.scrollPauses.current;
                break;
            case 'type':
                parameters.speed = this.patterns.typing.typingSpeed.current;
                parameters.errorRate = this.patterns.typing.errorRate.current;
                parameters.backspaceFrequency = this.patterns.typing.backspaceFrequency.current;
                break;
            case 'delay':
                parameters.actionDelay = this.patterns.timing.actionDelay.current;
                parameters.readingTime = this.patterns.timing.readingTime.current;
                parameters.thinkingTime = this.patterns.timing.thinkingTime.current;
                break;
            case 'navigate':
                parameters.pathVariety = Math.floor(this.patterns.navigation.pathVariety.current);
                parameters.backtrackFrequency = this.patterns.navigation.backtrackFrequency.current;
                parameters.explorationRate = this.patterns.navigation.explorationRate.current;
                break;
        }
        
        return parameters;
    }

    /**
     * Pobiera statystyki uczenia się
     */
    getLearningStats() {
        return {
            sessions: this.sessionHistory.length,
            successRate: this.successMetrics.averageSuccessRate,
            banRate: this.successMetrics.bannedSessions / this.successMetrics.totalSessions,
            patterns: this.patterns,
            effectiveness: this.successMetrics.patternEffectiveness,
            currentSession: {
                duration: Date.now() - this.currentSession.startTime,
                actions: this.currentSession.actions.length,
                successes: this.currentSession.successEvents.length,
                risks: this.currentSession.riskEvents.length
            }
        };
    }

    /**
     * Analizuje trendy w zachowaniach
     */
    analyzeTrends() {
        if (this.sessionHistory.length < 5) return null;
        
        const recentSessions = this.sessionHistory.slice(-10);
        const successTrend = recentSessions.map(s => s.success ? 1 : 0);
        const riskTrend = recentSessions.map(s => s.riskEvents.length);
        
        return {
            successTrend: this.calculateTrend(successTrend),
            riskTrend: this.calculateTrend(riskTrend),
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * Oblicza trend (rosnący/spadający/stabilny)
     */
    calculateTrend(values) {
        if (values.length < 2) return 'stable';
        
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        const change = (secondAvg - firstAvg) / firstAvg;
        
        if (change > 0.1) return 'improving';
        if (change < -0.1) return 'declining';
        return 'stable';
    }

    /**
     * Generuje rekomendacje
     */
    generateRecommendations() {
        const recommendations = [];
        const stats = this.getLearningStats();
        
        if (stats.successRate < 0.8) {
            recommendations.push('Consider increasing delays and reducing activity frequency');
        }
        
        if (stats.banRate > 0.05) {
            recommendations.push('High ban rate detected - implement more conservative patterns');
        }
        
        const recentRisks = this.currentSession.riskEvents.length;
        if (recentRisks > 3) {
            recommendations.push('Multiple risk events in current session - consider taking a break');
        }
        
        return recommendations;
    }
}

module.exports = BehavioralLearning;
