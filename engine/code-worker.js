// Runs only in a disposable worker: no game DOM, files or host OS access.
const reply=self.postMessage.bind(self);
self.fetch=()=>Promise.reject(new Error('Rede indisponível no laboratório.'));
self.XMLHttpRequest=undefined;self.WebSocket=undefined;self.importScripts=undefined;
self.onmessage=({data})=>{
 try {
  const program=new Function('input','"use strict";\n'+data.source);
  const equal=(a,b)=>{
   if(a===b)return true;
   if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
   const keys=Object.keys(a);return keys.length===Object.keys(b).length&&keys.every(k=>Object.prototype.hasOwnProperty.call(b,k)&&equal(a[k],b[k]));
  };
  const results=data.tests.map(([input,expected],i)=>{
   const actual=program(structuredClone(input));
   return {test:i+1,ok:equal(actual,expected),input,expected,actual:String(JSON.stringify(actual))};
  });
  reply({ok:results.every(r=>r.ok),results});
 }catch(error){reply({ok:false,error:error.name+': '+error.message});}
};
