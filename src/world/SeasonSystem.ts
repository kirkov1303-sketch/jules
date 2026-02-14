import { ColorMatrixFilter } from 'pixi.js';
import { Season } from './types';

export class SeasonSystem {
    public currentSeason: Season = Season.Spring;
    public dayCount: number = 0;
    private daysPerSeason: number = 10;

    constructor() {}

    public update(time: number): Season {
        const totalDays = Math.floor(time / 10);
        this.dayCount = totalDays;

        const seasonIndex = Math.floor((totalDays / this.daysPerSeason) % 4);
        const seasons = [Season.Spring, Season.Summer, Season.Autumn, Season.Winter];
        this.currentSeason = seasons[seasonIndex];

        return this.currentSeason;
    }

    public applySeasonFilter(filter: ColorMatrixFilter, season: Season) {
        switch (season) {
            case Season.Spring:
                filter.reset();
                filter.sepia(false);
                filter.matrix[4] = 0.1; // Slight green tint
                break;
            case Season.Summer:
                filter.reset();
                filter.saturate(1.2, false);
                break;
            case Season.Autumn:
                filter.reset();
                filter.sepia(true);
                filter.matrix[0] = 1.2; // Reddish
                break;
            case Season.Winter:
                filter.reset();
                filter.matrix[0] = 0.8;
                filter.matrix[5] = 0.8;
                filter.matrix[10] = 1.5; // Bluish
                break;
        }
    }

    public getSeasonRussianName(season: Season): string {
        switch (season) {
            case Season.Spring: return 'Весна';
            case Season.Summer: return 'Лето';
            case Season.Autumn: return 'Осень';
            case Season.Winter: return 'Зима';
        }
    }
}
