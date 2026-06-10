const { Client } = require("pg");
const fs = require("node:fs");
const path = require("node:path");

// 从 .env.local 加载环境变量
function loadLocalEnv() {
  for (const filename of [".env.local", ".env"]) {
    const envPath = path.join(process.cwd(), filename);
    if (!fs.existsSync(envPath)) continue;
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const equalsAt = trimmed.indexOf("=");
      if (equalsAt === -1) continue;
      const key = trimmed.slice(0, equalsAt).trim();
      const rawValue = trimmed.slice(equalsAt + 1).trim();
      const value = rawValue.replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadLocalEnv();

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "bnqeiyeakaqcoouzurjx";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const migrationFile = process.argv[2] || "003_stefbank_review_note.sql";
const sqlFile = path.join(__dirname, "..", "supabase", "migrations", migrationFile);

if (!fs.existsSync(sqlFile)) {
  console.error(`❌ 迁移文件不存在: ${sqlFile}`);
  process.exit(1);
}

const sql = fs.readFileSync(sqlFile, "utf8");

// 尝试多种连接方式，密码优先使用 service_role key
async function tryConnect(host, port, user, password, db) {
  const client = new Client({
    host,
    port,
    user,
    password,
    database: db,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
  try {
    await client.connect();
    console.log(`✅ 连接成功: ${user}@${host}:${port}/${db}`);
    return client;
  } catch (err) {
    return null;
  }
}

async function main() {
  const passwords = [
    SERVICE_ROLE_KEY,
    process.env.STEFBANK_ADMIN_PASSWORD,
    process.env.ADMIN_PASSWORD,
    process.env.STEFBANK_YEZI_PASSWORD,
    process.env.YEZI_PASSWORD,
  ].filter(Boolean);

  // 去重
  const uniquePasswords = [...new Set(passwords)];

  console.log(`正在执行迁移: ${migrationFile}`);
  console.log(`SQL 长度: ${sql.length} 字符`);
  console.log("");

  let client = null;

  // 连接选项
  const options = [
    // 直连
    { host: `db.${PROJECT_REF}.supabase.co`, port: 5432, user: "postgres", db: "postgres" },
    // 连接池 (transaction 模式)
    { host: `aws-0-us-west-2.pooler.supabase.com`, port: 6543, user: `postgres.${PROJECT_REF}`, db: "postgres" },
    // 连接池 (session 模式)
    { host: `aws-0-us-west-2.pooler.supabase.com`, port: 5432, user: `postgres.${PROJECT_REF}`, db: "postgres" },
  ];

  for (const opt of options) {
    for (const pwd of uniquePasswords) {
      console.log(`尝试连接: ${opt.user}@${opt.host}:${opt.port} ...`);
      client = await tryConnect(opt.host, opt.port, opt.user, pwd, opt.db);
      if (client) break;
    }
    if (client) break;
  }

  if (!client) {
    console.error("");
    console.error("❌ 无法连接到数据库。请尝试以下方法之一：");
    console.error("");
    console.error("方法 1 - 在 Supabase Dashboard SQL Editor 中手动执行：");
    console.error(`   打开 https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
    console.error(`   复制以下文件内容并执行：`);
    console.error(`   supabase/migrations/${migrationFile}`);
    console.error("");
    console.error("方法 2 - 使用 Supabase CLI：");
    console.error("   npx supabase db push");
    console.error("");
    console.error("方法 3 - 设置 SUPABASE_ACCESS_TOKEN 环境变量后运行：");
    console.error("   node scripts/run-migration.cjs");
    console.error("   获取 token: https://supabase.com/dashboard/account/tokens");
    console.error("");
    console.error(`迁移文件内容预览（共 ${sql.split(/\r?\n/).length} 行）：`);
    console.error("---");
    console.error(sql.substring(0, 500));
    process.exit(1);
  }

  try {
    console.log("");
    console.log("正在执行 SQL...");
    await client.query(sql);
    console.log("✅ 迁移执行成功！");
  } catch (err) {
    console.error("❌ SQL 执行失败:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
