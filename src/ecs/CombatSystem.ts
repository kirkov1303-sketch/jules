import { ECSWorld } from './index';
import { SpatialHash } from './SpatialHash';

const spatialHash = new SpatialHash(50);

export function combatSystem(world: ECSWorld, delta: number) {
    const units = world.query(['position', 'unit']);

    spatialHash.clear();
    for (const entity of units) {
        const pos = world.getComponent<any>(entity, 'position');
        if (pos) spatialHash.add(pos.x, pos.y, entity);
    }

    for (const e1 of units) {
        const u1 = world.getComponent<any>(e1, 'unit');
        const p1 = world.getComponent<any>(e1, 'position');
        if (!u1 || !p1) continue;

        const nearby = spatialHash.getNearby(p1.x, p1.y);

        for (const e2 of nearby) {
            if (e1 === e2) continue;
            const u2 = world.getComponent<any>(e2, 'unit');
            const p2 = world.getComponent<any>(e2, 'position');
            if (!u2 || !p2) continue;

            if (u1.race !== u2.race) {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distSq = dx*dx + dy*dy;

                if (distSq < 400) {
                    u1.health -= 5 * delta;
                    u2.health -= 5 * delta;

                    if (u1.health <= 0) world.removeEntity(e1);
                    if (u2.health <= 0) world.removeEntity(e2);
                }
            }
        }
    }
}
