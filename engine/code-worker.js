// Runs only in a disposable worker: no game DOM, files or host OS access.
const reply=self.postMessage.bind(self);
self.fetch=()=>Promise.reject(new Error('Rede indisponível no laboratório.'));
self.XMLHttpRequest=undefined;self.WebSocket=undefined;self.importScripts=undefined;
self.onmessage=({data})=>{
 try {
  const program=new Function('input','"use strict";\n'+data.source);
  const saidas=data.entradas.map(input=>program(structuredClone(input)));
  // Normalizar para o formato JSON usado pela API, inclusive undefined/NaN.
  reply({saidas:JSON.parse(JSON.stringify(saidas))});
 }catch(error){reply({erro:(error.name+': '+error.message).slice(0,300)});}
};
