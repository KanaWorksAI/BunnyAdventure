
export enum EntityType {
  PLAYER = 'PLAYER',
  SKELETON = 'SKELETON',
  ARCHER = 'ARCHER',
  BOSS = 'BOSS',
  PROJECTILE = 'PROJECTILE',
  ITEM = 'ITEM',
  DECORATION = 'DECORATION',
  PARTICLE = 'PARTICLE',
  TEXT_POPUP = 'TEXT_POPUP',
}

export enum ItemType {
  HEALTH_POTION = 'HEALTH_POTION',
  WARDEN_SEAL = 'WARDEN_SEAL',
  MANA_CRYSTAL = 'MANA_CRYSTAL',
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Stats {
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Vector2;
  vel: Vector2; // Velocity
  size: number; // Collision radius
  stats?: Stats;
  state: 'IDLE' | 'WALK' | 'ATTACK' | 'HIT' | 'DEAD' | 'DODGE' | 'CHARGE';
  facing: number; // Radians, 0 = Right, PI/2 = Down

  // Specific properties
  targetId?: string | null; // For AI
  cooldowns: Record<string, number>; // Time remaining
  animTimer: number; // For animation frames
  color: string;
  rotation?: number; // Radians
  
  // For Player Mouse Movement
  moveTarget?: Vector2 | null;
  attackTargetId?: string | null;
  attackType?: 'RANGED' | 'MELEE'; // Distinguish attack style

  // For enemies/AI
  aiState?: 'IDLE' | 'PATROL' | 'CHASE' | 'ATTACK' | 'FLEE';
  patrolPoint?: Vector2;
  
  // For projectiles
  ownerId?: string;
  duration?: number;
  
  // For items
  itemType?: ItemType;
  
  // Visuals
  scale: number; // For "breathing" or hit effects
  flashTimer?: number; // Flash white on hit
}

export interface Particle extends Entity {
  life: number;
  maxLife: number;
}

export interface TextPopup {
  id: string;
  pos: Vector2;
  text: string;
  color: string;
  life: number;
  offsetY: number;
}

export interface GameState {
  entities: Entity[];
  particles: Particle[];
  popups: TextPopup[];
  camera: Vector2;
  map: number[][]; // 0=floor, 1=wall, 2=gate, 3=pressure_plate, 4=altar, 5=void
  triggers: {
    gateOpen: boolean;
    bossActive: boolean;
    bossDefeated: boolean;
    gameWon: boolean;
    gameOver: boolean;
  };
  inventory: {
    potions: number;
    hasSeal: boolean;
  };
}

export enum TileType {
  FLOOR = 0,
  WALL = 1,
  GATE_LOCKED = 2,
  GATE_OPEN = 20,
  PRESSURE_PLATE = 3,
  ALTAR = 4,
  VOID = 5,
  BRAZIER = 6,
  BREAKABLE_CRATE = 7,
}

export const TILE_SIZE = 40;