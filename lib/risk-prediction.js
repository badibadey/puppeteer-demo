const { setTimeout } = require('timers/promises');
console.log('✅ Loaded lib/risk-prediction.js');

/**
 * System przewidywania ryzyka bana w czasie rzeczywistym
 */
class RiskPrediction {
    constructor() {
        this.riskFactors = {
            timing: {
                weight: 0.3,
                thresholds: {
                    low: 0.2,
                    medium: 0.5,
                    high: 0.8
                }
            },
            behavior: {
                weight: 0.25,
                thresholds: {
                    low: 0.15,
                    medium: 0.4,
                    high: 0.7
                }
            },
            patterns: {
                weight: 0.2,
                thresholds: {
                    low: 0.1,
                    medium: 0.3,
                    high: 0.6
                }
            },
            network: {
                weight: 0.15,
                thresholds: {
                    low: 0.1,
                    medium: 0.3,
                    high: 0.5
                }
            },
            session: {
                weight: 0.1,
                thresholds: {
                    low: 0.2,
                    medium: 0.4,
                    high: 0.6
                }
            }
        };
        
        this.currentRiskScore = 0;
        this.riskHistory = [];
        this.alerts = [];
        this.mitigationActions = [];
    }

    /**
     * Oblicza aktualny wynik ryzyka
     */
    calculateRiskScore(sessionData) {
        const scores = {
            timing: this.assessTimingRisk(sessionData),
            behavior: this.assessBehaviorRisk(sessionData),
            patterns: this.assessPatternRisk(sessionData),
            network: this.assessNetworkRisk(sessionData),
            session: this.assessSessionRisk(sessionData)
        };
        
        // Ważona suma wszystkich czynników
        let totalScore = 0;
        let totalWeight = 0;
        
        Object.keys(scores).forEach(factor => {
            const weight = this.riskFactors[factor].weight;
            totalScore += scores[factor] * weight;
            totalWeight += weight;
        });
        
        this.currentRiskScore = totalScore / totalWeight;
        
        // Zapisz historię
        this.riskHistory.push({
            timestamp: Date.now(),
            score: this.currentRiskScore,
            breakdown: scores,
            sessionData: this.sanitizeSessionData(sessionData)
        });
        
        // Ogranicz historię
        if (this.riskHistory.length > 100) {
            this.riskHistory = this.riskHistory.slice(-100);
        }
        
        return this.currentRiskScore;
    }

    /**
     * Ocenia ryzyko związane z timingiem
     */
    assessTimingRisk(sessionData) {
        let riskScore = 0;
        
        // Sprawdź prędkość akcji
        if (sessionData.actionSpeed) {
            if (sessionData.actionSpeed < 500) {
                riskScore += 0.4; // Zbyt szybkie akcje
            } else if (sessionData.actionSpeed < 1000) {
                riskScore += 0.2; // Szybkie akcje
            }
        }
        
        // Sprawdź regularność timingów
        if (sessionData.timingVariance) {
            if (sessionData.timingVariance < 100) {
                riskScore += 0.3; // Zbyt regularne
            } else if (sessionData.timingVariance < 300) {
                riskScore += 0.1; // Mało zróżnicowane
            }
        }
        
        // Sprawdź czas sesji
        if (sessionData.sessionDuration) {
            const durationMinutes = sessionData.sessionDuration / (1000 * 60);
            if (durationMinutes > 60) {
                riskScore += 0.2; // Zbyt długa sesja
            } else if (durationMinutes > 30) {
                riskScore += 0.1; // Długa sesja
            }
        }
        
        return Math.min(riskScore, 1);
    }

    /**
     * Ocenia ryzyko związane z zachowaniem
     */
    assessBehaviorRisk(sessionData) {
        let riskScore = 0;
        
        // Sprawdź ruchy myszy
        if (sessionData.mouseMovements) {
            if (sessionData.mouseMovements.linearity > 0.9) {
                riskScore += 0.3; // Zbyt linearne ruchy
            }
            if (sessionData.mouseMovements.pauseFrequency < 0.1) {
                riskScore += 0.2; // Brak pauz
            }
        }
        
        // Sprawdź scrollowanie
        if (sessionData.scrollBehavior) {
            if (sessionData.scrollBehavior.consistency > 0.8) {
                riskScore += 0.2; // Zbyt spójne scrollowanie
            }
            if (sessionData.scrollBehavior.directionRatio > 0.95) {
                riskScore += 0.1; // Zawsze w tym samym kierunku
            }
        }
        
        // Sprawdź błędy
        if (sessionData.errorRate !== undefined) {
            if (sessionData.errorRate < 0.01) {
                riskScore += 0.2; // Zbyt mało błędów
            } else if (sessionData.errorRate > 0.1) {
                riskScore += 0.1; // Zbyt dużo błędów
            }
        }
        
        return Math.min(riskScore, 1);
    }

