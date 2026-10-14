// engine/player.js
// Player como sprite independente do background. A hitbox (colisão/
// movimento/interação) é menor e fica na região dos pés; o sprite PNG
// visual é desenhado por cima, com proporções preservadas e alinhado aos pés.

const PLAYER_SPRITE_PATHS = {
  down: 'assets/player/main/down.png',
  up: 'assets/player/main/up.png',
  left: 'assets/player/main/left.png',
  right: 'assets/player/main/right.png',
};

const PLAYER_SPRITES = {};
const PLAYER_ANIMATIONS = {};
const PLAYER_IDLE_ANIMATION = new Image();

const STANDING_FRAMES = {
  'down': 0,
  'up': 0,
  'left': 0,
  'right': 0,
  'down-left': 0,
  'down-right': 0,
  'up-left': 0,
  'up-right': 0,
};

// Measure opaque artwork once, not on every render. Generated poses have
// different transparent margins; anchoring the whole cell makes feet slide.
function measurePlayerFrames(image, rows) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d', {willReadFrequently:true});
  context.drawImage(image,0,0);
  const pixels = context.getImageData(0,0,canvas.width,canvas.height).data;
  const cw = canvas.width/4, ch = canvas.height/rows;
  image.frames = Array.from({length:4*rows},(_,frame)=>{
    const ox = Math.round(frame%4*cw), oy = Math.round(Math.floor(frame/4)*ch);
    const width=Math.round((frame%4+1)*cw)-ox;
    const height=Math.round((Math.floor(frame/4)+1)*ch)-oy;
    let left=width,top=height,right=0,bottom=0;
    for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
      if(pixels[((oy+y)*canvas.width+ox+x)*4+3]<180)continue;
      left=Math.min(left,x);right=Math.max(right,x);
      top=Math.min(top,y);bottom=Math.max(bottom,y);
    }
    if(right<=left||bottom<=top)return {x:ox,y:oy,w:width,h:height,anchorX:width/2};
    // Anchor to the head, not to swinging arms or the widest foot.
    let sum=0,count=0;
    for(let y=top+Math.round((bottom-top)*.10);y<top+Math.round((bottom-top)*.28);y++){
      let a=width,b=-1;
      for(let x=left;x<=right;x++)if(pixels[((oy+y)*canvas.width+ox+x)*4+3]>=180){a=Math.min(a,x);b=x;}
      if(b>=a){sum+=(a+b)/2;count++;}
    }
    return {x:ox+left,y:oy+top,w:right-left+1,h:bottom-top+1,anchorX:(count?sum/count:(left+right)/2)-left};
  });
  // One scale for the entire cycle: no stretching between footsteps.
  const heights=image.frames.map(f=>f.h).sort((a,b)=>a-b);
  image.referenceHeight=heights[Math.floor(heights.length/2)];
}
PLAYER_IDLE_ANIMATION.onload=()=>{try { measurePlayerFrames(PLAYER_IDLE_ANIMATION,2); } catch { /* atlas still renders without crop */ }};
PLAYER_IDLE_ANIMATION.src='assets/player/main/idle8-front.png';
for (const direction of ['down','up','left','right','down-left','down-right','up-left','up-right']) {
  const walk = new Image(), idle = new Image();
  const diagonal = direction.includes('-');
  const rows = diagonal || direction === 'left' ? 1 : 2;
  walk.onload=()=>{try {measurePlayerFrames(walk,rows);} catch { /* File previews may restrict canvas reads. */ }};
  idle.onload=()=>{try {measurePlayerFrames(idle,1);} catch { /* Keep the uncropped sprite as fallback. */ }};
  walk.src = rows === 1 ? `assets/player/main/walk-${direction === 'up-right' ? 'up-left' : direction}.png` : `assets/player/main/walk8-${direction}.png`;
  idle.src = `assets/player/main/walk-${direction === 'up-right' ? 'up-left' : direction}.png`;
  PLAYER_ANIMATIONS[direction] = {walk, idle, rows, sequence:diagonal?[0,1,2,3,2,1]:direction==='left'?[1,2,3,0]:[0,1,2,3,4,5,6,7], mirrored: direction === 'up-right'};
}
for (const dir in PLAYER_SPRITE_PATHS) {
  const img = new Image();
  img.src = PLAYER_SPRITE_PATHS[dir];
  PLAYER_SPRITES[dir] = img;
}

