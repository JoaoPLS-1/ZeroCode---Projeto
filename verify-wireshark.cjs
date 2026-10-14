const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { compile } = require('./engine/os/apps/wireshark-filter.js');
const { pacotes, pensamento } = require('./server/data/capture.cjs');
const Progress = require('./engine/progress.js');
async function verify() {
  assert.equal(pacotes.length,50);assert.equal(new Set(pacotes.map(p=>p.n)).size,50);
  assert.deepEqual(pacotes.map(p=>p.n),Array.from({length:50},(_,i)=>i+1));
  assert(pacotes.every((p,i)=>!i||p.tempo>=pacotes[i-1].tempo));
  assert.equal(pacotes[0].tempo,'02:14:00');assert(pacotes.at(-1).tempo>='02:17:30');
  const suspicious=pacotes.filter(p=>p.origem==='10.19.56.7');
  assert.deepEqual(suspicious.map(p=>p.tempo),['02:14:15','02:15:15','02:16:15','02:17:15']);
  assert(suspicious.every(p=>p.tamanho===64&&p.portaDestino===2017&&p.camadas.join('\n').includes('RPHJD:EDWLPHQWR')));
  const filter=source=>pacotes.filter(compile(source));
  for(const [source,expected] of [
    ['',50],['  ',50],['ip.addr == 10.19.56.7',4],['ip.src == 10.19.56.7',4],['ip.dst == 10.0.9.66',4],
    ['ip.addr == 10.0.9.66',4],['ip.src != 10.19.56.7',46],['ip.dst != 10.0.9.66',46],['ip.addr != 10.19.56.7',46],
    ['tcp.port == 2017',4],['tcp.port == 42017',4],['udp.port == 53',4],['udp.port == 53000',1],
    ['tcp.port != 2017',42],['udp.port != 53',0],['http',42],['dns',4],['tcp',46],['udp',4],
    ['ip.addr == 10.19.56.7 && tcp.port == 2017',4],['tcp and not http',4],['tcp && !http',4],
    ['http || dns',46],['http or dns',46],['!(http or dns)',4],['not (http || dns)',4],
    ['(http || dns) && ip.addr != 10.19.56.7',46],['http or dns and tcp',42],['(http or dns) and tcp',42],
    ['(http or dns) and udp',4],['!!tcp',46],['not not tcp',46],
    ['frame contains "RPHJD:EDWLPHQWR"',4],['frame contains "503 Service Unavailable"',12],
    ['frame contains "pedido-cafe-1042"',8],['frame contains "não existe"',0],
  ])assert.equal(filter(source).length,expected,source);
  assert(filter('http').every(p=>p.protocolo==='HTTP'));
  for(const source of ['ip.foo == 10.0.0.1','ip.addr = 10.0.0.1','ip.addr == 999.0.0.1','ip.addr == 1.2.3','tcp.port == -1',
    'udp.port == 65536','tcp.port == 1.5','tcp.port','tcp &&','or tcp','()','(tcp','tcp)','tcp http',
    'frame contains x','frame == "x"','frame contains "x','tcp & http','tcp;alert(1)','http == tcp','!',
    '('.repeat(80)+'tcp'+')'.repeat(80),'!'.repeat(80)+'tcp','x'.repeat(2049)])assert.throws(()=>compile(source),SyntaxError,source);
  assert.throws(()=>compile(null),SyntaxError);
  console.log('Wireshark: captura de 50 pacotes ordenados, composição, quatro batimentos a cada 60 s, filtros por campo/protocolo/texto, operadores, precedência, parênteses e inválidos aprovados.');

  // DOM mínimo com proteção contra interpretação de conteúdo como HTML.
  class Element {
    constructor(tag){this.tag=tag;this.children=[];this.value='';this.isConnected=true;this.attributes={};this.classList={add(){},remove(){}};}
    set innerHTML(value){throw new Error('Conteúdo da captura deve ser texto.');}
    set textContent(value){this.text=value;this.children=[];}
    get textContent(){return (this.text||'')+this.children.map(child=>child.textContent).join('');}
    append(...children){this.children.push(...children);}replaceChildren(...children){this.text='';this.children=children;}
    setAttribute(name,value){this.attributes[name]=value;}
    querySelectorAll(tag){return this.children.flatMap(child=>[...(child.tag===tag?[child]:[]),...child.querySelectorAll(tag)]);}
  }
  let definition,reads=0,reports=0,failRead=false;
  const progress=new Progress(),controller=new AbortController(),record={};
  const scope=vm.createContext({TextEncoder,WiresharkFilter:{compile},registerZeroApp:def=>{definition=def;},
    document:{createElement:tag=>new Element(tag)},api:{
      get:async path=>{reads++;assert.equal(path,'/api/jogo/captura?estacao=computer_infra_upper');if(failRead)throw new Error('Sem conexão');return {pacotes};},
      post:async (path,body)=>{reports++;assert.equal(path,'/api/jogo/eventos');assert.equal(body.chave,'evento:batimento-visto');assert.equal(body.estacao,'computer_infra_upper');
        assert(suspicious.some(p=>p.n===body.pacote));progress.sincronizar({progresso:['app:wireshark','evento:batimento-visto']});return {nova:true,pensamento};},
    }});
  vm.runInContext(fs.readFileSync('engine/os/apps/wireshark.js','utf8'),scope);
  assert.equal(definition.requires,'app:wireshark');assert.deepEqual(Array.from(definition.availableAt),['computer_infra_upper']);
  const ctx={game:{progress},station:{id:'computer_infra_upper'},computer:{owner:{windowManager:{windows:new Map([['wireshark',record]])},osMenuEvents:controller}},window:{body:new Element('div')}};
  definition.openLocked(ctx);assert.equal(reads,0);assert(ctx.window.body.textContent.includes('Kael não se lembra'));
  assert.equal(ctx.window.body.querySelectorAll('input').length,0);
  record.onClose();assert.equal(progress._listeners.size,0);
  ctx.window.body=new Element('div');definition.openLocked(ctx);
  progress.sincronizar({progresso:['app:wireshark']});await new Promise(resolve=>setImmediate(resolve));
  assert.equal(reads,1);assert.equal(progress._listeners.size,0);
  const body=ctx.window.body,[form,feedback,list,panels,thought,status]=body.children,[input,apply]=form.children;
  assert.equal(status.textContent,'Pacotes: 50 · Exibidos: 50');
  const submit=source=>{input.value=source;form.onsubmit({preventDefault(){}});};
  input.value='tcp.port == nope';input.oninput();assert.equal(input.attributes['aria-invalid'],'true');assert(apply.disabled);
  assert.equal(status.textContent,'Pacotes: 50 · Exibidos: 50');
  submit('ip.addr == 10.19.56.7');assert.equal(input.attributes['aria-invalid'],'false');assert(!apply.disabled);
  assert.equal(status.textContent,'Pacotes: 50 · Exibidos: 4');
  const row=list.querySelectorAll('tbody')[0].children[0];await row.onclick();
  assert(panels.textContent.includes('Porta de destino: 2017'));assert(panels.textContent.includes('RPHJD:EDWLPHQWR'));
  assert(panels.textContent.includes('52 50 48 4a 44'));assert.equal(reports,1);assert(!thought.hidden);assert(thought.textContent.includes(pensamento));
  await row.onclick();assert.equal(reports,1);
  submit('http');await list.querySelectorAll('tbody')[0].children[0].onclick();assert.equal(reports,1);
  submit('frame contains "ausente"');assert.equal(status.textContent,'Pacotes: 50 · Exibidos: 0');
  const detached={...ctx,window:{body:new Element('div')}};detached.window.body.isConnected=false;
  await definition.open(detached);assert.equal(detached.window.body.children.length,0);
  failRead=true;await assert.rejects(()=>definition.open(ctx),/Sem conexão/);
  progress.sincronizar({progresso:[]});definition.openLocked(ctx);controller.abort();assert.equal(progress._listeners.size,0);
  console.log('Wireshark UI: autenticação sem campo/senha/captura, liberação com janela aberta, filtros válidos/inválidos, contagem, detalhes, hex/ASCII, pensamento único, fechamento, desconexão e limpeza aprovados.');
}
verify().catch(error=>{console.error(error);process.exitCode=1;});
