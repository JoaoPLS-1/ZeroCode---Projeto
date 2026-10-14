// engine/hud.js
// HUD com o progresso da investigação e o prompt de interação
// ("E — INVESTIGAR" / "E — CONVERSAR").

class HUD {
  constructor(rootEl, promptEl) {
    this.root = rootEl;
    this.root.innerHTML = `<img class="notebook-art" src="assets/hud/notebook.png" alt=""><div class="notebook-content"><small>PROTOCOLO ZERO</small><h2>Investigue o incidente</h2><p class="notebook-objective">Recupere os registros técnicos.</p><div class="notebook-progress" aria-label="Progresso dos registros"></div><div class="notebook-count"><span>⌕ PISTAS</span><b class="hud-found"></b></div><div class="notebook-count"><span>▤ REGISTROS</span><b class="hud-relevant"></b></div><span class="hud-false hidden"></span></div>`;
    this.foundEl = rootEl.querySelector('.hud-found');
    this.relevantEl = rootEl.querySelector('.hud-relevant');
    this.falseEl = rootEl.querySelector('.hud-false');
    this.promptEl = promptEl;
    this.memoryEl=document.createElement('div');this.memoryEl.className='notebook-memories';
    this.root.querySelector('.notebook-content').append(this.memoryEl);this.setLembrancas(0);
  }

  setLembrancas(count) { this.memoryEl.textContent='Lembranças '+count+'/5'; }

  update(clueState) {
    this.foundEl.textContent = `${clueState.found}/${clueState.total}`;
    this.relevantEl.textContent = `${clueState.relevant}/${clueState.relevantTarget}`;
    const progress=this.root.querySelector('.notebook-progress');
    progress.replaceChildren();
    for(let i=0;i<clueState.relevantTarget;i++){
      const dot=document.createElement('i');dot.className=i<clueState.relevant?'done':'';progress.append(dot);
    }
    progress.setAttribute('aria-label',`${clueState.relevant} de ${clueState.relevantTarget} registros recuperados`);
    this.root.querySelector('.notebook-objective').textContent=clueState.relevant>=clueState.relevantTarget?'Apresente a causa na reunião.':'Recupere os registros técnicos.';
    this.falseEl.textContent=clueState.falseFound?'Pista falsa identificada':'';
    this.falseEl.classList.toggle('hidden',!clueState.hasFalseClues || !clueState.falseFound);
  }

  showPrompt(container) {
    if (!container) {
      this.promptEl.classList.add('hidden');
      return;
    }
    const label = container.action === 'CONVERSAR' ? 'CONVERSAR' : container.action;
    this.promptEl.textContent = `E — ${label} · ${container.name}`;
    this.promptEl.classList.remove('hidden');
  }

  setVisible(visible) {
    this.root.classList.toggle('hidden', !visible);
  }
}

// Planta esquemática: as ligações seguem as portas reais e os obstáculos
// são projetados a partir de cada sala; não há salas fictícias.
class Minimap {
  constructor(rootEl, rooms) {
    this.root=rootEl;this.rooms=rooms;this.visited=new Set();
    this.root.classList.add('room-map');
    this.root.innerHTML='<div class="pixel-map-heading">MAPA <span class="map-location"></span><button class="map-hide" type="button" aria-label="Esconder mapa" title="Esconder mapa">−</button></div><button class="map-expand" type="button" aria-label="Ampliar mapa" aria-expanded="false"><canvas width="600" height="507" aria-label="Planta da empresa e posição do jogador" role="img"></canvas></button><div class="pixel-map-legend"><i></i> VOCÊ <span>M · AMPLIAR</span></div>';
    this.canvas=this.root.querySelector('canvas');this.ctx=this.canvas.getContext('2d');
    this.layout={room_manager:{x:0,y:0,w:300,h:169},room_secret:{x:300,y:0,w:300,h:169},room_meeting:{x:0,y:169,w:300,h:169},room_cafe:{x:300,y:169,w:300,h:169},room_qa_infra:{x:0,y:338,w:300,h:169},room_dev:{x:300,y:338,w:300,h:169}};
    this.backgrounds={};
    for(const [id,room] of Object.entries(rooms)){
      const img=new Image();this.backgrounds[id]=img;
      img.onload=()=>this.draw(this.lastPlayer);
      img.src=room.minimapBackground||room.background;
    }
    this.toggleButton=document.createElement('button');
    this.toggleButton.type='button';this.toggleButton.id='map-visibility-toggle';this.toggleButton.className='hidden';
    this.toggleButton.textContent='MAPA';this.toggleButton.setAttribute('aria-controls',this.root.id);
    this.toggleButton.setAttribute('aria-expanded','true');this.toggleButton.setAttribute('aria-label','Esconder mapa');
    this.root.after(this.toggleButton);
    this.toggleButton.onclick=()=>this.toggleVisibility();
    this.root.querySelector('.map-hide').onclick=()=>{this.toggleVisibility();this.toggleButton.focus();};
    this.root.querySelector('.map-expand').onclick=()=>this.toggle();
    this.enabled=false;this.collapsed=false;
  }
  toggleVisibility(){
    this.collapsed=!this.collapsed;
    this.setVisible(this.enabled);
  }
  toggle(){
    if(this.collapsed){this.collapsed=false;this.setVisible(this.enabled);return;}
    const open=this.root.classList.toggle('expanded');
    const button=this.root.querySelector('.map-expand');
    button.setAttribute('aria-expanded',String(open));
    button.setAttribute('aria-label',open?'Reduzir mapa':'Ampliar mapa');
    this.root.querySelector('.pixel-map-legend span').textContent=open?'M · REDUZIR':'M · AMPLIAR';
  }

