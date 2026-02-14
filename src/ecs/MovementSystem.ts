import { ECSWorld } from './index';

export function movementSystem(world: ECSWorld, delta: number) {
    const entities = world.query(['position', 'velocity']);
    for (const entity of entities) {
        const pos = world.getComponent<any>(entity, 'position');
        const vel = world.getComponent<any>(entity, 'velocity');
        if (pos && vel) {
            pos.x += vel.vx * delta * 20; // 20 is speed factor
            pos.y += vel.vy * delta * 20;

            // Random walk logic
            if (Math.random() < 0.02) {
                vel.vx = (Math.random() - 0.5);
                vel.vy = (Math.random() - 0.5);
            }

            // Keep in bounds (roughly)
            if (pos.x < 0) pos.x = 0;
            if (pos.y < 0) pos.y = 0;
        }
    }
}
