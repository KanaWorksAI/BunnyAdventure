import React, { useEffect, useRef, useState } from 'react';
import { EntityType, GameState, TileType, TILE_SIZE, Entity, ItemType, Vector2 } from './types';
import { LEVEL_MAP, COLORS, PLAYER_START_POS, GAME_CONSTANTS, KANA_SPRITES, KANA_PALETTE } from './constants';
import { createEntity, updateGame } from './services/GameLogic';

const HeartIcon = () => <span className="text-red-500">♥</span>;
const PotionIcon = () => <span className="text-pink-500">🧪</span>;
const KeyIcon = () => <span className="text-yellow-500">🗝️</span>;

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hp, setHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  const [inventory, setInventory] = useState({ potions: 0, hasSeal: false });
  const [gameStateStatus, setGameStateStatus] = useState<'PLAYING' | 'WON' | 'LOST'>('PLAYING');
  const [bossHp, setBossHp] = useState<number | null>(null);

  const gameState = useRef<GameState>({
    entities: [],
    particles: [],
    popups: [],
    camera: { x: 0, y: 0 },
    map: JSON.parse(JSON.stringify(LEVEL_MAP)),
    triggers: { gateOpen: false, bossActive: false, bossDefeated: false, gameWon: false, gameOver: false },
    inventory: { potions: 0, hasSeal: false }
  });

  const keys = useRef<Set<string>>(new Set());
  const mouse = useRef({ x: 0, y: 0, left: false, right: false });

  useEffect(() => {
    const entities: Entity[] = [];
    const player = createEntity(EntityType.PLAYER, PLAYER_START_POS.x, PLAYER_START_POS.y, 'player');
    entities.push(player);
    
    entities.push(createEntity(EntityType.SKELETON, 13, 10, 'skel1'));
    entities.push(createEntity(EntityType.SKELETON, 16, 14, 'skel2'));
    entities.push(createEntity(EntityType.ARCHER, 10, 18, 'arch1'));
    entities.push(createEntity(EntityType.ARCHER, 19, 6, 'arch2'));
    entities.push(createEntity(EntityType.SKELETON, 18, 18, 'skel3'));
    entities.push(createEntity(EntityType.SKELETON, 6, 14, 'skel4'));

    entities.push(createEntity(EntityType.BOSS, 11, 3, 'warden'));

    gameState.current.entities = entities;
    gameState.current.camera = { ...player.pos };
  }, []);

  const toIso = (x: number, y: number) => {
    return {
      x: (x - y), 
      y: (x + y) * 0.5
    };
  };

  const screenToWorld = (sx: number, sy: number, cam: Vector2, width: number, height: number) => {
    const cx = width / 2;
    const cy = height / 2;
    const camIso = toIso(cam.x, cam.y);
    const dx = sx - cx;
    const dy = sy - cy;
    
    // Inverse Iso
    // isoX = x - y
    // isoY = (x + y) * 0.5
    // => 2*isoY = x + y
    // => x = isoY + isoX/2 + cam.x (relative)
    
    // Correct Inverse calculation:
    // x = (2*isoY + isoX) / 2
    // y = (2*isoY - isoX) / 2
    
    // Adjust for camera offset in iso space
    const isoX = dx + camIso.x;
    const isoY = dy + camIso.y;
    
    return {
      x: isoY + isoX * 0.5,
      y: isoY - isoX * 0.5
    };
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === ' ') e.preventDefault(); // Prevent scrolling
        keys.current.add(e.key.toLowerCase());
    };
    const handleKeyUp = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) mouse.current.left = true;
      if (e.button === 2) mouse.current.right = true;
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) mouse.current.left = false;
      if (e.button === 2) mouse.current.right = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if(rect) {
          mouse.current.x = e.clientX - rect.left;
          mouse.current.y = e.clientY - rect.top;
      }
    };
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  useEffect(() => {
    let lastTime = performance.now();
    let animationFrameId: number;

    const loop = (time: number) => {
      const dt = Math.min(time - lastTime, 50); // Cap dt to prevent huge jumps
      lastTime = time;

      if (gameStateStatus === 'PLAYING') {
        const state = gameState.current;
        const canvas = canvasRef.current;
        if (canvas) {
           const wm = screenToWorld(mouse.current.x, mouse.current.y, state.camera, canvas.width, canvas.height);
           try {
             gameState.current = updateGame(state, keys.current, { ...mouse.current, x: wm.x, y: wm.y }, dt, time);
           } catch(e) {
             console.error("Game Update Error:", e);
           }
        }
        
        const player = state.entities.find(e => e.type === EntityType.PLAYER);
        if (player && player.stats) {
          setHp(Math.ceil(player.stats.hp));
          setMaxHp(player.stats.maxHp);
        }
        setInventory({ ...state.inventory });

        const boss = state.entities.find(e => e.type === EntityType.BOSS);
        if (boss && state.triggers.bossActive && !state.triggers.bossDefeated) {
           setBossHp(boss.stats?.hp || 0);
        } else {
           setBossHp(null);
        }

        if (state.triggers.gameWon) setGameStateStatus('WON');
        if (state.triggers.gameOver) setGameStateStatus('LOST');
      }
      
      try {
        render(gameState.current);
      } catch(e) {
        console.error("Render Error:", e);
      }
      
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStateStatus]);

  const render = (state: GameState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = COLORS.VOID;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    const cx = width / 2;
    const cy = height / 2;
    const camIso = toIso(state.camera.x, state.camera.y);
    ctx.translate(cx - camIso.x, cy - camIso.y);

    const drawCube = (x: number, y: number, z: number, w: number, h: number, d: number, colorTop: string, colorSide: string, colorFront: string) => {
        const isoX = x - y;
        const isoY = (x + y) * 0.5 - z;
        ctx.fillStyle = colorTop;
        ctx.beginPath();
        ctx.moveTo(isoX, isoY - d);
        ctx.lineTo(isoX + w, isoY - h/2 - d);
        ctx.lineTo(isoX, isoY - h - d);
        ctx.lineTo(isoX - w, isoY - h/2 - d);
        ctx.fill();

        ctx.fillStyle = colorSide;
        ctx.beginPath();
        ctx.moveTo(isoX + w, isoY - h/2 - d);
        ctx.lineTo(isoX + w, isoY - h/2);
        ctx.lineTo(isoX, isoY);
        ctx.lineTo(isoX, isoY - d);
        ctx.fill();

        ctx.fillStyle = colorFront;
        ctx.beginPath();
        ctx.moveTo(isoX - w, isoY - h/2 - d);
        ctx.lineTo(isoX - w, isoY - h/2);
        ctx.lineTo(isoX, isoY);
        ctx.lineTo(isoX, isoY - d);
        ctx.fill();
    };
    
    const drawVoxelChar = (ent: Entity) => {
       const x = ent.pos.x;
       const y = ent.pos.y;
       const s = ent.scale || 1;
       const isHit = ent.flashTimer && ent.flashTimer > 0;

       // Special Case: Player Projectile (Carrot)
       if (ent.type === EntityType.PROJECTILE && ent.ownerId?.startsWith('player')) {
           // Calculate screen space velocity angle for correct isometric rotation
           const vx = ent.vel.x;
           const vy = ent.vel.y;
           // Project velocity to isometric screen space
           const isoVx = vx - vy;
           const isoVy = (vx + vy) * 0.5;
           const screenAngle = Math.atan2(isoVy, isoVx);

           const isoX = x - y;
           const isoY = (x + y) * 0.5 - 10; // Floating
           
           const len = 20;
           const width = 5;

           ctx.save();
           ctx.translate(isoX, isoY);
           ctx.rotate(screenAngle); 
           
           // Draw Carrot Body - Tip pointing towards velocity (Positive X)
           ctx.fillStyle = COLORS.CARROT_BODY;
           ctx.beginPath();
           ctx.moveTo(len/2, 0); // Tip
           ctx.lineTo(-len/2, -width/2);
           ctx.lineTo(-len/2, width/2);
           ctx.fill();
           
           // Leaves at the back (Negative X)
           ctx.fillStyle = COLORS.CARROT_LEAF;
           ctx.fillRect(-len/2 - 4, -width, 4, width*2);
           
           ctx.restore();
           return;
       }

       // Special Case: Enemy Projectile (Energy Orb)
       if (ent.type === EntityType.PROJECTILE && !ent.ownerId?.startsWith('player')) {
           const isoX = x - y;
           const isoY = (x + y) * 0.5 - 12; // Floating mid-air
           
           // Pulsing animation
           const pulse = Math.sin(performance.now() * 0.01) * 0.2 + 1; 
           const size = ent.size * pulse;

           ctx.save();
           
           // Outer Glow (Shadow)
           ctx.shadowColor = ent.color;
           ctx.shadowBlur = 15;
           
           // Orb Body
           ctx.fillStyle = ent.color;
           ctx.beginPath();
           ctx.arc(isoX, isoY, size, 0, Math.PI * 2);
           ctx.fill();

           // Inner Hot Core
           ctx.fillStyle = '#ffffff';
           ctx.beginPath();
           ctx.arc(isoX, isoY, size * 0.5, 0, Math.PI * 2);
           ctx.fill();

           ctx.restore();
           return;
       }
       
       // Shadow
       const isoX = x - y;
       const isoY = (x + y) * 0.5;
       ctx.fillStyle = 'rgba(0,0,0,0.3)';
       ctx.beginPath();
       ctx.ellipse(isoX, isoY, ent.size * 1.2, ent.size * 0.6, 0, 0, Math.PI*2);
       ctx.fill();

       const walkCycle = Math.sin(ent.animTimer || 0);
       const armCycle = Math.cos(ent.animTimer || 0);
       
       let lLegOffset = walkCycle * 6;
       let rLegOffset = -walkCycle * 6;
       let lArmOffset = armCycle * 6;
       let rArmOffset = -armCycle * 6;

       if (ent.state === 'IDLE') {
          lLegOffset = 0; rLegOffset = 0; lArmOffset = 0; rArmOffset = 0;
       }
       if ((ent.state as string) === 'ATTACK') {
          const swing = Math.sin(ent.animTimer || 0) * 15;
          rArmOffset = swing + 10;
          lArmOffset = -5;
       }
       
       const f = ent.facing || 0;
       const legH = 12 * s;
       const bodyH = 14 * s;
       const headH = 10 * s;
       
       let cLeg = COLORS.PLAYER_LEGS;
       let cBody = COLORS.PLAYER_BODY;
       let cHead = COLORS.PLAYER_HEAD;
       
       if (ent.type === EntityType.PLAYER) { cLeg = COLORS.KANA_PANTS; cBody = COLORS.KANA_JACKET; cHead = COLORS.KANA_FUR; }
       if (ent.type === EntityType.SKELETON) { cLeg = '#d1d5db'; cBody = '#d1d5db'; cHead = '#d1d5db'; }
       if (ent.type === EntityType.ARCHER) { cLeg = '#4b5563'; cBody = '#9ca3af'; cHead = '#d1d5db'; }
       if (ent.type === EntityType.BOSS) { cLeg = '#7f1d1d'; cBody = '#991b1b'; cHead = '#b91c1c'; }
       if (isHit) { cLeg = '#fff'; cBody = '#fff'; cHead = '#fff'; }

       // Enemy/Boss Model
       const sideX = Math.cos(f + Math.PI/2) * 6 * s;
       const sideY = Math.sin(f + Math.PI/2) * 6 * s;
       const fwdX = Math.cos(f);
       const fwdY = Math.sin(f);

       const llX = x + sideX + fwdX * lLegOffset;
       const llY = y + sideY + fwdY * lLegOffset;
       const rlX = x - sideX + fwdX * rLegOffset;
       const rlY = y - sideY + fwdY * rLegOffset;
       const bX = x;
       const bY = y;
       const bZ = legH;
       const laX = x + sideX * 1.5 + fwdX * lArmOffset;
       const laY = y + sideY * 1.5 + fwdY * lArmOffset;
       const laZ = legH + 6*s; 
       const raX = x - sideX * 1.5 + fwdX * rArmOffset;
       const raY = y - sideY * 1.5 + fwdY * rArmOffset;
       const raZ = legH + 6*s;
       const hX = x;
       const hY = y;
       const hZ = legH + bodyH;

       const parts = [
          { x: llX, y: llY, z: 0, w: 4*s, h: 4*s, d: legH, c: cLeg },
          { x: rlX, y: rlY, z: 0, w: 4*s, h: 4*s, d: legH, c: cLeg },
          { x: bX, y: bY, z: bZ, w: 8*s, h: 6*s, d: bodyH, c: cBody },
          { x: hX, y: hY, z: hZ, w: 8*s, h: 8*s, d: headH, c: cHead },
          { x: laX, y: laY, z: laZ, w: 3*s, h: 3*s, d: 10*s, c: cBody },
          { x: raX, y: raY, z: raZ, w: 3*s, h: 3*s, d: 10*s, c: cBody },
       ];
       parts.sort((a, b) => (a.x + a.y) - (b.x + b.y));
       parts.forEach(p => {
          drawCube(p.x, p.y, p.z, p.w, p.h, p.d, p.c, p.c, p.c);
       });
       
       // Weapon if needed
       if (ent.type === EntityType.BOSS || ent.type === EntityType.SKELETON) {
          const wx = raX + fwdX * 10 * s;
          const wy = raY + fwdY * 10 * s;
          const wz = raZ - 5;
          drawCube(wx, wy, wz, 2*s, 2*s, 14*s, '#525252', '#525252', '#525252');
       }

       // HP Bar
       if (ent.stats && ent.type !== EntityType.PLAYER && ent.stats.hp < ent.stats.maxHp) {
          const barW = 30;
          const barH = 4;
          const barIsoY = (x + y) * 0.5;
          const barIsoX = x - y;
          const by = barIsoY - 80 * s;
          ctx.fillStyle = 'black';
          ctx.fillRect(barIsoX - barW/2, by, barW, barH);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(barIsoX - barW/2, by, barW * (ent.stats.hp / ent.stats.maxHp), barH);
       }
    };

    const drawSpriteChar = (ent: Entity) => {
      const x = ent.pos.x;
      const y = ent.pos.y;
      const isoX = x - y;
      const isoY = (x + y) * 0.5;
      
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(isoX, isoY, ent.size * 1.2, ent.size * 0.6, 0, 0, Math.PI*2);
      ctx.fill();

      // Fallback to voxel if sprite data missing
      if (!KANA_SPRITES || !KANA_SPRITES.IDLE) {
        drawVoxelChar(ent);
        return;
      }

      let frames = KANA_SPRITES.IDLE;
      if (ent.state === 'WALK') frames = KANA_SPRITES.WALK || KANA_SPRITES.IDLE;
      if (ent.state === 'DODGE') frames = KANA_SPRITES.DODGE || KANA_SPRITES.WALK;
      if (ent.state === 'ATTACK') frames = KANA_SPRITES.ATTACK || KANA_SPRITES.IDLE;

      // SAFE INDEXING
      const t = Math.max(0, ent.animTimer || 0);
      const frameIdx = Math.floor(t) % frames.length;
      const spriteData = frames[frameIdx];
      
      if (!spriteData) {
         drawVoxelChar(ent);
         return;
      }

      const pixelScale = 3; 
      const spriteH = 18 * pixelScale;
      
      const drawX = isoX;
      const drawY = isoY - spriteH + 10; 

      ctx.save();
      ctx.translate(drawX, drawY);
      
      // Flip logic
      let f = (ent.facing || 0) % (Math.PI * 2);
      if (f < 0) f += Math.PI * 2;
      const isFlipped = (f > Math.PI / 2 && f < Math.PI * 1.5);
      
      if (isFlipped) {
         ctx.scale(-1, 1);
      }

      // Draw pixels
      try {
          for (let r = 0; r < spriteData.length; r++) {
            const rowStr = spriteData[r];
            if (!rowStr) continue;
            for (let c = 0; c < rowStr.length; c++) {
               const char = rowStr[c];
               const color = KANA_PALETTE[char];
               if (color && color !== 'transparent') {
                  ctx.fillStyle = ent.flashTimer && ent.flashTimer > 0 ? '#ffffff' : color;
                  ctx.fillRect((c - 6) * pixelScale, r * pixelScale, pixelScale, pixelScale);
               }
            }
          }
      } catch (e) {
          // Ignore pixel errors, revert to next frame or fallback
      }
      ctx.restore();
      
      // DRAW GIANT CARROT SWING FOR MELEE
      if (ent.state === 'ATTACK' && ent.attackType === 'MELEE') {
          // Animation Progress (approx 0.0 to 3.0 based on animTimer)
          const progress = Math.min(1, (ent.animTimer || 0) / 3.0);
          
          // Calculate Screen Facing
          const f = ent.facing || 0;
          const fDirX = Math.cos(f);
          const fDirY = Math.sin(f);
          const isoFDirX = fDirX - fDirY;
          const isoFDirY = (fDirX + fDirY) * 0.5;
          const screenFacing = Math.atan2(isoFDirY, isoFDirX);

          // Swing Mechanics: Wide arc
          const startAngle = -Math.PI / 1.5;
          const endAngle = Math.PI / 1.5;
          const swingOffset = startAngle + (endAngle - startAngle) * Math.pow(progress, 0.7);

          const carrotLen = 50;
          const carrotW = 12;

          ctx.save();
          ctx.translate(isoX, isoY - 25); // Shoulder/Hand height
          
          // Rotate towards facing direction then apply swing
          ctx.rotate(screenFacing + swingOffset);

          // Handle
          ctx.fillStyle = '#a16207';
          ctx.fillRect(0, -4, 12, 8);

          // Carrot Body
          ctx.fillStyle = COLORS.CARROT_BODY;
          ctx.beginPath();
          ctx.moveTo(12, -carrotW/2);
          ctx.lineTo(12 + carrotLen, 0); // Tip
          ctx.lineTo(12, carrotW/2);
          ctx.fill();
          
          // Leaves near base
          ctx.fillStyle = COLORS.CARROT_LEAF;
          ctx.fillRect(6, -carrotW, 8, carrotW*2);
          
          ctx.restore();
      }
    };

    // Draw Move Target
    const player = state.entities.find(e => e.type === EntityType.PLAYER);
    if (player && player.moveTarget) {
       const tIso = toIso(player.moveTarget.x, player.moveTarget.y);
       ctx.strokeStyle = '#4ade80';
       ctx.lineWidth = 2;
       ctx.beginPath();
       ctx.ellipse(tIso.x, tIso.y, 10 + Math.sin(Date.now()/200)*3, 5 + Math.sin(Date.now()/200)*1.5, 0, 0, Math.PI*2);
       ctx.stroke();
    }
    
    // Render Map Floor
    const visibleRadius = 22; 
    const playerMapX = Math.floor(state.camera.x / TILE_SIZE);
    const playerMapY = Math.floor(state.camera.y / TILE_SIZE);

    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[0].length; x++) {
        if (Math.abs(x - playerMapX) > visibleRadius || Math.abs(y - playerMapY) > visibleRadius) continue;
        const tileType = state.map[y][x];
        if (tileType === TileType.VOID) continue;

        const wx = x * TILE_SIZE + TILE_SIZE/2;
        const wy = y * TILE_SIZE + TILE_SIZE/2;
        
        let col = COLORS.FLOOR;
        if(tileType === TileType.GATE_LOCKED) col = COLORS.GATE;
        if(tileType === TileType.ALTAR) col = COLORS.ALTAR;
        if(tileType === TileType.PRESSURE_PLATE) col = '#44403c';
        
        const isoX = wx - wy;
        const isoY = (wx + wy) * 0.5;
        
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(isoX, isoY - TILE_SIZE*0.5);
        ctx.lineTo(isoX + TILE_SIZE, isoY);
        ctx.lineTo(isoX, isoY + TILE_SIZE*0.5);
        ctx.lineTo(isoX - TILE_SIZE, isoY);
        ctx.fill();
        
        ctx.fillStyle = COLORS.FLOOR_SIDE;
        ctx.beginPath();
        ctx.moveTo(isoX + TILE_SIZE, isoY);
        ctx.lineTo(isoX + TILE_SIZE, isoY + 5);
        ctx.lineTo(isoX, isoY + TILE_SIZE*0.5 + 5);
        ctx.lineTo(isoX - TILE_SIZE, isoY + 5);
        ctx.lineTo(isoX - TILE_SIZE, isoY);
        ctx.lineTo(isoX, isoY + TILE_SIZE*0.5);
        ctx.fill();
      }
    }

    // Sort Walls and Entities
    const renderables: Array<{ type: 'ENTITY' | 'WALL', pos: Vector2, zIndex: number, obj?: any }> = [];
    state.entities.forEach(ent => {
       renderables.push({ type: 'ENTITY', pos: ent.pos, zIndex: ent.pos.x + ent.pos.y, obj: ent });
    });

    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[0].length; x++) {
        if (Math.abs(x - playerMapX) > visibleRadius || Math.abs(y - playerMapY) > visibleRadius) continue;
        const t = state.map[y][x];
        if (t === TileType.WALL || t === TileType.GATE_LOCKED || t === TileType.BREAKABLE_CRATE || t === TileType.BRAZIER) {
           const cx = x * TILE_SIZE + TILE_SIZE/2;
           const cy = y * TILE_SIZE + TILE_SIZE/2;
           renderables.push({ type: 'WALL', pos: { x: cx, y: cy }, zIndex: cx + cy, obj: { type: t, x, y } });
        }
      }
    }
    renderables.sort((a, b) => a.zIndex - b.zIndex);

    renderables.forEach(item => {
      if (item.type === 'WALL') {
         const h = TILE_SIZE;
         const x = item.pos.x;
         const y = item.pos.y;
         let cTop = COLORS.WALL_TOP;
         let cSide = COLORS.WALL;
         let cFront = COLORS.WALL_SIDE;
         if(item.obj.type === TileType.BRAZIER) { cTop='#fca5a5'; cSide='#b91c1c'; cFront='#991b1b'; }
         if(item.obj.type === TileType.BREAKABLE_CRATE) { cTop='#fbbf24'; cSide=COLORS.CRATE; cFront='#b45309'; }
         drawCube(x, y, 0, TILE_SIZE/2, TILE_SIZE/2, h, cTop, cSide, cFront);
         
         if(item.obj.type === TileType.BRAZIER) {
            ctx.fillStyle = COLORS.FIRE;
            const r = Math.random();
            const px = (x-y);
            const py = (x+y)*0.5 - h - 10;
            ctx.beginPath();
            ctx.arc(px, py - r*5, 4+r*4, 0, Math.PI*2);
            ctx.fill();
         }
      } else {
         if (item.obj.type === EntityType.PLAYER) {
            drawSpriteChar(item.obj);
         } else {
            drawVoxelChar(item.obj);
         }
      }
    });

    state.popups.forEach(pop => {
       const iso = toIso(pop.pos.x, pop.pos.y);
       ctx.fillStyle = pop.color;
       ctx.font = 'bold 20px "Cinzel", monospace';
       ctx.shadowColor = 'black';
       ctx.shadowBlur = 4;
       ctx.fillText(pop.text, iso.x - 10, iso.y - 60 - pop.offsetY);
       ctx.shadowBlur = 0;
    });
    
    ctx.restore();
  };

  const restartGame = () => window.location.reload();

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden cursor-crosshair font-sans select-none">
      <canvas ref={canvasRef} className="block" />
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
        <div className="w-64 h-8 bg-gray-900 border-4 border-gray-700 relative">
          <div className="h-full bg-red-600 transition-all duration-200" style={{ width: `${(hp / maxHp) * 100}%` }} />
          <span className="absolute inset-0 flex items-center justify-center text-sm text-white font-bold drop-shadow-md">HP {hp}/{maxHp}</span>
        </div>
        <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded border-2 border-gray-600">
                <PotionIcon />
                <span className="text-white font-bold text-xl">{inventory.potions}</span>
                <span className="text-gray-400 text-xs font-mono">(Q)</span>
            </div>
             {inventory.hasSeal && (
                <div className="flex items-center gap-2 bg-yellow-900/80 px-4 py-2 rounded border-2 border-yellow-500 animate-bounce">
                    <KeyIcon />
                    <span className="text-yellow-100 font-bold">SEAL</span>
                </div>
            )}
        </div>
      </div>
      {bossHp !== null && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-1/2 max-w-2xl pointer-events-none">
           <h3 className="text-red-500 text-center font-bold tracking-widest text-lg mb-2 uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">Crypt Warden</h3>
           <div className="w-full h-6 bg-gray-900 border-4 border-red-900 shadow-lg">
              <div className="h-full bg-red-600 transition-all duration-100" style={{ width: `${(bossHp / 150) * 100}%` }} />
           </div>
        </div>
      )}
      <div className="absolute bottom-4 left-4 text-white/70 text-sm pointer-events-none font-bold bg-black/50 p-2 rounded">
        <p>LEFT CLICK: Move</p>
        <p>E: Throw Carrot</p>
        <p>W: Giant Carrot Swing</p>
        <p>SPACE: Dodge Roll</p>
        <p>Q: Use Potion</p>
      </div>
      {gameStateStatus !== 'PLAYING' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center p-8 border-4 border-white bg-gray-800 shadow-2xl transform scale-110">
            <h1 className={`text-6xl font-bold mb-6 ${gameStateStatus === 'WON' ? 'text-yellow-400' : 'text-red-500'}`} style={{textShadow: '4px 4px 0px #000'}}>
              {gameStateStatus === 'WON' ? 'QUEST COMPLETE' : 'GAME OVER'}
            </h1>
            <p className="text-white text-xl mb-8 max-w-lg mx-auto font-mono">
              {gameStateStatus === 'WON' ? "You have escaped with the Warden's Seal!" : "The Crypt claims you..."}
            </p>
            <button onClick={restartGame} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 border-b-4 border-blue-800 text-white font-bold text-xl rounded transition-transform active:scale-95 shadow-lg">
              {gameStateStatus === 'WON' ? 'Play Again' : 'Try Again'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;