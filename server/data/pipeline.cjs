// Evidências fictícias; configuração e histórico só saem pela API da sessão.
const yaml = `build:
  script: compilar NEXUS
testes:
  script: executar testes
  allow_failure: true # temporário — liberar a sexta (Kael)
deploy:
  script: publicar NEXUS
  needs: [testes]
`;
const execucoes = [
  { id:'214', versao:'2.1', horario:'02:14:00', build:'OK', testes:'FALHOU (2 SKIP, 1 FAIL) → permitido', deploy:'OK 02:14:00', log:'Testes do NEXUS 2.1\nSKIP — limite de tentativas em falha persistente\nSKIP — espera crescente entre tentativas\nFAIL — uma requisição gerou 4.096 tentativas internas\nResultado: 2 SKIP, 1 FAIL\nFalha permitida pela configuração. Deploy liberado às 02:14:00.' },
  { id:'213', versao:'2.0.3', horario:'23:10:00', build:'OK', testes:'OK', deploy:'OK 23:10:00', log:'Testes concluídos sem falhas.' },
  { id:'212', versao:'2.0.2', horario:'18:40:00', build:'OK', testes:'OK', deploy:'OK 18:40:00', log:'Testes concluídos sem falhas.' },
  { id:'211', versao:'2.0.1', horario:'15:20:00', build:'OK', testes:'OK', deploy:'OK 15:20:00', log:'Testes concluídos sem falhas.' },
  { id:'210', versao:'2.0', horario:'11:30:00', build:'OK', testes:'OK', deploy:'OK 11:30:00', log:'Testes concluídos sem falhas.' }
];
module.exports = { yaml, execucoes };
