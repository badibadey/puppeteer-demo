console.log('✅ Loaded lib/distributed-coordinator.js');

/**
 * Distributed Architecture Coordinator
 * Zarządza wieloma instancjami bota, load balancing i fault tolerance
 */
class DistributedCoordinator {
    constructor(config = {}) {
        this.config = {
            maxInstances: config.maxInstances || 5,
            healthCheckInterval: config.healthCheckInterval || 30000,
            loadBalancingStrategy: config.loadBalancingStrategy || 'round_robin',
            instanceTimeout: config.instanceTimeout || 120000, // 2 minuty
            sharedStatePath: config.sharedStatePath || './shared-state',
            ...config
        };

        // Stan instancji
        this.instances = new Map(); // instanceId -> instance info
        this.currentInstanceIndex = 0;
        this.sharedState = {};
        this.isCoordinator = false;
        this.instanceId = this.generateInstanceId();

        // Load balancing
        this.loadBalancer = {
            strategy: this.config.loadBalancingStrategy,
            roundRobinIndex: 0,
            leastConnections: new Map()
        };

        // Health monitoring
        this.healthMonitor = {
            lastHealthCheck: Date.now(),
            unhealthyInstances: new Set(),
            recoveryAttempts: new Map()
        };

        // Task queue
        this.taskQueue = [];
        this.completedTasks = [];
        this.failedTasks = [];

        // Inicjalizacja
        this.initialize();
    }

    /**
     * Inicjalizuje koordynatora
     */
    async initialize() {
        console.log(`🔄 Initializing Distributed Coordinator (Instance: ${this.instanceId})`);
        
        // Sprawdź czy jesteśmy koordynatorem
        await this.electCoordinator();
        
        // Załaduj shared state
        await this.loadSharedState();
        
        // Start health monitoring
        this.startHealthMonitoring();
        
        // Rejestracja instancji
        if (this.isCoordinator) {
            await this.registerInstance();
        }
        
        console.log(`✅ Distributed Coordinator initialized - ${this.isCoordinator ? 'Coordinator' : 'Worker'}`);
    }

