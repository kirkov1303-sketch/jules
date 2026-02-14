import { Graphics, Container } from 'pixi.js';
import { ECSWorld } from './index';

export class RenderSystem {
    private graphics: Graphics;

    constructor(parent: Container) {
        this.graphics = new Graphics();
        parent.addChild(this.graphics);
    }

    public update(world: ECSWorld) {
        this.graphics.clear();
        const entities = world.query(['position', 'renderable']);
        for (const entity of entities) {
            const pos = world.getComponent<any>(entity, 'position');
            const render = world.getComponent<any>(entity, 'renderable');
            if (pos && render) {
                this.graphics.circle(pos.x, pos.y, render.size);
                this.graphics.fill(render.color ?? 0xffffff);
            }
        }
    }
}