    /**
     * Ocenia ryzyko związane z wzorcami
     */
    assessPatternRisk(sessionData) {
        let riskScore = 0;
        
        // Sprawdź powtarzalność ścieżek
        if (sessionData.pathRepetition) {
            if (sessionData.pathRepetition > 0.8) {
                riskScore += 0.4; // Wysoka powtarzalność
            } else if (sessionData.pathRepetition > 0.6) {
                riskScore += 0.2; // Umiarkowana powtarzalność
            }
        }
        
        // Sprawdź sekwencje akcji
        if (sessionData.actionSequences) {
            if (sessionData.actionSequences.variety < 3) {
                riskScore += 0.3; // Mała różnorodność
            }
        }
        
        // Sprawdź interakcje z elementami
        if (sessionData.elementInteractions) {
            if (sessionData.elementInteractions.sameElements > 0.7) {
                riskScore += 0.2; // Zawsze te same elementy
            }
        }
        
        return Math.min(riskScore, 1);
    }

    /**
     * Ocenia ryzyko związane z siecią
     */
    assessNetworkRisk(sessionData) {
        let riskScore = 0;
        
        // Sprawdź proxy
        if (sessionData.proxyInfo) {
            if (sessionData.proxyInfo.failedAttempts > 3) {
                riskScore += 0.3; // Problemy z proxy
            }
            if (sessionData.proxyInfo.reputation < 0.5) {
                riskScore += 0.2; // Słaba reputacja proxy
            }
        }
        
        // Sprawdź request timing
        if (sessionData.requestPatterns) {
            if (sessionData.requestPatterns.frequency > 10) {
                riskScore += 0.3; // Zbyt częste requesty
            }
            if (sessionData.requestPatterns.burstiness > 0.8) {
                riskScore += 0.2; // Bursty requestów
            }
        }
        
        return Math.min(riskScore, 1);
    }

    /**
     * Ocenia ryzyko związane z sesją
     */
    assessSessionRisk(sessionData) {
        let riskScore = 0;
        
        // Sprawdź liczbę postów
        if (sessionData.postsProcessed) {
            if (sessionData.postsProcessed > 50) {
                riskScore += 0.3; // Zbyt wiele postów
            } else if (sessionData.postsProcessed > 30) {
                riskScore += 0.1; // Wiele postów
            }
        }
        
        // Sprawdź success rate
        if (sessionData.successRate !== undefined) {
            if (sessionData.successRate < 0.5) {
                riskScore += 0.2; // Niska skuteczność
            }
        }
        
        // Sprawdź czas od ostatniej sesji
        if (sessionData.timeSinceLastSession) {
            const hoursSince = sessionData.timeSinceLastSession / (1000 * 60 * 60);
            if (hoursSince < 1) {
                riskScore += 0.3; // Zbyt częste sesje
            } else if (hoursSince < 6) {
                riskScore += 0.1; // Częste sesje
            }
        }
        
        return Math.min(riskScore, 1);
    }

    /**
     * Usuwa wrażliwe dane z sesji
     */
    sanitizeSessionData(sessionData) {
        const sanitized = { ...sessionData };
        
        // Usuń wrażliwe informacje
        delete sanitized.cookies;
        delete sanitized.userData;
        delete sanitized.sensitiveData;
        
        return sanitized;
    }

    /**
     * Pobiera poziom ryzyka
     */
    getRiskLevel() {
        if (this.currentRiskScore < 0.3) return 'low';
        if (this.currentRiskScore < 0.6) return 'medium';
        if (this.currentRiskScore < 0.8) return 'high';
        return 'critical';
    }

    /**
     * Generuje alerty
     */
    generateAlerts() {
        const alerts = [];
        const riskLevel = this.getRiskLevel();
        
        if (riskLevel === 'critical') {
            alerts.push({
                type: 'critical',
                message: 'Krytyczne ryzyko bana! Zalecane natychmiastowe zatrzymanie sesji.',
                action: 'stop_session',
                timestamp: Date.now()
            });
        } else if (riskLevel === 'high') {
            alerts.push({
                type: 'high',
                message: 'Wysokie ryzyko bana. Zalecane zwolnienie aktywności.',
                action: 'slow_down',
                timestamp: Date.now()
            });
        } else if (riskLevel === 'medium') {
            alerts.push({
                type: 'medium',
                message: 'Średnie ryzyko bana. Zalecana ostrożność.',
                action: 'be_cautious',
                timestamp: Date.now()
            });
        }
        
        // Sprawdź trendy
        const trend = this.analyzeRiskTrend();
        if (trend === 'increasing') {
            alerts.push({
                type: 'trend',
                message: 'Ryzyko rośnie. Rozważ przerwę.',
                action: 'take_break',
                timestamp: Date.now()
            });
        }
        
        this.alerts = alerts;
        return alerts;
    }

