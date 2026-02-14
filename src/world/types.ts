export enum BiomeType {
    DeepOcean = 'DeepOcean',
    Ocean = 'Ocean',
    Beach = 'Beach',
    Tundra = 'Tundra',
    Taiga = 'Taiga',
    TropicalRainforest = 'TropicalRainforest',
    Savanna = 'Savanna',
    Desert = 'Desert',
    Swamp = 'Swamp',
    Mangrove = 'Mangrove',
    Volcanic = 'Volcanic',
    Mushroom = 'Mushroom',
    SaltLake = 'SaltLake',
    Glacier = 'Glacier',
    Plains = 'Plains',
    DeadLands = 'DeadLands',
    Mountain = 'Mountain',
    SnowyMountain = 'SnowyMountain'
}

export enum Season {
    Spring = 'Spring',
    Summer = 'Summer',
    Autumn = 'Autumn',
    Winter = 'Winter'
}

export interface TileData {
    x: number;
    y: number;
    height: number;
    moisture: number;
    temperature: number;
    biome: BiomeType;
}

export const BIOME_COLORS: Record<BiomeType, number> = {
    [BiomeType.DeepOcean]: 0x000033,
    [BiomeType.Ocean]: 0x000066,
    [BiomeType.Beach]: 0xd2b48c,
    [BiomeType.Tundra]: 0x90a090,
    [BiomeType.Taiga]: 0x2e4d2e,
    [BiomeType.TropicalRainforest]: 0x004400,
    [BiomeType.Savanna]: 0xbfb755,
    [BiomeType.Desert]: 0xedc9af,
    [BiomeType.Swamp]: 0x2f351d,
    [BiomeType.Mangrove]: 0x203a27,
    [BiomeType.Volcanic]: 0x3d0c02,
    [BiomeType.Mushroom]: 0x7b3f00,
    [BiomeType.SaltLake]: 0xadd8e6,
    [BiomeType.Glacier]: 0xffffff,
    [BiomeType.Plains]: 0x32cd32,
    [BiomeType.DeadLands]: 0x2c2c2c,
    [BiomeType.Mountain]: 0x808080,
    [BiomeType.SnowyMountain]: 0xf0f0f0,
};