class Player {
  constructor(x, y) {
    // Hitbox: usada para colisão, movimento e distância de interação.
    this.width = 28;
    this.height = 18;
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
    this.speed = 220; // px/s no espaço do mapa
    this.facing = 'down';
    this.walkDistance = 0;
    this.idleTime = 0;
    this.moving = false;

    // Sprite visual (não usado para colisão).
    this.spriteWidth = 52;
    this.spriteHeight = 78;
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  get centerY() {
    return this.y + this.height / 2;
  }

  get feetX() {
    return this.x + this.width / 2;
  }

  get feetY() {
    return this.y + this.height;
  }

  get rect() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  setPosition(centerX, centerY) {
    this.x = centerX - this.width / 2;
    this.y = centerY - this.height / 2;
  }

  update(dt, moveVec, collisionSystem) {
    this.moving = false;
    if (moveVec.x !== 0 || moveVec.y !== 0) {
      const len = Math.hypot(moveVec.x, moveVec.y) || 1;
      const dx = (moveVec.x / len) * this.speed * dt;
      const dy = (moveVec.y / len) * this.speed * dt;

      if (moveVec.x && moveVec.y) {
        this.facing = `${moveVec.y > 0 ? 'down' : 'up'}-${moveVec.x > 0 ? 'right' : 'left'}`;
      } else if (Math.abs(moveVec.x) > Math.abs(moveVec.y)) {
        this.facing = moveVec.x > 0 ? 'right' : 'left';
      } else if (moveVec.y !== 0) {
        this.facing = moveVec.y > 0 ? 'down' : 'up';
      }

      const resolved = collisionSystem.resolveMove(this.rect, dx, dy);
      const distance = Math.hypot(resolved.x-this.x, resolved.y-this.y);
      this.moving = distance > 0.01;
      // Face actual travel when collision makes a diagonal input slide on a wall.
      const actualX=resolved.x-this.x, actualY=resolved.y-this.y;
      if(this.moving){
        if(Math.abs(actualX)<0.01)this.facing=actualY>0?'down':'up';
        else if(Math.abs(actualY)<0.01)this.facing=actualX>0?'right':'left';
      }
      if (this.moving) this.walkDistance = (this.walkDistance + distance) % 160;
      this.x = resolved.x;
      this.y = resolved.y;
    }
    if (!this.moving) {
      this.idleTime += dt;
    } else this.idleTime = 0;
  }

  // screenX/screenY = posição da hitbox (pés) na tela.
  draw(ctx, screenX, screenY) {
    const animation = PLAYER_ANIMATIONS[this.facing];
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasIdleAtlas = !this.moving && this.facing === 'down' && PLAYER_IDLE_ANIMATION.complete && PLAYER_IDLE_ANIMATION.naturalWidth > 0;

    // walk8-*.png = 8-frame walk cycle (4 cols × 2 rows) — used while moving
    // walk-*.png  = 4-frame idle/standing sheet (4 cols × 1 row) — used while stopped
    const useWalk = this.moving && animation && animation.walk.complete && animation.walk.naturalWidth > 0;
    const useIdle = !this.moving && !hasIdleAtlas && animation && animation.idle.complete && animation.idle.naturalWidth > 0;
    const sheet = hasIdleAtlas ? PLAYER_IDLE_ANIMATION : useWalk ? animation.walk : useIdle ? animation.idle : null;
    const sheetRows = hasIdleAtlas ? 2 : useWalk ? animation.rows : 1;

    const feetX = screenX + this.width / 2;
    const feetY = screenY + this.height - 3;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Sombra de contato suave e alinhada com os pés
    const shadow = ctx.createRadialGradient(feetX, feetY, 2, feetX, feetY, 34);
    shadow.addColorStop(0, 'rgba(4, 12, 19, 0.45)');
    shadow.addColorStop(1, 'rgba(4, 12, 19, 0)');
    ctx.fillStyle = shadow;
    ctx.beginPath(); ctx.ellipse(feetX, feetY, 34, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(192, 223, 213, 0.50)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(feetX, feetY, 26, 8, 0, 0, Math.PI * 2); ctx.stroke();

    if (sheet && sheet.complete && sheet.naturalWidth > 0) {
      let frame = 0;
      if (this.moving) {
        const sequence=animation.sequence;
        frame=sequence[Math.floor(this.walkDistance/(160/sequence.length))%sequence.length];
      } else if (hasIdleAtlas) {
        if (!reduced) {
          const cycle = this.idleTime % 6.0;
          if (cycle < 3.6) {
            const breathStep = Math.floor(cycle / 0.45) % 4;
            const breathFrames = [0, 1, 2, 1];
            frame = breathFrames[breathStep];
          } else {
            frame = Math.min(7, 3 + Math.floor((cycle - 3.6) / 0.48));
          }
        } else {
          frame = 0;
        }
      } else {
        // Idle in non-down directions: frame 0 of walk-*.png (standing pose)
        frame = 0;
      }

      const cols = 4;
      const cellWidth = sheet.naturalWidth / cols;
      const cellHeight = sheet.naturalHeight / sheetRows;
      const crop = sheet.frames?.[frame] || {
        x: (frame % cols) * cellWidth,
        y: Math.floor(frame / cols) * cellHeight,
        w: cellWidth,
        h: cellHeight
      };

      const breath = (!reduced && !this.moving && !hasIdleAtlas)
        ? Math.sin(this.idleTime * 2.5) * 0.008
        : 0;

      const baseHeight = 125;
      const scale=baseHeight/(sheet.referenceHeight||crop.h);
      const drawHeight=crop.h*scale*(1+breath);
      const drawWidth=crop.w*scale;
      const anchorX=(crop.anchorX??crop.w/2)*scale;

      ctx.save();
      ctx.translate(feetX, feetY);
      if (!hasIdleAtlas && animation && animation.mirrored) ctx.scale(-1, 1);
      ctx.drawImage(sheet, crop.x, crop.y, crop.w, crop.h, -anchorX, -drawHeight, drawWidth, drawHeight);
      ctx.restore();
    } else {
      const dirKey = this.facing ? this.facing.split('-')[0] : 'down';
      const fallbackImg = PLAYER_SPRITES[dirKey];
      if (fallbackImg && fallbackImg.complete && fallbackImg.naturalWidth > 0) {
        const h = 125;
        const w = h * fallbackImg.naturalWidth / fallbackImg.naturalHeight;
        ctx.save();
        ctx.translate(feetX, feetY);
        ctx.drawImage(fallbackImg, -w / 2, -h, w, h);
        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(124, 249, 255, 0.55)';
        ctx.fillRect(feetX - 35, feetY - 125, 70, 125);
      }
    }
    ctx.restore();
  }
}

if (typeof module !== 'undefined') module.exports = Player;