    /**
     * Analizuje trend ryzyka
     */
    analyzeRiskTrend() {
        if (this.riskHistory.length < 5) return 'stable';
        
        const recentScores = this.riskHistory.slice(-5).map(h => h.score);
        const olderScores = this.riskHistory.slice(-10, -5).map(h => h.score);
        
        if (olderScores.length === 0) return 'stable';
        
        const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
        
        const change = (recentAvg - olderAvg) / olderAvg;
        
        if (change > 0.2) return 'increasing';
        if (change < -0.2) return 'decreasing';
        return 'stable';
    }

    /**
     * Generuje działania mitigacyjne
     */
    generateMitigationActions() {
        const actions = [];
        const riskLevel = this.getRiskLevel();
        
        if (riskLevel === 'critical') {
            actions.push({
                type: 'immediate',
                action: 'stop_session',
                description: 'Natychmiastowe zatrzymanie sesji',
                priority: 1
            });
            actions.push({
                type: 'immediate',
                action: 'change_proxy',
                description: 'Zmiana proxy IP',
                priority: 2
            });
        } else if (riskLevel === 'high') {
            actions.push({
                type: 'adjustment',
                action: 'increase_delays',
                description: 'Zwiększenie opóźnień o 50%',
                priority: 1
            });
            actions.push({
                type: 'adjustment',
                action: 'reduce_activity',
                description: 'Redukcja aktywności o 30%',
                priority: 2
            });
        } else if (riskLevel === 'medium') {
            actions.push({
                type: 'prevention',
                action: 'add_randomness',
                description: 'Dodanie więcej losowości do zachowań',
                priority: 1
            });
            actions.push({
                type: 'prevention',
                action: 'take_short_break',
                description: 'Krótka przerwa 5-10 minut',
                priority: 2
            });
        }
        
        this.mitigationActions = actions;
        return actions;
    }

    /**
     * Pobiera rekomendacje
     */
    getRecommendations() {
        const recommendations = [];
        const riskLevel = this.getRiskLevel();
        
        if (riskLevel === 'critical' || riskLevel === 'high') {
            recommendations.push('Natychmiast zatrzymaj sesję i odczekaj co najmniej 30 minut');
            recommendations.push('Zmień proxy i odśwież fingerprint urządzenia');
            recommendations.push('Przejrzyj logi aby zidentyfikować problematyczne wzorce');
        }
        
        if (riskLevel === 'medium') {
            recommendations.push('Zwiększ opóźnienia między akcjami o 25-50%');
            recommendations.push('Dodaj więcej naturalnych zachowań (mysz, scroll)');
            recommendations.push('Rozważ krótką przerwę 5-10 minut');
        }
        
        // Trend-based recommendations
        const trend = this.analyzeRiskTrend();
        if (trend === 'increasing') {
            recommendations.push('Ryzyko systematycznie rośnie - rozważ dłuższą przerwę');
            recommendations.push('Sprawdź czy nie nastąpiła zmiana w systemie detekcji Facebooka');
        }
        
        return recommendations;
    }

    /**
     * Pobiera pełny raport ryzyka
     */
    getRiskReport() {
        return {
            currentScore: this.currentRiskScore,
            riskLevel: this.getRiskLevel(),
            trend: this.analyzeRiskTrend(),
            alerts: this.generateAlerts(),
            mitigationActions: this.generateMitigationActions(),
            recommendations: this.getRecommendations(),
            history: this.riskHistory.slice(-10),
            summary: {
                totalAssessments: this.riskHistory.length,
                averageRisk: this.riskHistory.reduce((sum, h) => sum + h.score, 0) / this.riskHistory.length,
                peakRisk: Math.max(...this.riskHistory.map(h => h.score)),
                lastUpdate: Date.now()
            }
        };
    }

    /**
     * Resetuje system ryzyka
     */
    reset() {
        this.currentRiskScore = 0;
        this.alerts = [];
        this.mitigationActions = [];
    }

    /**
     * Czyści starą historię
     */
    cleanup() {
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 godziny
        this.riskHistory = this.riskHistory.filter(h => h.timestamp > cutoffTime);
    }
}

module.exports = RiskPrediction;
