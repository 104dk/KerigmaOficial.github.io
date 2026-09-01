/* ═══════════════════════════════════════════════════════
   KERIGMA — setup-do-novo-supabase.js
   Aplica a migration 003 no novo projeto Supabase via
   conexão direta ao banco (pooler/db). Deve ser rodado
   QUANDO o banco do novo projeto provisionar (db.* resolve).

   Uso:
     node scripts/setup-do-novo-supabase.js

   Variáveis de ambiente (opcionais; fallback abaixo):
     PG_CONN   -> string de conexão (senha NÃO versionada)
   ═══════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const SUPABASE_REF = 'vkrtogskkhumqphiftcz';
// O pooler transacional dos projetos usa este host padrão (região East-US de exemplo).
// Troque aqui OU defina PG_CONN com a string exata do dashboard (Settings -> Database).
const FALLBACK_HOSTS = [
  {
    label: 'pooler us-east-1',
    host: 'aws-0-us-east-1.pooler.supabase.com',
    user: process.env.PG_USER || 'postgres.' + SUPABASE_REF
  },
  {
    label: 'direct db host',
    host: 'db.' + SUPABASE_REF + '.supabase.co',
    user: process.env.PG_DIRECT_USER || 'postgres'
  }
];
const DB_NAME = 'postgres';
const DB_PASSWORD = process.env.PG_PASSWORD; // ex.: Super@dk.com (NÃO versionar default real)

const PG_CONN = process.env.PG_CONN || (DB_PASSWORD
  ? null
  : null);

const SQL_PATH = path.resolve(__dirname, '..', 'supabase', 'migrations', '003_ecommerce_core.sql');

(async () => {
  if (!PG_CONN && !DB_PASSWORD) {
    console.error('Defina a senha do banco via PG_PASSWORD (ou PG_CONN) para conectar.');
    process.exit(2);
  }
  if (!fs.existsSync(SQL_PATH)) {
    console.error('Migration não encontrada: ' + SQL_PATH);
    process.exit(2);
  }
  let Client;
  try {
    ({ Client } = require('pg'));
  } catch {
    console.error('Dependencia ausente: pg. Instale antes com: npm install pg');
    process.exit(2);
  }
  const sql = fs.readFileSync(SQL_PATH, 'utf-8');
  const attempts = PG_CONN
    ? [{ label: 'PG_CONN', connectionString: PG_CONN }]
    : FALLBACK_HOSTS.map(h => ({ ...h, password: DB_PASSWORD, database: DB_NAME, port: 5432 }));

  const errors = [];
  for (const attempt of attempts) {
    const client = attempt.connectionString
      ? new Client({ connectionString: attempt.connectionString, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 20000 })
      : new Client({ host: attempt.host, port: attempt.port, user: attempt.user, password: attempt.password, database: attempt.database, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 20000 });
    try {
      console.log('Tentando conexao: ' + attempt.label);
      await client.connect();
      console.log('Conectado. Aplicando migration 003...');
      await client.query(sql);
      console.log('Migration 003 aplicada com sucesso.');
      await client.end().catch(() => {});
      return;
    } catch (e) {
      errors.push(attempt.label + ': ' + (e.code ? e.code + ' - ' : '') + (e.message || 'erro sem mensagem'));
      await client.end().catch(() => {});
    }
  }
  console.error('Falha ao aplicar a migration em todas as conexoes testadas:');
  errors.forEach(err => console.error('- ' + err));
  console.error('Se o projeto ainda estiver provisionando ou em outra regiao, use PG_CONN com a string exata do Dashboard Supabase.');
  process.exitCode = 1;
})();
