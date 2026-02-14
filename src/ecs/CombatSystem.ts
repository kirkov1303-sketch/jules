import { ECSWorld } from './index';
import { SpatialHash } from './SpatialHash';

const spatialHash = new SpatialHash(50);

export function combatSystem(world: ECSWorld, delta: number, onHit?: (x: number, y: number) => void) {
    const units = world.query(['position', 'unit']);

    spatialHash.clear();
    for (const entity of units) {
        const pos = world.getComponent<any>(entity, 'position');
        if (pos) spatialHash.add(pos.x, pos.y, entity);
    }

    for (const e1 of units) {
        const u1 = world.getComponent<any>(e1, 'unit');
        const p1 = world.getComponent<any>(e1, 'position');
        const t1 = world.getComponent<any>(e1, 'task');
        if (!u1 || !p1) continue;

        const nearby = spatialHash.getNearby(p1.x, p1.y);

        for (const e2 of nearby) {
            if (e1 === e2) continue;
            const u2 = world.getComponent<any>(e2, 'unit');
            const p2 = world.getComponent<any>(e2, 'position');
            if (!u2 || !p2) continue;

            // Simple hostility: different races are enemies
            if (u1.race !== u2.race) {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distSq = dx*dx + dy*dy;

                const attackRange = 15;
                if (distSq < attackRange * attackRange) {
                    // Attack logic
                    let damage1 = 10;
                    let damage2 = 10;

                    if (u1.traits.includes('Strong')) damage1 += 5;
                    if (u2.traits.includes('Strong')) damage2 += 5;

                    u2.health -= damage1 * delta;
                    u1.health -= damage2 * delta;

                    if (onHit && Math.random() < 0.1) onHit(p1.x, p1.y);

                    // If attacking, maybe change task to stay and fight?
                    if (t1 && t1.type !== 'FIGHT') {
                        t1.type = 'FIGHT';
                        t1.timer = 2;
                    }

                    if (u1.health <= 0) { world.removeEntity(e1); break; }
                    if (u2.health <= 0) { world.removeEntity(e2); }
                }
            }
        }
    }
}
