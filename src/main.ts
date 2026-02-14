import { Application, Text, TextStyle, Container, ColorMatrixFilter } from 'pixi.js';
import { WorldGenerator } from './world/Generator';
import { WorldView } from './world/WorldView';
import { Toolbar } from './ui/Toolbar';
import { BiomeType, Season } from './world/types';
import { SeasonSystem } from './world/SeasonSystem';
import { EnvironmentSystem } from './world/EnvironmentSystem';
import { ResourceSpatialHash } from './world/ResourceSpatialHash';
import { ParticleSystem } from './world/ParticleSystem';
import { WeatherSystem } from './world/WeatherSystem';
import { ECSWorld } from './ecs';
import { movementSystem } from './ecs/MovementSystem';
import { RenderSystem } from './ecs/RenderSystem';
import { aiSystem } from './ecs/AISystem';
import { combatSystem } from './ecs/CombatSystem';

(async () => {
    window.onerror = (msg, url, line, col, error) => {
        console.log(`ERROR: ${msg} at ${line}:${col}. Stack: ${error?.stack}`);
    };

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
    const seasonSystem = new SeasonSystem();
    const envSystem = new EnvironmentSystem(grid);
    const resourceHash = new ResourceSpatialHash(128);
    resourceHash.update(grid);
    const particles = new ParticleSystem();
    worldContainer.addChild(particles);
    const weather = new WeatherSystem(gridWidth * worldView.tileSize, gridHeight * worldView.tileSize);
    worldContainer.addChild(weather);

    // --- Visual Effects ---
    const worldFilter = new ColorMatrixFilter();
    const dayNightFilter = new ColorMatrixFilter();
    worldContainer.filters = [worldFilter, dayNightFilter];
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
            particles.emit(localPos.x, localPos.y, 0xffaa00, 50);
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
        } else if (currentPower === 'LIGHTNING') {
            if (isContinuous) return;
            strikeLightning(localPos.x, localPos.y);
        } else if (currentPower === 'BLESS') {
            applyEffectToUnits(localPos.x, localPos.y, 50, (u) => {
                u.maxHealth += 50;
                u.health = u.maxHealth;
                u.traits.push('Blessed');
            });
        } else if (currentPower === 'PLAGUE') {
            applyEffectToUnits(localPos.x, localPos.y, 30, (u) => {
                u.traits.push('Infected');
            });
        } else if (typeof currentPower === 'string' && currentPower.startsWith('SPAWN')) {
            if (isContinuous) return;
            spawnUnit(currentPower, localPos.x, localPos.y);
        } else if (tx >= 0 && tx < gridWidth && ty >= 0 && ty < gridHeight) {
            if (Object.values(BiomeType).includes(currentPower as BiomeType)) {
                applyBrush(tx, ty, 5, currentPower as BiomeType);
            }
        }
    }

    function spawnUnit(type: string, x: number, y: number) {
        const entity = ecs.createEntity();
        ecs.addComponent(entity, 'position', { x, y });
        ecs.addComponent(entity, 'velocity', { vx: 0, vy: 0 });

        let race = 'Human';
        let color = 0xffffff;
        let traits: string[] = [];

        if (type === 'SPAWN_HUMAN') { race = 'Human'; color = 0xffffff; }
        if (type === 'SPAWN_ORC') { race = 'Orc'; color = 0x55ff55; traits.push('Strong'); }
        if (type === 'SPAWN_ELF') { race = 'Elf'; color = 0x55ffff; traits.push('Agile'); }
        if (type === 'SPAWN_DWARF') { race = 'Dwarf'; color = 0xffaa55; traits.push('Tough'); }

        ecs.addComponent(entity, 'unit', {
            race,
            health: 100, maxHealth: 100,
            age: 0,
            traits,
            hunger: 0, energy: 100, mood: 100
        });
        ecs.addComponent(entity, 'task', {
            type: 'WANDER', targetX: x, targetY: y, timer: 1
        });
        ecs.addComponent(entity, 'renderable', {
            color: color,
            size: 3
        });
    }

    function strikeLightning(x: number, y: number) {
        const radius = 20;
        particles.emit(x, y, 0xaaaaff, 30);
        const entities = ecs.query(['position', 'unit']);
        for (const e of entities) {
            const pos = ecs.getComponent<any>(e, 'position');
            const d = Math.sqrt((pos.x - x)**2 + (pos.y - y)**2);
            if (d < radius) {
                const u = ecs.getComponent<any>(e, 'unit');
                u.health -= 80;
                if (u.health <= 0) ecs.removeEntity(e);
            }
        }
    }

    function applyEffectToUnits(x: number, y: number, radius: number, callback: (unit: any) => void) {
        const entities = ecs.query(['position', 'unit']);
        for (const e of entities) {
            const pos = ecs.getComponent<any>(e, 'position');
            const d = Math.sqrt((pos.x - x)**2 + (pos.y - y)**2);
            if (d < radius) {
                callback(ecs.getComponent<any>(e, 'unit'));
            }
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

        // Seasons & Day/Night Cycle
        const currentSeason = seasonSystem.update(time);
        seasonSystem.applySeasonFilter(worldFilter, currentSeason);

        envSystem.update(delta);
        if (Math.floor(time) % 5 === 0 && Math.floor(time) !== Math.floor(time - delta)) {
            worldView.renderWorld(); // Refresh map visuals for resources periodically
            resourceHash.update(grid);
        }

        const cycle = (Math.sin(time * 0.1) + 1) / 2;
        dayNightFilter.brightness(0.3 + 0.7 * cycle, false);
        dayNightFilter.night(1.0 - (0.4 + 0.6 * cycle), false);

        aiSystem(ecs, grid, resourceHash, delta);
        combatSystem(ecs, delta, (x, y) => particles.emit(x, y, 0xff0000, 3));
        movementSystem(ecs, delta);
        renderSystem.update(ecs);
        particles.update(delta);
        weather.update(delta, currentSeason);

        const units = ecs.query(['unit']).length;
        const buildings = ecs.query(['building']).length;
        const seasonName = seasonSystem.getSeasonRussianName(currentSeason);
        infoText.text = `Юниты: ${units} | Здания: ${buildings} | День: ${Math.floor(time/10)} | Сезон: ${seasonName}`;
    });
})();
