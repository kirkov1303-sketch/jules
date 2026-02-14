import { Application, Text, TextStyle, Container, ColorMatrixFilter } from 'pixi.js';
import { WorldGenerator } from './world/Generator';
import { WorldView } from './world/WorldView';
import { Toolbar } from './ui/Toolbar';
import { BiomeType } from './world/types';
import { ECSWorld } from './ecs';
import { movementSystem } from './ecs/MovementSystem';
import { RenderSystem } from './ecs/RenderSystem';
import { aiSystem } from './ecs/AISystem';
import { combatSystem } from './ecs/CombatSystem';

(async () => {
    const app = new Application();

    await app.init({
        background: '#020205',
        resizeTo: window,
        antialias: false,
        roundPixels: true,
    });

    const appContainer = document.getElementById('app');
    if (appContainer) {
        appContainer.appendChild(app.canvas);
    }

    // --- Core Systems ---
    const ecs = new ECSWorld();
    const generator = new WorldGenerator();
    const gridWidth = 256;
    const gridHeight = 256;
    const grid = generator.generate(gridWidth, gridHeight);

    const worldContainer = new Container();
    const worldView = new WorldView(app, grid);
    worldContainer.addChild(worldView);
    app.stage.addChild(worldContainer);

    const renderSystem = new RenderSystem(worldContainer);

    // --- Visual Effects ---
    const worldFilter = new ColorMatrixFilter();
    worldContainer.filters = [worldFilter];
    let time = 0;

    worldContainer.x = (app.screen.width - gridWidth * worldView.tileSize) / 2;
    worldContainer.y = (app.screen.height - gridHeight * worldView.tileSize) / 2;

    // --- Interaction ---
    let currentPower: BiomeType | string = BiomeType.Plains;
    let isPanning = false;
    let lastPos = { x: 0, y: 0 };

    new Toolbar((power) => {
        currentPower = power;
    });

    app.canvas.addEventListener('mousedown', (e: MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            isPanning = true;
            lastPos = { x: e.clientX, y: e.clientY };
        } else if (e.button === 0) {
            handlePower(e.clientX, e.clientY);
        }
    });

    window.addEventListener('mousemove', (e: MouseEvent) => {
        if (isPanning) {
            const dx = e.clientX - lastPos.x;
            const dy = e.clientY - lastPos.y;
            worldContainer.x += dx;
            worldContainer.y += dy;
            lastPos = { x: e.clientX, y: e.clientY };
        } else if (e.buttons === 1) {
            handlePower(e.clientX, e.clientY, true);
        }
    });

    window.addEventListener('mouseup', () => { isPanning = false; });

    app.canvas.addEventListener('wheel', (e: WheelEvent) => {
        const scaleAmount = e.deltaY > 0 ? 0.9 : 1.1;
        const worldPos = worldContainer.toLocal({ x: e.clientX, y: e.clientY });
        worldContainer.scale.x *= scaleAmount;
        worldContainer.scale.y *= scaleAmount;
        const newMousePos = worldContainer.toGlobal(worldPos);
        worldContainer.x += e.clientX - newMousePos.x;
        worldContainer.y += e.clientY - newMousePos.y;
    }, { passive: false });

    function handlePower(mouseX: number, mouseY: number, isContinuous: boolean = false) {
        const localPos = worldContainer.toLocal({ x: mouseX, y: mouseY });
        const tx = Math.floor(localPos.x / worldView.tileSize);
        const ty = Math.floor(localPos.y / worldView.tileSize);

        if (currentPower === 'METEOR') {
            if (isContinuous) return;
            const radius = 10;
            // Kill entities
            const entities = ecs.query(['position']);
            for (const entity of entities) {
                const pos = ecs.getComponent<any>(entity, 'position');
                const d = Math.sqrt((pos.x - localPos.x)**2 + (pos.y - localPos.y)**2);
                if (d < radius * worldView.tileSize) ecs.removeEntity(entity);
            }
            // Change terrain
            applyBrush(tx, ty, radius, BiomeType.Volcanic);
        } else if (currentPower === 'RAIN') {
            applyBrush(tx, ty, 6, BiomeType.Plains); // Makes things green
        } else if (typeof currentPower === 'string' && currentPower.startsWith('SPAWN')) {
            if (isContinuous) return;
            const entity = ecs.createEntity();
            ecs.addComponent(entity, 'position', { x: localPos.x, y: localPos.y });
            ecs.addComponent(entity, 'velocity', { vx: 0, vy: 0 });
            ecs.addComponent(entity, 'unit', {
                race: currentPower === 'SPAWN_HUMAN' ? 'Human' : 'Orc',
                health: 100, age: 0, traits: []
            });
            ecs.addComponent(entity, 'task', {
                type: 'WANDER', targetX: localPos.x, targetY: localPos.y, timer: 1
            });
            ecs.addComponent(entity, 'renderable', {
                color: currentPower === 'SPAWN_HUMAN' ? 0xffffff : 0x55ff55,
                size: 3
            });
        } else if (tx >= 0 && tx < gridWidth && ty >= 0 && ty < gridHeight) {
            applyBrush(tx, ty, 5, currentPower as BiomeType);
        }
    }

    function applyBrush(tx: number, ty: number, radius: number, type: BiomeType) {
        let changed = false;
        for (let x = tx - radius; x <= tx + radius; x++) {
            for (let y = ty - radius; y <= ty + radius; y++) {
                if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
                    const dist = Math.sqrt((x - tx)**2 + (y - ty)**2);
                    if (dist <= radius) {
                        grid[x][y].biome = type;
                        changed = true;
                    }
                }
            }
        }
        if (changed) worldView.renderWorld();
    }

    // --- UI Info ---
    const infoStyle = new TextStyle({
        fontFamily: 'Verdana', fontSize: 18, fill: '#ffffff',
    });
    const infoText = new Text({ text: '', style: infoStyle });
    infoText.x = 20; infoText.y = 20;
    app.stage.addChild(infoText);

    // --- Game Loop ---
    app.ticker.add((ticker) => {
        const delta = ticker.deltaTime / 60;
        time += delta;

        // Day/Night Cycle
        const cycle = (Math.sin(time * 0.1) + 1) / 2;
        worldFilter.brightness(0.3 + 0.7 * cycle, false);
        worldFilter.night(1.0 - cycle, false);

        aiSystem(ecs, delta);
        combatSystem(ecs, delta);
        movementSystem(ecs, delta);
        renderSystem.update(ecs);

        const units = ecs.query(['unit']).length;
        const buildings = ecs.query(['building']).length;
        infoText.text = `Юниты: ${units} | Здания: ${buildings} | День: ${Math.floor(time/10)}`;
    });
})();
