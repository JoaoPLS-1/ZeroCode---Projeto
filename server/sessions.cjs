const { randomBytes } = require('node:crypto');
const SESSION_TTL = 2 * 60 * 60 * 1000;

function createSessions({ now = Date.now } = {}) {
  const sessions = new Map();
  function prune() {
    const time = now();
    for (const [id, session] of sessions) {
      if (time - session.usadaEm >= SESSION_TTL) sessions.delete(id);
    }
  }
  function reset(session) {
    session.criadaEm = now();
    session.usadaEm = session.criadaEm;
    session.progresso = [];
    session.missoes = null;
    session.gameOver = false;
    session.capturaAberta = false;
    return session;
  }
  return {
    get(req) {
      prune();
      const cookie = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('zc_sid='));
      const id = cookie?.slice('zc_sid='.length);
      if (!/^[a-f0-9]{48}$/.test(id || '')) return null;
      const session = sessions.get(id);
      if (!session) return null;
      session.usadaEm = now();
      return session;
    },
    create(res) {
      prune();
      const id = randomBytes(24).toString('hex');
      const session = reset({});
      sessions.set(id, session);
      res.setHeader('Set-Cookie', `zc_sid=${id}; HttpOnly; SameSite=Strict; Path=/`);
      return session;
    },
    reset,
  };
}

module.exports = { createSessions, SESSION_TTL };