    /**
     * Generuje unikalne ID instancji
     */
    generateInstanceId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `bot_${timestamp}_${random}`;
    }

    /**
     * Wybiera koordynatora (simple election)
     */
    async electCoordinator() {
        // W prostym przypadku pierwsza instancja jest koordynatorem
        // W rzeczywistym systemie użylibyśmy consensus algorithm
        
        try {
            // Sprawdź czy istnieje lock file
            const fs = require('fs');
            const path = require('path');
            const lockFile = path.join(this.config.sharedStatePath, 'coordinator.lock');
            
            if (fs.existsSync(lockFile)) {
                const lockData = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
                
                // Sprawdź czy lock jest wciąż ważny
                if (Date.now() - lockData.timestamp < this.config.instanceTimeout) {
                    this.isCoordinator = false;
                    this.coordinatorId = lockData.instanceId;
                    return;
                }
            }
            
            // Zostań koordynatorem
            this.isCoordinator = true;
            this.coordinatorId = this.instanceId;
            
            // Stwórz lock file
            if (!fs.existsSync(this.config.sharedStatePath)) {
                fs.mkdirSync(this.config.sharedStatePath, { recursive: true });
            }
            
            fs.writeFileSync(lockFile, JSON.stringify({
                instanceId: this.instanceId,
                timestamp: Date.now()
            }));
            
        } catch (error) {
            console.error('❌ Election failed:', error);
            this.isCoordinator = false;
        }
    }

    /**
     * Ładuje shared state
     */
    async loadSharedState() {
        try {
            const fs = require('fs');
            const path = require('path');
            const stateFile = path.join(this.config.sharedStatePath, 'shared-state.json');
            
            if (fs.existsSync(stateFile)) {
                this.sharedState = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
                console.log('📁 Shared state loaded');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load shared state:', error);
            this.sharedState = {};
        }
    }

    /**
     * Zapisuje shared state
     */
    async saveSharedState() {
        if (!this.isCoordinator) return;
        
        try {
            const fs = require('fs');
            const path = require('path');
            const stateFile = path.join(this.config.sharedStatePath, 'shared-state.json');
            
            fs.writeFileSync(stateFile, JSON.stringify(this.sharedState, null, 2));
        } catch (error) {
            console.error('❌ Failed to save shared state:', error);
        }
    }

    /**
     * Rejestruje instancję
     */
    async registerInstance() {
        const instanceInfo = {
            id: this.instanceId,
            status: 'active',
            lastSeen: Date.now(),
            tasksCompleted: 0,
            currentLoad: 0,
            capabilities: ['scraping', 'processing']
        };
        
        this.instances.set(this.instanceId, instanceInfo);
        await this.saveSharedState();
        
        console.log(`📝 Instance registered: ${this.instanceId}`);
    }

    /**
     * Startuje health monitoring
     */
    startHealthMonitoring() {
        setInterval(async () => {
            await this.performHealthCheck();
        }, this.config.healthCheckInterval);
    }

    /**
     * Wykonuje health check wszystkich instancji
     */
    async performHealthCheck() {
        if (!this.isCoordinator) return;
        
        const now = Date.now();
        const deadInstances = [];
        
        for (const [instanceId, instance] of this.instances) {
            if (now - instance.lastSeen > this.config.instanceTimeout) {
                deadInstances.push(instanceId);
                this.healthMonitor.unhealthyInstances.add(instanceId);
            }
        }
        
        // Usuń martwe instancje
        for (const instanceId of deadInstances) {
            console.log(`💀 Removing dead instance: ${instanceId}`);
            this.instances.delete(instanceId);
            this.healthMonitor.unhealthyInstances.delete(instanceId);
        }
        
        await this.saveSharedState();
    }

    /**
     * Rozdziela zadanie między instancje
     */
    async distributeTask(task) {
        if (!this.isCoordinator) {
            // Jeśli nie jesteśmy koordynatorem, przekaż zadanie
            return await this.forwardToCoordinator(task);
        }
        
        // Wybierz instancję na podstawie strategii
        const selectedInstance = this.selectInstance();
        
        if (!selectedInstance) {
            throw new Error('No available instances');
        }
        
        // Dodaj zadanie do kolejki
        const taskWithId = {
            ...task,
            id: this.generateTaskId(),
            assignedTo: selectedInstance.id,
            createdAt: Date.now(),
            status: 'assigned'
        };
        
        this.taskQueue.push(taskWithId);
        
        console.log(`📋 Task ${taskWithId.id} assigned to ${selectedInstance.id}`);
        
        // Jeśli to my jesteśmy wybraną instancją, wykonaj zadanie
        if (selectedInstance.id === this.instanceId) {
            return await this.executeTask(taskWithId);
        }
        
        return taskWithId;
    }

    /**
     * Wybiera instancję do wykonania zadania
     */
    selectInstance() {
        const activeInstances = Array.from(this.instances.values())
            .filter(instance => instance.status === 'active')
            .filter(instance => !this.healthMonitor.unhealthyInstances.has(instance.id));
        
        if (activeInstances.length === 0) return null;
        
        switch (this.loadBalancer.strategy) {
            case 'round_robin':
                return this.roundRobinSelection(activeInstances);
            case 'least_connections':
                return this.leastConnectionsSelection(activeInstances);
            case 'random':
                return this.randomSelection(activeInstances);
            default:
                return activeInstances[0];
        }
    }

    /**
     * Round robin selection
     */
    roundRobinSelection(instances) {
        const instance = instances[this.loadBalancer.roundRobinIndex % instances.length];
        this.loadBalancer.roundRobinIndex++;
        return instance;
    }

    /**
     * Least connections selection
     */
    leastConnectionsSelection(instances) {
        return instances.reduce((min, current) => 
            (current.currentLoad < min.currentLoad) ? current : min
        );
    }

    /**
     * Random selection
     */
    randomSelection(instances) {
        return instances[Math.floor(Math.random() * instances.length)];
    }

    /**
     * Generuje ID zadania
     */
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Wykonuje zadanie
     */
    async executeTask(task) {
        const startTime = Date.now();
        
        try {
            console.log(`🚀 Executing task ${task.id}: ${task.type}`);
            
            // Aktualizuj status instancji
            if (this.instances.has(this.instanceId)) {
                this.instances.get(this.instanceId).currentLoad++;
            }
            
            // Wykonaj zadanie
            let result;
            switch (task.type) {
                case 'scrape_group':
                    result = await this.executeScrapingTask(task);
                    break;
                case 'process_posts':
                    result = await this.executeProcessingTask(task);
                    break;
                default:
                    throw new Error(`Unknown task type: ${task.type}`);
            }
            
            // Zakończ zadanie
            const duration = Date.now() - startTime;
            task.status = 'completed';
            task.completedAt = Date.now();
            task.duration = duration;
            task.result = result;
            
            this.completedTasks.push(task);
            
            // Aktualizuj statystyki instancji
            if (this.instances.has(this.instanceId)) {
                const instance = this.instances.get(this.instanceId);
                instance.currentLoad--;
                instance.tasksCompleted++;
                instance.lastSeen = Date.now();
            }
            
            console.log(`✅ Task ${task.id} completed in ${duration}ms`);
            
            return result;
            
        } catch (error) {
            console.error(`❌ Task ${task.id} failed:`, error);
            
            task.status = 'failed';
            task.error = error.message;
            task.failedAt = Date.now();
            
            this.failedTasks.push(task);
            
            // Aktualizuj statystyki instancji
            if (this.instances.has(this.instanceId)) {
                const instance = this.instances.get(this.instanceId);
                instance.currentLoad--;
                instance.lastSeen = Date.now();
            }
            
            throw error;
        }
    }

    /**
     * Wykonuje zadanie scrapowania
     */
    async executeScrapingTask(task) {
        // Tutaj integrujemy z istniejącym kodem scrapowania
        const { runSingleSession } = require('./fb-scanner-bot');
        
        return await runSingleSession(task.targetGroup);
    }

    /**
     * Wykonuje zadanie przetwarzania
     */
    async executeProcessingTask(task) {
        // Przetwarzanie postów
        return {
            processed: task.posts.length,
            results: task.posts.map(post => ({ id: post.id, processed: true }))
        };
    }

    /**
     * Przekazuje zadanie do koordynatora
     */
    async forwardToCoordinator(task) {
        // W rzeczywistym systemie użylibyśmy komunikacji sieciowej
        console.log(`📤 Forwarding task to coordinator: ${task.type}`);
        
        // Symulacja - w rzeczywistości wysłalibyśmy przez HTTP/WebSocket
        return {
            id: this.generateTaskId(),
            status: 'forwarded',
            forwardedTo: this.coordinatorId
        };
    }

    /**
     * Pobiera statystyki systemu
     */
    getSystemStats() {
        const totalTasks = this.completedTasks.length + this.failedTasks.length;
        const successRate = totalTasks > 0 ? (this.completedTasks.length / totalTasks * 100).toFixed(1) : 0;
        
        return {
            instanceId: this.instanceId,
            isCoordinator: this.isCoordinator,
            instances: Array.from(this.instances.values()),
            totalInstances: this.instances.size,
            activeInstances: Array.from(this.instances.values()).filter(i => i.status === 'active').length,
            tasks: {
                queued: this.taskQueue.length,
                completed: this.completedTasks.length,
                failed: this.failedTasks.length,
                total: totalTasks,
                successRate: `${successRate}%`
            },
            loadBalancer: this.loadBalancer,
            health: {
                unhealthyInstances: this.healthMonitor.unhealthyInstances.size,
                lastHealthCheck: this.healthMonitor.lastHealthCheck
            }
        };
    }

    /**
     * Czyszczy stare zadania
     */
    cleanup() {
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 godziny
        
        this.completedTasks = this.completedTasks.filter(task => task.completedAt > cutoffTime);
        this.failedTasks = this.failedTasks.filter(task => task.failedAt > cutoffTime);
        
        console.log('🧹 Cleaned up old tasks');
    }

    /**
     * Zamyka koordynatora
     */
    async shutdown() {
        console.log('🔄 Shutting down Distributed Coordinator...');
        
        if (this.isCoordinator) {
            // Usuń lock file
            try {
                const fs = require('fs');
                const path = require('path');
                const lockFile = path.join(this.config.sharedStatePath, 'coordinator.lock');
                
                if (fs.existsSync(lockFile)) {
                    const lockData = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
                    if (lockData.instanceId === this.instanceId) {
                        fs.unlinkSync(lockFile);
                    }
                }
            } catch (error) {
                console.error('❌ Failed to remove lock file:', error);
            }
        }
        
        // Zapisz końcowy stan
        await this.saveSharedState();
        
        console.log('✅ Distributed Coordinator shut down');
    }
}

module.exports = DistributedCoordinator;
