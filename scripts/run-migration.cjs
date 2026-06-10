const fs = require("node:fs");
const path = require("node:path");

// 从 .env.local 加载环境变量
function loadLocalEnv() {
  for (const filename of [".env.local", ".env"]) {
    const envPath = path.join(process.cwd(), filename);

    if (!fs.existsSync(envPath)) {
      continue;
    }

    const content = fs.readFileSync(envPath, "utf8");

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const equalsAt = trimmed.indexOf("=");

      if (equalsAt === -1) {
        continue;
      }

      const key = trimmed.slice(0, equalsAt).trim();
      const rawValue = trimmed.slice(equalsAt + 1).trim();
      const value = rawValue.replace(/^["']|["']$/g, "");

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

loadLocalEnv();

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "bnqeiyeakaqcoouzurjx";
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error("❌ 缺少 SUPABASE_ACCESS_TOKEN 环境变量");
  console.error("");
  console.error("请按以下步骤获取：");
  console.error("1. 打开 Supabase Dashboard → 点击右上角头像 → Access Tokens");
  console.error("2. 创建一个新的 token（或复制已有的）");
  console.error("3. 在 .env.local 中添加：");
  console.error("   SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxx");
  console.error("");
  console.error("或者直接在 Supabase Dashboard 的 SQL Editor 中执行以下文件：");
  const migrationFile = process.argv[2] || "003_stefbank_review_note.sql";
  console.error(`   supabase/migrations/${migrationFile}`);
  process.exit(1);
}

// 支持命令行参数指定迁移文件
const migrationFile = process.argv[2] || "003_stefbank_review_note.sql";
const sqlFile = path.join(__dirname, "..", "supabase", "migrations", migrationFile);

if (!fs.existsSync(sqlFile)) {
  console.error(`❌ 迁移文件不存在: ${sqlFile}`);
  process.exit(1);
}

const sql = fs.readFileSync(sqlFile, "utf8");

async function main() {
  console.log(`正在执行迁移: ${migrationFile} ...`);

  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  const contentType = response.headers.get("content-type") || "";
  let result;

  if (contentType.includes("application/json")) {
    result = await response.json();
  } else {
    result = await response.text();
  }

  if (!response.ok) {
    console.error("❌ SQL 执行失败:", JSON.stringify(result, null, 2));
    process.exit(1);
  }

  console.log("✅ 迁移执行成功！");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
