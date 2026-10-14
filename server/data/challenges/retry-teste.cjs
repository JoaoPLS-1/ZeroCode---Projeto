// Alternativa QA para a mesma evidência da camada C do caso Retry.
module.exports = {
  id:'retry-teste',caso:'retry',camada:'C',flag:'retry-C',estacoes:['computer_qa_upper'],
  titulo:'Escreva o teste que o QA não escreveu',arquivo:'retry-teste.js',modo:'testes',
  assinatura:'deveRepetir({ status, attempt }) → boolean',
  enunciado:'O QA pulou o cenário 503. Escreva casos [entrada, saída esperada] para deveRepetir: a regra correta repete somente com status 503 e attempt menor que 3. Todos os casos devem passar na versão correta e pelo menos um deve falhar na vibecodada. Não altere a implementação: retorne uma lista de 1 a 10 casos. status deve ser inteiro de 100 a 599 e attempt inteiro de 0 a 100.',
  codigoInicial:'// Escreva casos de teste: [entrada, saída esperada]\n// TODO: inclua um caso que revele o bug.\nreturn [\n  [{ status: 200, attempt: 0 }, false],\n];',
  implementacaoVibecodada(entrada) { return entrada.status === 503; },
  referencia(entrada) { return entrada.status === 503 && entrada.attempt < 3; },
  validarEntrada(entrada) {
    return entrada!==null&&typeof entrada==='object'&&!Array.isArray(entrada)&&
      Object.keys(entrada).length===2&&Object.hasOwn(entrada,'status')&&Object.hasOwn(entrada,'attempt')&&
      Number.isInteger(entrada.status)&&entrada.status>=100&&entrada.status<=599&&
      Number.isInteger(entrada.attempt)&&entrada.attempt>=0&&entrada.attempt<=100;
  },
  minimoCasos:1,maximoCasos:10,maxErros:null,
  dicas:[
    'Um teste que passa nas duas versões não revela o erro. Explore o cenário que o QA pulou.',
    'A versão vibecodada verifica o status, mas ignora a quantidade de tentativas. Pense no limite.',
    'Use status 503 depois de atingir o limite de 3 tentativas. Qual deveria ser a saída esperada?'
  ],
  recompensa:'O cenário 503 revelou a repetição sem limite. Evidência do caso Retry recuperada.'
};
