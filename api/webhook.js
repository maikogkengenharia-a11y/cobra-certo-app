// api/webhook.js
// Recebe eventos do Cakto e gerencia acesso no Redis

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Cakto-Signature');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  try {
    const payload = req.body;
    console.log('[webhook] payload recebido:', JSON.stringify(payload));

    // Cakto envia: payload.event e payload.data.customer.email
    // Eventos possíveis: purchase.approved, purchase.refunded, purchase.chargeback
    const evento = payload?.event || payload?.type || '';
    const email = payload?.data?.customer?.email
      || payload?.customer?.email
      || payload?.email
      || '';

    if (!email) {
      console.warn('[webhook] email não encontrado no payload');
      return res.status(200).json({ ok: true, aviso: 'email não encontrado' });
    }

    const emailNorm = email.trim().toLowerCase();
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const chave = `cc:${emailNorm}`;

    // Compra aprovada → libera acesso (sem expiração)
    if (
      evento.includes('approved') ||
      evento.includes('paid') ||
      evento.includes('complete') ||
      evento === ''  // fallback: qualquer payload com email
    ) {
      await fetch(`${redisUrl}/set/${encodeURIComponent(chave)}/1`, {
        headers: { Authorization: `Bearer ${redisToken}` }
      });
      console.log('[webhook] acesso LIBERADO para:', emailNorm);
    }

    // Reembolso ou chargeback → revoga acesso
    if (
      evento.includes('refund') ||
      evento.includes('chargeback') ||
      evento.includes('cancel')
    ) {
      await fetch(`${redisUrl}/del/${encodeURIComponent(chave)}`, {
        headers: { Authorization: `Bearer ${redisToken}` }
      });
      console.log('[webhook] acesso REVOGADO para:', emailNorm);
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('[webhook] erro:', err);
    return res.status(500).json({ erro: 'Erro interno' });
  }
}
