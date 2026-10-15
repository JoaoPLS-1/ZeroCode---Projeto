// Presets privados e independentes, exclusivos da apresentação.
const lembrancas = ['retry-C', 'pagamento-C', 'crachas-C', 'mural-C', 'upload-C']
  .flatMap(id => ['flag:'+id, 'mem:'+id]);
module.exports = [
  { titulo:'O incidente',
    legenda:'Times usam IA para gerar código e publicam sem revisar. O ZeroCode transforma esse risco em uma investigação jogável.',
    sala:'room_dev', spawn:{x:836,y:760}, progresso:[], acao:'abertura' },
  { titulo:'Aprender fazendo',
    legenda:'O jogador corrige código real gerado por IA: validação no backend, regra de negócio e testes — com dicas de um assistente.',
    sala:'room_dev', spawn:{x:555,y:500}, progresso:['flag:retry-C'],
    acao:'abrir-pc:computer_dev_left', desafio:'pagamento-validar' },
  { titulo:'Cada acerto ensina',
    legenda:'Cada conquista vem com uma ficha de conhecimento: o conceito, o que o código gerado errou e como prevenir.',
    sala:'room_dev', spawn:{x:555,y:500}, progresso:['flag:pagamento-C','mem:pagamento-C'], acao:'mostrar-flag:pagamento-C' },
  { titulo:'Investigação de rede',
    legenda:'Cibersegurança na prática: 50 pacotes, um filtro, e uma comunicação que não deveria existir.',
    sala:'room_qa_infra', spawn:{x:1370,y:350},
    progresso:[...lembrancas,'evento:senha-lembrada','app:wireshark'], acao:'abrir-app:computer_infra_upper:wireshark' },
  { titulo:'A virada',
    legenda:'A IA que escrevia o código de todo mundo estava escondida dentro do sistema.',
    sala:'room_secret', spawn:{x:790,y:530}, progresso:['acesso:sala-secreta'], acao:'omega' },
  { titulo:'Decisão e resultado',
    legenda:'O jogador decide como responder ao incidente e recebe uma nota que explica cada escolha. Três modos: rápido para todos, completo para profissionais e apresentação.',
    sala:'room_secret', spawn:{x:790,y:530}, progresso:['acesso:sala-secreta','evento:omega-encontrada'], acao:'decisao' }
];
