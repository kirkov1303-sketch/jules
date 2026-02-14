export type Entity = number;

export class ECSWorld {
    private entities: Set<Entity> = new Set();
    private nextEntity: Entity = 0;
    private components: Map<string, Map<Entity, any>> = new Map();
    private queryCache: Map<string, Entity[]> = new Map();

    public createEntity(): Entity {
        const entity = this.nextEntity++;
        this.entities.add(entity);
        return entity;
    }

    public addComponent<T>(entity: Entity, componentName: string, component: T): void {
        if (!this.components.has(componentName)) {
            this.components.set(componentName, new Map());
        }
        this.components.get(componentName)!.set(entity, component);
        this.queryCache.clear(); // Simple cache invalidation
    }

    public getComponent<T>(entity: Entity, componentName: string): T | null {
        const list = this.components.get(componentName);
        if (!list) return null;
        return list.get(entity) || null;
    }

    public query(componentNames: string[]): Entity[] {
        const cacheKey = componentNames.sort().join(',');
        if (this.queryCache.has(cacheKey)) {
            return this.queryCache.get(cacheKey)!;
        }

        // Find the smallest set to start with
        let smallestSet: Map<Entity, any> | null = null;
        for (const name of componentNames) {
            const set = this.components.get(name);
            if (!set) {
                this.queryCache.set(cacheKey, []);
                return [];
            }
            if (!smallestSet || set.size < smallestSet.size) {
                smallestSet = set;
            }
        }

        if (!smallestSet) return [];

        const result: Entity[] = [];
        for (const entity of smallestSet.keys()) {
            let hasAll = true;
            for (const name of componentNames) {
                if (!this.components.get(name)!.has(entity)) {
                    hasAll = false;
                    break;
                }
            }
            if (hasAll) result.push(entity);
        }

        this.queryCache.set(cacheKey, result);
        return result;
    }

    public removeEntity(entity: Entity): void {
        if (this.entities.delete(entity)) {
            this.components.forEach(list => {
                list.delete(entity);
            });
            this.queryCache.clear();
        }
    }
}
