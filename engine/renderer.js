// engine/renderer.js
// Desenha o background (imagem única do mapa), os destaques neon dos
// containers em alcance, e o player. Não usa sprites individuais de
// mesas/computadores para montar o cenário.

const HIGHLIGHT_COLORS = {
  red: '#ff2d55',
  green: '#3dff8a',
  blue: '#2fd0ff',
  yellow: '#ffd23d',
  purple: '#b56cff',
};

// Gentle idle motion, with a stable phase per character (no synchronized crowd).
function npcIdlePose(id, seconds, reducedMotion) {
  if (reducedMotion) return {stretch:1, sway:0};
  const seed=Array.from(id).reduce((hash,char)=>(hash*31+char.charCodeAt(0))>>>0,0);
  const phase=(seed%628)/100;
  const breath=Math.sin(seconds*(1.35+(seed%7)*0.07)+phase);
  return {
    stretch:1+breath*0.008,
    sway:Math.sin(seconds*0.75+phase)*0.009,
  };
}

class Renderer {
  constructor(canvas, map) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.backgrounds = new Map();
    this.npcSprites = new Map();
    this.npcIdleSprites = new Map();
    this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.setMap(map);
  }

  setMap(map) {
    this.map = map;
    this.currentBackground = this.preloadMap(map);
  }

  preloadNpcs(npcs) {
    for(const npc of npcs){
      const image=new Image();image.src=npc.sprite;this.npcSprites.set(npc.id,image);
      const idle=new Image();
      idle.onload=()=>{try {measurePlayerFrames(idle,2);} catch { /* Use original if frame data is unavailable. */ }};
      idle.src=npc.sprite.replace('assets/npcs/','assets/npcs/idle/');this.npcIdleSprites.set(npc.id,idle);
    }
  }

  drawNpc(npc, camera, player, near, seconds=0) {
    const image=this.npcSprites.get(npc.id);
    if(!image?.complete || !image.naturalWidth)return;
    const idle=this.npcIdleSprites.get(npc.id);
    const seed=Array.from(npc.id).reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0);
    const cycle=16+seed%11;
    const time=(seconds+seed%9)%cycle;
    const gesture=time-(cycle-2.8);
    // The generated Steve atlas does not match his original skin.
    const animated=npc.id!=='npc_infra' && !near && !this.motionPreference.matches && gesture>=0 && idle?.frames;
    const p=camera.worldToScreen(npc.feetX,npc.feetY),ctx=this.ctx;
    const facing=near&&Math.abs(player.centerX-npc.feetX)>18 ? (player.centerX<npc.feetX?'left':'right') : npc.facing;
    ctx.save();ctx.translate(p.x,p.y);
    ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(0,0,26,7,0,0,Math.PI*2);ctx.fill();
    ctx.scale(facing==='left'?-1:1,1);
    const h=125;
    const hasIdle = npc.id !== 'npc_infra' && idle?.frames && idle.frames.length > 0;
    if(hasIdle) {
      const frame = animated ? Math.min(7, Math.floor(gesture/0.35)) : 0;
      const crop = idle.frames[frame], base = idle.frames[0];
      const scale = h / base.h;
      const w = crop.w * scale, drawHeight = crop.h * scale;
      ctx.drawImage(idle, crop.x, crop.y, crop.w, crop.h, -w / 2, -drawHeight, w, drawHeight);
    } else {
      const w=h*image.naturalWidth/image.naturalHeight;
      ctx.drawImage(image,-w/2,-h,w,h);
    }
    ctx.restore();
  }

  preloadMap(map) {
    if (!this.backgrounds.has(map.background)) {
      const record = { image: new Image(), loaded: false, failed: false };
      record.image.onload = () => {
        record.loaded = true;
      };
      record.image.onerror = () => { record.failed = true; };
      record.image.src = map.background;
      this.backgrounds.set(map.background, record);
    }
    return this.backgrounds.get(map.background);
  }

  clear() {
    const ctx = this.ctx;
    // Desenho em coordenadas do mundo, com resolução física independente.
    ctx.setTransform(this.canvas.width / this.map.width, 0, 0,
      this.canvas.height / this.map.height, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, this.map.width, this.map.height);
  }

  _prepareBackground(image) {
    // Tratamento calculado uma vez por sala, nunca a cada frame.
    // Reduz o ruído fino sem desfocar personagens ou interface.
    const surface = document.createElement('canvas');
    surface.width = image.naturalWidth;
    surface.height = image.naturalHeight;
    const ctx = surface.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.filter = 'saturate(0.68) contrast(0.90) brightness(1.16) blur(0.55px)';
    ctx.drawImage(image, 0, 0);
    ctx.filter = 'none';

    // Luz ambiente difusa: sombras azul-acinzentadas e pontos quentes suaves.
    ctx.fillStyle = 'rgba(39, 57, 67, 0.10)';
    ctx.fillRect(0, 0, surface.width, surface.height);
    const light = ctx.createRadialGradient(820, 400, 40, 820, 450, 850);
    light.addColorStop(0, 'rgba(182, 198, 192, 0.10)');
    light.addColorStop(0.65, 'rgba(89, 119, 129, 0.025)');
    light.addColorStop(1, 'rgba(8, 18, 27, 0.18)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, surface.width, surface.height);
    return surface;
  }

  drawBackground(camera) {
    const ctx = this.ctx;
    const background = this.currentBackground;
    if (background && background.loaded) {
      ctx.drawImage(
        background.image,
        camera.x,
        camera.y,
        camera.viewportWidth,
        camera.viewportHeight,
        0,
        0,
        camera.viewportWidth,
        camera.viewportHeight
      );
    } else {
      // Fallback visual: o jogo não deve quebrar caso a imagem ainda
      // não esteja disponível em assets/backgrounds/fase1/sala-dev.png
      this._drawFallbackBackground(camera);
    }
  }

  _drawFallbackBackground(camera) {
    const ctx = this.ctx;
    const { viewportWidth: vw, viewportHeight: vh } = camera;

    const grad = ctx.createLinearGradient(0, 0, 0, vh);
    grad.addColorStop(0, '#0d1023');
    grad.addColorStop(1, '#1a1030');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, vw, vh);

    ctx.strokeStyle = 'rgba(124, 249, 255, 0.15)';
    ctx.lineWidth = 1;
    const step = 64;
    for (let x = -((camera.x) % step); x < vw; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, vh);
      ctx.stroke();
    }
    for (let y = -((camera.y) % step); y < vh; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(vw, y);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '14px monospace';
    ctx.fillText(
      `Aguardando ${this.map.background}`,
      20,
      24
    );
  }

  drawHighlight(container, camera, isHighlighted) {
    if (!isHighlighted) return;
    const ctx = this.ctx;
    const screen = camera.worldToScreen(container.x, container.y);
    ctx.save();
    // Cantos discretos indicam o alvo sem contornar todo o mobiliário.
    ctx.strokeStyle = 'rgba(199, 222, 218, 0.52)';
    ctx.lineWidth = 1.5;
    const x = screen.x - 5, y = screen.y - 5;
    const w = container.width + 10, h = container.height + 10, arm = 12;
    ctx.beginPath();
    for (const [cx, cy, sx, sy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]]) {
      ctx.moveTo(cx + arm * sx, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + arm * sy);
    }
    ctx.stroke();
    ctx.restore();
  }

  drawDebugContainer(container, camera) {
    // Útil durante desenvolvimento para conferir alinhamento dos
    // containers com o background. Desligado por padrão (ver game.js).
    const ctx = this.ctx;
    const screen = camera.worldToScreen(container.x, container.y);
    const color = HIGHLIGHT_COLORS[container.color] || '#7cf9ff';
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    ctx.strokeRect(screen.x, screen.y, container.width, container.height);
    ctx.restore();
  }

  drawPlayer(player, camera) {
    const screen = camera.worldToScreen(player.x, player.y);
    player.draw(this.ctx, screen.x, screen.y);
  }
}

if (typeof module !== 'undefined') module.exports = Renderer;

