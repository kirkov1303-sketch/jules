export interface Position {
    x: number;
    y: number;
}

export interface Velocity {
    vx: number;
    vy: number;
}

export interface Unit {
    race: string;
    health: number;
    maxHealth: number;
    age: number;
    traits: string[];
    hunger: number;
    energy: number;
    mood: number;
}

export interface Inventory {
    resources: Record<string, number>;
}

export interface Renderable {
    color: number;
    size: number;
}

export interface VillageData {
    id: number;
    race: string;
    resources: Record<string, number>;
    level: number;
    population: number;
    culture: string;
}

export interface Task {
    type: 'IDLE' | 'GATHER' | 'BUILD' | 'WANDER' | 'FIGHT';
    targetX: number;
    targetY: number;
    timer: number;
}
