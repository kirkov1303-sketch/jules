import { ECSWorld } from './index';

export function aiSystem(world: ECSWorld, delta: number) {
    const entities = world.query(['position', 'unit', 'task', 'velocity']);

    for (const entity of entities) {
        const pos = world.getComponent<any>(entity, 'position');
        const task = world.getComponent<any>(entity, 'task');
        const vel = world.getComponent<any>(entity, 'velocity');

        if (!pos || !task || !vel) continue;

        task.timer -= delta;

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
    world.addComponent(b, 'building', { level: 1 });
}
