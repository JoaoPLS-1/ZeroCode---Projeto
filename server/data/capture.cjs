// Captura fictícia e determinística. Este arquivo nunca é servido ao navegador.
const packets = [];
function add(segundos, origem, destino, protocolo, portaOrigem, portaDestino, tamanho, payload, info = payload) {
  packets.push({ segundos, origem, destino, protocolo, portaOrigem, portaDestino, tamanho, info, payload });
}
for (let i = 0; i < 25; i++) {
  const resposta = i % 2 === 1;
  add(i * 7, resposta ? '10.0.3.20' : '10.0.2.15', resposta ? '10.0.2.15' : '10.0.3.20', 'HTTP',
    resposta ? 443 : 49152, resposta ? 49152 : 443, resposta ? 178 : 256,
    resposta ? 'HTTP/1.1 503 Service Unavailable' : 'POST /v1/cobrancas HTTP/1.1\r\nrequest_id: nexus-0214\r\ntentativa: ' + (Math.floor(i / 2) + 1));
}
for (let i = 0; i < 8; i++) add(22 + i * 25, '10.0.5.21', '10.0.3.20', 'HTTP', 49200, 443, 240,
  'POST /v1/cobrancas HTTP/1.1\r\nrequest_id: pedido-cafe-1042\r\nquantidade: 1',
  'POST /v1/cobrancas · request_id=pedido-cafe-1042 · cobrança duplicada');
for (let i = 0; i < 8; i++) {
  const dns = i % 2 === 0;
  add(9 + i * 31, '10.0.5.' + (10 + i), dns ? '10.0.1.53' : '10.0.1.80', dns ? 'DNS' : 'HTTP',
    53000 + i, dns ? 53 : 80, dns ? 90 : 180, dns ? 'Consulta A intranet.zerocode.test' : 'GET /intranet HTTP/1.1');
}
for (const [i, caminho] of ['/api/crachas/1042', '/api/crachas/1043', '/mural', '/upload', '/mural/avisos'].entries())
  add(30 + i * 48, '10.0.5.30', '10.0.4.10', 'HTTP', 54000 + i, 80, 210, (caminho === '/upload' ? 'POST ' : 'GET ') + caminho + ' HTTP/1.1');
for (let i = 0; i < 4; i++) add(15 + i * 60, '10.19.56.7', '10.0.9.66', 'TCP', 42017, 2017, 64,
  'RPHJD:EDWLPHQWR', 'srv-legado-07 → TCP · 64 bytes · dados');
packets.sort((a, b) => a.segundos - b.segundos);
const pacotes = packets.map(({ segundos, ...packet }, i) => {
  const tempo = '02:' + String(14 + Math.floor(segundos / 60)).padStart(2, '0') + ':' + String(segundos % 60).padStart(2, '0');
  const transporte = packet.protocolo === 'DNS' ? 'UDP' : 'TCP';
  return { n:i + 1, tempo, ...packet, camadas:[
    `Frame ${i + 1}\nTempo: ${tempo}\nTamanho: ${packet.tamanho} bytes`,
    'Ethernet\nOrigem: 02:00:00:00:00:01\nDestino: 02:00:00:00:00:02',
    `IPv4\nOrigem: ${packet.origem}\nDestino: ${packet.destino}`,
    `${transporte}\nPorta de origem: ${packet.portaOrigem}\nPorta de destino: ${packet.portaDestino}`,
    `${packet.protocolo === 'TCP' ? 'Dados' : packet.protocolo}\n${packet.payload}`,
  ] };
});
const pensamento = 'Um servidor desativado em 2023 mandando sinal a cada sessenta segundos. Para um lugar que não existe no mapa.';
function suspeito(n) { return pacotes.some(p => p.n === n && p.origem === '10.19.56.7' && p.portaDestino === 2017); }
module.exports = { pacotes, pensamento, suspeito };
