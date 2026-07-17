# Cobra Certo — App

App PWA de precificação para profissionais de obra.  
Acesso por e-mail (valida contra compra no Cakto via Redis).

---

## Estrutura

```
cobra-certo-app/
├── public/
│   └── index.html       ← app completo (tela de acesso + 5 ferramentas)
│   └── manifest.json    ← PWA (instalar no celular)
├── api/
│   ├── verificar.js     ← POST /api/verificar { email } → { acesso: true/false }
│   ├── webhook.js       ← POST /api/webhook ← Cakto envia aqui
│   └── admin.js         ← POST /api/admin { senha, email, acao }
├── vercel.json
└── package.json
```

---

## Deploy no Vercel

### 1. Criar repositório GitHub

```
maikogkengenharia-a11y/cobra-certo-app
```

Sobe todos os arquivos.

### 2. Importar no Vercel

- vercel.com → Add New Project → Import Git Repository
- Seleciona o repo `cobra-certo-app`
- Framework: **Other**
- Build Command: *(deixa em branco)*
- Output Directory: *(deixa em branco)*
- Deploy

### 3. Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Variável | Valor |
|----------|-------|
| `UPSTASH_REDIS_REST_URL` | URL do seu Redis no Upstash (mesmo do Potencial Urbano ou cria novo) |
| `UPSTASH_REDIS_REST_TOKEN` | Token do Redis |
| `ADMIN_SENHA` | Uma senha forte pra você usar no admin |

### 4. Configurar webhook no Cakto

- Cakto → Produto → Configurações → Webhooks (ou Integrações)
- URL: `https://seu-app.vercel.app/api/webhook`
- Eventos: compra aprovada, reembolso, chargeback
- Salva

### 5. Testar

**Liberar email manualmente (para testes):**
```bash
curl -X POST https://seu-app.vercel.app/api/admin \
  -H "Content-Type: application/json" \
  -d '{"senha":"SUA_SENHA_ADMIN","email":"seuemail@gmail.com","acao":"liberar"}'
```

**Verificar se email tem acesso:**
```bash
curl -X POST https://seu-app.vercel.app/api/verificar \
  -H "Content-Type: application/json" \
  -d '{"email":"seuemail@gmail.com"}'
```
Deve retornar `{"acesso":true}`.

---

## Lógica de acesso

1. Compra aprovada no Cakto → webhook chama `/api/webhook` → salva `cc:email@x.com = 1` no Redis
2. Cliente abre o app → digita email → `/api/verificar` consulta Redis → libera ou bloqueia
3. Reembolso/chargeback → webhook → **deleta** a chave do Redis → acesso revogado automaticamente
4. Após primeiro acesso online, salva no `localStorage` → funciona offline depois

---

## Rota admin

Para liberar emails de compradores antes do webhook estar ativo:

```bash
# Liberar
curl -X POST /api/admin -d '{"senha":"X","email":"y@y.com","acao":"liberar"}'

# Revogar
curl -X POST /api/admin -d '{"senha":"X","email":"y@y.com","acao":"revogar"}'
```

---

## Ferramentas do app

1. **Calculadora de Orçamento** — custos + margem → preço final com detalhamento
2. **Calculadora de Diária** — meta mensal + gastos + dias → valor da diária mínima
3. **Gerador de Orçamento pro WhatsApp** — texto pronto com sinal, prazo e validade
4. **Respostas pro "Tá Caro"** — 4 scripts prontos para copiar
5. **Checklist** — 8 itens antes de passar o preço (persiste no localStorage)
