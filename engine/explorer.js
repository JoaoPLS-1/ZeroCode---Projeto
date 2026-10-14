const ZERO_TUTORIALS=[
 `AULA 1 — Decisões\n\nImagine que input é uma ficha: { status: 503, attempt: 2 }. input.status lê o status e input.attempt lê a tentativa.\n\nreturn devolve sua resposta ao sistema. true significa sim; false significa não.\n=== compara dois valores. < pergunta se o primeiro é menor. && exige que as duas condições sejam verdadeiras.\n\nTreino: para autorizar uma pessoa adulta com crachá:\nreturn input.age >= 18 && input.badge === true;\n\nNa missão, troque as condições pelas regras do arquivo instrucoes.txt. Junte a comparação do status com o limite de tentativas usando &&. Não use = para comparar: ele atribui um valor.\n\nConfira no papel: com status 503 e tentativa 2, pode repetir? E na tentativa 3? E se o status for 200?`,
 `AULA 2 — Listas e buscas\n\nUma lista usa colchetes: [item1, item2]. Cada evento possui type e time. Um laço for...of passa por cada item.\n\nExemplo: procurar o nome de uma pessoa pelo cargo:\nfor (const pessoa of input) {\n  if (pessoa.cargo === "gerente") {\n    return pessoa.nome;\n  }\n}\nreturn null;\n\nconst dá um nome temporário a um valor. if executa o trecho entre chaves apenas quando a condição é verdadeira. return encerra a função. null significa que nada foi encontrado.\n\nAdapte o exemplo aos eventos da missão: compare type, procure o deploy e devolva time. O return null deve ficar DEPOIS do laço, para permitir a busca em toda a lista.`,
 `AULA 3 — Filtrar uma lista\n\nVocê pode criar uma lista vazia com const resultado = []; e acrescentar um valor com resultado.push(valor).\n\nExemplo: guardar os títulos dos livros disponíveis:\nconst resultado = [];\nfor (const livro of input) {\n  if (livro.disponivel === true) {\n    resultado.push(livro.titulo);\n  }\n}\nreturn resultado;\n\nNa missão, percorra os testes. Examine status e acrescente name apenas quando o status for SKIP. Mantenha as aspas nas palavras. Retorne a lista inteira, não um nome sozinho. Uma lista vazia é uma resposta válida quando nenhum item corresponde.`,
 `AULA 4 — Cálculos e limites\n\nNesta estação, input é um número, não um objeto. * multiplica e ** calcula potência. 2 ** 0 vale 1; 2 ** 1 vale 2; 2 ** 2 vale 4.\n\nExemplo: dobrar uma quantia a cada etapa, sem passar de 500:\nconst valor = 100 * (2 ** input);\nreturn Math.min(valor, 500);\n\nMath.min escolhe o menor dos números. Substitua a quantia inicial e o teto pelos valores do manual da missão. Você também pode calcular tudo dentro do return.\n\nFaça uma tabela para input 0, 1, 2, 3 e 6 antes de executar. O limite deve impedir crescimento infinito.`,
 `AULA 5 — Objetos de comandos\n\nUm objeto agrupa valores com nomes: { luz: true, alarme: false }. Retorne booleanos, não as palavras "true" e "false" entre aspas.\n\nExemplo: ativar luz se estiver escuro e alarme apenas se houver movimento:\nconst luz = input.escuro === true;\nconst alarme = luz && input.movimento === true;\nreturn { luz: luz, alarme: alarme };\n\nNa missão, crie isolate usando o limite de retries. Crie rollback combinando esse limite com o tráfego baseline. Retorne exatamente essas duas propriedades. Uma estação com tráfego alto pode precisar de isolamento sem rollback. Leia os quatro cenários no manual e confira cada decisão.`
];

