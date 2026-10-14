// ZeroOS lab: per-machine state persists until the run is restarted.
class ZeroComputer {
 constructor(owner){this.owner=owner;this.records=new Map();this.dead=false;this.worker=null;this.layer=10;}
 record(id){
  if(!this.records.has(id)){
   const m=CODE_MISSIONS.find(m=>m.id===id);
   const folders=['Documentos','Projetos','Backup','Equipe','Downloads','Arquivo'];
   const folder=folders[Math.floor(Math.random()*folders.length)];
   const others=folders.filter(f=>f!==folder);
   this.records.set(id,{errors:0,solved:false,unlocked:id===CODE_MISSIONS[0].id,read:false,tutorialRead:false,draft:m.starter,folder,tutorialFolder:others[Math.floor(Math.random()*others.length)],password:'ZERO-'+Math.random().toString(36).slice(2,7).toUpperCase()});
  }
  return this.records.get(id);
 }
 stop(){if(this.worker){this.worker.terminate();this.worker=null;}clearTimeout(this.timeout);}
 drag(win,handle){
  handle.style.touchAction='none';handle.style.cursor='grab';
  handle.onpointerdown=e=>{
   if(e.button!==0||e.target.closest('button')||win.classList.contains('maximized'))return;
   const parent=win.parentElement.getBoundingClientRect(),r=win.getBoundingClientRect();
   const dx=e.clientX-r.left,dy=e.clientY-r.top;
   win.style.width=r.width+'px';win.style.height=r.height+'px';win.style.transform='none';win.style.right='auto';win.style.bottom='auto';win.style.zIndex=++this.layer;
   handle.setPointerCapture(e.pointerId);
   const move=ev=>{win.style.left=Math.max(0,Math.min(parent.width-r.width,ev.clientX-parent.left-dx))+'px';win.style.top=Math.max(0,Math.min(parent.height-100,ev.clientY-parent.top-dy))+'px';};
   move(e);handle.onpointermove=move;
   handle.onpointerup=handle.onpointercancel=()=>{handle.onpointermove=null;};
  };
  win.onpointerdown=()=>{win.style.zIndex=++this.layer;};
 }
 open(c){
  this.stop();this.c=c;const m=CODE_MISSIONS.find(m=>m.id===c.id),r=this.record(c.id),o=this.owner;
  const b=o.desktop(c),p=o.panel,find=s=>p.querySelector(s);
  this.drag(find('.pc-window'),find('.pc-titlebar'));
  this.drag(find('.zero-info'),find('.zero-info h2'));
  const maximize=()=>{const w=find('.pc-window');w.removeAttribute('style');w.classList.toggle('maximized');};
  find('.pc-max').onclick=maximize;find('.pc-titlebar').ondblclick=e=>{if(!e.target.closest('button'))maximize();};
  find('.pc-readonly').textContent='JavaScript · Laboratório isolado';
  const explorer=document.createElement('button');explorer.className='zero-explorer-launch';explorer.innerHTML='<img src="assets/zeroos/imported/5.png" alt=""><span>Arquivos</span>';
  explorer.setAttribute('aria-label','Abrir Explorador de Arquivos');explorer.title='Explorador de Arquivos';
  find('.pc-taskbar').insertBefore(explorer,find('.pc-task'));explorer.onclick=()=>this.explore();
  find('.zero-vault').onclick=()=>this.explore('ZeroVault');
  find('.pc-window').classList.add('hidden');
  find('.pc-start-button').focus();
  const welcome=document.createElement('div');welcome.className='desktop-welcome';welcome.innerHTML='<details open><summary aria-label="Fechar notificação">×</summary><div><strong>Mensagem da equipe</strong><p>Primeiro dia? Abra Arquivos e procure o caderno de treinamento e as instruções de recuperação. ZeroTrace é o editor; ZeroVault guarda suas descobertas e senhas.</p></div></details>';
  find('.pc-desktop').append(welcome);
  const i=CODE_MISSIONS.indexOf(m),previous=CODE_MISSIONS[i-1];
  if(previous&&!r.unlocked){
   b.innerHTML='<h2>Estação protegida</h2><p class="lock-description"></p><label>Senha de manutenção<input class="code-password" autocomplete="off"></label><button class="code-unlock">Desbloquear</button><p class="code-feedback" role="status"></p>';
   find('.lock-description').textContent='Conclua '+previous.name+' no PC anterior. A senha aparece na recompensa e em Credenciais no explorador. Consulte a sequência: Dev 1 → Dev 2 → QA → Técnico → Infra.';
   find('.code-unlock').onclick=()=>{const prior=this.record(previous.id);if(prior.solved&&find('.code-password').value.trim()===prior.password){r.unlocked=true;this.open(c);this.owner.panel.querySelector('.pc-shortcut').click();}else find('.code-feedback').textContent='Senha inválida ou missão anterior incompleta. Isso não consome tentativas de código.';};
   return;
  }
  b.innerHTML='<div class="pc-document-heading"><span class="code-tab">'+m.file+'</span><h2></h2></div><div class="code-actions"><button class="code-run">▶ Executar testes</button><button class="code-files">Procurar instruções nos arquivos</button></div><label class="code-label">Corpo da função JavaScript · input → return<textarea class="code-editor" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Editor JavaScript"></textarea></label><div class="code-output-heading">Saída</div><p class="code-risk"></p><pre class="code-output" role="status" aria-live="polite"></pre><footer class="code-status"><span>'+m.file+' · JavaScript</span><span class="code-attempts"></span></footer>';
  find('.pc-document-heading h2').textContent=m.name;
  find('.code-risk').textContent='LoopZero está corrompendo esta estação. Cada execução que falha consome 1 tentativa. Ao acumular 3 erros neste PC, o ZeroOS é apagado e a partida termina. Fechar o PC não zera os erros.';
  const editor=find('.code-editor');editor.value=r.draft;editor.disabled=r.solved;
  editor.oninput=()=>{r.draft=editor.value;};
  editor.onkeydown=e=>{if(e.key==='Tab'){e.preventDefault();const a=editor.selectionStart,z=editor.selectionEnd;editor.setRangeText('  ',a,z,'end');r.draft=editor.value;}if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();this.run();}};
  find('.code-files').onclick=()=>this.explore();find('.code-run').onclick=()=>this.run();
  this.refresh();
  if(r.solved)this.reward();
 }
 refresh(){const r=this.record(this.c.id),p=this.owner.panel;p.querySelector('.code-attempts').textContent=(3-r.errors)+'/3 tentativas restantes';p.querySelector('.code-run').disabled=r.solved||!r.read||!!this.worker;p.querySelector('.code-output').textContent=r.read?'Pronto. Edite o código e execute os testes.':'Procure e abra instrucoes.txt no explorador para iniciar.';}
 explore(folder=''){
  const p=this.owner.panel;let w=p.querySelector('.code-explorer');
  if(!w){w=document.createElement('section');w.className='code-explorer';w.innerHTML='<header><strong>ZeroFiles · Explorador</strong><button aria-label="Fechar explorador">×</button></header><nav></nav><div class="file-list"></div><pre class="file-preview"></pre>';p.querySelector('.pc-desktop').append(w);this.drag(w,w.querySelector('header'));w.querySelector('header button').onclick=()=>w.classList.add('hidden');}
  w.classList.remove('hidden');w.style.zIndex=++this.layer;
  const list=w.querySelector('.file-list'),nav=w.querySelector('nav'),preview=w.querySelector('.file-preview');list.textContent='';nav.textContent='';preview.textContent='';
  const up=document.createElement('button');up.textContent='← Este computador';up.onclick=()=>this.explore();nav.append(up);nav.append(document.createTextNode(' / '+folder));
  const r=this.record(this.c.id),m=CODE_MISSIONS.find(m=>m.id===this.c.id);
  const item=(name,fn)=>{const b=document.createElement('button');b.textContent=name;b.onclick=fn;list.append(b);};
  if(!folder){for(const name of ['Documentos','Projetos','Backup','Equipe','Downloads','Arquivo','Credenciais','ZeroOS'])item('▣ '+name,()=>this.explore(name));}
  else if(folder==='Credenciais'){
   const completed=CODE_MISSIONS.filter(m=>this.record(m.id).solved);
   if(!completed.length)preview.textContent='Nenhuma credencial recuperada. Complete uma missão de código.';
   for(const mission of completed)item(mission.file+'.key',()=>{preview.textContent=mission.reward+'\nSenha: '+this.record(mission.id).password;});
  }else if(folder==='ZeroOS'){
   item('kernel.zero',()=>{preview.textContent='Arquivo essencial do ZeroOS simulado. Excluí-lo encerra a partida.';});
   item('Excluir sistema…',()=>{preview.textContent='ATENÇÃO: esta ação permite que LoopZero apague o ZeroOS e causa GAME OVER.';item('Confirmar exclusão do ZeroOS',()=>this.gameOver('O núcleo do ZeroOS foi excluído.'));});
  }else{
   item('notas.txt',()=>{preview.textContent='Arquivo de equipe. A cópia das instruções de recuperação foi movida para uma das pastas locais. Explore os diretórios.';});
   if(folder===r.folder)item('instrucoes.txt',()=>{r.read=true;preview.textContent=m.name+'\n\n'+m.manual+'\n\nSalve seu raciocínio no editor. Um envio errado conta apenas uma falha, mesmo se vários testes falharem.';if(p.querySelector('.code-run'))this.refresh();});
  }
 }
 run(){
  const r=this.record(this.c.id);if(this.dead||r.solved||!r.read||!r.unlocked||this.worker)return;
  const m=CODE_MISSIONS.find(m=>m.id===this.c.id),out=this.owner.panel.querySelector('.code-output');
  r.draft=this.owner.panel.querySelector('.code-editor').value;
  try{this.worker=new Worker('engine/code-worker.js');}catch{out.textContent='Não foi possível iniciar o laboratório. Abra o jogo por um servidor local (HTTP). Nenhuma tentativa consumida.';return;}
  this.owner.panel.querySelector('.code-run').disabled=true;out.textContent='Executando os testes em ambiente isolado…';
  const finish=result=>{
   this.stop();if(this.dead)return;
   if(result.ok){r.solved=true;this.owner.solved.add(m.id);this.owner.g.clues.addClue(this.c.clueRef);this.owner.g.hud.update(this.owner.g.clues.getState());this.refresh();this.owner.panel.querySelector('.code-editor').disabled=true;this.reward();}
   else {r.errors++;this.owner.errors++;if(r.errors>=3){this.gameOver('Três execuções incorretas permitiram que LoopZero apagasse o ZeroOS.');return;}this.refresh();out.textContent=(result.error||result.results.map(t=>'Teste '+t.test+': '+(t.ok?'OK':'FALHOU — entrada '+JSON.stringify(t.input)+'; esperado '+JSON.stringify(t.expected)+'; recebido '+t.actual)).join('\n'))+'\n\nRevise as instruções antes de tentar novamente.';}
  };
  this.worker.onmessage=e=>finish(e.data);
  this.worker.onerror=()=>{this.stop();this.refresh();out.textContent='Falha ao carregar o laboratório. Nenhuma tentativa consumida. Use um servidor HTTP local.';};
  this.timeout=setTimeout(()=>finish({ok:false,error:'Tempo excedido (2 segundos). Verifique laços infinitos.'}),2000);
  this.worker.postMessage({source:r.draft,tests:m.tests});
 }
 reward(){const r=this.record(this.c.id),m=CODE_MISSIONS.find(m=>m.id===this.c.id);this.owner.panel.querySelector('.code-output').textContent='✓ Todos os testes passaram. Evidência coletada.\n'+m.reward+(CODE_MISSIONS.indexOf(m)<4?'\nSenha do próximo PC: '+r.password:'');}
 gameOver(reason){
  this.dead=true;this.stop();this.owner.g.state='gameover';
  this.owner.panel.innerHTML='<div class="zero-gameover"><span>LoopZero / falha crítica</span><h1>ZeroOS não encontrado</h1><p></p><p>A estação foi corrompida. A investigação terminou.</p><button>Reiniciar investigação</button></div>';
  this.owner.panel.querySelector('p').textContent=reason;const b=this.owner.panel.querySelector('button');b.onclick=()=>location.reload();b.focus();
 }
}
const zeroTerminal=CaseExperience.prototype.terminal;
CaseExperience.prototype.terminal=function(c){if(!CODE_MISSIONS.some(m=>m.id===c.id))return zeroTerminal.call(this,c);this.computer??=new ZeroComputer(this);if(!this.computer.dead)this.computer.open(c);return true;};
const zeroClose=CaseExperience.prototype.close;
CaseExperience.prototype.close=function(){if(this.computer?.dead)return;this.computer?.stop();zeroClose.call(this);};
