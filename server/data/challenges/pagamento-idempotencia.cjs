module.exports = {
  id:'pagamento-idempotencia',caso:'pagamento',camada:'C',flag:'pagamento-C',flagComposta:true,
  estacoes:['computer_dev_left'],requires:'flag:retry-C',
  titulo:'Impeça a cobrança repetida',arquivo:'pagamento-idempotencia.js',modo:'implementar',maxErros:null,
  enunciado:'Mateus contou: "Um cliente foi cobrado três vezes. Mesmo pedido, mesmo identificador, três cobranças." Escreva o corpo de processar(input), com input = { pedido, requestId, jaProcessados }. jaProcessados é uma lista de identificadores já processados. Retorne "duplicado" se requestId já estiver nessa lista e "processado" se for novo. Compare o identificador completo: ids parecidos são pedidos diferentes. O conteúdo de pedido não muda essa decisão. Esta é uma das duas correções do caso Pagamento; a outra valida os valores no servidor.',
  codigoInicial:'// input: { pedido, requestId, jaProcessados }\n// gerado pelo Assistente de IA — "processar o pedido"\n// TODO impedir cobranças repetidas\nreturn "processado";',
  casosFixos:[
    {pedido:{produto:'cafe',quantidade:1},requestId:'pedido-2',jaProcessados:['pedido-1']},
    {pedido:{produto:'cafe',quantidade:1},requestId:'pedido-1',jaProcessados:['pedido-1']},
    {pedido:{produto:'cafe',quantidade:1},requestId:'pedido-1',jaProcessados:[]},
    {pedido:{produto:'cafe',quantidade:1},requestId:'pedido-10',jaProcessados:['pedido-1']},
    {pedido:{produto:'bolo',quantidade:2},requestId:'pedido-1',jaProcessados:['pedido-10','pedido-1','pedido-3']}
  ],
  gerarCasos(rng) {
    const integer=n=>Math.floor(rng()*n);
    return Array.from({length:24},(_,i)=>{
      const requestId='req-'+integer(100000000),pedido={produto:'cafe',quantidade:integer(10)+1};
      const jaProcessados=i%4===0?[]:[requestId+'0','outro-'+integer(100000000)];
      if(i%2===1)jaProcessados.splice(integer(jaProcessados.length+1),0,requestId);
      return {pedido,requestId,jaProcessados};
    });
  },
  referencia: ({requestId,jaProcessados}) => jaProcessados.includes(requestId)?'duplicado':'processado',
  dicas:[
    'Se o mesmo pedido chegar de novo, ele deve gerar outra cobrança? Lembre do relato do Mateus.',
    'Idempotência evita repetir o efeito de uma requisição já atendida. Consulte o registro de identificadores antes de processar.',
    'Compare requestId com os ids completos de jaProcessados. Um prefixo parecido não significa que o pedido já foi atendido.'
  ]
};
