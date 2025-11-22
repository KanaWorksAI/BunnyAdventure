
import { TileType } from './types';

// Expanded Map 24x24
// 0: Floor, 1: Wall, 2: Gate, 3: Plate, 4: Altar, 5: Void, 6: Brazier, 7: Crate
export const LEVEL_MAP = [
  [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  [5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 5],
  [5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 4, 0, 0, 6, 0, 0, 0, 0, 0, 0, 1, 5, 5], // Altar Room Top
  [5, 1, 0, 6, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 5, 5],
  [5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 5, 5],
  [5, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 5, 5], // Gate Row
  [5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 5, 5],
  [5, 1, 0, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 1, 5, 5],
  [5, 1, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 1, 5, 5],
  [5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 5, 5],
  [5, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 6, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 5, 5], // Mid Pillars
  [5, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 5, 5],
  [5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 5, 5],
  [5, 1, 0, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 1, 5, 5],
  [5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 5, 5],
  [5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 5, 5],
  [5, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 5, 5],
  [5, 5, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 5, 5, 5], // Pressure plate room left
  [5, 5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 5, 5, 5],
  [5, 5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 5, 5, 5],
  [5, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 5, 5],
  [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
];

export const GAME_CONSTANTS = {
  PLAYER_SPEED: 5.5,
  PLAYER_DASH_SPEED: 14,
  PLAYER_ATTACK_RANGE: 1800,
  PLAYER_ATTACK_CD: 400,
  PLAYER_DASH_CD: 1500,
  SKELETON_SPEED: 2.5,
  ARCHER_SPEED: 3,
  BOSS_SPEED: 3.0,
  BOSS_ENRAGE_SPEED: 4.5,
};

// Start Position in map coordinates
export const PLAYER_START_POS = { x: 11, y: 14 }; 
export const BOSS_START_POS = { x: 11, y: 3 };
export const ALTAR_POS = { x: 11, y: 2 }; 
export const GATE_POS = { x: 11, y: 5 };
export const PRESSURE_PLATE_POS = { x: 6, y: 17 };

// Minecraft-inspired Palette
export const COLORS = {
  FLOOR: '#65a30d', // Grass/Moss Green
  FLOOR_SIDE: '#4d7c0f',
  WALL: '#78716c', // Stone
  WALL_SIDE: '#57534e', 
  WALL_TOP: '#a8a29e',
  VOID: '#0ea5e9', // Sky Blue / Water
  
  // Old Player Colors (Keeping for fallbacks if needed)
  PLAYER_BODY: '#0ea5e9',
  PLAYER_LEGS: '#1e3a8a', 
  PLAYER_HEAD: '#fcd34d',

  // KANA CHARACTER DESIGN
  KANA_JACKET: '#fbbf24', // Vibrant Yellow Puffer
  KANA_PANTS: '#1e3a8a', // Dark Blue Tech Pants
  KANA_FUR: '#f9fafb', // White Fur
  KANA_BOOTS: '#374151', // Dark Grey Mech Boots
  KANA_BOOTS_ACCENT: '#f59e0b', // Amber/Gold Accents
  KANA_EYE: '#ef4444', // Cyber Red Eye
  KANA_EAR_GLOW: '#22d3ee', // Cyan Tech Glow
  KANA_GLOVE: '#1f2937', // Dark Gloves

  SKELETON: '#e5e7eb', // Bone White
  ARCHER: '#9ca3af', // Gray
  BOSS: '#b91c1c', // Red Nether Brick
  PROJECTILE: '#d946ef', // Magenta/Purple Energy Orb
  FIRE: '#f97316', // Orange
  GATE: '#854d0e', // Wood
  ALTAR: '#a855f7', // Purple Obsidian
  CRATE: '#d97706', // Wood Planks

  // Carrot Colors
  CARROT_BODY: '#f97316',
  CARROT_LEAF: '#4ade80',
};

// --- KANA PIXEL ART ---
export const KANA_PALETTE: Record<string, string> = {
  '.': 'transparent',
  'W': COLORS.KANA_FUR,
  'Y': COLORS.KANA_JACKET,
  'B': COLORS.KANA_PANTS,
  'R': COLORS.KANA_EYE,
  'G': COLORS.KANA_BOOTS,
  'O': COLORS.KANA_BOOTS_ACCENT,
  'C': COLORS.KANA_EAR_GLOW,
  'D': COLORS.KANA_GLOVE, // Dark glove
  'S': '#22d3ee', // Sword Blade
  'H': '#0ea5e9', // Sword Handle
  ' ': 'transparent', // Fallback
};

const KANA_FRAME_WIDTH = 12;
const KANA_FRAME_HEIGHT = 18;

// Sprite Frames (Strings representing pixel rows)
// 12 pixels wide, approx 18 pixels tall
const IDLE_FRAME_1 = [
  "....W..W....",
  "....C..W....",
  "....W..W....",
  "....WWWW....",
  "....WWRW....",
  "....WWWW....",
  "...YYYYYY...",
  "..YYYYYYYY..",
  "..DYYYYYYD..",
  "..DYYYYYYD..",
  "...BBBBBB...",
  "...BBBBBB...",
  "...BB..BB...",
  "...G....G...",
  "...G....G...",
  "..OO....OO.."
];

const IDLE_FRAME_2 = [
  "....W..W....",
  "....C..W....",
  "....W..W....",
  "....WWWW....",
  "....WWRW....",
  "....WWWW....",
  "...YYYYYY...",
  "..YYYYYYYY..",
  "..DYYYYYYD..",
  "..DYYYYYYD..",
  "...BBBBBB...",
  "...BBBBBB...",
  "...BB..BB...",
  "...G....G...",
  "...G....G...",
  "..OO....OO.."
];

const WALK_FRAME_1 = [
  "....W..W....",
  "....C..W....",
  "....W..W....",
  "....WWWW....",
  "....WWRW....",
  "....WWWW....",
  "...YYYYYY...",
  "..YYYYYYYY..",
  ".D.YYYYYY.D.",
  ".D.YYYYYY.D.",
  "...BBBBBB...",
  "...BBBBBB...",
  "...BB..BB...",
  "...G....G...",
  "..G....OO...",
  ".OO........."
];

const WALK_FRAME_2 = [
  "....W..W....",
  "....C..W....",
  "....W..W....",
  "....WWWW....",
  "....WWRW....",
  "....WWWW....",
  "...YYYYYY...",
  "..YYYYYYYY..",
  "..DYYYYYYD..",
  "..DYYYYYYD..",
  "...BBBBBB...",
  "...BBBBBB...",
  "...BB..BB...",
  "...G....G...",
  "...G....G...",
  "..OO....OO.."
];

const WALK_FRAME_3 = [
  "....W..W....",
  "....C..W....",
  "....W..W....",
  "....WWWW....",
  "....WWRW....",
  "....WWWW....",
  "...YYYYYY...",
  "..YYYYYYYY..",
  ".D.YYYYYY.D.",
  ".D.YYYYYY.D.",
  "...BBBBBB...",
  "...BBBBBB...",
  "...BB..BB...",
  "...G....G...",
  "...OO....G..",
  "........OO.."
];

const ATTACK_FRAME_1 = [
  "....W..W....",
  "....C..W....",
  "....W..W....",
  "....WWWW....",
  "....WWRW....",
  "....WWWW....",
  "...YYYYYY...",
  "..YYYYYYYY..",
  "..YYYYYYYD..",
  "..BBBBBB....",
  "..BBBBBB....",
  "..G..G......",
  ".OO..OO....."
];

const ATTACK_FRAME_2 = [
  "....W..W....",
  "....C..W....",
  "....W..W....",
  "....WWWW....",
  "....WWRW....",
  "....WWWW....",
  "...YYYYYY...",
  "..YYYYYYYY..",
  "..YYYYYYYD..",
  "..BBBBBB....",
  "..BBBBBB....",
  "..G..G......",
  ".OO..OO....."
];

const ATTACK_FRAME_3 = [
  "....W..W....",
  "....C..W....",
  "....W..W....",
  "....WWWW....",
  "....WWRW....",
  "....WWWW....",
  "...YYYYYY...",
  "..YYYYYYYY..",
  "..YYYYYYYD..",
  "..BBBBBB....",
  "..BBBBBB....",
  "..G..G......",
  ".OO..OO....."
];

// Dodge / Roll Frames - "Ball" shape transition
const DODGE_FRAME_1 = [
  "............",
  "....W..W....",
  "....C..W....",
  "...WWWWWW...",
  "...WWRWWW...",
  "..YYYYYYYY..",
  "..YYYYYYYY..",
  "..DYYYYYYD..",
  "...BBBBBB...",
  "...BBBBBB...",
  "...G....G...",
  "..OO....OO.."
];

const DODGE_FRAME_2 = [
  "............",
  "............",
  "...WWWWWW...",
  "..W.C..W.W..",
  "..YYYYYYYY..",
  "..YYYYYYYY..",
  "..BBBBBBBB..",
  "...BBBBBB...",
  "...G....G...",
  "..OO....OO..",
  "............",
  "............"
];

const DODGE_FRAME_3 = [
  "............",
  "............",
  "............",
  "...G....G...",
  "...BBBBBB...",
  "..YYYYYYYY..",
  "..YYYYYYYY..",
  "..WWWWWWWW..",
  "...W.C..W...",
  "............",
  "............",
  "............"
];

const DODGE_FRAME_4 = [
  "............",
  "....W..W....",
  "....C..W....",
  "...WWWWWW...",
  "...WWRWWW...",
  "..YYYYYYYY..",
  "..YYYYYYYY..",
  "..DYYYYYYD..",
  "...BBBBBB...",
  "...BBBBBB...",
  "...G....G...",
  "..OO....OO.."
];

export const KANA_SPRITES = {
  IDLE: [IDLE_FRAME_1, IDLE_FRAME_2],
  WALK: [WALK_FRAME_1, WALK_FRAME_2, WALK_FRAME_3, WALK_FRAME_2],
  ATTACK: [ATTACK_FRAME_1, ATTACK_FRAME_2, ATTACK_FRAME_3],
  DODGE: [DODGE_FRAME_1, DODGE_FRAME_2, DODGE_FRAME_3, DODGE_FRAME_4], 
};
