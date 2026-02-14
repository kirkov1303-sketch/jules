import { TileData, ResourceType } from '../world/types';
import { ResourceSpatialHash } from '../world/ResourceSpatialHash';
import { ECSWorld } from './index';

export function aiSystem(world: ECSWorld, grid: TileData[][], resourceHash: ResourceSpatialHash, delta: number) {
    const entities = world.query(['position', 'unit', 'task', 'velocity']);
    const tileSize = 8;

    for (const entity of entities) {
        const pos = world.getComponent<any>(entity, 'position');
        const task = world.getComponent<any>(entity, 'task');
        const vel = world.getComponent<any>(entity, 'velocity');
        const unit = world.getComponent<any>(entity, 'unit');

        if (!pos || !task || !vel || !unit) continue;

        task.timer -= delta;

        // Vital stats
        unit.hunger += delta * 0.5;
        if (unit.hunger > 100) {
            unit.health -= delta * 2;
            if (unit.health <= 0) {
                world.removeEntity(entity);
                continue;
            }
        }

        if (task.timer <= 0) {
            // State machine
            const tx = Math.floor(pos.x / tileSize);
            const ty = Math.floor(pos.y / tileSize);

            if (task.type === 'WANDER' || task.type === 'IDLE') {
                // Look for resources using spatial hash
                const nearby = resourceHash.getNearby(pos.x, pos.y, 120);
                let found = false;

                if (nearby.length > 0) {
                    // Pick nearest
                    let minDist = Infinity;
                    let target = null;
                    for (const tile of nearby) {
                        const dSq = (tile.x * tileSize - pos.x)**2 + (tile.y * tileSize - pos.y)**2;
                        if (dSq < minDist) {
                            minDist = dSq;
                            target = tile;
                        }
                    }

                    if (target) {
                        task.type = 'GATHER';
                        task.targetX = target.x * tileSize + tileSize/2;
                        task.targetY = target.y * tileSize + tileSize/2;
                        task.timer = 10;
                        found = true;
                    }
                }

                if (!found) {
                    task.type = 'WANDER';
                    task.timer = 2 + Math.random() * 3;
                    task.targetX = pos.x + (Math.random() - 0.5) * 150;
                    task.targetY = pos.y + (Math.random() - 0.5) * 150;
                }
            } else if (task.type === 'GATHER') {
                // Actually collect
                if (tx >= 0 && tx < grid.length && ty >= 0 && ty < grid[0].length) {
                    const tile = grid[tx][ty];
                    if (tile.resource && tile.resourceAmount > 0) {
                        tile.resourceAmount--;
                        // For now, just increase "well-being" or something
                        if (tile.resource === ResourceType.Berry) unit.hunger = Math.max(0, unit.hunger - 30);

                        // If they have a lot of resources, maybe they should build?
                        if (Math.random() < 0.3) {
                            task.type = 'BUILD';
                            task.timer = 3;
                            task.targetX = pos.x;
                            task.targetY = pos.y;
                        } else {
                            task.type = 'IDLE';
                            task.timer = 1;
                        }
                    } else {
                        task.type = 'IDLE';
                        task.timer = 0;
                    }
                }
            } else if (task.type === 'BUILD') {
                createBuilding(world, pos.x, pos.y, unit.race);
                task.type = 'WANDER';
                task.timer = 5;
            } else if (task.type === 'FIGHT') {
                task.type = 'IDLE';
                task.timer = 1;
            }
        }

        // Movement
        const dx = task.targetX - pos.x;
        const dy = task.targetY - pos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist > 3) {
            const speed = 1.5;
            vel.vx = (dx / dist) * speed;
            vel.vy = (dy / dist) * speed;
        } else {
            vel.vx = 0;
            vel.vy = 0;
            if (task.type === 'WANDER') task.timer = 0; // Reach destination faster
        }
    }
}

function createBuilding(world: ECSWorld, x: number, y: number, race: string) {
    // Check if building already exists nearby to avoid overcrowding
    const buildings = world.query(['position', 'building']);
    for (const b of buildings) {
        const bpos = world.getComponent<any>(b, 'position');
        const d = Math.sqrt((bpos.x - x)**2 + (bpos.y - y)**2);
        if (d < 30) return; // Too close
    }

    const b = world.createEntity();
    world.addComponent(b, 'position', { x, y });

    let color = 0x8d6e63;
    if (race === 'Orc') color = 0x388e3c;
    if (race === 'Elf') color = 0x81c784;
    if (race === 'Dwarf') color = 0x5d4037;

    world.addComponent(b, 'renderable', { color: color, size: 8 });
    world.addComponent(b, 'building', { level: 1 });
    world.addComponent(b, 'villageData', {
        id: Math.floor(Math.random() * 1000),
        race: race,
        resources: { wood: 0, stone: 0, food: 0 },
        level: 1,
        population: 1,
        culture: 'Default'
    });
}
