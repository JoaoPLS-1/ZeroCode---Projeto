// Repositório fictício. O gabarito do review nunca é serializado pela API.
const linha = (id, tipo, texto) => ({ id, tipo, texto });
const retryDiff = [
  linha('r1','contexto','function retry(attempt) {'),
  linha('r2','removida','  if (attempt >= 3) return fail();'),
  linha('r3','contexto','  if (send()) return success();'),
  linha('r4','removida','  return schedule(() => retry(attempt + 1), backoff(attempt));'),
  linha('r5','adicionada','  return retry(attempt + 1);'),
  linha('r6','contexto','}'),
  linha('r7','removida','// Retry com teto e espera crescente.'),
  linha('r8','adicionada','// Reenvio simplificado.'),
];
const anteriores = [
  ['a10b001','Edu','2026-05-08T16:00:00-03:00','feat(nexus): inicia serviço','nexus.js','export const version = "2.0";'],
  ['b20c002','Edu','2026-05-08T16:20:00-03:00','feat(retry): limita tentativas','retry.js','function retry(attempt) {\n  if (attempt >= 3) return fail();\n  if (send()) return success();\n  return schedule(() => retry(attempt + 1), backoff(attempt));\n}\n// Retry com teto e espera crescente.'],
  ['c30d003','Steve','2026-05-08T17:00:00-03:00','feat(log): registra tentativas','log.js','export const registrar = evento => gravar(evento);'],
  ['d40e004','Mark','2026-05-08T17:30:00-03:00','test(nexus): cobre resposta de sucesso','retry.test.js','expect(retry(0)).toEqual(success());'],
  ['e50f005','Edu','2026-05-08T18:00:00-03:00','feat(fila): acompanha pendências','queue.js','export const pendencias = [];'],
  ['f60a006','Rick','2026-05-08T18:30:00-03:00','docs(release): descreve versão 2.0','release.md','Versão 2.0: fila e retry limitado.'],
  ['a70b007','Steve','2026-05-08T19:00:00-03:00','feat(metrics): mede tamanho da fila','metrics.js','export const filaAtual = () => pendencias.length;'],
  ['b80c008','Mark','2026-05-08T19:30:00-03:00','test(fila): verifica inclusão de pedido','queue.test.js','expect(enqueue(pedido)).toEqual(1);'],
  ['c90d009','Edu','2026-05-08T20:00:00-03:00','docs(retry): descreve limite de três tentativas','retry.md','Toda repetição precisa de teto e espera crescente.'],
  ['da0e010','Rick','2026-05-08T23:00:00-03:00','chore(release): prepara versão 2.1','release.md','Versão 2.1 preparada para publicação.'],
];
const commits = anteriores.map(([hash,autor,data,mensagem,arquivo,texto]) => ({ hash,autor,data,mensagem,arquivos:[arquivo],
  diff:[{ arquivo, linhas:texto.split('\n').map((texto,i) => linha(hash+'-'+(i+1),'adicionada',texto)) }] }));
commits.push({ hash:'7f2c9a1',autor:'Rick',data:'2026-05-09T02:09:00-03:00',
  mensagem:'refactor(retry): simplifica reenvio (gerado pelo Assistente de IA)',arquivos:['retry.js'],diff:[{ arquivo:'retry.js',linhas:retryDiff }] });
commits.push({ hash:'eb1f012',autor:'Rick',data:'2026-05-09T02:14:00-03:00',mensagem:'release(nexus): publica versão 2.1',arquivos:['release.md'],
  diff:[{ arquivo:'release.md',linhas:[linha('release-1','adicionada','02:14 — Rick publicou NEXUS 2.1 com o commit 7f2c9a1.')] }] });
const pullRequests = [{ numero:214,titulo:'Retry mais simples',commit:'7f2c9a1',autor:'Rick',
  descricao:'Pedi pro assistente refazer o retry, ele gerou, os testes passaram e eu subi. Foi rápido.',
  abertaEm:'2026-05-09T02:09:00-03:00',aprovadaEm:'2026-05-09T02:09:40-03:00',
  aprovador:'bot-aprovador',comentario:'LGTM 🚀',segundosAteAprovar:40,diff:[{ arquivo:'retry.js',linhas:retryDiff }] }];
const blame = { 'retry.js':[
  { linha:1,hash:'b20c002',autor:'Edu',texto:'function retry(attempt) {' },
  { linha:2,hash:'b20c002',autor:'Edu',texto:'  if (send()) return success();' },
  { linha:3,hash:'7f2c9a1',autor:'Rick',texto:'  return retry(attempt + 1);' },
  { linha:4,hash:'b20c002',autor:'Edu',texto:'}' },
  { linha:5,hash:'7f2c9a1',autor:'Rick',texto:'// Reenvio simplificado.' },
] };
const linhasProblematicas = ['r2','r4','r5'];
module.exports = { nome:'nexus', commits, pullRequests, blame, linhasProblematicas };
