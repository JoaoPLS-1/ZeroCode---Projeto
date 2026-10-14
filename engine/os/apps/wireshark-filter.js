// Parser de filtros de exibição; não executa código e não depende do DOM.
const WiresharkFilter = (()=>{
 function compile(source){
  if(typeof source!=='string'||source.length>2048)throw new SyntaxError('Filtro muito longo ou inválido.');
  const tokens=[];let offset=0;
  while(offset<source.length){
   if(/\s/.test(source[offset])){offset++;continue;}
   const match=source.slice(offset).match(/^(==|!=|&&|\|\||!|\(|\)|"(?:[^"\\]|\\["\\nrt])*"|[a-zA-Z0-9_.]+)/);
   if(!match)throw new SyntaxError('Caractere inválido no filtro.');
   tokens.push(match[0]);offset+=match[0].length;
  }
  let pos=0,depth=0;
  const peek=()=>tokens[pos],take=()=>tokens[pos++];
  const invalid=()=>{throw new SyntaxError('Filtro inválido: confira campos, operadores e valores.');};
  const isTcp=p=>['TCP','HTTP'].includes(p.protocolo),isUdp=p=>['UDP','DNS'].includes(p.protocolo);
  function atom(){
   const field=take();
   if(field==='('){const predicate=expression();if(take()!==')')invalid();return predicate;}
   if(field==='frame'){
    if(take()!=='contains'||!peek()?.startsWith('"'))invalid();
    const text=JSON.parse(take());return p=>[p.info,p.payload,...(p.camadas||[])].join('\n').includes(text);
   }
   if(['tcp','udp','http','dns'].includes(field))return p=>field==='tcp'?isTcp(p):field==='udp'?isUdp(p):p.protocolo===field.toUpperCase();
   if(!['ip.addr','ip.src','ip.dst','tcp.port','udp.port'].includes(field))invalid();
   const op=take(),value=take();if(!['==','!='].includes(op)||!value)invalid();
   if(field.startsWith('ip.')){
    if(!/^\d{1,3}(\.\d{1,3}){3}$/.test(value)||value.split('.').some(v=>Number(v)>255))invalid();
    const ip=value.split('.').map(Number).join('.');
    return p=>{const equal=field==='ip.src'?p.origem===ip:field==='ip.dst'?p.destino===ip:p.origem===ip||p.destino===ip;return op==='=='?equal:!equal;};
   }
   if(!/^\d+$/.test(value)||Number(value)>65535)invalid();
   const port=Number(value),transport=field==='tcp.port'?isTcp:isUdp;
   return p=>transport(p)&&(op==='=='?(p.portaOrigem===port||p.portaDestino===port):(p.portaOrigem!==port&&p.portaDestino!==port));
  }
  function unary(){
   if(++depth>64)invalid();
   let predicate;
   if(peek()==='!'||peek()==='not'){take();const inner=unary();predicate=p=>!inner(p);}else predicate=atom();
   depth--;return predicate;
  }
  function conjunction(){let left=unary();while(peek()==='&&'||peek()==='and'){take();const a=left,b=unary();left=p=>a(p)&&b(p);}return left;}
  function expression(){let left=conjunction();while(peek()==='||'||peek()==='or'){take();const a=left,b=conjunction();left=p=>a(p)||b(p);}return left;}
  if(!tokens.length)return ()=>true;
  const predicate=expression();if(pos!==tokens.length)invalid();return predicate;
 }
 return {compile};
})();
if(typeof module!=='undefined')module.exports=WiresharkFilter;
