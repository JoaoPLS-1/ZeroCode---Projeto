// Interface somente de leitura do repositório; a revisão é validada no servidor.
const ZERO_GIT_APP = {
 id:'git',name:'Git · NEXUS',icon:'assets/zeroos/link.svg',availableAt:['computer_dev_left','computer_dev_right'],
 open(ctx){
  const body=ctx.window.body;body.classList.add('zero-app-git');
  const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  const button=(text,click)=>{const el=make('button',null,text);el.type='button';el.onclick=click;return el;};
  const url=path=>'/api/jogo/repo/'+path+(path.includes('?')?'&':'?')+'estacao='+encodeURIComponent(ctx.station.id);
  const nav=make('nav','git-tabs'),content=make('section','git-content');nav.setAttribute('aria-label','Abas do Git');
  body.append(make('h2',null,'Repositório nexus'),nav,content);
  let revision=0;
  const alive=ticket=>body.isConnected&&revision===ticket;
  function diff(root,files,marked){
   for(const file of files){
    root.append(make('h3',null,file.arquivo));const lines=make('div','git-diff');
    for(const line of file.linhas){
     const prefix=line.tipo==='adicionada'?'+':line.tipo==='removida'?'−':' ';
     const text=prefix+' '+line.texto;
     const el=marked?button(text,()=>{
      if(marked.has(line.id))marked.delete(line.id);else marked.add(line.id);
      el.setAttribute('aria-pressed',String(marked.has(line.id)));
     }):make('pre',null,text);
     el.className='git-line git-'+line.tipo;
     if(marked){el.setAttribute('aria-pressed','false');el.setAttribute('aria-label','Marcar como problema: '+text);}
     lines.append(el);
    }
    root.append(lines);
   }
  }
  async function detail(root,path,render){
   const ticket=++revision;root.textContent='Carregando…';
   try{const result=await api.get(url(path));if(!alive(ticket))return;root.replaceChildren();render(result,ticket);}
   catch(error){if(alive(ticket))root.textContent=error.message;}
  }
  function commit(root,data){
   const c=data.commit;root.append(make('h3',null,c.hash+' · '+c.mensagem),make('p',null,c.autor+' · '+c.data),make('p',null,'Arquivos: '+c.arquivos.join(', ')));diff(root,c.diff);
  }
  function pr(root,data,ticket){
   const p=data.pr,marked=new Set();
   root.append(make('h3',null,'#'+p.numero+' · '+p.titulo),make('p',null,'Autor: '+p.autor+' · Commit: '+p.commit),make('p',null,p.descricao),
    make('p',null,'Aberto em '+p.abertaEm+' · Aprovado em '+p.aprovadaEm),
    make('p',null,'Aprovado por '+p.aprovador+' em '+p.segundosAteAprovar+' s · '+p.comentario));
   if(data.revisado){root.append(make('p',null,'Revisão concluída.'));diff(root,p.diff);return;}
   root.append(make('p',null,'Clique nas linhas que removem as proteções ou tornam o reenvio infinito. Clique novamente para desmarcar.'));
   diff(root,p.diff,marked);
   const status=make('p','git-status');status.setAttribute('aria-live','polite');
   const send=button('Enviar revisão',async()=>{
    if(send.disabled)return;send.disabled=true;
    try{
     const result=await api.post(url('prs/'+p.numero+'/review'),{linhas:[...marked]});
     if(!alive(ticket))return;status.textContent=result.mensagem;
     if(result.ok){root.querySelectorAll('.git-line').forEach(line=>{line.disabled=true;});return;}
    }catch(error){if(alive(ticket))status.textContent=error.message;}
    if(alive(ticket))send.disabled=false;
   });root.append(send,status);
  }
  async function tab(name){
   const ticket=++revision;
   for(const el of nav.children)el.setAttribute('aria-pressed',String(el.textContent===name));
   content.textContent='Carregando…';
   try{
    const path=name==='Histórico'?'historico':name==='Blame'?'blame?arquivo=retry.js':'prs';
    const data=await api.get(url(path));if(!alive(ticket))return;content.replaceChildren();
    if(name==='Blame'){
     const label=make('label',null,'Arquivo '),select=make('select'),option=make('option',null,'retry.js');option.value='retry.js';select.append(option);label.append(select);
     const lines=make('div','git-blame');
     for(const line of data.linhas)lines.append(make('pre',null,line.linha+'  '+line.hash+'  '+line.autor+'  '+line.texto));
     content.append(label,lines);return;
    }
    const list=make('aside','git-list'),root=make('article','git-detail');root.textContent='Selecione '+(name==='Histórico'?'um commit.':'um pull request.');
    content.append(list,root);
    for(const item of name==='Histórico'?data.commits:data.prs){
     const isCommit=name==='Histórico',path=isCommit?'commits/'+item.hash:'prs/'+item.numero;
     const el=button(isCommit?item.hash+' · '+item.mensagem:'#'+item.numero+' · '+item.titulo,()=>{
      for(const other of list.children)other.setAttribute('aria-pressed',String(other===el));
      return detail(root,path,(result,ticket)=>isCommit?commit(root,result):pr(root,result,ticket));
     });el.setAttribute('aria-pressed','false');list.append(el);
    }
   }catch(error){if(alive(ticket))content.textContent=error.message;}
  }
  for(const name of ['Histórico','Blame','Pull requests'])nav.append(button(name,()=>tab(name)));
  return tab('Histórico');
 }
};
if(typeof registerZeroApp==='function')registerZeroApp(ZERO_GIT_APP);
if(typeof module!=='undefined')module.exports={ZERO_GIT_APP};
