const definition = require('../data/missions.js');
const progress = require('./progress.cjs');
const { readJson, json } = require('./router.cjs');
// Referência e explicações privadas: só são devolvidas após confirmar a decisão.
const explanations = {
 omega:{
  isolar:'Isolar ÔMEGA e o servidor legado contém a comunicação suspeita e preserva evidências para investigar.',
  monitorar:'Monitorar ajuda a observar, mas manter ÔMEGA ativa permite que continue operando. O isolamento contém o risco e preserva evidências.',
  desligar:'Desligar tudo interrompe também os serviços da equipe e pode perder evidências. Isolar ÔMEGA e o legado permite investigar com menos impacto.'},
 deploy:{
  rollback:'O rollback retira a versão que iniciou a tempestade. Limite de tentativas e espera progressiva impedem que uma falha se multiplique.',
  fila:'Uma fila maior só adia a saturação enquanto os retries continuam sem limite. O rollback, seguido de limite e espera, trata a causa.',
  reiniciar:'Reiniciar não altera o código do retry; a tempestade pode voltar. O rollback e a correção com limite e espera tratam a causa.'},
 processo:{
  revisao:'Revisão humana, QA acionado e testes que barram o deploy conferem o código gerado antes de publicar, inclusive nos caminhos de falha.',
  proibir:'Proibir IA não garante validação nem testes: código humano também pode falhar. Revisão, QA e pipeline que barra devem valer para todo código.',
  manter:'Manter o processo deixa as mesmas lacunas de revisão e testes. Revisão humana, QA e pipeline que barra ajudam a impedir outro incidente.'}
};
const best = {omega:'isolar',deploy:'rollback',processo:'revisao'};
function evaluate(session, choices) {
 const actions = Object.keys(best).filter(key => choices[key] === best[key]).length;
 const flags = progress.count(session, 'flag:');
 const points = actions * 2 + Math.min(flags, 5);
 const rank = points === 11 ? 'S' : points >= 7 ? 'A' : 'B';
 return {title:'DECISÃO REGISTRADA · CLASSIFICAÇÃO '+rank,rank,flags,
  body:['D.A.N.I.E.L.: Vamos analisar as ações que você escolheu, Kael.',
   ...definition.choices.map(choice => choice.title+': '+explanations[choice.id][choices[choice.id]]),
   `CLASSIFICAÇÃO ${rank} / ${flags} flags capturadas / ${actions} de 3 ações que tratam as causas.`,
   'Cada ação que trata a causa vale 2 pontos; cada flag vale 1, até 5. S: 11 pontos; A: 7 a 10; B: até 6. O aprendizado continua com a equipe.']};
}
function installDecisionRoutes(router, sessions) {
 router.add('POST', '/api/jogo/decisao', async (req,res) => {
  const session = sessions.get(req);
  if (!session) return json(res,401,{ok:false,erro:'Inicie uma nova partida.'});
  const body = await readJson(req);
  if (!progress.has(session,'evento:omega-encontrada')) return json(res,403,{ok:false,erro:'Encontre ÔMEGA antes de tomar a decisão.'});
  // Verificar depois da leitura assíncrona impede duas confirmações concorrentes.
  if (session.decisao) return json(res,409,{ok:false,erro:'A decisão desta partida já foi registrada.'});
  const choices = body?.escolhas;
  if (!choices || typeof choices !== 'object' || Array.isArray(choices) || Object.keys(choices).length !== 3 ||
   !definition.choices.every(choice => choice.options.some(option => option.id === choices[choice.id])))
   return json(res,400,{ok:false,erro:'Escolha uma opção para ÔMEGA, deploy e processo.'});
  session.decisao = evaluate(session,choices);
  json(res,200,{ok:true,resultado:session.decisao});
 });
}
module.exports = {evaluate,installDecisionRoutes};
