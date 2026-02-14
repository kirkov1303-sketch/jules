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
    age: number;
    traits: string[];
}

export interface Renderable {
    color: number;
    size: number;
}

export interface VillageData {
    id: number;
    race: string;
    resources: number;
    level: number;
}

export interface Task {
    type: 'IDLE' | 'GATHER' | 'BUILD' | 'WANDER';
    targetX: number;
    targetY: number;
    timer: number;
}
