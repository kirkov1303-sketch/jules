import { Application, Graphics, RenderTexture, Sprite, Container, Texture } from 'pixi.js';
import { TileData, BIOME_COLORS, ResourceType } from './types';

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
                const color = BIOME_COLORS[tile.biome] ?? 0xff00ff; // Magenta fallback
                g.rect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                g.fill(color);

                if (tile.resource && tile.resource !== ResourceType.None && tile.resourceAmount > 0) {
                    let rColor = 0x000000;
                    switch (tile.resource) {
                        case ResourceType.Wood: rColor = 0x5d4037; break;
                        case ResourceType.Stone: rColor = 0x757575; break;
                        case ResourceType.Ore: rColor = 0x455a64; break;
                        case ResourceType.Gold: rColor = 0xffd700; break;
                        case ResourceType.Berry: rColor = 0xd32f2f; break;
                        case ResourceType.Crops: rColor = 0xfbc02d; break;
                    }
                    // Draw a small dot or square for resource
                    const size = Math.min(this.tileSize - 2, 2 + (tile.resourceAmount / 10) * (this.tileSize - 4));
                    g.rect(
                        x * this.tileSize + (this.tileSize - size) / 2,
                        y * this.tileSize + (this.tileSize - size) / 2,
                        size, size
                    );
                    g.fill(rColor);
                }
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
