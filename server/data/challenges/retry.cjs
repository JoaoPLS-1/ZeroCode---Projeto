// Desafio S2: dados privados, carregados somente pelo servidor.
module.exports = {
  "id": "computer_dev_left",
  "caso": "retry",
  "camada": "C",
  "flag": "retry-C",
  "estacoes": [
    "computer_dev_left"
  ],
  "titulo": "Restaurar o limite de tentativas",
  "arquivo": "retry.js",
  "enunciado": "O vírus LoopZero removeu o limite de retries. Escreva o corpo de uma função JavaScript: retorne true somente quando input.status for 503 E input.attempt for menor que 3. Em qualquer outro caso, retorne false. Use return, comparações e &&. Exemplo de sintaxe: return input.status === 200; (não é a solução).",
  "codigoInicial": "// input: { status, attempt }\n// Retorne true para repetir ou false para encerrar.\n// TODO: implemente a recuperação.\nreturn true;",
  "modo": "implementar",
  "casosFixos": [
    {
      "status": 503,
      "attempt": 0
    },
    {
      "status": 503,
      "attempt": 2
    },
    {
      "status": 503,
      "attempt": 3
    },
    {
      "status": 200,
      "attempt": 0
    },
    {
      "status": 500,
      "attempt": 1
    }
  ],
  "dicas": [
    "Observe quando repetir uma requisição faz sentido e quando é hora de parar.",
    "Combine uma falha temporária com um limite de tentativas. As duas condições precisam valer juntas.",
    "Confira os campos status e attempt no manual. Escreva as duas comparações e combine seus resultados antes de retornar."
  ],
  "maxErros": 3,
  "ordemS2": 0,
  "clueRef": "clue_test_dev_computer_1",
  "recompensa": "Limite restaurado. Credencial do Computador Dev 2 recuperada.",
  gerarCasos(rng) {
    const integer = n => Math.floor(rng()*n), pick = values => values[integer(values.length)];
    const label = () => Array.from({length:16},()=>integer(16).toString(16)).join('');
    const timestamp = () => new Date(integer(86400000)).toISOString().slice(11,23);
    return Array.from({length:24},() => ({status:pick([200,500,503]),attempt:integer(7)}));
  },
  referencia: input => input.status === 503 && input.attempt < 3
};
