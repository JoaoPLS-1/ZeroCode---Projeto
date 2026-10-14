// Desafios de leitura técnica. A evidência só é concedida após a análise.
const CHALLENGES = [
 ['computer_dev_left','commit 7f2 / retry.js\n− if (attempt >= 3) return fail();\n+ if (status === 503) return send(job);','Qual proteção desapareceu?',['Criptografia','Limite de tentativas','Validação de usuário'],1,'Observe a condição removida: attempt >= 3.'],
 ['computer_dev_right','02:13:59 external_rps = 120\n02:14:00 deploy v2.1 OK\n02:14:03 retries = 512\n02:14:05 external_rps = 120','O que antecedeu as falhas?',['Deploy 2.1','Aumento de clientes','Queda de energia'],0,'Compare o horário do deploy ao dos retries.'],
 ['computer_qa_upper','PASS response_200\nPASS valid_payload\nSKIP response_503\nSKIP retry_limit','Que cenário falta testar?',['Cor da interface','Apenas respostas 200','Falha 503 com limite de retries'],2,'SKIP significa que o cenário não foi executado.'],
 ['computer_qa_infra_lower','trace_id: NX-204\nexternal_requests: 1\ninternal_attempts: 4096\nretry_delay_ms: 0','O que o registro demonstra?',['4.096 clientes','Repetição interna sem espera','Uma operação normal'],1,'Existe uma única requisição externa.'],
 ['computer_infra_upper','unknown_sources: 0\nexternal_traffic: baseline\ncpu_before_deploy: 23%\nqueue_after_deploy: +4096%','Qual hipótese perde força?',['Ataque externo','Retry defeituoso','Regressão no deploy'],0,'Não há origens desconhecidas nem crescimento do tráfego externo.']
];
class CaseExperience {
 constructor(g) {
  this.g=g;this.seconds=0;this.errors=0;this.hypothesisErrors=0;this.solved=new Set();
  this.panel=document.createElement('section');this.panel.id='case-panel';this.panel.className='hidden';this.panel.setAttribute('role','dialog');this.panel.setAttribute('aria-modal','true');
  this.bar=document.createElement('div');this.bar.id='case-bar';this.bar.className='hidden';
  this.bar.innerHTML=`<div class="case-status-copy"><strong></strong></div>
    <button class="hud-menu-toggle" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="hud-menu"><span aria-hidden="true">☰</span></button>
    <nav id="hud-menu" class="cyber-hud-panel" aria-label="Menu do jogo" hidden>
      <button class="hud-image-button dossier-button" type="button"><img src="assets/hud/dossier.png" alt=""><span>DOSSIÊ<small>Casos e pistas · J</small></span></button>
      <button class="hud-image-button settings-button" type="button"><img src="assets/hud/settings.png" alt=""><span>CONFIGURAÇÕES<small>Pausa · Esc</small></span></button>
    </nav>`;
  document.getElementById('game-container').append(this.panel,this.bar);
  this.menuToggle=this.bar.querySelector('.hud-menu-toggle');
  this.menu=this.bar.querySelector('#hud-menu');
  this.menuToggle.onclick=()=>{if(this.available())this.setMenuOpen(this.menu.hidden);};
  this.bar.querySelector('.dossier-button').onclick=()=>{this.setMenuOpen(false);this.menuToggle.focus();this.journal();};
  this.bar.querySelector('.settings-button').onclick=()=>{this.setMenuOpen(false);this.menuToggle.focus();this.pause();};
  document.addEventListener('pointerdown',e=>{if(!this.bar.contains(e.target))this.setMenuOpen(false);});
 }
 setMenuOpen(open){
  this.menu.hidden=!open;
  this.menuToggle.setAttribute('aria-expanded',String(open));
  this.menuToggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');

 }
 available(){return this.g.state==='playing'&&!this.g.dialogue.active&&!this.g.mission.active;}
 show(title,sub){
  this.panel.classList.remove('pc-mode');
  this.focus=document.activeElement;this.g.state='case';this.g.hud.showPrompt(null);
  this.panel.innerHTML='<div class="case-window"><div class="case-heading"><div><span class="eyebrow"></span><h2></h2></div><button aria-label="Fechar">ESC / ×</button></div><div class="case-content"></div></div>';
  this.panel.querySelector('h2').textContent=title;this.panel.querySelector('.eyebrow').textContent=sub;
  this.panel.querySelector('button').onclick=()=>this.close();this.panel.classList.remove('hidden');this.panel.querySelector('button').focus();
  return this.panel.querySelector('.case-content');
 }
 close(){this.panel.classList.add('hidden');this.panel.classList.remove('pc-mode');this.g.state='playing';this.g._lockInteractions();this.focus?.focus();}
 desktop(c){
  this.focus=document.activeElement;this.g.state='case';this.g.hud.showPrompt(null);
  this.panel.classList.add('pc-mode');
  this.panel.innerHTML=`<div class="pc-desktop">
   <div class="pc-brand"><img class="pc-logo" src="assets/zeroos/imported/1.png" alt="" /><div>ZeroOS<span>Seu espaço. Suas ideias.</span></div></div>
   <div class="zero-wallpaper" aria-hidden="true"><img src="assets/zeroos/imported/1.png" alt="" /><strong>Zero<span>OS</span></strong><small>Um novo jeito de conectar ideias.</small></div>
   <nav class="zero-launchers" aria-label="Aplicativos"><button class="pc-shortcut" aria-label="Abrir ZeroTrace"><img src="assets/zeroos/imported/2.png" alt="" />ZeroTrace<small>ANÁLISE</small></button><button class="zero-vault"><img src="assets/zeroos/imported/4.png" alt="" />ZeroVault<small>EVIDÊNCIAS</small></button><button class="zero-link"><img src="assets/zeroos/imported/3.png" alt="" />ZeroLink<small>ESTAÇÃO</small></button></nav>
   <div class="pc-window">
    <header class="pc-titlebar"><span><img src="assets/zeroos/imported/2.png" alt="" /> ZeroTrace <span class="zero-accent">· Registros</span></span><div><button class="pc-min" aria-label="Minimizar">−</button><button class="pc-max" aria-label="Maximizar">□</button><button class="pc-close" aria-label="Fechar janela">×</button></div></header>
    <div class="pc-toolbar"><span>Documentos da investigação</span><span class="pc-readonly">● Somente leitura</span></div>
    <div class="pc-address">Este computador <span>› Registros ›</span> <strong></strong></div>
    <div class="pc-workspace"><aside><small>BIBLIOTECA</small><div class="selected">Registros técnicos</div><div>Análise do incidente</div><footer>ZeroOS 1.0<br><span>Área de trabalho</span></footer></aside><main class="case-content"></main></div>
    <div class="pc-status">● Conectado à rede local <span>Documento disponível</span></div>
   </div>
   <div class="pc-start hidden"><strong>Bem-vindo ao ZeroOS</strong><p>Seus aplicativos, sempre por perto.</p><button class="pc-launch">Abrir ZeroTrace</button><button class="pc-exit">Sair do computador</button></div>
   <section class="zero-info hidden" aria-label="Informações do sistema"><button class="zero-info-close" aria-label="Fechar informações">×</button><h2></h2><div></div></section>
   <footer class="pc-taskbar"><button class="pc-start-button" aria-label="Abrir aplicativos ZeroOS" aria-expanded="false"><img src="assets/zeroos/imported/1.png" alt="" /> Aplicativos</button><button class="pc-task" aria-label="Restaurar ZeroTrace"><img src="assets/zeroos/imported/2.png" alt="" /><span>ZeroTrace</span></button><span class="pc-session"></span><button class="pc-disconnect">Sair · Esc</button><time></time></footer>
  </div>`;
  const find=s=>this.panel.querySelector(s),win=find('.pc-window'),menu=find('.pc-start');
  find('.pc-address strong').textContent=c.name;
  find('.pc-session').textContent=c.name;
  const now=new Date();find('time').textContent=now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+' · '+now.toLocaleDateString('pt-BR');
  const restore=()=>{win.classList.remove('hidden');menu.classList.add('hidden');find('.pc-start-button').setAttribute('aria-expanded','false');find('.pc-min').focus();};
  find('.pc-min').onclick=()=>{win.classList.add('hidden');find('.pc-task').focus();};
  find('.pc-close').onclick=find('.pc-min').onclick;
  find('.pc-max').onclick=()=>{win.classList.toggle('maximized');};
  find('.pc-titlebar').ondblclick=()=>win.classList.toggle('maximized');
  find('.pc-shortcut').onclick=restore;find('.pc-task').onclick=restore;find('.pc-launch').onclick=restore;
  find('.pc-start-button').onclick=()=>{menu.classList.toggle('hidden');find('.pc-start-button').setAttribute('aria-expanded',String(!menu.classList.contains('hidden')));};
  find('.pc-exit').onclick=()=>this.close();find('.pc-disconnect').onclick=()=>this.close();
  const info=find('.zero-info');
  find('.zero-info-close').onclick=()=>{info.classList.add('hidden');find('.zero-vault').focus();};
  find('.zero-vault').onclick=()=>{
   info.classList.remove('hidden');find('.zero-info h2').textContent='ZeroVault / Evidências';
   const body=find('.zero-info div');body.textContent='';
   const found=Object.values(this.g.cluesData||{}).filter(clue=>this.g.clues.hasClue(clue.id));
   if(!found.length)body.textContent='Nenhuma evidência recuperada. Analise os registros no ZeroTrace.';
   for(const clue of found){const p=document.createElement('p');p.textContent='✓ '+clue.title;body.append(p);}
   find('.zero-info-close').focus();
  };
  find('.zero-link').onclick=()=>{info.classList.remove('hidden');find('.zero-info h2').textContent='ZeroLink / Estação';find('.zero-info div').textContent=c.name+' — conexão local ativa. ZeroOS 1.0 / acesso de investigação em modo somente leitura.';find('.zero-info-close').focus();};
  this.panel.classList.remove('hidden');find('.pc-min').focus();
  return find('.case-content');
 }
 pause(){if(!this.available())return;
  this.focus=document.activeElement;this.g.state='case';this.g.hud.showPrompt(null);
  const mins=Math.floor(this.seconds/60);const secs=Math.floor(this.seconds%60);
  const timeStr='00:'+String(mins).padStart(2,'0')+':'+String(secs).padStart(2,'0');
  const evCount=this.g.clues.found.size;const evTotal=Object.keys(this.g.cluesData||{}).length;
  const relCount=this.g.clues.getRelevantCount();
  const roomName=this.g.map?.name||'—';
  const roomOrder=this.g.map?.mapOrder||1;
  const objective=relCount<5?'Recupere os registros técnicos':'Apresente a causa na Reunião';
  this.panel.classList.remove('pc-mode');
  const icon=(kind)=>{const paths={resume:'<path d="M8 4l15 12L8 28z" fill="currentColor"/>',journal:'<path d="M3 10h26v17H3zM3 10V6h10l4 4"/>',controls:'<path d="M2 6h28v21H2zM6 11h3m3 0h3m3 0h3m3 0h3M6 16h3m3 0h3m3 0h3m3 0h3M7 22h18"/>',quit:'<path d="M16 2v14M9 6a12 12 0 1014 0"/>',record:'<path d="M7 3h13l6 6v20H7zM19 3v8h7M11 16h11M11 21h11M11 25h8"/>',search:'<circle cx="13" cy="13" r="9"/><path d="M20 20l9 9"/>',time:'<circle cx="16" cy="16" r="13"/><path d="M16 7v10l7 4"/>'};return '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">'+paths[kind]+'</svg>';};
  this.panel.innerHTML=`<div class="daniel-pause" role="dialog" aria-modal="true" aria-label="Menu de pausa"><div class="dp-frame"><div class="dp-grid"><section class="dp-left"><img class="dp-computer" src="assets/hud/pause-computer.png" alt="Computador em pixel art pausado"><h2>PAUSADO</h2><nav class="dp-nav">${[['resume','CONTINUAR'],['journal','DOSSIÊ'],['controls','CONTROLES'],['quit','SAIR PARA O INÍCIO']].map(([action,label])=>`<button class="pause-nav-btn" data-action="${action}">${icon(action)}<span>${label}</span></button>`).join('')}</nav></section><section class="dp-right pause-info-panel"><small>LOCAL ATUAL</small><h3>${roomName}</h3><div class="dp-room"><img src="${this.g.map.background}" alt="${roomName}"></div><small>MISSÃO ATUAL</small><h3>Investigue o incidente</h3><p>${objective}.</p><div class="dp-stat">${icon('record')}<span>Registros técnicos</span><b>${relCount}/5</b></div><div class="dp-stat">${icon('search')}<span>Pistas encontradas</span><b>${evCount}/${evTotal||11}</b></div><div class="dp-stat">${icon('time')}<span>Tempo de jogo</span><b>${timeStr}</b></div></section></div><footer><kbd>ESC</kbd> Voltar <i></i> <kbd>ENTER</kbd> Selecionar</footer></div></div>`;
  this.panel.classList.remove('hidden');
  const resumeBtn=this.panel.querySelector('[data-action="resume"]');
  const journalBtn=this.panel.querySelector('[data-action="journal"]');
  const controlsBtn=this.panel.querySelector('[data-action="controls"]');
  const quitBtn=this.panel.querySelector('[data-action="quit"]');
  resumeBtn.onclick=()=>this.close();
  journalBtn.onclick=()=>{this.close();setTimeout(()=>this.journal(),60);};
  controlsBtn.onclick=()=>{
    const info=this.panel.querySelector('.pause-info-panel');
    info.innerHTML=`<div class="pause-info-section" style="margin-top:0"><div class="pause-info-title"><span class="pause-info-dot">⌘</span> CONTROLES</div>
      <div class="pause-info-row"><span>W A S D / Setas</span><span>Mover</span></div>
      <div class="pause-info-row"><span>SHIFT</span><span>Correr</span></div>
      <div class="pause-info-row"><span>E</span><span>Interagir / Avançar</span></div>
      <div class="pause-info-row"><span>J</span><span>Abrir Dossiê</span></div>
      <div class="pause-info-row"><span>ESC</span><span>Pausar / Fechar</span></div>
    </div><div class="pause-info-section"><div class="pause-info-title"><span class="pause-info-dot">◈</span> SÍMBOLOS</div>
      <div class="pause-info-row"><span>?</span><span>Depoimento (NPC)</span></div>
      <div class="pause-info-row"><span>>_</span><span>Terminal</span></div>
      <div class="pause-info-row"><span>↗</span><span>Porta</span></div>
      <div class="pause-info-row"><span>✓</span><span>Evidência recuperada</span></div>
    </div>`;
  };
  quitBtn.onclick=()=>{location.reload();};
  resumeBtn.focus();
  // Keyboard nav within pause menu
  const btns=[...this.panel.querySelectorAll('.pause-nav-btn')];
  let idx=0;
  const highlight=(i)=>{btns.forEach((b,j)=>{b.classList.toggle('pause-nav-focused',j===i);});idx=i;};
  highlight(0);
  btns.forEach((b,i)=>{b.addEventListener('focus',()=>highlight(i));b.addEventListener('pointerenter',()=>highlight(i));});
  this._pauseKeyHandler=(e)=>{
    if(e.key==='ArrowDown'||e.key==='s'||e.key==='S'){e.preventDefault();highlight((idx+1)%btns.length);}
    else if(e.key==='ArrowUp'||e.key==='w'||e.key==='W'){e.preventDefault();highlight((idx-1+btns.length)%btns.length);}
    else if(e.key==='Enter'){e.preventDefault();btns[idx].click();}
  };
  window.addEventListener('keydown',this._pauseKeyHandler);
  const origClose=this.close.bind(this);
  this.close=()=>{window.removeEventListener('keydown',this._pauseKeyHandler);this.close=origClose;origClose();};
 }
 journal(){
  if(!this.available())return;const b=this.show('Dossiê de evidências',`CASO 01 / ${this.g.clues.found.size} DE 11 RECUPERADAS`);
  b.innerHTML='<p>Cruze os registros com os depoimentos. Um rumor não é uma prova.</p><div class="evidence-grid"></div>';
  for(const clue of Object.values(this.g.cluesData)){
   const found=this.g.clues.hasClue(clue.id),card=document.createElement('article');card.className='evidence-card'+(found?' recovered':'');
   const label=document.createElement('small'),title=document.createElement('h3'),p=document.createElement('p');label.textContent=clue.relevant?'REGISTRO TÉCNICO':'DEPOIMENTO';title.textContent=found?clue.title:'Sinal não recuperado';
   const source=[...this.g.allNpcs,...this.g.allObjects].find(c=>c.clueRef===clue.id);p.textContent=found?clue.body.join(' '):'Local: '+this.g.rooms[source.roomId].name;
   card.append(label,title,p);b.querySelector('.evidence-grid').append(card);
  }
 }
 terminal(c){
  const q=CHALLENGES.find(q=>q[0]===c.id);if(!q)return false;
  const b=this.desktop(c),pre=document.createElement('pre'),h=document.createElement('h3'),feedback=document.createElement('p');
  const heading=document.createElement('div');heading.className='pc-document-heading';heading.innerHTML='<span>REGISTRO TÉCNICO</span><h2>Inspecionar evidência</h2><p>Leia o registro e identifique o que ele revela sobre o incidente.</p>';b.append(heading);
  pre.textContent=q[1];h.textContent=q[2];feedback.setAttribute('aria-live','polite');feedback.className='terminal-feedback';b.append(pre,h);
  if(this.solved.has(c.id)){feedback.textContent='✓ Registro analisado. Evidência disponível no dossiê.';b.append(feedback);return true;}
  q[3].forEach((text,i)=>{const button=document.createElement('button');button.className='decision-option';button.textContent=`0${i+1} / ${text}`;button.onclick=()=>{if(i!==q[4]){this.errors++;button.disabled=true;feedback.textContent='REVISE / '+q[5];return;}this.solved.add(c.id);this.close();this.g._openContainerContent(c,c.contentRef);};b.append(button);});b.append(feedback);return true;
 }
 update(dt){
  const g=this.g,n=g.clues.getRelevantCount();
  if(this.available()&&g.input.wasJustPressed('KeyM'))g.minimap.toggle();
  if(!this.available())this.setMenuOpen(false);this.bar.classList.toggle('hidden',!['playing','case','transition'].includes(g.state));if(this.available())this.seconds+=dt;
  const objective=n<5?`${g.map.name} / Recupere os registros técnicos · ${n}/5`:'Evidências reunidas / Apresente a causa na Reunião';
  if(objective!==this.objective){this.bar.querySelector('strong').textContent=objective;this.objective=objective;}
  if(g.input.wasJustPressed('Escape')){if(!this.menu.hidden){this.setMenuOpen(false);this.menuToggle.focus();}else if(g.state==='case')this.close();else if(g.dialogue.active){g.dialogue.close(false);g._lockInteractions();}else if(g.mission.active){g.mission.close();g._lockInteractions();}else this.pause();}
  else if(g.input.wasJustPressed('KeyJ')){if(g.state==='case')this.close();else this.journal();}
 }
 drawMarker(c){
  const g=this.g,ctx=g.renderer.ctx,p=g.camera.worldToScreen(c.x+c.width/2,c.y+c.height),done=c.clueRef&&g.clues.hasClue(c.clueRef),near=c===g._nearestContainer;
  const color=done?'#9ee8be':c.type==='npc'?'#e1a0ff':'#62f2ff';
  const pulse=g.renderer.motionPreference?.matches?0:Math.sin(this.seconds*2.6+p.x*0.01);
  ctx.save();ctx.translate(p.x,p.y+(c.type==='npc'?-132:c.type==='item'?-48:-18)+pulse*2);
  ctx.globalAlpha=done?0.7:1;
  ctx.fillStyle='rgba(6,20,30,0.94)';
  ctx.strokeStyle=color;ctx.lineWidth=near?2:1.5;
  ctx.shadowColor=color;ctx.shadowBlur=near?18:8+pulse*2;
  ctx.beginPath();ctx.roundRect(-14,-14,28,28,6);ctx.fill();ctx.stroke();
  ctx.shadowBlur=0;
  ctx.fillStyle=color;ctx.font='500 13px "Segoe UI", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(done?'✓':c.type==='door'?'↗':(c.type==='npc'||c.type==='manager')?'?':c.type==='item'?'+':'›_',0,0);
  if(near){
   const label='E · '+c.name;
   ctx.font='500 14px "Segoe UI", sans-serif';const w=ctx.measureText(label).width+28;
   ctx.fillStyle='rgba(21,33,42,0.94)';ctx.beginPath();ctx.roundRect(-w/2,23,w,30,7);ctx.fill();
   ctx.fillStyle='#e0e9e8';ctx.fillText(label,0,38);
  }ctx.restore();
 }
}
const caseStart=Game.prototype.start;
Game.prototype.start=function(){this.case=new CaseExperience(this);caseStart.call(this);};
const caseUpdate=Game.prototype._update;
Game.prototype._update=function(dt){if(this.phone.update(dt)) return;this.case.update(dt);caseUpdate.call(this,dt);};
const caseInteract=Game.prototype._interactWith;
Game.prototype._interactWith=function(c){
 if(c.type==='computer'&&this.case.terminal(c))return;
 caseInteract.call(this,c);
};
const caseResult=Game.prototype._showResult;
Game.prototype._showResult=function(correct,def){
 if(!correct)this.case.hypothesisErrors++;
 const mistakes=this.case.errors+this.case.hypothesisErrors;
 const rank=this.clues.found.size===11&&mistakes===0?'S':mistakes<3?'A':'B';
 caseResult.call(this,correct,{...def,body:[...def.body,...(correct?[`CLASSIFICAÇÃO ${rank} / ${this.clues.found.size}/11 evidências / ${Math.floor(this.case.seconds/60)}:${Math.floor(this.case.seconds%60).toString().padStart(2,'0')} em campo / ${this.case.errors} revisões de análise / ${this.case.hypothesisErrors} hipóteses incorretas`]:[])]});
};


