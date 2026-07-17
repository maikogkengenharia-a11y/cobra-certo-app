// api/admin.js
// Rota protegida para liberar/revogar acesso manualmente
// Uso: POST /api/admin com { senha, email, acao: "liberar" | "revogar" }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  try {
    const { senha, email, acao } = req.body;

    // senha definida na variável de ambiente ADMIN_SENHA
    if (senha !== process.env.ADMIN_SENHA) {
      return res.status(401).json({ erro: 'Não autorizado' });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ erro: 'E-mail inválido' });
    }

    const emailNorm = email.trim().toLowerCase();
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const chave = `cc:${emailNorm}`;

    if (acao === 'liberar') {
      await fetch(`${redisUrl}/set/${encodeURIComponent(chave)}/1`, {
        headers: { Authorization: `Bearer ${redisToken}` }
      });
      return res.status(200).json({ ok: true, msg: `Acesso liberado para ${emailNorm}` });
    }

    if (acao === 'revogar') {
      await fetch(`${redisUrl}/del/${encodeURIComponent(chave)}`, {
        headers: { Authorization: `Bearer ${redisToken}` }
      });
      return res.status(200).json({ ok: true, msg: `Acesso revogado para ${emailNorm}` });
    }

    return res.status(400).json({ erro: 'Ação inválida. Use "liberar" ou "revogar"' });

  } catch (err) {
    console.error('[admin] erro:', err);
    return res.status(500).json({ erro: 'Erro interno' });
  }
}
