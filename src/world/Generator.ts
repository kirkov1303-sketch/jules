import { createNoise2D } from 'simplex-noise';
import { BiomeType, TileData } from './types';

export class WorldGenerator {
    private noiseHeight: (x: number, y: number) => number;
    private noiseMoisture: (x: number, y: number) => number;
    private noiseTemperature: (x: number, y: number) => number;
    private noiseSpecial: (x: number, y: number) => number;

    constructor(_seed: string = Math.random().toString()) {
        // Note: simplex-noise v4 uses a different initialization if we want seeds
        // For simplicity now, we'll just use the default which is random-ish
        this.noiseHeight = createNoise2D();
        this.noiseMoisture = createNoise2D();
        this.noiseTemperature = createNoise2D();
        this.noiseSpecial = createNoise2D();
    }

    public generate(width: number, height: number): TileData[][] {
        const grid: TileData[][] = [];
        for (let x = 0; x < width; x++) {
            grid[x] = [];
            for (let y = 0; y < height; y++) {
                const nx = x / width - 0.5;
                const ny = y / height - 0.5;

                // Scale for noise
                const scale = 3;

                // Height: multiple octaves
                let h = 1.0 * this.noiseHeight(nx * scale, ny * scale)
                      + 0.5 * this.noiseHeight(nx * scale * 2, ny * scale * 2)
                      + 0.25 * this.noiseHeight(nx * scale * 4, ny * scale * 4);
                h = h / 1.75;
                h = (h + 1) / 2;

                // Moisture
                let m = (this.noiseMoisture(nx * scale, ny * scale) + 1) / 2;

                // Temperature
                let t = (this.noiseTemperature(nx * scale, ny * scale) + 1) / 2;
                t = t * (1.1 - Math.abs(ny) * 2); // Polar cooling

                // Special noise for unique biomes like mushroom or dead lands
                const s = (this.noiseSpecial(nx * scale * 5, ny * scale * 5) + 1) / 2;

                grid[x][y] = {
                    x, y,
                    height: h,
                    moisture: m,
                    temperature: t,
                    biome: this.getBiome(h, m, t, s)
                };
            }
        }
        return grid;
    }

    private getBiome(h: number, m: number, t: number, s: number): BiomeType {
        // Water layers
        if (h < 0.15) return BiomeType.DeepOcean;
        if (h < 0.25) {
            if (s > 0.8 && t > 0.5) return BiomeType.SaltLake;
            return BiomeType.Ocean;
        }
        if (h < 0.3) return BiomeType.Beach;

        // High altitude
        if (h > 0.85) {
            if (t < 0.3) return BiomeType.SnowyMountain;
            return BiomeType.Mountain;
        }

        // Extreme temperatures
        if (t < 0.15) return BiomeType.Glacier;
        if (t < 0.3) {
            if (m < 0.4) return BiomeType.Tundra;
            return BiomeType.Taiga;
        }

        // Hot biomes
        if (t > 0.75) {
            if (s > 0.9) return BiomeType.Volcanic;
            if (m < 0.3) return BiomeType.Desert;
            if (m < 0.5) return BiomeType.Savanna;
            if (m > 0.8) return BiomeType.Mangrove;
            return BiomeType.TropicalRainforest;
        }

        // Temperate/Special
        if (s > 0.92) return BiomeType.Mushroom;
        if (s < 0.05) return BiomeType.DeadLands;

        if (m < 0.3) return BiomeType.Plains;
        if (m > 0.7) return BiomeType.Swamp;

        return BiomeType.Plains;
    }
}
