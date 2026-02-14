export type Entity = number;

export class ECSWorld {
    private entities: Entity[] = [];
    private nextEntity: Entity = 0;
    private components: Map<string, (any | null)[]> = new Map();

    public createEntity(): Entity {
        const entity = this.nextEntity++;
        this.entities.push(entity);
        return entity;
    }

    public addComponent<T>(entity: Entity, componentName: string, component: T): void {
        if (!this.components.has(componentName)) {
            this.components.set(componentName, []);
        }
        this.components.get(componentName)![entity] = component;
    }

    public getComponent<T>(entity: Entity, componentName: string): T | null {
        const list = this.components.get(componentName);
        if (!list) return null;
        return list[entity] || null;
    }

    public query(componentNames: string[]): Entity[] {
        return this.entities.filter(entity =>
            componentNames.every(name => {
                const list = this.components.get(name);
                return list && list[entity] !== undefined && list[entity] !== null;
            })
        );
    }

    public removeEntity(entity: Entity): void {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
            this.components.forEach(list => {
                list[entity] = null;
            });
        }
    }
}
