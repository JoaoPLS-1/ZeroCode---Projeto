// API da mesma origem. Nenhuma regra de conquista é validada aqui.
const api = (() => {
  async function request(method, caminho, corpo) {
    if (!caminho.startsWith('/api/jogo/')) throw new Error('Caminho de API inválido.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(caminho, {
        method, credentials: 'same-origin', signal: controller.signal,
        headers: { Accept: 'application/json', ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}) },
        ...(method === 'POST' ? { body: JSON.stringify(corpo ?? {}) } : {}),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error(result.erro || 'Não foi possível concluir a solicitação.');
      return result;
    } catch (error) {
      if (error.name === 'AbortError' || error instanceof TypeError || error instanceof SyntaxError) {
        throw new Error('Não foi possível conectar ao servidor. Verifique se ele está ativo e tente novamente.');
      }
      throw error;
    } finally { clearTimeout(timeout); }
  }
  return { get: caminho => request('GET', caminho), post: (caminho, corpo) => request('POST', caminho, corpo) };
})();
