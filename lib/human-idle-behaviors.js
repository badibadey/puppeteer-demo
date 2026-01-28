const { setTimeout } = require('timers/promises');
console.log('✅ Loaded lib/human-idle-behaviors.js');

/**
 * Symuluje naturalne zachowania człowieka podczas bezczynności
 */
class HumanIdleBehaviors {
    constructor(page) {
        this.page = page;
        this.idleActions = [
            this.randomMouseMove.bind(this),
            this.randomScroll.bind(this),
            this.focusChange.bind(this),
            this.keyboardActivity.bind(this),
            this.zoomActivity.bind(this),
            this.tabActivity.bind(this)
        ];
    }

    /**
     * Wykonuje losową akcję bezczynności
     */
    async performIdleAction() {
        if (Math.random() < 0.3) { // 30% szans na akcję bezczynności
            const action = this.idleActions[Math.floor(Math.random() * this.idleActions.length)];
            try {
                await action();
            } catch (e) {
                // Ignoruj błędy w akcjach bezczynności
            }
        }
    }

    /**
     * Losowe ruchy myszy - symulacja naturalnych ruchów
     */
    async randomMouseMove() {
        const viewport = this.page.viewport();
        const moves = Math.floor(Math.random() * 3) + 1; // 1-3 ruchy
        
        for (let i = 0; i < moves; i++) {
            const x = Math.random() * viewport.width;
            const y = Math.random() * viewport.height;
            
            // Płynny ruch do losowego punktu
            await this.page.mouse.move(x, y, { steps: Math.floor(Math.random() * 10) + 5 });
            await setTimeout(Math.random() * 1000 + 500); // 0.5-1.5s przerwy
        }
    }

    /**
     * Losowe, małe scrollowanie
     */
    async randomScroll() {
        const scrollAmount = Math.floor(Math.random() * 200) - 100; // -100 do +100px
        if (scrollAmount !== 0) {
            await this.page.evaluate((amount) => {
                window.scrollBy({ top: amount, behavior: 'smooth' });
            }, scrollAmount);
            await setTimeout(Math.random() * 2000 + 500);
        }
    }

    /**
     * Zmiana fokusa między elementami
     */
    async focusChange() {
        try {
            // Znajdź losowe elementy które mogą otrzymać focus
            const focusableElements = await this.page.$$(
                'input, button, a, textarea, select, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length > 0) {
                const randomElement = focusableElements[Math.floor(Math.random() * focusableElements.length)];
                await randomElement.focus();
                await setTimeout(Math.random() * 1000 + 200);
                
                // 50% szans na usunięcie fokusa
                if (Math.random() < 0.5) {
                    await this.page.evaluate(() => document.activeElement.blur());
                }
            }
        } catch (e) {
            // Ignoruj błędy focusa
        }
    }

    /**
     * Aktywność klawiatury - losowe naciśnięcia klawiszy
     */
    async keyboardActivity() {
        const actions = [
            () => this.page.keyboard.press('ArrowDown'),
            () => this.page.keyboard.press('ArrowUp'),
            () => this.page.keyboard.press('Home'),
            () => this.page.keyboard.press('End'),
            () => this.page.keyboard.press('PageDown'),
            () => this.page.keyboard.press('PageUp'),
            () => this.page.keyboard.down('Control'), () => this.page.keyboard.up('Control'),
            () => this.page.keyboard.down('Shift'), () => this.page.keyboard.up('Shift'),
        ];

        const action = actions[Math.floor(Math.random() * actions.length)];
        await action();
        await setTimeout(Math.random() * 500 + 100);
    }

    /**
     * Aktywność zoomu - Ctrl + scroll
     */
    async zoomActivity() {
        if (Math.random() < 0.2) { // 20% szans na zoom
            const zoomDirection = Math.random() < 0.5 ? -1 : 1;
            
            await this.page.keyboard.down('Control');
            await this.page.mouse.wheel({ deltaY: zoomDirection * 100 });
            await this.page.keyboard.up('Control');
            
            await setTimeout(1000);
            
            // Przywróć oryginalny zoom
            await this.page.keyboard.down('Control');
            await this.page.mouse.wheel({ deltaY: -zoomDirection * 100 });
            await this.page.keyboard.up('Control');
        }
    }

    /**
     * Aktywność związana z tabami - symulacja przełączania
     */
    async tabActivity() {
        if (Math.random() < 0.1) { // 10% szans na akcję tab
            const actions = [
                () => this.page.keyboard.press('Tab'),
                () => {
                    this.page.keyboard.down('Shift');
                    this.page.keyboard.press('Tab');
                    this.page.keyboard.up('Shift');
                },
                () => this.page.keyboard.press('F5'), // Odśwież
                () => this.page.keyboard.press('Escape'),
            ];

            const action = actions[Math.floor(Math.random() * actions.length)];
            await action();
            await setTimeout(Math.random() * 2000 + 500);
        }
    }

    /**
     * Symulacja czytania - pauzy i mikro-ruchy
     */
    async simulateReading(duration = 3000) {
        const startTime = Date.now();
        const endTime = startTime + duration;
        
        while (Date.now() < endTime) {
            // Losowe mikro-ruchy myszy podczas czytania
            if (Math.random() < 0.1) {
                const viewport = this.page.viewport();
                const currentPos = await this.page.evaluate(() => ({ x: window.mouseX || 0, y: window.mouseY || 0 }));
                
                const newX = currentPos.x + (Math.random() - 0.5) * 50;
                const newY = currentPos.y + (Math.random() - 0.5) * 50;
                
                await this.page.mouse.move(
                    Math.max(0, Math.min(viewport.width, newX)),
                    Math.max(0, Math.min(viewport.height, newY))
                );
            }
            
            await setTimeout(500);
        }
    }

    /**
     * Symulacja rozmyślania - patrzenie w różne miejsca
     */
    async simulateThinking() {
        const viewport = this.page.viewport();
        const gazePoints = [
            { x: viewport.width * 0.1, y: viewport.height * 0.1 }, // Górny lewy róg
            { x: viewport.width * 0.9, y: viewport.height * 0.1 }, // Górny prawy róg
            { x: viewport.width * 0.5, y: viewport.height * 0.1 }, // Góra środek
            { x: viewport.width * 0.5, y: viewport.height * 0.9 }, // Dół środek
        ];

        for (let i = 0; i < 3; i++) {
            const point = gazePoints[Math.floor(Math.random() * gazePoints.length)];
            await this.page.mouse.move(point.x, point.y, { steps: 15 });
            await setTimeout(Math.random() * 2000 + 1000);
        }
    }
}

module.exports = HumanIdleBehaviors;
