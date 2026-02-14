import { TileData, ResourceType } from './types';

export class ResourceSpatialHash {
    private grid: Map<string, TileData[]> = new Map();
    private cellSize: number;

    constructor(cellSize: number = 32) {
        this.cellSize = cellSize;
    }

    private getKey(x: number, y: number): string {
        return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
    }

    public update(grid: TileData[][]) {
        this.grid.clear();
        for (let x = 0; x < grid.length; x++) {
            for (let y = 0; y < grid[0].length; y++) {
                const tile = grid[x][y];
                if (tile.resource && tile.resource !== ResourceType.None && tile.resourceAmount > 0) {
                    const key = this.getKey(x * 8, y * 8); // Assuming tileSize = 8
                    if (!this.grid.has(key)) this.grid.set(key, []);
                    this.grid.get(key)!.push(tile);
                }
            }
        }
    }

    public getNearby(x: number, y: number, radius: number): TileData[] {
        const result: TileData[] = [];
        const minX = Math.floor((x - radius) / this.cellSize);
        const maxX = Math.floor((x + radius) / this.cellSize);
        const minY = Math.floor((y - radius) / this.cellSize);
        const maxY = Math.floor((y + radius) / this.cellSize);

        for (let cx = minX; cx <= maxX; cx++) {
            for (let cy = minY; cy <= maxY; cy++) {
                const tiles = this.grid.get(`${cx},${cy}`);
                if (tiles) result.push(...tiles);
            }
        }
        return result;
    }
}
