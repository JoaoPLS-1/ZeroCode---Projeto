const ZERO_WIRESHARK_APP = {
 id:'wireshark',name:'Wireshark',icon:'assets/zeroos/trace.svg',availableAt:['computer_infra_upper'],requires:'app:wireshark',
 openLocked(ctx){
  const body=ctx.window.body;body.classList.add('zero-app-about');
  const title=document.createElement('h2');title.textContent='Autenticação necessária — senha do administrador (Kael)';
  const text=document.createElement('p');text.textContent='Kael não se lembra da senha. Recuperar cinco lembranças libera o acesso à captura de rede.';
  body.append(title,text);
  const off=ctx.game.progress.on(()=>{if(ctx.game.progress.requires(this.requires)&&body.isConnected){off();body.replaceChildren();body.classList.remove('zero-app-about');this.open(ctx).catch(error=>{if(body.isConnected)body.textContent=error.message;});}});
  // A janela pode ser fechada independentemente do desktop.
  const owner=ctx.computer.owner,record=owner.windowManager.windows.get(this.id);
  if(record){const original=record.onClose;record.onClose=()=>{off();original?.();};}
  owner.osMenuEvents.signal.addEventListener('abort',off,{once:true});
 },
 async open(ctx){
  const body=ctx.window.body;body.classList.add('zero-app-wireshark');body.textContent='Carregando captura…';
  const result=await api.get('/api/jogo/captura?estacao='+encodeURIComponent(ctx.station.id));
  if(!body.isConnected)return;
  body.replaceChildren();const packets=result.pacotes;
  const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  const form=make('form','wireshark-filter'),input=make('input');input.type='text';input.autocomplete='off';input.spellcheck=false;
  input.placeholder='Filtro de exibição';input.setAttribute('aria-label','Filtro de exibição');
  const apply=make('button',null,'Aplicar');apply.type='submit';form.append(input,apply);
  const feedback=make('div','wireshark-feedback');feedback.setAttribute('role','status');
  const list=make('div','wireshark-list'),table=make('table');table.setAttribute('aria-label','Pacotes da captura');
  const head=make('thead'),header=make('tr');
  for(const label of ['Nº','Tempo','Origem','Destino','Protocolo','Tamanho','Informações'])header.append(make('th',null,label));
  head.append(header);const rows=make('tbody');table.append(head,rows);list.append(table);
  const panels=make('div','wireshark-panels'),details=make('section','wireshark-details'),bytes=make('section','wireshark-bytes');
  details.setAttribute('aria-label','Camadas do pacote');bytes.setAttribute('aria-label','Bytes do payload');panels.append(details,bytes);
  const thought=make('p','wireshark-thought');thought.hidden=true;thought.setAttribute('role','status');
  const status=make('div','wireshark-status');body.append(form,feedback,list,panels,thought,status);
  let reporting=false;
  async function select(packet,row){
   rows.querySelectorAll('tr').forEach(r=>r.setAttribute('aria-selected',String(r===row)));
   details.replaceChildren();bytes.replaceChildren(make('h3',null,'Bytes do payload (hexadecimal · ASCII)'));
   for(const layer of packet.camadas){const lines=layer.split('\n'),branch=make('details');branch.append(make('summary',null,lines.shift()),make('pre',null,lines.join('\n')));details.append(branch);}
   const payload=new TextEncoder().encode(packet.payload||''),lines=[];
   for(let offset=0;offset<payload.length;offset+=16){const chunk=[...payload.slice(offset,offset+16)];lines.push(offset.toString(16).padStart(4,'0')+'  '+chunk.map(b=>b.toString(16).padStart(2,'0')).join(' ').padEnd(47,' ')+'  '+chunk.map(b=>b>=32&&b<=126?String.fromCharCode(b):'.').join(''));}
   bytes.append(make('pre',null,lines.join('\n')));
   if(packet.protocolo!=='TCP'||reporting||ctx.game.progress.has('evento:batimento-visto'))return;
   // O servidor reconhece o pacote e concede o evento; não há IP/porta secreto no app.
   reporting=true;
   try{
    const event=await api.post('/api/jogo/eventos',{chave:'evento:batimento-visto',estacao:ctx.station.id,pacote:packet.n});
    if(body.isConnected&&event.nova){thought.textContent='Kael (pensa): “'+event.pensamento+'”';thought.hidden=false;}
   }catch(error){
    // Pacotes comuns são recusados pelo servidor. Uma falha de rede pode ser tentada de novo.
    if(body.isConnected&&error.message!=='Evento não permitido.')feedback.textContent=error.message;
   }finally{reporting=false;}
  }
  function validate(){try{const predicate=WiresharkFilter.compile(input.value);input.className='valid';input.setAttribute('aria-invalid','false');feedback.textContent='Filtro válido';apply.disabled=false;return predicate;}catch(error){input.className='invalid';input.setAttribute('aria-invalid','true');feedback.textContent=error.message;apply.disabled=true;return null;}}
  function render(predicate){
   rows.replaceChildren();const visible=packets.filter(predicate);
   for(const packet of visible){const row=make('tr','wireshark-'+packet.protocolo.toLowerCase());row.tabIndex=0;row.setAttribute('aria-selected','false');
    for(const value of [packet.n,packet.tempo,packet.origem,packet.destino,packet.protocolo,packet.tamanho,packet.info])row.append(make('td',null,String(value)));
    row.onclick=()=>select(packet,row);row.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select(packet,row);}};rows.append(row);
   }
   details.textContent='Selecione um pacote para ver as camadas.';bytes.textContent='Selecione um pacote para ver os bytes.';
   status.textContent='Pacotes: '+packets.length+' · Exibidos: '+visible.length;
  }
  input.oninput=validate;form.onsubmit=event=>{event.preventDefault();const predicate=validate();if(predicate)render(predicate);};
  render(validate());
 }
};
registerZeroApp(ZERO_WIRESHARK_APP);
if(typeof module!=='undefined')module.exports=ZERO_WIRESHARK_APP;
