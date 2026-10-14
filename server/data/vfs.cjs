// provisório — substituído na tarefa 13
const VFS_FILES = {
  '/home/kael/leia-me.txt': {
    id: 'leia-me',
    content: 'Kael, comece pelos registros do NEXUS em /var/log/nexus.log.\nOs contatos da equipe ficam em /srv/equipe/contatos.txt.\nCruze as pistas na ordem que preferir.',
    size: '1 KB', modified: '13/10/2026 02:20',
  },
  '/var/log/nexus.log': {
    id: 'nexus-log',
    content: [
      '02:13:50 NEXUS 2.0 em operação',
      '02:13:52 Fila de pagamentos estável',
      '02:13:55 Preparando deploy 2.1',
      '02:13:57 Commit 7f2 selecionado',
      '02:14:00 Deploy 2.1 iniciado',
      '02:14:01 Configuração de retries atualizada',
      '02:14:02 Limite de retries ausente',
      '02:14:03 Serviço de pagamento retornou 503',
      '02:14:04 Nova tentativa interna iniciada',
      '02:14:05 Requisição repetida na fila',
      '02:14:06 Crescimento das tentativas internas',
      '02:14:08 Uma requisição gerou 4.096 tentativas',
      '02:14:10 Alerta de cobranças repetidas',
      '02:14:12 Operação degradada',
      '02:14:15 Investigação solicitada',
    ].join('\n'),
    size: '1 KB', modified: '13/10/2026 02:15',
  },
  '/srv/equipe/contatos.txt': {
    id: 'contatos', requires: 'file:leia-me',
    content: 'Equipe de investigação\nMark: qualidade e testes.\nDante Kernel: gestão de acesso.\nConverse com a equipe e compare os relatos com o log.',
    size: '1 KB', modified: '13/10/2026 02:20',
  },
};

module.exports = { VFS_FILES };
