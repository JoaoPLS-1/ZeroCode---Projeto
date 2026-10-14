// Teams narrativo local. Conversas e bolso duram a partida, inclusive entre salas.
class GamePhone {
  constructor(game) {
    this.g = game;
    this.view = null;
    this.current = null;
    this.pending = [];
    this.events = new Set();
    this.threads = [
      {id:'equipe', name:'Equipe NEXUS', initials:'NX', subtitle:'Canal da equipe · 4 participantes', unread:0, messages:[]},
      {id:'livia', name:'Lívia', initials:'L', subtitle:'Treinamento e suporte', unread:0, messages:[]},
      {id:'dante', name:'Dante Kernel', initials:'DK', subtitle:'Coordenação', unread:0, messages:[]}
    ];
    this.root = document.createElement('section');
    this.root.id = 'phone-overlay';
    this.root.className = 'hidden';
    this.root.setAttribute('role','dialog');
    this.root.setAttribute('aria-modal','true');
    this.root.setAttribute('aria-label','Bolso e celular');
    document.getElementById('game-container').append(this.root);
    this.toast = document.createElement('div');
    this.toast.id = 'phone-toast';
    this.toast.className = 'hidden';
    this.toast.setAttribute('role','status');
    document.getElementById('game-container').append(this.toast);
    game.inventory.root.querySelector('.inv-bag').onclick=()=>this.open('pocket');
    game.inventory.onUse=item=>this.open(item ? 'home' : 'pocket');
  }
  owned(){return this.g.inventory.has('celular');}
  notify(text){
    this.toast.textContent=text; this.toast.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer=setTimeout(()=>this.toast.classList.add('hidden'),4500);
  }
  collected(){
    this.receive('equipe','Lívia','Você encontrou o celular! Podemos acompanhar a investigação por aqui.');
    this.notify('Celular guardado no bolso. I para abrir · 1 mensagem no Teams.');
    this.pending.push({wait:7,id:'livia',author:'Lívia',text:'Se precisar de ajuda com os computadores, me chama. Deixei instruções e treinamentos nas pastas.'});
  }
  receive(id,author,text){
    const t=this.threads.find(t=>t.id===id);
    t.messages.push({author,text,time:this.time(),mine:false});
    if(this.view==='thread' && this.current===id){this.renderMessages();}
    else {t.unread++; if(this.view==='chats')this.render(); else if(this.view==='home')this.render();}
    this.badge();
    if(!this.view)this.notify('Teams · '+author+': '+text);
  }
  badge(){
    const count=this.threads.reduce((n,t)=>n+t.unread,0);
    const slot=this.g.inventory.root.querySelector('.inv-slot');
    slot?.setAttribute('data-unread', count ? String(count) : '');
    const badge=this.g.inventory.root.querySelector('.hoodie-unread');
    if(badge){badge.textContent=String(count);badge.hidden=!count;}
  }
  time(){return new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});}
  open(view){
    if(!this.view && !this.g.case?.available())return;
    if(view!=='pocket' && !this.owned())return;
    if(!this.view)this.previousFocus=document.activeElement;
    this.view=view; this.g.state='phone';
    this.g.input.keys={};this.g.input._justPressed={};
    this.g.hud.showPrompt(null);this.g._nearestContainer=null;
    this.root.classList.remove('hidden');this.render();
  }
  close(){
    this.view=null;this.root.classList.add('hidden');this.g.state='playing';
    this.g.input.keys={};this.g.input._justPressed={};this.g._lockInteractions();
    this.previousFocus?.focus();
  }
  back(){
    if(this.view==='thread')this.open('chats');
    else if(this.view==='chats')this.open('home');
    else if(this.view==='home')this.open('pocket');
    else this.close();
  }
  update(dt){
    // Mensagens aguardam durante diálogos, computadores e pausa.
    if(this.owned() && (this.g.case?.available() || this.view)){
      this.pending.forEach(p=>p.wait-=dt);
      const ready=this.pending.filter(p=>p.wait<=0);
      this.pending=this.pending.filter(p=>p.wait>0);
      ready.forEach(p=>this.receive(p.id,p.author,p.text));
      if(this.g.map.id==='room_meeting' && !this.events.has('meeting')){
        this.events.add('meeting');this.receive('dante','Dante Kernel','Antes de apresentar sua conclusão, confira se reuniu os cinco registros técnicos.');
      }
      if(this.g.clues.getRelevantCount()>=1 && !this.events.has('clue')){
        this.events.add('clue');this.receive('equipe','Lívia','Primeiro registro recuperado. Compare os horários e continue verificando as outras estações.');
      }
    }
    if(this.view){
      if(this.g.input.wasJustPressed('Escape'))this.back();
      else if(this.g.input.wasJustPressed('KeyI'))this.close();
      return true;
    }
    if(this.g.input.wasJustPressed('KeyI') && this.g.case?.available()){this.open('pocket');return true;}
    return false;
  }
  render(){
    if(this.view==='pocket'){
      const pass=this.g.inventory.has('passe_omega');
      this.root.innerHTML=`<div class="hoodie-pocket"><header><div><small>INVENTÁRIO <span>///</span></small><h2>Bolso do moletom</h2></div><button data-close aria-label="Fechar bolso">×</button></header><div class="pocket-seam">${this.owned()?'<button class="pocket-item pocket-phone" aria-label="Abrir celular"><span class="pocket-art"><img src="assets/items/celular.png" alt="Celular pixelado com bordas ciano e roxo"></span><span class="pocket-info"><small>01 / DISPOSITIVO</small><strong>Celular</strong><span class="pocket-open">▱ &nbsp; Abrir <b>↗</b></span></span></button>':''}${pass?'<article class="pocket-item pocket-pass"><span class="pocket-art"><img src="assets/items/passe-omega.png" alt="Passe Ômega de acesso à Sala Secreta"></span><div class="pocket-info"><small>02 / CREDENCIAL</small><strong>Passe Ômega</strong><p>Entregue por Dante Kernel</p><span class="pass-status"><i></i> Sala Secreta · acesso liberado</span></div></article>':''}${!this.owned()&&!pass?'<div class="pocket-empty"><span>◇</span><strong>Seu bolso está vazio</strong><p>Explore a sala do café para encontrar o celular.</p></div>':''}</div><footer><span>SEUS ITENS · ${this.g.inventory.items.length.toString().padStart(2,'0')}</span><span><kbd>I</kbd> / <kbd>Esc</kbd> Guardar</span></footer></div>`;
      const phone=this.root.querySelector('.pocket-phone');if(phone)phone.onclick=()=>this.open('home');
    }else{
      this.root.innerHTML=`<div class="game-phone"><div class="phone-status"><time>${this.time()}</time><span class="phone-camera"></span><span class="phone-signals">▂▄▆ <i aria-label="Bateria cheia"></i></span></div><header class="phone-header"><button data-back aria-label="Voltar">‹</button><strong>${this.view==='home'?'ZERO MOBILE':'TEAMS'}<small>${this.view==='home'?'NEXUS / DISPOSITIVO PESSOAL':'NEXUS / COMUNICAÇÃO'}</small></strong><button data-close aria-label="Guardar celular">×</button></header><main class="phone-content"></main><button class="phone-home" aria-label="Tela inicial do celular"></button></div><span class="phone-help">Esc · voltar / guardar</span>`;
      this.root.querySelector('[data-back]').onclick=()=>this.back();
      this.root.querySelector('.phone-home').onclick=()=>this.open('home');
      const body=this.root.querySelector('.phone-content');
      if(this.view==='home'){
        const count=this.threads.reduce((n,t)=>n+t.unread,0);
        body.classList.add('phone-wallpaper');
        body.innerHTML=`<div class="phone-clock">${this.time()}<small>NEXUS · conectado</small></div><button class="teams-launch"><span class="teams-logo"><i aria-hidden="true">T</i>${count?'<b>'+count+'</b>':''}</span>Teams</button><div class="phone-home-note"><small>CANAL DA EQUIPE</small><p>A investigação continua.<br>Sua equipe está por aqui.</p><span>● CONECTADO AO NEXUS</span></div>`;
        body.querySelector('button').onclick=()=>this.open('chats');
      }else if(this.view==='chats'){
        body.innerHTML='<div class="teams-title"><small>SEU ESPAÇO DE TRABALHO</small><h2>Conversas</h2></div><div class="teams-list"></div><p class="teams-footnote">NEXUS / Equipe de investigação</p>';
        for(const t of this.threads){
          const b=document.createElement('button');b.className='teams-row';
          b.innerHTML='<span class="teams-avatar"></span><span><strong></strong><small></small></span><b></b>';
          b.querySelector('.teams-avatar').textContent=t.initials;
          b.querySelector('strong').textContent=t.name;
          b.querySelector('small').textContent=t.messages.at(-1)?.text || 'Iniciar conversa';
          b.querySelector('b').textContent=t.unread||'';
          b.onclick=()=>{this.current=t.id;t.unread=0;this.badge();this.open('thread');};
          body.querySelector('.teams-list').append(b);
        }
      }else{
        const t=this.threads.find(t=>t.id===this.current);
        body.innerHTML='<div class="thread-title"><strong></strong><small></small></div><div class="teams-messages" role="log" aria-live="polite" aria-label="Mensagens"></div><div class="teams-replies"></div><form class="teams-compose"><input maxlength="500" aria-label="Escrever mensagem" placeholder="Escreva uma mensagem…" autocomplete="off"><button aria-label="Enviar mensagem" type="submit">➤</button></form>';
        body.querySelector('.thread-title strong').textContent=t.name;
        body.querySelector('.thread-title small').textContent=t.subtitle;
        for(const text of ['Onde começo?','Preciso de ajuda','Qual é o próximo passo?']){
          const b=document.createElement('button');b.textContent=text;b.onclick=()=>this.send(text);body.querySelector('.teams-replies').append(b);
        }
        body.querySelector('form').onsubmit=e=>{e.preventDefault();const input=body.querySelector('input');if(this.send(input.value))input.value='';};
        this.renderMessages();
      }
    }
    this.root.querySelector('[data-close]').onclick=()=>this.close();
    this.root.querySelector('button')?.focus();
  }
  renderMessages(){
    const list=this.root.querySelector('.teams-messages');if(!list)return;
    const t=this.threads.find(t=>t.id===this.current);list.replaceChildren();
    if(!t.messages.length){const p=document.createElement('p');p.className='thread-empty';p.textContent='Envie uma mensagem para iniciar a conversa.';list.append(p);}
    for(const m of t.messages){
      const bubble=document.createElement('article');bubble.className='teams-bubble'+(m.mine?' mine':'');
      const author=document.createElement('strong');author.textContent=m.author;
      const text=document.createElement('p');text.textContent=m.text;
      const time=document.createElement('small');time.textContent=m.time+(m.mine?' · Enviada':'');
      bubble.append(author,text,time);list.append(bubble);
    }
    if(this.pending.some(p=>p.id===t.id && p.reply)){
      const p=document.createElement('p');p.className='typing';p.textContent='Digitando…';list.append(p);
    }
    list.scrollTop=list.scrollHeight;
  }
  send(raw){
    const text=raw.trim().slice(0,500);if(!text)return false;
    const t=this.threads.find(t=>t.id===this.current);
    if(this.pending.some(p=>p.id===t.id && p.reply))return false;
    t.messages.push({author:'Você',text,time:this.time(),mine:true});
    const q=text.toLocaleLowerCase('pt-BR');
    let response;
    if(/obrigad|valeu/.test(q))response='Por nada! Vou continuar por aqui enquanto você explora.';
    else if(/olá|oi\b|bom dia/.test(q))response='Oi! Estou por aqui. Você pode perguntar onde começar, pedir ajuda ou conferir o próximo passo.';
    else if(/começ|comec|onde/.test(q))response='Comece pelos computadores de Desenvolvimento. Abra o explorador de arquivos e procure as instruções da estação.';
    else if(/ajud|código|codigo|program/.test(q))response='Leia instrucoes.txt e o treinamento da Lívia nas pastas da estação. Eles explicam o desafio antes de você executar o código.';
    else if(/próxim|proxim|registro|pista|conclu/.test(q))response=this.g.clues.getRelevantCount()>=5?'Os cinco registros estão reunidos. Vá ao terminal da sala de reuniões e apresente sua conclusão.':'Ainda precisamos dos cinco registros: dois em Desenvolvimento e três em QA / Infra. O dossiê (J) ajuda a acompanhar.';
    else if(/acesso|restrit|senha/.test(q))response='As credenciais das próximas estações são liberadas ao concluir os desafios. Confira o ZeroVault no computador.';
    else response='Recebi sua mensagem. Por enquanto posso orientar sobre o início, os treinamentos e os próximos passos da investigação. Qual desses você precisa?';
    this.pending.push({wait:1.6,id:t.id,author:t.id==='dante'?'Dante Kernel':'Lívia',text:response,reply:true});
    this.renderMessages();return true;
  }
}
