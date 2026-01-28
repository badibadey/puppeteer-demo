console.log('✅ Loaded lib/fault-tolerance.js');

/**
 * System Fault Tolerance & Auto-Recovery
 * Zapewnia odporność na awarie i automatyczne odtwarzanie
 */
class FaultTolerance {
    constructor(config = {}) {
        this.config = {
            maxRetries: config.maxRetries || 3,
            retryDelay: config.retryDelay || 5000,
            circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
            circuitBreakerTimeout: config.circuitBreakerTimeout || 60000,
            healthCheckInterval: config.healthCheckInterval || 30000,
            maxMemoryUsage: config.maxMemoryUsage || 2048, // MB
            maxCpuUsage: config.maxCpuUsage || 80, // %
            ...config
        };

        // Circuit Breaker state
        this.circuitBreaker = {
            isOpen: false,
            failureCount: 0,
            lastFailureTime: null,
            nextRetryTime: null
        };

        // Health monitoring
        this.healthStatus = {
            isHealthy: true,
            lastHealthCheck: Date.now(),
            consecutiveFailures: 0,
            totalFailures: 0,
            totalRecoveries: 0
        };

        // Retry tracking
        this.retryAttempts = new Map();
        this.recoveryActions = [];

        // Performance monitoring
        this.performanceMetrics = {
            memoryUsage: [],
            cpuUsage: [],
            responseTime: [],
            errorRate: []
        };

        // Start health monitoring
        this.startHealthMonitoring();
    }

    /**
     * Uruchamia monitorowanie zdrowia systemu
     */
    startHealthMonitoring() {
        if (this.healthCheckInterval) {
            setInterval(() => {
                this.performHealthCheck();
            }, this.healthCheckInterval);
        }
    }

    /**
     * Wykonuje health check systemu
     */
    async performHealthCheck() {
        try {
            const health = await this.getSystemHealth();
            
            // Sprawdź memory usage
            if (health.memoryUsage > this.config.maxMemoryUsage) {
                this.handleMemoryIssue(health.memoryUsage);
            }

            // Sprawdź CPU usage
            if (health.cpuUsage > this.config.maxCpuUsage) {
                this.handleCpuIssue(health.cpuUsage);
            }

            // Aktualizuj status
            this.healthStatus.isHealthy = health.isHealthy;
            this.healthStatus.lastHealthCheck = Date.now();

            if (health.isHealthy) {
                this.healthStatus.consecutiveFailures = 0;
            }

            console.log(`🏥 Health Check: ${health.isHealthy ? '✅ Healthy' : '❌ Unhealthy'} | Memory: ${health.memoryUsage}MB | CPU: ${health.cpuUsage}%`);

        } catch (error) {
            console.error('❌ Health check failed:', error);
            this.healthStatus.consecutiveFailures++;
        }
    }

    /**
     * Pobiera aktualne statystyki systemu
     */
    async getSystemHealth() {
        const memUsage = process.memoryUsage();
        const memoryUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        
        // Symulacja CPU usage (w rzeczywistym systemie użylibyśmy proper CPU monitoring)
        const cpuUsage = this.simulateCpuUsage();
        
        const isHealthy = (
            memoryUsageMB < this.config.maxMemoryUsage &&
            cpuUsage < this.config.maxCpuUsage &&
            !this.circuitBreaker.isOpen
        );

        return {
            isHealthy,
            memoryUsage: memoryUsageMB,
            cpuUsage,
            uptime: process.uptime(),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
            heapUsed: memoryUsageMB,
            external: Math.round(memUsage.external / 1024 / 1024)
        };
    }

    /**
     * Symuluje CPU usage (placeholder)
     */
    simulateCpuUsage() {
        // W rzeczywistym systemie użylibyśmy np. process.cpuUsage()
        return Math.random() * 100;
    }

    /**
     * Obsługuje problemy z pamięcią
     */
    handleMemoryIssue(memoryUsage) {
        console.warn(`⚠️ High memory usage detected: ${memoryUsage}MB`);
        
        this.recoveryActions.push({
            type: 'memory_issue',
            timestamp: Date.now(),
            memoryUsage,
            action: 'garbage_collection'
        });

        // Wymuś garbage collection
        if (global.gc) {
            global.gc();
            console.log('🗑️ Forced garbage collection');
        }

        // Jeśli nadal wysokie, rozważ restart
        setTimeout(async () => {
            const newHealth = await this.getSystemHealth();
            if (newHealth.memoryUsage > this.config.maxMemoryUsage) {
                console.warn('⚠️ Memory usage still high after GC');
                this.scheduleGracefulRestart();
            }
        }, 5000);
    }

