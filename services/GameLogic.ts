import { Entity, EntityType, GameState, TileType, TILE_SIZE, Vector2, ItemType, Stats } from '../types';
import { LEVEL_MAP, GAME_CONSTANTS, GATE_POS, COLORS } from '../constants';

const checkCollision = (pos: Vector2, radius: number, map: number[][]): boolean => {
  // Check map boundaries and tiles
  const minX = Math.floor((pos.x - radius) / TILE_SIZE);
  const maxX = Math.floor((pos.x + radius) / TILE_SIZE);
  const minY = Math.floor((pos.y - radius) / TILE_SIZE);
  const maxY = Math.floor((pos.y + radius) / TILE_SIZE);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (y < 0 || x < 0 || y >= map.length || x >= map[0].length) return true;
      const tile = map[y][x];
      if (tile === TileType.WALL || tile === TileType.GATE_LOCKED || tile === TileType.VOID || tile === TileType.BRAZIER || tile === TileType.BREAKABLE_CRATE) {
        const tileRect = {
          x: x * TILE_SIZE,
          y: y * TILE_SIZE,
          w: TILE_SIZE,
          h: TILE_SIZE
        };
        const closestX = Math.max(tileRect.x, Math.min(pos.x, tileRect.x + tileRect.w));
        const closestY = Math.max(tileRect.y, Math.min(pos.y, tileRect.y + tileRect.h));
        const dx = pos.x - closestX;
        const dy = pos.y - closestY;
        if ((dx * dx + dy * dy) < (radius * radius)) {
          return true;
        }
      }
    }
  }
  return false;
};

const getDistance = (a: Vector2, b: Vector2) => {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
};

// Safe cooldown check
const isReady = (cooldowns: Record<string, number>, key: string) => {
  return (cooldowns[key] || 0) <= 0;
};

export const createEntity = (type: EntityType, x: number, y: number, id: string): Entity => {
  const base: Entity = {
    id,
    type,
    pos: { x: x * TILE_SIZE + TILE_SIZE / 2, y: y * TILE_SIZE + TILE_SIZE / 2 },
    vel: { x: 0, y: 0 },
    size: 12,
    state: 'IDLE',
    cooldowns: {},
    animTimer: 0,
    color: '#fff',
    scale: 1,
    facing: Math.PI / 2, // Default face down
  };

  switch (type) {
    case EntityType.PLAYER:
      return {
        ...base,
        stats: { hp: 100, maxHp: 100, damage: 25, speed: GAME_CONSTANTS.PLAYER_SPEED },
        size: 14,
        color: COLORS.KANA_FUR // Base color for map/shadows
      };
    case EntityType.SKELETON:
      return {
        ...base,
        stats: { hp: 45, maxHp: 45, damage: 8, speed: GAME_CONSTANTS.SKELETON_SPEED },
        color: '#d1d5db',
        aiState: 'PATROL'
      };
    case EntityType.ARCHER:
      return {
        ...base,
        stats: { hp: 30, maxHp: 30, damage: 6, speed: GAME_CONSTANTS.ARCHER_SPEED },
        color: '#9ca3af',
        aiState: 'PATROL'
      };
    case EntityType.BOSS:
      return {
        ...base,
        stats: { hp: 150, maxHp: 150, damage: 10, speed: GAME_CONSTANTS.BOSS_SPEED },
        size: 16, // Reduced collision size to prevent getting stuck
        scale: 2.0, // Visually large
        color: '#ef4444',
        aiState: 'PATROL'
      };
    case EntityType.ITEM:
      return {
        ...base,
        size: 8,
        color: '#fbbf24'
      };
    default:
      return base;
  }
};

