// Apresentação das conquistas recebidas; toda decisão e contagem vêm do servidor.
class FlagsUI {
  constructor(game) {
    this.g=game;this.queue=[];this.active=false;
    this.panel=document.createElement('section');this.panel.id='flag-panel';this.panel.className='hidden';
    this.panel.setAttribute('role','dialog');this.panel.setAttribute('aria-modal','true');this.panel.setAttribute('aria-labelledby','flag-title');
    document.getElementById('game-container').append(this.panel);
    api.onResposta((result,path)=>{
      if(path==='/api/jogo/nova-partida'){this.reset();return;}
      if(Number.isInteger(result.contagem?.lembrancas))this.g.hud.setLembrancas(result.contagem.lembrancas,result.metaLembrancas);
      else if(Number.isInteger(result.lembrancas))this.g.hud.setLembrancas(result.lembrancas,result.meta);
      if(result.captura?.nova)this.queue.push(result.captura);
    });
    window.addEventListener('keydown',event=>{
      if(!this.active)return;
      if(['Escape','KeyE','Enter','KeyJ','KeyI'].includes(event.code)){
        event.preventDefault();event.stopImmediatePropagation();
        if(!event.repeat&&['Escape','KeyE','Enter'].includes(event.code)){
          if(this.g.dialogue.active)this.g.dialogue.advance();else this.remember();
        }
      }
      if(event.code==='Tab'){
        event.preventDefault();event.stopImmediatePropagation();
        if(this.g.dialogue.active)this.g.dialogue.continueEl.focus();else this.panel.querySelector('button').focus();
      }
    },true);
  }
  reset(){
    if(this.active){this.g.dialogue.close(false);this.g.state=this.previousState;}
    this.active=false;this.queue=[];this.panel.classList.add('hidden');this.g.hud.setLembrancas(0);
    this.g.dialogue.root.classList.remove('flag-memory');
  }
  update(){
    if(this.active)return true;
    if(!this.queue.length||!['playing','case'].includes(this.g.state)||this.g.dialogue.active||this.g.mission.active)return false;
    this.current=this.queue.shift();this.previousState=this.g.state;this.previousFocus=document.activeElement;
    this.g.state='flag';this.active=true;this.g.hud.showPrompt(null);this.g.case.setMenuOpen(false);
    this.g.input.keys={};this.g.input._justPressed={};
    this.panel.innerHTML='<div class="flag-window"><header>FLAG CAPTURADA</header><h2 id="flag-title"></h2><p class="flag-concept"></p><h3>Ficha de conhecimento</h3><p class="flag-sheet"></p><h3>O que o vibecode errou</h3><p class="flag-error"></p><button type="button">Continuar · Lembrança</button></div>';
    const flag=this.current.flag;
    for(const [selector,value] of [['h2',flag.titulo],['.flag-concept',flag.conceito],['.flag-sheet',flag.ficha],['.flag-error',flag.vibecodeErrou]])this.panel.querySelector(selector).textContent=value;
    this.panel.querySelector('button').onclick=()=>this.remember();this.panel.classList.remove('hidden');this.panel.querySelector('button').focus();
    return true;
  }
  remember(){
    this.panel.classList.add('hidden');
    const lines=[{speaker:'thought',text:this.current.flag.lembranca}];
    if(this.current.wiresharkLiberado)lines.push(...this.current.senhaLembrada);
    this.g.dialogue.root.classList.add('flag-memory');
    this.g.dialogue.open({npcName:'D.A.N.I.E.L.',lines},()=>{
      this.g.dialogue.root.classList.remove('flag-memory');
      this.active=false;this.g.state=this.previousState;this.g.input.keys={};this.g.input._justPressed={};
      this.g._lockInteractions();if(this.previousFocus?.isConnected)this.previousFocus.focus();
    });
  }
  async renderCards(root){
    root.textContent='Carregando fichas…';
    try{
      const result=await api.get('/api/jogo/flags');if(!root.isConnected)return;
      root.replaceChildren();
      if(!result.flags.length){root.textContent='Nenhuma ficha capturada.';return;}
      for(const flag of result.flags){
        const card=document.createElement('article');card.className='knowledge-card';
        for(const [tag,text] of [['h3',flag.titulo],['p',flag.conceito],['p',flag.ficha],['p','O que o vibecode errou: '+flag.vibecodeErrou],['p','Kael (pensa): “'+flag.lembranca+'”']]){
          const el=document.createElement(tag);el.textContent=text;card.append(el);
        }
        root.append(card);
      }
    }catch(error){if(root.isConnected)root.textContent=error.message;}
  }
}
if(typeof module!=='undefined')module.exports=FlagsUI;