    /**
     * Obsługuje problemy z CPU
     */
    handleCpuIssue(cpuUsage) {
        console.warn(`⚠️ High CPU usage detected: ${cpuUsage}%`);
        
        this.recoveryActions.push({
            type: 'cpu_issue',
            timestamp: Date.now(),
            cpuUsage,
            action: 'throttling'
        });

        // Zmniejsz aktywność
        console.log('🐌 Throttling system activity');
    }

    /**
     * Wykonuje operację z retry logic i circuit breaker
     */
    async executeWithRetry(operation, operationName, context = {}) {
        const operationId = `${operationName}_${Date.now()}`;
        
        // Sprawdź circuit breaker
        if (this.circuitBreaker.isOpen) {
            if (Date.now() < this.circuitBreaker.nextRetryTime) {
                throw new Error(`Circuit breaker is open for ${operationName}. Next retry at ${new Date(this.circuitBreaker.nextRetryTime)}`);
            } else {
                // Spróbuj zamknąć circuit breaker
                this.circuitBreaker.isOpen = false;
                this.circuitBreaker.failureCount = 0;
                console.log(`🔓 Circuit breaker closed for ${operationName}`);
            }
        }

        let lastError;
        
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                console.log(`🔄 Executing ${operationName} (attempt ${attempt}/${this.config.maxRetries})`);
                
                const startTime = Date.now();
                const result = await operation();
                const responseTime = Date.now() - startTime;
                
                // Sukces - zresetuj circuit breaker
                if (this.circuitBreaker.failureCount > 0) {
                    this.circuitBreaker.failureCount = 0;
                    this.healthStatus.totalRecoveries++;
                    console.log(`✅ ${operationName} recovered after failures`);
                }
                
                // Zapisz metryki
                this.recordSuccessMetrics(operationName, responseTime);
                
                return result;
                
            } catch (error) {
                lastError = error;
                this.healthStatus.totalFailures++;
                this.circuitBreaker.failureCount++;
                this.circuitBreaker.lastFailureTime = Date.now();
                
                console.error(`❌ ${operationName} attempt ${attempt} failed:`, error.message);
                
                // Sprawdź circuit breaker threshold
                if (this.circuitBreaker.failureCount >= this.config.circuitBreakerThreshold) {
                    this.circuitBreaker.isOpen = true;
                    this.circuitBreaker.nextRetryTime = Date.now() + this.config.circuitBreakerTimeout;
                    console.error(`🚨 Circuit breaker OPENED for ${operationName} (threshold: ${this.config.circuitBreakerThreshold})`);
                    break;
                }
                
                // Odczekaj przed kolejną próbą
                if (attempt < this.config.maxRetries) {
                    const delay = this.calculateRetryDelay(attempt);
                    console.log(`⏳ Retrying ${operationName} in ${delay}ms...`);
                    await this.sleep(delay);
                }
            }
        }
        
        // Zapisz metryki błędu
        this.recordFailureMetrics(operationName, lastError);
        
        throw lastError;
    }

    /**
     * Oblicza delay dla retry z exponential backoff
     */
    calculateRetryDelay(attempt) {
        const baseDelay = this.config.retryDelay;
        const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 1000; // Dodaj jitter
        
        return Math.min(exponentialDelay + jitter, 30000); // Max 30 sekund
    }

    /**
     * Zapisuje metryki sukcesu
     */
    recordSuccessMetrics(operationName, responseTime) {
        this.performanceMetrics.responseTime.push({
            operation: operationName,
            time: responseTime,
            timestamp: Date.now(),
            success: true
        });
        
        // Ogranicz historię
        if (this.performanceMetrics.responseTime.length > 1000) {
            this.performanceMetrics.responseTime = this.performanceMetrics.responseTime.slice(-500);
        }
    }

    /**
     * Zapisuje metryki błędu
     */
    recordFailureMetrics(operationName, error) {
        this.performanceMetrics.errorRate.push({
            operation: operationName,
            error: error.message,
            timestamp: Date.now(),
            success: false
        });
        
        // Ogranicz historię
        if (this.performanceMetrics.errorRate.length > 1000) {
            this.performanceMetrics.errorRate = this.performanceMetrics.errorRate.slice(-500);
        }
    }

    /**
     * Planuje graceful restart
     */
    scheduleGracefulRestart() {
        console.log('🔄 Scheduling graceful restart...');
        
        this.recoveryActions.push({
            type: 'graceful_restart',
            timestamp: Date.now(),
            reason: 'high_resource_usage'
        });

        // Daj czas na zakończenie operacji
        setTimeout(() => {
            console.log('🔄 Performing graceful restart...');
            process.exit(1); // Process manager powinien zrestartować
        }, 10000);
    }

    /**
     * Obsługuje critical errors
     */
    handleCriticalError(error, context = {}) {
        console.error('🚨 CRITICAL ERROR:', error);
        console.error('Context:', context);
        
        this.recoveryActions.push({
            type: 'critical_error',
            timestamp: Date.now(),
            error: error.message,
            stack: error.stack,
            context
        });

        // Natychmiastowe działania recovery
        this.immediateRecoveryActions(error);
    }

    /**
     * Natychmiastowe działania recovery
     */
    immediateRecoveryActions(error) {
        // Wymuś garbage collection
        if (global.gc) {
            global.gc();
        }

        // Zapisz stan systemu
        this.saveSystemState();

        // Spróbuj odzyskać połączenia
        this.attemptConnectionRecovery();
    }

    /**
     * Zapisuje stan systemu przed restartem
     */
    saveSystemState() {
        try {
            const state = {
                timestamp: Date.now(),
                healthStatus: this.healthStatus,
                circuitBreaker: this.circuitBreaker,
                performanceMetrics: {
                    errorRate: this.performanceMetrics.errorRate.slice(-10),
                    responseTime: this.performanceMetrics.responseTime.slice(-10)
                },
                recoveryActions: this.recoveryActions.slice(-5)
            };

            // W rzeczywistym systemie zapisalibyśmy do pliku lub bazy
            console.log('💾 System state saved for recovery');
            
        } catch (error) {
            console.error('❌ Failed to save system state:', error);
        }
    }

    /**
     * Próbuje odzyskać połączenia
     */
    attemptConnectionRecovery() {
        console.log('🔄 Attempting connection recovery...');
        
        // Tutaj moglibyśmy próbować odświeżyć połączenia z bazą, proxy, etc.
        // To jest placeholder dla konkretnej implementacji
    }

    /**
     * Pobiera status systemu
     */
    getSystemStatus() {
        return {
            health: this.healthStatus,
            circuitBreaker: this.circuitBreaker,
            performance: {
                avgResponseTime: this.calculateAverageResponseTime(),
                errorRate: this.calculateErrorRate(),
                recentFailures: this.performanceMetrics.errorRate.slice(-5)
            },
            recovery: {
                totalRecoveries: this.healthStatus.totalRecoveries,
                recentActions: this.recoveryActions.slice(-5)
            },
            config: this.config
        };
    }

    /**
     * Oblicza średni response time
     */
    calculateAverageResponseTime() {
        const recent = this.performanceMetrics.responseTime.slice(-50);
        if (recent.length === 0) return 0;
        
        const total = recent.reduce((sum, metric) => sum + metric.time, 0);
        return Math.round(total / recent.length);
    }

    /**
     * Oblicza error rate
     */
    calculateErrorRate() {
        const recent = this.performanceMetrics.errorRate.slice(-100);
        if (recent.length === 0) return 0;
        
        const errors = recent.filter(metric => !metric.success).length;
        return Math.round((errors / recent.length) * 100);
    }

    /**
     * Resetuje system
     */
    reset() {
        console.log('🔄 Resetting fault tolerance system...');
        
        this.circuitBreaker = {
            isOpen: false,
            failureCount: 0,
            lastFailureTime: null,
            nextRetryTime: null
        };

        this.healthStatus.consecutiveFailures = 0;
        this.recoveryActions = [];
        this.retryAttempts.clear();
    }

    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = FaultTolerance;
