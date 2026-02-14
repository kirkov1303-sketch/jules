import { Application, Graphics, RenderTexture, Sprite, Container, Texture } from 'pixi.js';
import { TileData, BIOME_COLORS } from './types';

export class WorldView extends Container {
    private worldSprite: Sprite;
    public tileSize: number = 8;

    constructor(private app: Application, private grid: TileData[][]) {
        super();
        this.worldSprite = new Sprite();
        this.addChild(this.worldSprite);
        this.renderWorld();
    }

    public renderWorld() {
        const width = this.grid.length;
        const height = this.grid[0].length;

        const g = new Graphics();

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const tile = this.grid[x][y];
                const color = BIOME_COLORS[tile.biome];
                g.rect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                g.fill(color);
            }
        }

        const renderTexture = RenderTexture.create({
            width: width * this.tileSize,
            height: height * this.tileSize
        });

        this.app.renderer.render({
            container: g,
            target: renderTexture
        });

        if (this.worldSprite.texture && this.worldSprite.texture !== Texture.EMPTY) {
            this.worldSprite.texture.destroy(true);
        }
        this.worldSprite.texture = renderTexture;
        // Optional: g.destroy() might be problematic if we want to reuse it,
        // but here we are done with it.
    }

    public updateTile(x: number, y: number, color: number) {
        // For individual updates, we might want a different strategy
        // than re-rendering the whole texture, but for now this is a start.
    }
}
