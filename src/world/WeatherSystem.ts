import { Container, Graphics } from 'pixi.js';
import { Season } from './types';

export class WeatherSystem extends Container {
    private graphics: Graphics;
    private particles: { x: number, y: number, v: number }[] = [];

    constructor(private width: number, private height: number) {
        super();
        this.graphics = new Graphics();
        this.addChild(this.graphics);
        for (let i = 0; i < 200; i++) {
            this.particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                v: 2 + Math.random() * 3
            });
        }
    }

    public update(delta: number, season: Season) {
        this.graphics.clear();
        if (season === Season.Summer) return;

        let color = 0xffffff;
        let alpha = 0.3;
        if (season === Season.Spring || season === Season.Autumn) {
            color = 0xaaaaff; // Rain
            alpha = 0.5;
        }

        for (const p of this.particles) {
            p.y += p.v * delta;
            p.x += Math.sin(p.y * 0.05) * delta;

            if (p.y > this.height) {
                p.y = -10;
                p.x = Math.random() * this.width;
            }

            if (season === Season.Winter) {
                this.graphics.circle(p.x, p.y, 1.5);
            } else {
                this.graphics.rect(p.x, p.y, 1, 5);
            }
            this.graphics.fill({ color, alpha });
        }
    }
}
