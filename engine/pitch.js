// Orquestra apenas a apresentação; conquistas e conteúdo continuam na API.
class PitchPresentation {
  constructor(game) {
    this.g=game;this.chapter=0;this.total=6;this.busy=false;this.hidden=false;
    this.bar=document.createElement('aside');this.bar.id='pitch-bar';this.bar.hidden=true;
    this.bar.setAttribute('aria-label','Apresentação por capítulos');
    this.bar.innerHTML='<strong></strong><p></p><small>← / B anterior · → / N próximo · 1–6 capítulo · H legenda</small><span role="status"></span>';
    document.getElementById('game-container').append(this.bar);
    // Captura antes dos controles do jogo e dos painéis, inclusive da cena ÔMEGA.
    window.addEventListener('keydown',event=>this.keydown(event),true);
  }
  start() {
    const g=this.g;
    g.dom.startScreen.classList.add('hidden');g.dom.briefingScreen.classList.add('hidden');
    g.hud.setVisible(true);g.minimap.setVisible(true);g.inventory.setVisible(true);
    g._openingShown=true;g.state='playing';this.go(1);
  }
  keydown(event) {
    if(this.g.modo!=='pitch'||['start','briefing'].includes(this.g.state)||event.ctrlKey||event.altKey||event.metaKey)return;
    // Digitação e setas nos editores/filtros continuam disponíveis. PageUp/Down
    // funcionam também nesses campos, para passadores de slides.
    const editing=event.target?.closest?.('input,textarea,select,[contenteditable="true"]');
    if(editing&&!['PageDown','PageUp'].includes(event.code))return;
    const next=['ArrowRight','PageDown','KeyN'].includes(event.code);
    const previous=['ArrowLeft','PageUp','KeyB'].includes(event.code);
    const number=/^Digit[1-6]$/.test(event.code)?Number(event.code.slice(-1)):null;
    if(!next&&!previous&&!number&&event.code!=='KeyH')return;
    event.preventDefault();event.stopImmediatePropagation();
    if(event.repeat)return;
    if(event.code==='KeyH'){this.hidden=!this.hidden;this.renderVisibility();return;}
    this.go(number||(this.chapter+(next?1:-1)));
  }
  renderVisibility() {
    this.bar.hidden=this.hidden;
    document.getElementById('game-container').classList.toggle('pitch-caption',!this.hidden);
  }
  closeCurrent() {
    const g=this.g;
    closeContextMenu();g.secretDoor?.close();
    g.case.computer?.stop();g.case.computer?.pixelObserver?.disconnect();
    if(g.case.computer)g.case.computer.dead=false;
    g.case.windowManager?.destroy();g.case.osMenuEvents?.abort();clearInterval(g.case.osClock);
    // Levar o apresentador a outro capítulo não conclui o diálogo interrompido.
    g.dialogue.unskippable=false;g.dialogue.close(false);
    g.flagsUI.reset();g.mission.close();g.phone.close();g.case.close();g.case.setMenuOpen(false);
    for(const root of [g.dom.resultScreen,g.dom.completeScreen,g.dom.clueAlert])root.classList.add('hidden');
    clearTimeout(g._clueAlertTimeout);clearTimeout(g._clueAlertHideTimeout);
    g.input.keys={};g.input._justPressed={};g.state='playing';g.hud.showPrompt(null);
  }
  async go(n) {
    const g=this.g;
    if(this.busy||g._roomTransition||g.omega?.busy||g.mission.submitting||n<1||n>this.total)return;
    this.busy=true;this.closeCurrent();g.state='pitch-loading';
    this.bar.querySelector('[role="status"]').textContent='Carregando capítulo…';this.renderVisibility();
    try {
      const chapter=await api.post('/api/jogo/pitch/capitulo/'+n,{});
      this.chapter=chapter.capitulo;this.total=chapter.total;
      this.bar.querySelector('strong').textContent=String(this.chapter).padStart(2,'0')+' / '+String(this.total).padStart(2,'0')+' · '+chapter.titulo;
      this.bar.querySelector('p').textContent=chapter.legenda;
      g.case.computer?.records.clear();g.case.computer?.catalog.clear();g.case.solved.clear();
      g.clues.found.clear();g.case.errors=0;g.case.hypothesisErrors=0;g.case.seconds=0;
      g.hud.update(g.clues.getState());g.state='playing';
      g._changeRoom(chapter.sala,chapter.spawn);
      if(!g._roomTransition)throw new Error('Não foi possível abrir a sala do capítulo.');
      g._roomTransition.onComplete=()=>this.run(chapter);
    } catch(error) { this.failed(error); }
  }
  failed(error) {
    this.busy=false;if(this.g.state==='pitch-loading')this.g.state='playing';
    this.bar.querySelector('[role="status"]').textContent=error.message+' Use 1–6 para tentar novamente.';
    this.hidden=false;this.renderVisibility();
  }
  async run(chapter) {
    const g=this.g;
    try {
      const [action,stationId,appId]=chapter.acao.split(':');
      if(action==='abertura')g.dialogue.open(g.dialogsData.dialog_opening,()=>g._lockInteractions());
      else if(action==='abrir-pc'||action==='abrir-app') {
        const station=g.allObjects.find(object=>object.id===stationId);
        if(!station)throw new Error('Estação indisponível.');
        const computer=g.case.computer??=new ZeroComputer(g.case);
        computer.record(station.id).os='zero';computer.open(station);
        await computer.ready;
        if(action==='abrir-pc')computer.selectChallenge(chapter.desafio);
        else {
          const launcher=g.case.panel.querySelector('[data-zero-app="'+appId+'"]');
          if(!launcher)throw new Error('Aplicativo indisponível.');
          // Clique simples só seleciona o ícone (padrão de SO); abrir usa o lançador real.
          (launcher._osLaunch||launcher.onclick)?.call(launcher);
        }
      } else if(action==='mostrar-flag')g.flagsUI.update();
      else if(action==='omega')await g._omegaEncounter().enter();
      else if(action==='decisao')await g._omegaEncounter().decide();
      this.bar.querySelector('[role="status"]').textContent='';this.busy=false;
    } catch(error) { this.failed(error); }
  }
}
if(typeof module!=='undefined')module.exports=PitchPresentation;
