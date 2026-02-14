import { Container, Graphics } from 'pixi.js';

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: number;
    size: number;
}

export class ParticleSystem extends Container {
    private particles: Particle[] = [];
    private graphics: Graphics;

    constructor() {
        super();
        this.graphics = new Graphics();
        this.addChild(this.graphics);
    }

    public emit(x: number, y: number, color: number, count: number = 5) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1.0,
                maxLife: 1.0,
                color,
                size: 2 + Math.random() * 2
            });
        }
    }

    public update(delta: number) {
        this.graphics.clear();
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= delta * 2;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.graphics.rect(p.x, p.y, p.size, p.size);
            this.graphics.fill({ color: p.color ?? 0xffffff, alpha: p.life });
        }
    }
}
