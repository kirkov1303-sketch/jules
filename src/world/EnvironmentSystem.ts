import { TileData, BiomeType, ResourceType } from './types';

export class EnvironmentSystem {
    constructor(private grid: TileData[][]) {}

    public update(delta: number) {
        const width = this.grid.length;
        const height = this.grid[0].length;

        // Randomly grow resources
        for (let i = 0; i < 50; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            const tile = this.grid[x][y];

            if (tile.resourceAmount < 10) {
                this.growResource(tile);
            }
        }
    }

    private growResource(tile: TileData) {
        if (tile.resource && tile.resource !== ResourceType.None) {
            tile.resourceAmount = Math.min(10, tile.resourceAmount + 1);
            return;
        }

        // Try to spawn new resource
        switch (tile.biome) {
            case BiomeType.Plains:
            case BiomeType.TropicalRainforest:
            case BiomeType.Taiga:
                if (Math.random() < 0.1) {
                    tile.resource = ResourceType.Wood;
                    tile.resourceAmount = 1;
                } else if (Math.random() < 0.05) {
                    tile.resource = ResourceType.Berry;
                    tile.resourceAmount = 1;
                }
                break;
            case BiomeType.Mountain:
            case BiomeType.SnowyMountain:
                if (Math.random() < 0.1) {
                    tile.resource = ResourceType.Stone;
                    tile.resourceAmount = 1;
                } else if (Math.random() < 0.02) {
                    tile.resource = ResourceType.Ore;
                    tile.resourceAmount = 1;
                }
                break;
            case BiomeType.Desert:
                if (Math.random() < 0.01) {
                    tile.resource = ResourceType.Gold;
                    tile.resourceAmount = 1;
                }
                break;
        }
    }
}