export const updateGame = (state: GameState, keys: Set<string>, mouse: { x: number, y: number, left: boolean, right: boolean }, dt: number, time: number): GameState => {
  if (state.triggers.gameOver || state.triggers.gameWon) return state;

  const player = state.entities.find(e => e.type === EntityType.PLAYER);
  if (!player) return state;

  const nextEntities = [...state.entities];
  const newParticles = [...state.particles];
  const newPopups = [...state.popups];

  // Check active minions for Boss Logic
  const activeMinions = state.entities.filter(e => (e.type === EntityType.SKELETON || e.type === EntityType.ARCHER) && e.stats && e.stats.hp > 0).length;

  const spawnDamageText = (pos: Vector2, text: string | number, isCrit = false) => {
    newPopups.push({
      id: Math.random().toString(),
      pos: { ...pos },
      text: text.toString(),
      color: isCrit ? '#ef4444' : (text === 'IMMUNE' ? '#fbbf24' : '#ffffff'),
      life: 800,
      offsetY: 0
    });
  };

  // --- PLAYER LOGIC ---
  if (player.state !== 'DEAD') {
    
    const currentState = player.state as string; // Cast to string for easier comparison

    // Facing update (Mouse)
    if (currentState !== 'DODGE') {
        player.facing = Math.atan2(mouse.y - player.pos.y, mouse.x - player.pos.x);
    }

    // Input: 'W' Key for Melee Attack (Giant Carrot Swing)
    if (keys.has('w') && isReady(player.cooldowns, 'attack') && currentState !== 'DODGE') {
        player.state = 'ATTACK';
        player.attackType = 'MELEE';
        player.cooldowns['attack'] = 600;
        player.cooldowns['attackAnim'] = 300;
        player.animTimer = 0;
        player.moveTarget = null;

        // Melee Area Damage (Cone)
        const swingRange = 80;
        const swingDamage = 50;
        nextEntities.forEach(ent => {
            if (ent.type !== EntityType.PLAYER && ent.stats && ent.stats.hp > 0) {
                const dist = getDistance(player.pos, ent.pos);
                if (dist < swingRange) {
                    const angleToEnt = Math.atan2(ent.pos.y - player.pos.y, ent.pos.x - player.pos.x);
                    let angleDiff = angleToEnt - player.facing;
                    // Normalize angle
                    while(angleDiff > Math.PI) angleDiff -= Math.PI*2;
                    while(angleDiff < -Math.PI) angleDiff += Math.PI*2;
                    
                    if (Math.abs(angleDiff) < Math.PI / 2.5) { // Within ~70 degree cone
                         if (ent.type === EntityType.BOSS && activeMinions > 0) {
                             spawnDamageText(ent.pos, "IMMUNE");
                         } else {
                             ent.stats.hp -= swingDamage;
                             ent.flashTimer = 150;
                             spawnDamageText(ent.pos, swingDamage, true);
                         }
                    }
                }
            }
        });
    }

    // Input: 'E' Key to Attack (Throw Carrot) - SLOWER SPEED, SAME DISTANCE
    if (keys.has('e') && isReady(player.cooldowns, 'attack') && currentState !== 'DODGE') {
        player.state = 'ATTACK';
        player.attackType = 'RANGED';
        player.cooldowns['attack'] = GAME_CONSTANTS.PLAYER_ATTACK_CD;
        player.cooldowns['attackAnim'] = 200;
        player.animTimer = 0;
        player.moveTarget = null;
        
        // Face Mouse
        const angle = Math.atan2(mouse.y - player.pos.y, mouse.x - player.pos.x);
        player.facing = angle;

        // Spawn Carrot Projectile
        const proj = createEntity(EntityType.PROJECTILE, 0, 0, Math.random().toString());
        proj.pos = { ...player.pos };
        proj.pos.x += Math.cos(angle) * 10;
        proj.pos.y += Math.sin(angle) * 10;
        
        // Slower velocity (6) but longer duration (7500) = ~45,000 distance units capability
        proj.vel = { 
            x: Math.cos(angle) * 6, 
            y: Math.sin(angle) * 6 
        };
        proj.size = 5;
        proj.color = COLORS.CARROT_BODY;
        proj.ownerId = player.id;
        proj.duration = 7500; 
        nextEntities.push(proj);
    }

    // Input: Left Click to Move
    if (mouse.left) {
       player.moveTarget = { x: mouse.x, y: mouse.y };
    }

    let desiredDx = 0;
    let desiredDy = 0;

    // Move to Point
    if (player.moveTarget) {
       const dist = getDistance(player.pos, player.moveTarget);
       if (dist < 5) {
          player.moveTarget = null;
          if(currentState === 'WALK') player.state = 'IDLE';
       } else {
          const dirX = player.moveTarget.x - player.pos.x;
          const dirY = player.moveTarget.y - player.pos.y;
          const len = Math.sqrt(dirX*dirX + dirY*dirY);
          if (len > 0) {
             desiredDx = dirX / len;
             desiredDy = dirY / len;
          }
       }
    }

    // Apply Movement
    const isMoving = (desiredDx !== 0 || desiredDy !== 0);
    
    if (isMoving && currentState !== 'ATTACK' && currentState !== 'DODGE') {
      const speed = player.stats?.speed || 4;
      
      const nextX = player.pos.x + desiredDx * speed;
      const nextY = player.pos.y + desiredDy * speed;

      // Slide Collision Logic
      let collidedX = checkCollision({ x: nextX, y: player.pos.y }, player.size, state.map);
      let collidedY = checkCollision({ x: player.pos.x, y: nextY }, player.size, state.map);

      if (!collidedX) player.pos.x = nextX;
      if (!collidedY) player.pos.y = nextY;

      if (collidedX && collidedY) {
         // Stuck
         player.moveTarget = null;
      }

      // Anim Timer
      player.animTimer = (player.animTimer || 0) + dt * 0.010; 

      player.state = 'WALK';
    } else {
      if (currentState === 'WALK') player.state = 'IDLE';
      if (currentState === 'IDLE') {
         player.animTimer = (player.animTimer || 0) + dt * 0.005; // Slow idle
      }
    }

    // Dodge Input: Space key
    if (keys.has(' ') && isReady(player.cooldowns, 'dodge')) {
      player.state = 'DODGE';
      player.cooldowns['dodge'] = GAME_CONSTANTS.PLAYER_DASH_CD;
      player.cooldowns['dodgeDuration'] = 350; // Slightly longer for full roll animation
      player.animTimer = 0; // Reset for dodge sprite
      player.moveTarget = null;
      
      // Dash in mouse direction
      const mx = mouse.x - player.pos.x;
      const my = mouse.y - player.pos.y;
      const angle = Math.atan2(my, mx);
      
      player.vel = { x: Math.cos(angle) * GAME_CONSTANTS.PLAYER_DASH_SPEED, y: Math.sin(angle) * GAME_CONSTANTS.PLAYER_DASH_SPEED };
      player.facing = angle;
    }
    
    if (currentState === 'DODGE') {
      player.animTimer = (player.animTimer || 0) + dt * 0.015; // Fast roll
      if (isReady(player.cooldowns, 'dodgeDuration')) {
        player.state = 'IDLE';
        player.vel = {x:0, y:0};
      } else {
         // Force velocity move
         const nextX = player.pos.x + player.vel.x;
         const nextY = player.pos.y + player.vel.y;
         if(!checkCollision({x: nextX, y: nextY}, player.size, state.map)) {
            player.pos.x = nextX;
            player.pos.y = nextY;
         }
      }
    }

    if (currentState === 'ATTACK') {
      // Attack animation frame progression
      player.animTimer = (player.animTimer || 0) + dt * 0.010; 
      if (isReady(player.cooldowns, 'attackAnim')) {
        player.state = 'IDLE';
        player.attackType = undefined;
      }
    }

    Object.keys(player.cooldowns).forEach(k => {
      player.cooldowns[k] = Math.max(0, player.cooldowns[k] - dt);
    });

    if (player.flashTimer && player.flashTimer > 0) {
        player.flashTimer -= dt;
    }
  }

  // --- ENTITIES LOOP ---
  for (let i = nextEntities.length - 1; i >= 0; i--) {
    const ent = nextEntities[i];
    if (ent.type === EntityType.PLAYER) continue;

    // Physics
    ent.pos.x += ent.vel.x;
    ent.pos.y += ent.vel.y;
    
    // Apply friction only to non-projectiles
    // Projectiles should fly straight without slowing down
    if (ent.type !== EntityType.PROJECTILE) {
      ent.vel.x *= 0.8;
      ent.vel.y *= 0.8;
    }
    
    if (ent.cooldowns) {
       Object.keys(ent.cooldowns).forEach(k => {
        ent.cooldowns[k] = Math.max(0, ent.cooldowns[k] - dt);
      });
    }
    if (ent.flashTimer && ent.flashTimer > 0) ent.flashTimer -= dt;

    // AI
    if (ent.stats && ent.stats.hp > 0) {
      const distToPlayer = getDistance(ent.pos, player.pos);
      
      // SKELETON & BOSS Common Melee Logic
      if (ent.type === EntityType.SKELETON || ent.type === EntityType.BOSS) {
         const aggroRange = ent.type === EntityType.BOSS ? 600 : 300;
         const attackRange = ent.type === EntityType.BOSS ? 55 : 40;

         // Boss Logic: Only Chase if no minions
         if (ent.type === EntityType.BOSS) {
            if (activeMinions > 0) {
                ent.aiState = 'IDLE';
            } else {
                ent.aiState = 'CHASE';
                // Activate Boss UI if not already active
                if (!state.triggers.bossActive) state.triggers.bossActive = true;
            }
         } else {
             // Skeleton Logic
             if (distToPlayer < aggroRange) ent.aiState = 'CHASE';
         }
         
         if (ent.aiState === 'CHASE') {
            const currentEntState = ent.state as string;

            // Move if too far
            if (distToPlayer > attackRange - 5 && currentEntState !== 'ATTACK') { 
                const dx = player.pos.x - ent.pos.x;
                const dy = player.pos.y - ent.pos.y;
                const angle = Math.atan2(dy, dx);
                ent.facing = angle;
                
                // Boid separation
                let pushX = 0, pushY = 0;
                nextEntities.forEach(other => {
                   if (other !== ent && other.stats && getDistance(ent.pos, other.pos) < 25) {
                      pushX += ent.pos.x - other.pos.x;
                      pushY += ent.pos.y - other.pos.y;
                   }
                });
                
                const speed = ent.stats.speed;
                const moveX = Math.cos(angle) * speed + pushX * 0.15;
                const moveY = Math.sin(angle) * speed + pushY * 0.15;

                if (!checkCollision({x: ent.pos.x + moveX, y: ent.pos.y}, ent.size, state.map)) ent.pos.x += moveX;
                if (!checkCollision({x: ent.pos.x, y: ent.pos.y + moveY}, ent.size, state.map)) ent.pos.y += moveY;
                
                ent.animTimer = (ent.animTimer || 0) + dt * 0.01;
                ent.state = 'WALK'; // Ensure walking animation plays
            } else if (currentEntState !== 'ATTACK') {
               // Close enough to attack, face player
               ent.facing = Math.atan2(player.pos.y - ent.pos.y, player.pos.x - ent.pos.x);
               ent.animTimer = 0; 
               ent.state = 'IDLE';
            }

            // Attack Check
            if (distToPlayer <= attackRange + 15 && isReady(ent.cooldowns, 'attack')) {
                // Face player when attacking
                ent.facing = Math.atan2(player.pos.y - ent.pos.y, player.pos.x - ent.pos.x);
                
                ent.cooldowns['attack'] = ent.type === EntityType.BOSS ? 1000 : 1500;
                ent.state = 'ATTACK'; // Visual state
                ent.cooldowns['attackAnim'] = 300;
                ent.animTimer = 0;
                
                if ((player.state as string) !== 'DODGE') {
                    player.stats!.hp -= ent.stats.damage;
                    player.flashTimer = 200;
                    spawnDamageText(player.pos, ent.stats.damage, true);
                }
            }
         }
      }
      // ARCHER Logic
      else if (ent.type === EntityType.ARCHER) {
         if (distToPlayer < 400) ent.aiState = 'CHASE';
         if (ent.aiState === 'CHASE') {
            ent.facing = Math.atan2(player.pos.y - ent.pos.y, player.pos.x - ent.pos.x);
            
            const desiredDist = 200;
            if (distToPlayer < desiredDist - 20) {
               // Back up
               const angle = ent.facing + Math.PI;
               if (!checkCollision({x: ent.pos.x + Math.cos(angle)*2, y: ent.pos.y + Math.sin(angle)*2}, ent.size, state.map)) {
                  ent.pos.x += Math.cos(angle) * 2;
                  ent.pos.y += Math.sin(angle) * 2;
                  ent.animTimer = (ent.animTimer || 0) + dt * 0.01;
                  ent.state = 'WALK';
               }
            } else if (distToPlayer > desiredDist + 20) {
               // Approach
               const angle = ent.facing;
               ent.pos.x += Math.cos(angle) * 2;
               ent.pos.y += Math.sin(angle) * 2;
               ent.animTimer = (ent.animTimer || 0) + dt * 0.01;
               ent.state = 'WALK';
            } else {
                ent.state = 'IDLE';
            }

            // Shoot
            if (isReady(ent.cooldowns, 'attack')) {
               ent.cooldowns['attack'] = 2000;
               ent.state = 'ATTACK';
               ent.cooldowns['attackAnim'] = 200;
               
               const proj = createEntity(EntityType.PROJECTILE, 0, 0, Math.random().toString());
               proj.pos = { ...ent.pos };
               proj.vel = { x: Math.cos(ent.facing) * 7, y: Math.sin(ent.facing) * 7 };
               proj.size = 5;
               proj.color = COLORS.PROJECTILE;
               proj.ownerId = ent.id;
               proj.duration = 2000;
               nextEntities.push(proj);
            }
         }
      }
      
      // Clear visual attack state
      if ((ent.state as string) === 'ATTACK') {
         ent.animTimer = (ent.animTimer || 0) + dt * 0.02; // Animate swing
         if (isReady(ent.cooldowns, 'attackAnim')) {
             ent.state = 'IDLE';
         }
      }
    }

    // Projectiles
    if (ent.type === EntityType.PROJECTILE) {
      ent.duration = (ent.duration || 0) - dt;
      if (ent.duration <= 0 || checkCollision(ent.pos, ent.size, state.map)) {
        nextEntities.splice(i, 1);
        continue;
      }
      
      // Player Projectile Hits Enemy
      if (ent.ownerId === player.id) {
         let hit = false;
         for (const target of nextEntities) {
            if (target === ent || target.type === EntityType.PLAYER || target.type === EntityType.ITEM || target.type === EntityType.PROJECTILE || target.type === EntityType.PARTICLE || target.type === EntityType.TEXT_POPUP || target.type === EntityType.DECORATION) continue;
            if (getDistance(ent.pos, target.pos) < target.size + ent.size) {
                // Hit Enemy
                if (target.stats) {
                   if (target.type === EntityType.BOSS && activeMinions > 0) {
                       spawnDamageText(target.pos, "IMMUNE");
                   } else {
                       target.stats.hp -= player.stats!.damage;
                       target.flashTimer = 150;
                       spawnDamageText(target.pos, player.stats!.damage);
                   }
                }
                hit = true;
                break;
            }
         }
         if (hit) {
            nextEntities.splice(i, 1);
            continue;
         }
      }
      // Enemy Projectile Hits Player
      else if (ent.ownerId !== player.id && getDistance(ent.pos, player.pos) < player.size + ent.size) {
        if ((player.state as string) !== 'DODGE') {
           player.stats!.hp -= 8;
           player.flashTimer = 100;
           spawnDamageText(player.pos, 8, true);
        }
        nextEntities.splice(i, 1);
        continue;
      }
    }
    
    // Items
    if (ent.type === EntityType.ITEM) {
      if (getDistance(ent.pos, player.pos) < player.size + ent.size) {
        if (ent.itemType === ItemType.HEALTH_POTION) {
          state.inventory.potions++;
          spawnDamageText(player.pos, 1, false);
        } else if (ent.itemType === ItemType.WARDEN_SEAL) {
          state.inventory.hasSeal = true;
          newPopups.push({ id: 'seal', pos: {...player.pos}, text: "SEAL ACQUIRED", color: '#fbbf24', life: 3000, offsetY: 20 });
        }
        nextEntities.splice(i, 1);
        continue;
      }
    }

    // Death
    if (ent.stats && ent.stats.hp <= 0) {
      if (ent.type === EntityType.BOSS) {
         state.triggers.bossDefeated = true;
         const seal = createEntity(EntityType.ITEM, 0, 0, 'warden_seal');
         seal.pos = { ...ent.pos };
         seal.itemType = ItemType.WARDEN_SEAL;
         seal.color = '#ef4444';
         seal.size = 15;
         nextEntities.push(seal);
      } else {
         if (Math.random() > 0.8) {
             const pot = createEntity(EntityType.ITEM, 0, 0, Math.random().toString());
             pot.pos = { ...ent.pos };
             pot.itemType = ItemType.HEALTH_POTION;
             nextEntities.push(pot);
         }
      }
      nextEntities.splice(i, 1);
    }
  }

  // Map Triggers
  const playerMapX = Math.floor(player.pos.x / TILE_SIZE);
  const playerMapY = Math.floor(player.pos.y / TILE_SIZE);
  if (playerMapY >= 0 && playerMapX >= 0 && playerMapY < state.map.length && playerMapX < state.map[0].length) {
    const currentTile = state.map[playerMapY][playerMapX];
    if (currentTile === TileType.PRESSURE_PLATE && !state.triggers.gateOpen) {
      state.triggers.gateOpen = true;
      if (state.map[GATE_POS.y][GATE_POS.x] === TileType.GATE_LOCKED) {
         state.map[GATE_POS.y][GATE_POS.x] = TileType.GATE_OPEN;
         newPopups.push({ id: 'gate', pos: { x: GATE_POS.x*TILE_SIZE, y: GATE_POS.y*TILE_SIZE }, text: "GATE OPENED", color: '#a16207', life: 2000, offsetY: 0 });
      }
    }
    if (currentTile === TileType.ALTAR && state.inventory.hasSeal) {
      state.triggers.gameWon = true;
    }
  }

  if (keys.has('q') && state.inventory.potions > 0 && player.stats!.hp < player.stats!.maxHp) {
     player.stats!.hp = Math.min(player.stats!.maxHp, player.stats!.hp + 40);
     state.inventory.potions--;
     keys.delete('q');
     spawnDamageText(player.pos, 40, false);
  }

  if (player.stats!.hp <= 0) state.triggers.gameOver = true;

  for(let i=newPopups.length-1; i>=0; i--) {
    newPopups[i].life -= dt;
    newPopups[i].pos.y -= 0.5;
    if(newPopups[i].life <= 0) newPopups.splice(i, 1);
  }

  state.camera.x += (player.pos.x - state.camera.x) * 0.1;
  state.camera.y += (player.pos.y - state.camera.y) * 0.1;

  return {
    ...state,
    entities: nextEntities,
    particles: newParticles,
    popups: newPopups,
  };
};