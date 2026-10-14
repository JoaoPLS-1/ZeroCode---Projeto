// ZeroOS lab: per-machine state persists until the run is restarted.
class ZeroComputer {
 constructor(owner){this.owner=owner;this.records=new Map();this.dead=false;this.worker=null;this.layer=10;this.generation=0;this.busy=false;}
 record(id){
  if(!this.records.has(id)){
   const m=CODE_MISSIONS.find(m=>m.id===id);
   const folders=['Documentos','Projetos','Backup','Equipe','Downloads','Arquivo'];
   const folder=folders[Math.floor(Math.random()*folders.length)];
   const others=folders.filter(f=>f!==folder);
   this.records.set(id,{read:false,tutorialRead:false,draft:m.starter,folder,tutorialFolder:others[Math.floor(Math.random()*others.length)]});
  }
  return this.records.get(id);
 }
 stop(){this.generation++;this.busy=false;this.cancelRun?.();if(this.worker){this.worker.terminate();this.worker=null;}clearTimeout(this.timeout);}
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
  this.stop();this.c=c;const o=this.owner;
  const b=o.desktop(c),p=o.panel,find=s=>p.querySelector(s);
  find('.pc-readonly').textContent='JavaScript · Laboratório isolado';
  const explorer=document.createElement('button');explorer.className='zero-explorer-launch';explorer.innerHTML='<img src="assets/zeroos/imported/5.png" alt=""><span>Arquivos</span>';
  explorer.setAttribute('aria-label','Abrir Explorador de Arquivos');explorer.title='Explorador de Arquivos';
  find('.zero-launchers').append(explorer);explorer.onclick=()=>this.explore();
  find('.zero-vault').onclick=()=>this.explore('ZeroVault');
  find('.pc-window').classList.add('hidden');
  find('.pc-start-button').focus();
  const welcome=document.createElement('div');welcome.className='desktop-welcome';welcome.innerHTML='<details open><summary aria-label="Fechar notificação">×</summary><div><strong>Mensagem da equipe</strong><p>Primeiro dia? Abra Arquivos e procure o caderno de treinamento e as instruções de recuperação. ZeroTrace é o editor; ZeroVault guarda suas descobertas e senhas.</p></div></details>';
  find('.pc-desktop').append(welcome);
  b.textContent='Consultando a estação no servidor…';
  const generation=this.generation;
  this.sync().then(result=>{
   if(generation!==this.generation)return;
   if(result.gameOver){this.gameOver('Três execuções incorretas permitiram que LoopZero apagasse o ZeroOS.');return;}
   this.renderMission(c,b);
  }).catch(error=>{if(generation===this.generation){b.textContent=error.message;const retry=document.createElement('button');retry.textContent='Tentar novamente';retry.onclick=()=>this.open(c);b.append(retry);}});
 }
 async sync(){
  const generation=this.generation;
  const result=await api.get('/api/jogo/missoes');
  if(generation!==this.generation)return result;
  for(const m of result.missoes){const r=this.record(m.id);Object.assign(r,{errors:m.erros,solved:m.resolvida,unlocked:!m.bloqueada,reward:m.recompensa,password:m.senha});
   if(m.resolvida){this.owner.solved.add(m.id);this.owner.g.clues.addClue(m.clueRef);}
  }
  this.owner.errors=result.missoes.reduce((sum,m)=>sum+m.erros,0);
  this.owner.g.hud.update(this.owner.g.clues.getState());
  return result;
 }
 renderMission(c,b){
  const m=CODE_MISSIONS.find(m=>m.id===c.id),r=this.record(c.id),find=s=>this.owner.panel.querySelector(s);
  const i=CODE_MISSIONS.indexOf(m),previous=CODE_MISSIONS[i-1];
  if(previous&&!r.unlocked){
   b.innerHTML='<h2>Estação protegida</h2><p class="lock-description"></p><label>Senha de manutenção<input class="code-password" autocomplete="off"></label><button class="code-unlock">Desbloquear</button><p class="code-feedback" role="status"></p>';
   find('.lock-description').textContent='Conclua '+previous.name+' no PC anterior. A senha aparece na recompensa e em Credenciais no explorador. Consulte a sequência: Dev 1 → Dev 2 → QA → Técnico → Infra.';
   find('.code-unlock').onclick=async()=>{
    const button=find('.code-unlock'),feedback=find('.code-feedback'),generation=this.generation;button.disabled=true;
    try{const result=await api.post('/api/jogo/missoes/'+c.id+'/desbloquear',{senha:find('.code-password').value.trim()});if(generation!==this.generation)return;
     if(result.ok){await this.sync();if(generation!==this.generation)return;this.renderMission(c,b);this.owner.launchTrace();}
     else feedback.textContent='Senha inválida ou missão anterior incompleta. Isso não consome tentativas de código.';
    }catch(error){if(generation===this.generation)feedback.textContent=error.message;}finally{button.disabled=false;}
   };
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
 refresh(){const r=this.record(this.c.id),p=this.owner.panel;p.querySelector('.code-attempts').textContent=(3-r.errors)+'/3 tentativas restantes';p.querySelector('.code-run').disabled=r.solved||!r.read||this.busy;p.querySelector('.code-output').textContent=r.read?'Pronto. Edite o código e execute os testes.':'Procure e abra instrucoes.txt no explorador para iniciar.';}
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
   for(const mission of completed)item(mission.file+'.key',()=>{preview.textContent=this.record(mission.id).reward+'\nSenha: '+this.record(mission.id).password;});
  }else if(folder==='ZeroOS'){
   item('kernel.zero',()=>{preview.textContent='Arquivo essencial do ZeroOS simulado. Excluí-lo encerra a partida.';});
   item('Excluir sistema…',()=>{preview.textContent='ATENÇÃO: esta ação permite que LoopZero apague o ZeroOS e causa GAME OVER.';item('Confirmar exclusão do ZeroOS',()=>this.gameOver('O núcleo do ZeroOS foi excluído.'));});
  }else{
   item('notas.txt',()=>{preview.textContent='Arquivo de equipe. A cópia das instruções de recuperação foi movida para uma das pastas locais. Explore os diretórios.';});
   if(folder===r.folder)item('instrucoes.txt',()=>{r.read=true;preview.textContent=m.name+'\n\n'+m.manual+'\n\nSalve seu raciocínio no editor. Um envio errado conta apenas uma falha, mesmo se vários testes falharem.';if(p.querySelector('.code-run'))this.refresh();});
  }
 }
 async run(){
  const c=this.c,r=this.record(c.id);if(this.dead||r.solved||!r.read||!r.unlocked||this.busy)return;
  const out=this.owner.panel.querySelector('.code-output'),generation=this.generation;
  r.draft=this.owner.panel.querySelector('.code-editor').value;this.busy=true;
  this.owner.panel.querySelector('.code-run').disabled=true;out.textContent='Executando os testes em ambiente isolado…';
  try{
   const execution=await api.post('/api/jogo/missoes/'+c.id+'/execucao',{});
   if(generation!==this.generation)return;
   let finish,settled=false;
   const answer=await new Promise((resolve,reject)=>{
    finish=data=>{if(settled)return;settled=true;this.cancelRun=null;clearTimeout(this.timeout);this.worker?.terminate();this.worker=null;resolve(data);};
    try{this.worker=new Worker('engine/code-worker.js');}catch{reject(new Error('Não foi possível iniciar o laboratório. Abra o jogo por um servidor local (HTTP). Nenhuma tentativa consumida.'));return;}
    this.cancelRun=()=>finish(null);
    this.worker.onmessage=e=>finish(e.data);
    this.worker.onerror=()=>{if(settled)return;settled=true;this.cancelRun=null;clearTimeout(this.timeout);this.worker?.terminate();this.worker=null;reject(new Error('Falha ao carregar o laboratório. Nenhuma tentativa consumida. Use um servidor HTTP local.'));};
    this.timeout=setTimeout(()=>finish({erro:'Tempo excedido (2 segundos). Verifique laços infinitos.'}),2000);
    this.worker.postMessage({source:r.draft,entradas:execution.entradas});
   });
   if(generation!==this.generation)return;
   const body=answer.erro?{saidas:execution.entradas.map(()=>null),erro:answer.erro}:answer;
   const result=await api.post('/api/jogo/missoes/'+c.id+'/execucao/'+execution.execucao,body);
   if(generation!==this.generation)return;
   this.owner.errors+=result.erros-r.errors;r.errors=result.erros;r.solved=result.ok;this.busy=false;
   if(result.gameOver){this.gameOver('Três execuções incorretas permitiram que LoopZero apagasse o ZeroOS.');return;}
   this.refresh();
   if(result.ok){
    r.reward=result.recompensa;r.password=result.senha;
    this.owner.solved.add(c.id);this.owner.g.clues.addClue(result.clueRef);this.owner.g.hud.update(this.owner.g.clues.getState());
    this.owner.panel.querySelector('.code-editor').disabled=true;this.reward();
   }else{
    out.textContent=(result.erroExecucao||result.resultados.map(t=>'Teste '+t.teste+': '+(t.passou?'OK':'FALHOU — entrada '+JSON.stringify(t.entrada)+'; esperado '+JSON.stringify(t.esperado)+'; recebido '+JSON.stringify(t.recebido))).join('\n'))+'\n\nRevise as instruções antes de tentar novamente.';
   }
  }catch(error){if(generation===this.generation){this.busy=false;this.refresh();out.textContent=error.message+'\nConsulte a estação novamente antes de reenviar.';}}
 }
 reward(){const r=this.record(this.c.id);this.owner.panel.querySelector('.code-output').textContent='✓ Todos os testes passaram. Evidência coletada.\n'+r.reward+(r.password?'\nSenha do próximo PC: '+r.password:'');}
 gameOver(reason){
  this.dead=true;this.stop();this.owner.windowManager?.destroy();clearInterval(this.owner.osClock);this.owner.osMenuEvents?.abort();if(typeof closeContextMenu==='function')closeContextMenu();this.owner.g.state='gameover';
  this.owner.panel.innerHTML='<div class="zero-gameover"><span>LoopZero / falha crítica</span><h1>ZeroOS não encontrado</h1><p></p><p>A estação foi corrompida. A investigação terminou.</p><button>Reiniciar investigação</button></div>';
  this.owner.panel.querySelector('p').textContent=reason;const b=this.owner.panel.querySelector('button');b.onclick=()=>location.reload();b.focus();
 }
}
const zeroTerminal=CaseExperience.prototype.terminal;
CaseExperience.prototype.terminal=function(c){if(!CODE_MISSIONS.some(m=>m.id===c.id))return zeroTerminal.call(this,c);this.computer??=new ZeroComputer(this);if(!this.computer.dead)this.computer.open(c);return true;};
const zeroClose=CaseExperience.prototype.close;
CaseExperience.prototype.close=function(){if(this.computer?.dead)return;this.computer?.stop();this.windowManager?.destroy();clearInterval(this.osClock);this.osMenuEvents?.abort();if(typeof closeContextMenu==='function')closeContextMenu();zeroClose.call(this);};