  update(currentRoomId, visitedRooms){this.current=currentRoomId;this.visited=new Set(visitedRooms);this.root.querySelector('.map-location').textContent=this.rooms[currentRoomId]?.name||'';this.draw();}
  project(id,x,y){
    const r=this.layout[id],room=this.rooms[id];
    return {x:r.x+x/room.width*r.w,y:r.y+y/room.height*r.h};
  }
  draw(player){
    if(player)this.lastPlayer=player;
    player=player||this.lastPlayer;
    const c=this.ctx;c.imageSmoothingEnabled=false;c.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.doorMarkers=[];
    for(const [id,r] of Object.entries(this.layout)){
      const room=this.rooms[id],active=id===this.current,img=this.backgrounds[id];
      c.fillStyle='#171d22';c.fillRect(r.x,r.y,r.w,r.h);
      if(img?.complete&&img.naturalWidth)c.drawImage(img,r.x,r.y,r.w,r.h);
      c.fillStyle=active?'rgba(9,13,18,.25)':'rgba(9,13,18,.55)';c.fillRect(r.x,r.y,r.w,r.h);
      c.strokeStyle=active?'#98acb5':'#39424a';c.lineWidth=active?2:1;c.strokeRect(r.x+1,r.y+1,r.w-2,r.h-2);
      // As portas e o jogador usam a mesma projeção do fundo completo.
      for(const d of room.doors||[]){
        const q=this.project(id,d.x+d.width/2,d.y+d.height/2);
        const w=Math.max(6,d.width/room.width*r.w),h=Math.max(6,d.height/room.height*r.h);
        this.doorMarkers.push({...q,id:d.id,roomId:id});
        c.fillStyle='#071116b3';c.fillRect(q.x-w/2,q.y-h/2,w,h);
        c.strokeStyle='#a9dce0';c.lineWidth=1.5;c.strokeRect(q.x-w/2,q.y-h/2,w,h);
      }
      c.font='14px monospace';const label=id==='room_qa_infra'?'QA / INFRA':room.name.toUpperCase();
      c.fillStyle='#11181cdb';c.fillRect(r.x+5,r.y+5,c.measureText(label).width+10,20);
      c.fillStyle='#e0e7e9';c.fillText(label,r.x+10,r.y+20);
      if(active&&player){
        const {x,y}=this.project(id,player.centerX,player.centerY);this.marker={x,y,roomId:id};
        const angles={up:-Math.PI/2,down:Math.PI/2,left:Math.PI,right:0,'up-left':-Math.PI*3/4,'up-right':-Math.PI/4,'down-left':Math.PI*3/4,'down-right':Math.PI/4};
        c.save();c.translate(x,y);c.rotate(angles[player.facing]??0);c.fillStyle='#071116e8';c.beginPath();c.arc(0,0,15,0,Math.PI*2);c.fill();c.strokeStyle='#f6faff';c.lineWidth=3;c.stroke();c.fillStyle='#64fff0';c.strokeStyle='#051014';c.lineWidth=2;c.beginPath();c.moveTo(12,0);c.lineTo(-8,-9);c.lineTo(-4,0);c.lineTo(-8,9);c.closePath();c.fill();c.stroke();c.restore();
      }
    }
  }
  setVisible(visible){
    this.enabled=visible;
    this.root.classList.toggle('hidden',!visible||this.collapsed);
    this.toggleButton.classList.toggle('hidden',!visible);
    this.toggleButton.setAttribute('aria-expanded',String(!this.collapsed));
    this.toggleButton.setAttribute('aria-label',this.collapsed?'Mostrar mapa':'Esconder mapa');
    this.toggleButton.textContent=this.collapsed?'▧ MOSTRAR MAPA':'▧ ESCONDER MAPA';
  }
}

if (typeof module !== 'undefined') module.exports = { HUD, Minimap };
