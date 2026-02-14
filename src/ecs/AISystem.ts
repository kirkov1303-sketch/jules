import { ECSWorld } from './index';

export function aiSystem(world: ECSWorld, delta: number) {
    const entities = world.query(['position', 'unit', 'task', 'velocity']);

    for (const entity of entities) {
        const pos = world.getComponent<any>(entity, 'position');
        const task = world.getComponent<any>(entity, 'task');
        const vel = world.getComponent<any>(entity, 'velocity');
        const unit = world.getComponent<any>(entity, 'unit');

        if (!pos || !task || !vel || !unit) continue;

        task.timer -= delta;

        // Vital stats
        unit.hunger += delta * 2;
        if (unit.hunger > 100) {
            unit.health -= delta * 5;
            if (unit.health <= 0) {
                world.removeEntity(entity);
                continue;
            }
        }

        if (task.timer <= 0) {
            // State transitions
            if (task.type === 'WANDER' || task.type === 'IDLE') {
                task.type = 'GATHER';
                task.timer = 3 + Math.random() * 2;
                // Pick a target nearby
                task.targetX = pos.x + (Math.random() - 0.5) * 200;
                task.targetY = pos.y + (Math.random() - 0.5) * 200;
            } else if (task.type === 'GATHER') {
                task.type = 'BUILD';
                task.timer = 2;
                // Try to build where they are
                task.targetX = pos.x;
                task.targetY = pos.y;
            } else if (task.type === 'BUILD') {
                // Successfully "built" something
                createBuilding(world, pos.x, pos.y);
                task.type = 'WANDER';
                task.timer = 5;
                task.targetX = pos.x + (Math.random() - 0.5) * 300;
                task.targetY = pos.y + (Math.random() - 0.5) * 300;
            }
        }

        // Movement logic
        const dx = task.targetX - pos.x;
        const dy = task.targetY - pos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist > 5) {
            const speed = 1.0;
            vel.vx = (dx / dist) * speed;
            vel.vy = (dy / dist) * speed;
        } else {
            vel.vx = 0;
            vel.vy = 0;
        }
    }
}

function createBuilding(world: ECSWorld, x: number, y: number) {
    const b = world.createEntity();
    world.addComponent(b, 'position', { x, y });
    world.addComponent(b, 'renderable', { color: 0xaa8844, size: 8 });
    world.addComponent(b, 'villageData', {
        id: Math.floor(Math.random() * 1000),
        race: 'Unknown',
        resources: { wood: 0, stone: 0, food: 0 },
        level: 1,
        population: 1,
        culture: 'Default'
    });
    world.addComponent(b, 'building', { level: 1 });
}
