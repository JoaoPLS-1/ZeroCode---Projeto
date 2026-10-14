// Evidências e validação vêm do servidor; o editor envia apenas texto.
const ZERO_PIPELINE_APP = {
 id:'pipeline',name:'Pipeline',icon:'assets/zeroos/link.svg',availableAt:['computer_qa_upper','computer_qa_infra_lower'],
 async open(ctx){
  const body=ctx.window.body;body.classList.add('zero-app-pipeline');
  const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  const button=(text,click)=>{const el=make('button',null,text);el.type='button';el.onclick=click;return el;};
  const nav=make('nav','pipeline-tabs'),runs=make('section'),config=make('section');nav.setAttribute('aria-label','Abas da Pipeline');
  const status=make('p','pipeline-status');status.setAttribute('aria-live','polite');
  body.append(make('h2',null,'Pipeline · NEXUS'),nav,runs,config,status);
  const tabs=[button('Execuções',()=>tab(false)),button('Configuração',()=>tab(true))];nav.append(...tabs);
  function tab(edit){runs.hidden=edit;config.hidden=!edit;tabs[0].setAttribute('aria-pressed',String(!edit));tabs[1].setAttribute('aria-pressed',String(edit));}
  tab(false);status.textContent='Carregando…';
  try{
   const data=await api.get('/api/jogo/pipeline?estacao='+encodeURIComponent(ctx.station.id));if(!body.isConnected)return;
   status.textContent='';
   const log=make('pre','pipeline-log','Selecione uma execução para ler o log da etapa de testes.');log.setAttribute('aria-live','polite');
   for(const run of data.execucoes){
    const row=make('article','pipeline-run');
    row.append(button('NEXUS '+run.versao+' · '+run.horario,()=>{
     log.textContent='NEXUS '+run.versao+' · Log de testes\n'+run.log;
    }),make('p',null,'build: '+run.build),make('p',null,'testes: '+run.testes),make('p',null,'deploy: '+run.deploy));runs.append(row);
   }
   runs.append(log);
   const label=make('label',null,'pipeline.yml'),editor=make('textarea');editor.value=data.yaml;editor.rows=12;editor.spellcheck=false;editor.setAttribute('aria-label','Configuração pipeline.yml');label.append(editor);
   const save=button('Validar e salvar',async()=>{
    if(save.disabled)return;save.disabled=true;status.textContent='Validando…';
    try{
     const result=await api.post('/api/jogo/pipeline',{yaml:editor.value});if(!body.isConnected)return;
     status.textContent=result.mensagem;
    }catch(error){if(body.isConnected)status.textContent=error.message;}
    finally{if(body.isConnected)save.disabled=false;}
   });
   config.append(make('p',null,'Confira se uma falha nos testes impede a publicação e se o deploy depende da etapa de testes.'),label,save);
  }catch(error){if(body.isConnected)status.textContent=error.message;}
 }
};
if(typeof registerZeroApp==='function')registerZeroApp(ZERO_PIPELINE_APP);
if(typeof module!=='undefined')module.exports={ZERO_PIPELINE_APP};
