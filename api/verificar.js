// api/verificar.js
// Verifica se o email está liberado no Redis (comprou o produto)

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ acesso: false, erro: 'E-mail inválido' });
    }

    // normaliza: lowercase e sem espaços
    const emailNorm = email.trim().toLowerCase();

    // consulta Redis via REST API do Upstash
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    const chave = `cc:${emailNorm}`;

    const respRedis = await fetch(`${redisUrl}/get/${encodeURIComponent(chave)}`, {
      headers: { Authorization: `Bearer ${redisToken}` }
    });

    const dados = await respRedis.json();

    // resultado do Redis: { result: "1" } se existe, { result: null } se não existe
    if (dados.result && dados.result !== 'null') {
      return res.status(200).json({ acesso: true });
    } else {
      return res.status(200).json({ acesso: false });
    }

  } catch (err) {
    console.error('[verificar] erro:', err);
    return res.status(500).json({ acesso: false, erro: 'Erro interno' });
  }
}
