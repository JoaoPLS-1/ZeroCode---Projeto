// Desafio S2: dados privados, carregados somente pelo servidor.
module.exports = {
  "id": "computer_qa_infra_lower",
  "caso": "retry",
  "camada": "C",
  "flag": "provisoria-4",
  "estacoes": [
    "computer_qa_infra_lower"
  ],
  "titulo": "Reativar a espera progressiva",
  "arquivo": "backoff.js",
  "enunciado": "Cada tentativa deve esperar 1000 * 2 elevado a input milissegundos, com teto de 8000 ms. input começa em 0. Exemplos: 0 → 1000; 1 → 2000; 2 → 4000; 3 ou mais → 8000. Em JavaScript, potência usa ** e o menor valor usa Math.min(a, b).",
  "codigoInicial": "// input: número da tentativa (0 ou maior)\n// Retorne a espera em milissegundos.\n// TODO: implemente a recuperação.\nreturn 0;",
  "modo": "implementar",
  "casosFixos": [
    0,
    1,
    2,
    3,
    6
  ],
  "dicas": [
    "A espera precisa crescer sem ultrapassar um teto.",
    "Potência representa o crescimento exponencial; escolher o menor valor aplica um teto.",
    "Separe o cálculo da espera e a aplicação do limite. Confira o começo da tabela e a primeira tentativa que alcança o teto."
  ],
  "maxErros": 3,
  "ordemS2": 3,
  "clueRef": "clue_test_qa_infra_computer",
  "recompensa": "Espera progressiva ativa. Canal de manutenção do Servidor de Infra habilitado.",
  gerarCasos(rng) {
    const integer = n => Math.floor(rng()*n), pick = values => values[integer(values.length)];
    const label = () => Array.from({length:16},()=>integer(16).toString(16)).join('');
    const timestamp = () => new Date(integer(86400000)).toISOString().slice(11,23);
    return Array.from({length:24},() => integer(12));
  },
  referencia: input => Math.min(8000,1000*2**input)
};