ZeroComputer.prototype.explore=function(folder='',back=false){
 const p=this.owner.panel;let w=p.querySelector('.code-explorer');
 if(!w){
  w=document.createElement('section');w.className='code-explorer explorer-modern';
  w.innerHTML='<header tabindex="0"><strong><img src="assets/zeroos/imported/5.png" alt=""> ZeroFiles</strong><div><button class="files-max" aria-label="Maximizar explorador">□</button><button class="files-close" aria-label="Fechar explorador">×</button></div></header><div class="files-navigation"><button class="files-back" aria-label="Voltar">←</button><button class="files-home" aria-label="Início">⌂</button><div class="files-path"></div><input class="files-search" type="search" placeholder="Pesquisar nesta pasta" aria-label="Pesquisar nesta pasta"></div><div class="files-toolbar"><button class="files-sort">Nome ↑</button></div><div class="files-layout"><aside class="files-sidebar"></aside><div class="files-center"><div class="files-columns"><span>Nome</span><span>Tipo</span><span>Tamanho</span><span>Data de modificação</span></div><div class="file-list"></div></div><article class="files-details"><img class="preview-icon" src="assets/zeroos/imported/6.png" alt=""><h3>Selecione um arquivo</h3><pre class="file-preview"></pre><div class="preview-actions"></div></article></div><footer class="files-footer"></footer>';
  p.querySelector('.pc-desktop').append(w);this.fileHistory=[];
 }
 if(!back&&this.fileFolder!==undefined&&this.fileFolder!==folder)this.fileHistory.push(this.fileFolder);
 this.fileFolder=folder;this.owner.windowManager.adopt({id:'explorer',el:w,body:w.querySelector('.files-layout'),header:w.querySelector('header'),title:'Arquivos',icon:'assets/zeroos/imported/5.png'});
 const find=s=>w.querySelector(s),r=this.record(this.c.id),m=CODE_MISSIONS.find(m=>m.id===this.c.id),entries=[];
 find('.files-path').textContent='Este computador  ›  '+(folder||'Início');find('.files-search').value='';
 find('.files-back').disabled=!this.fileHistory.length;
 find('.files-back').onclick=()=>{const previous=this.fileHistory.pop();this.explore(previous||'',true);};find('.files-home').onclick=()=>this.explore();
 find('.file-preview').textContent=folder==='ZeroVault'?'Seu caderno de investigação. Documentos encontrados, pistas e credenciais ficam disponíveis aqui, em qualquer PC.':'Abra uma pasta ou selecione um arquivo para ler. Dica: a equipe deixou um caderno de treinamento e as instruções em pastas diferentes.';
 find('.files-details h3').textContent=folder==='ZeroVault'?'ZeroVault / Descobertas':'Prévia do arquivo';find('.preview-actions').textContent='';
 const show=(name,text,icon='6')=>{find('.files-details h3').textContent=name;find('.file-preview').textContent=text;find('.preview-icon').src='assets/zeroos/imported/'+icon+'.png';find('.preview-actions').textContent='';};
 const action=(label,fn)=>{const b=document.createElement('button');b.textContent=label;b.onclick=fn;find('.preview-actions').append(b);};
 const editor=()=>this.owner.launchTrace();
 const manual=mission=>{show('instrucoes.txt',mission.name+'\n\n'+mission.manual);action('Abrir ZeroTrace',editor);};
 const lesson=mission=>{show('Caderno de treinamento — '+mission.file,'Mensagem de Lívia, equipe de desenvolvimento\n\nSe você chegou agora, respire. Este caderno ensina o necessário para recuperar a estação.\n\nCOMO USAR O EDITOR\n1. Abra ZeroTrace. O editor já representa o corpo de uma função: não escreva function por fora.\n2. input é o dado que os testes entregam a você.\n3. Escreva uma resposta usando return. Texto usa aspas; números não. Linhas que começam com // são comentários.\n4. Encontre instrucoes.txt para conhecer as regras desta estação.\n5. Edite com calma: digitar e ler não gastam tentativas. Só executar código incorreto conta como erro.\n6. Depois de 3 erros no mesmo PC, a partida termina. Fechar a janela não apaga os erros.\n\n'+ZERO_TUTORIALS[CODE_MISSIONS.indexOf(mission)]+'\n\nDEPOIS DA MISSÃO\nA senha e a evidência serão guardadas no ZeroVault. A sequência é Dev 1 → Dev 2 → QA → Técnico → Infra.');action('Abrir ZeroTrace',editor);};
 const add=(name,type,icon,open)=>entries.push({name,type,icon,open});
 const folders=['Documentos','Projetos','Backup','Equipe','Downloads','Arquivo','ZeroVault','ZeroOS'];
 const sidebar=find('.files-sidebar');sidebar.textContent='';
 for(const name of ['Início',...folders]){const b=document.createElement('button');b.innerHTML='<img src="assets/zeroos/imported/'+(name==='Início'?'5':'folder')+'.png" alt=""><span></span>';b.querySelector('span').textContent=name;b.classList.toggle('active',(name==='Início'?'':name)===folder);b.onclick=()=>this.explore(name==='Início'?'':name);sidebar.append(b);}
 if(!folder){for(const name of folders)add(name,'Pasta','folder',()=>this.explore(name));}
 else if(folder==='ZeroVault'||folder==='Credenciais'){
  for(const mission of CODE_MISSIONS){const state=this.record(mission.id);
   if(state.read)add('Instruções · '+mission.file,'Documento','6',()=>manual(mission));
   if(state.tutorialRead)add('Treinamento · '+mission.file,'Tutorial','6',()=>lesson(mission));
   if(state.solved){const index=CODE_MISSIONS.indexOf(mission);add('Recuperação · '+mission.file,'Relatório','4',()=>show('Missão concluída',mission.reward));
    if(index<CODE_MISSIONS.length-1)add('Acesso · '+CODE_MISSIONS[index+1].file,'Credencial','4',()=>show('Credencial recuperada',mission.reward+'\n\nSenha: '+state.password+'\n\nDigite esta senha na próxima estação.','4'));
   }
  }
  for(const clue of Object.values(this.owner.g.cluesData||{})){if(this.owner.g.clues.hasClue(clue.id))add(clue.title,'Evidência','6',()=>show(clue.title,(clue.body||[]).join('\n\n')));}
  if(!entries.length)find('.file-preview').textContent='O cofre ainda está vazio. Encontre documentos no explorador ou conclua a primeira missão. Suas descobertas aparecerão aqui automaticamente.';
 }else if(folder==='ZeroOS'){
  add('kernel.zero','Sistema','1',()=>{show('kernel.zero','Núcleo essencial do ZeroOS simulado. Excluí-lo permite que LoopZero destrua a estação e encerra a partida.','1');action('Excluir sistema…',()=>{show('Confirmar exclusão','Esta ação causa GAME OVER. Ela afeta apenas o ZeroOS dentro do jogo.');action('Cancelar',()=>this.explore('ZeroOS'));action('Confirmar exclusão',()=>this.gameOver('O núcleo do ZeroOS foi excluído.'));});});
 }else{
  add('leia-me.txt','Documento','6',()=>show('Nota da equipe','Lívia separou o treinamento de programação das instruções operacionais. Explore as pastas locais; há um caderno para iniciantes. Documentos lidos ficam no ZeroVault.'));
  if(folder===r.folder)add('instrucoes.txt','Missão','6',()=>{r.read=true;manual(m);if(p.querySelector('.code-run')&&!r.solved)this.refresh();});
  if(folder===r.tutorialFolder)add('treinamento-livia.txt','Tutorial','6',()=>{r.tutorialRead=true;lesson(m);});
 }
 let descending=false;
 const render=()=>{
  const list=find('.file-list'),query=find('.files-search').value.toLocaleLowerCase();list.textContent='';
  const visible=entries.filter(e=>e.name.toLocaleLowerCase().includes(query)).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')*(descending?-1:1));
  for(const entry of visible){const b=document.createElement('button');b.className='file-row';b.innerHTML='<img alt=""><span class="file-name"></span><span class="file-kind"></span><span class="file-size">1 KB</span><span class="file-date">01/10/2026 02:14</span>';b.querySelector('img').src='assets/zeroos/imported/'+entry.icon+'.png';b.querySelector('.file-name').textContent=entry.name;b.querySelector('.file-kind').textContent=entry.type;b.onclick=()=>{list.querySelectorAll('button').forEach(el=>el.classList.remove('selected'));b.classList.add('selected');entry.open();};list.append(b);}
  if(!visible.length){const empty=document.createElement('p');empty.className='files-empty';empty.textContent=query?'Nenhum arquivo encontrado nesta pasta.':'Nenhum item por enquanto.';list.append(empty);}
  find('.files-footer').textContent=visible.length+' itens · '+this.c.name+' · Arquivos do jogo';
 };
 find('.files-search').oninput=render;find('.files-sort').textContent='Nome ↑';find('.files-sort').onclick=()=>{descending=!descending;find('.files-sort').textContent='Nome '+(descending?'↓':'↑');render();};render();
};
