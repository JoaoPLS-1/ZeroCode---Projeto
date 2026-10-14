// Conteúdo privado: entregue apenas por leituras autorizadas do RemoteFS.
function generateNexusLog() {
  const lines = [];
  const anchors = [[1, 0], [1680, 840], [2017, 1277], [2400, 1800]];
  const normal = [
    ['INFO ', '[nexus] Verificação de saúde concluída'],
    ['INFO ', '[fila] Pagamentos processados; fila estável'],
    ['INFO ', '[api] Pedido validado pelo serviço de pagamento'],
    ['INFO ', '[cache] Catálogo atualizado'],
    ['WARN ', '[worker] Latência elevada; monitoramento ativo'],
    ['INFO ', '[release] NEXUS v2.0 em operação'],
  ];
  for (let line = 1; line <= 2400; line++) {
    const segment = anchors.findIndex((anchor, index) => index < anchors.length - 1 && line <= anchors[index + 1][0]);
    const [start, seconds] = anchors[segment], [end, endSeconds] = anchors[segment + 1];
    const elapsed = seconds + Math.floor((line - start) * (endSeconds - seconds) / (end - start));
    const time = '02:' + String(Math.floor(elapsed / 60)).padStart(2, '0') + ':' + String(elapsed % 60).padStart(2, '0');
    let [level, message] = normal[(line - 1) % normal.length];
    if (line === 1679) message = '[release] Commit 7f2 selecionado; gerado pelo assistente de IA';
    if (line === 1680) { level = 'INFO '; message = '[release] Deploy v2.1 iniciado; commit 7f2'; }
    if (line === 1681) { level = 'WARN '; message = '[nexus] Configuração v2.1 aplicada; limite de retries ausente'; }
    if (line > 1681) {
      const attempts = 2 ** Math.min(12, 1 + Math.floor((line - 1682) / 50));
      const degraded = [
        ['ERROR', '[pagamento] HTTP 503; serviço indisponível'],
        ['WARN ', '[retry] HTTP 503; tentativas internas=' + attempts + '; request_id=req-incidente'],
        ['INFO ', '[fila] Reenfileirando request_id=req-incidente; pendentes=' + (line - 1680) * 8],
        ['ERROR', '[pagamento] Cobrança repetida; request_id=req-incidente'],
        ['WARN ', '[worker] Operação degradada; fila acima do limite'],
        ['INFO ', '[nexus] NEXUS v2.1; coleta de métricas ativa'],
      ];
      [level, message] = degraded[(line - 1682) % degraded.length];
    }
    lines.push(line === 2017 ? '02:21:17 WARN  [kernel] R VHUYLGRU TXH GRUPH DLQGD IDOD. YHMD R LQYHQWDULR.' : time + ' ' + level + ' ' + message);
  }
  return lines.join('\n');
}
const nexusLog = generateNexusLog();
const VFS_FILES = {
  '/home/kael/leia-me.txt': {
    id: 'leia-me',
    content: 'Kael, comece pelos registros do NEXUS em /var/log/nexus.log.\nOs contatos da equipe ficam em /srv/equipe/contatos.txt.\nCruze as pistas na ordem que preferir.',
    size: '1 KB', modified: '13/10/2026 02:20',
  },
  '/var/log/nexus.log': {
    id: 'nexus-log',
    content: nexusLog,
    size: Math.ceil(Buffer.byteLength(nexusLog, 'utf8') / 1024) + ' KB', modified: '13/10/2026 02:30',
  },
  '/srv/infra/inventario.csv': {
    id: 'inventario', stations: ['computer_qa_infra_lower', 'computer_infra_upper', 'computer_dev_right'],
    content: [
      'hostname,ip,funcao,status,desde',
      'srv-nexus-01,10.0.2.15,orquestração NEXUS,ATIVO,2024-02',
      'srv-pagamento-01,10.0.3.20,API de pagamento,ATIVO,2024-02',
      'srv-dns-01,10.0.0.53,resolução DNS,ATIVO,2022-04',
      'srv-fila-01,10.0.2.30,fila de pedidos,ATIVO,2024-06',
      'srv-cache-01,10.0.2.31,cache de catálogo,ATIVO,2024-06',
      'srv-banco-01,10.0.3.21,banco de pagamentos,ATIVO,2022-08',
      'srv-monitor-01,10.0.4.10,métricas e alertas,ATIVO,2023-11',
      'srv-git-01,10.0.4.11,repositórios Git,ATIVO,2022-09',
      'srv-ci-01,10.0.4.12,pipeline de testes,ATIVO,2024-01',
      'srv-backup-01,10.0.5.10,cópias de segurança,ATIVO,2023-06',
      'srv-legado-07,10.19.56.7,batch noturno,DESATIVADO,2023-03',
      'srv-arquivos-01,10.0.5.11,relatórios internos,MANUTENÇÃO,2025-02',
    ].join('\n'),
    size: '1 KB', modified: '13/10/2026 02:00',
  },
  '/srv/equipe/contatos.txt': {
    id: 'contatos', requires: 'file:leia-me',
    content: 'Equipe de investigação\nMark: qualidade e testes.\nDante Kernel: gestão de acesso.\nConverse com a equipe e compare os relatos com o log.',
    size: '1 KB', modified: '13/10/2026 02:20',
  },
};

module.exports = { VFS_FILES, generateNexusLog };
