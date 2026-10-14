// Adaptador S2: a fonte dos dados ? o catálogo de desafios.
const { challenges, inputs } = require('../challenges.cjs');
const missions = challenges.filter(c => Number.isInteger(c.ordemS2)).sort((a,b)=>a.ordemS2-b.ordemS2).map(c => ({
  ...c, public:{id:c.id,name:c.titulo,file:c.arquivo,starter:c.codigoInicial,manual:c.enunciado},
  fixed:c.casosFixos, reference:c.referencia, generate:()=>c.gerarCasos(Math.random)[0], reward:c.recompensa,
}));
module.exports = { missions, inputs };
