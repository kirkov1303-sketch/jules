import { Entity } from './index';

export class SpatialHash {
    private grid: Map<string, Entity[]> = new Map();

    constructor(private cellSize: number) {}

    public clear() {
        this.grid.clear();
    }

    public add(x: number, y: number, entity: Entity) {
        const key = `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key)!.push(entity);
    }

    public getNearby(x: number, y: number): Entity[] {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        let nearby: Entity[] = [];

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const key = `${cx + i},${cy + j}`;
                const cell = this.grid.get(key);
                if (cell) {
                    nearby = nearby.concat(cell);
                }
            }
        }
        return nearby;
    }
}
