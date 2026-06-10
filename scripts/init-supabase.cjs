const { createClient } = require("@supabase/supabase-js");
const fs = require("node:fs");
const path = require("node:path");

const BANK_ACCOUNT_ID = "stefbank-main-account";

const users = [
  {
    username: "admin",
    email: "admin@stefbank.local",
    envPassword: "STEFBANK_ADMIN_PASSWORD",
    role: "manager",
    fullName: "车厘子行长",
    displayName: "车厘子行长",
    avatarUrl: null,
  },
  {
    username: "yezi",
    email: "yezi@stefbank.local",
    envPassword: "STEFBANK_YEZI_PASSWORD",
    role: "depositor",
    fullName: "应展硕",
    displayName: "应展硕",
    avatarUrl: "/yezi-avatar.jpg",
  },
];

const historyTransactions = [
  ["tx-001", "2025-10-31", "deposit", 2000, 2000],
  ["tx-002", "2025-11-10", "withdraw", 1000, 1000],
  ["tx-003", "2025-11-16", "withdraw", 500, 500],
  ["tx-004", "2025-12-01", "deposit", 2500, 3000],
  ["tx-005", "2025-12-06", "withdraw", 500, 2500],
  ["tx-006", "2025-12-15", "withdraw", 300, 2200],
  ["tx-007", "2025-12-17", "withdraw", 180, 2020],
  ["tx-008", "2025-12-23", "withdraw", 720, 1300],
  ["tx-009", "2026-01-03", "deposit", 2500, 3800],
  ["tx-010", "2026-01-08", "withdraw", 500, 3300],
  ["tx-011", "2026-01-16", "withdraw", 500, 2800],
  ["tx-012", "2026-01-26", "withdraw", 300, 2500],
  ["tx-013", "2026-02-02", "withdraw", 600, 1900],
  ["tx-014", "2026-02-18", "withdraw", 600, 1300],
  ["tx-015", "2026-03-22", "deposit", 300, 1600],
  ["tx-016", "2026-03-26", "withdraw", 300, 1300],
  ["tx-017", "2026-03-29", "withdraw", 500, 800],
  ["tx-018", "2026-03-30", "withdraw", 600, 200],
  ["tx-019", "2026-03-31", "deposit", 2000, 2200],
  ["tx-020", "2026-04-13", "withdraw", 500, 1700],
  ["tx-021", "2026-04-17", "withdraw", 500, 1200],
  ["tx-022", "2026-04-20", "withdraw", 500, 700],
  ["tx-023", "2026-04-22", "withdraw", 500, 200],
  ["tx-024", "2026-05-05", "deposit", 1300, 1500],
  ["tx-025", "2026-05-19", "withdraw", 540, 960],
  ["tx-026", "2026-05-24", "withdraw", 200, 760],
  ["tx-027", "2026-05-25", "withdraw", 500, 260],
  ["tx-028", "2026-05-30", "withdraw", 260, 0],
  ["tx-029", "2026-06-02", "deposit", 3000, 3000],
  ["tx-030", "2026-06-05", "withdraw", 100, 2900],
  ["tx-031", "2026-06-08", "withdraw", 100, 2800],
  ["tx-032", "2026-06-09", "withdraw", 100, 2700],
  ["tx-033", "2026-06-09", "deposit", 600, 3300],
];

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

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

async function findUserByEmail(supabase, email) {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (error) {
    throw error;
  }

  return data.users.find((user) => user.email === email) ?? null;
}

async function upsertAuthUser(supabase, username, config) {
  const password = requiredEnv(config.envPassword);
  const existing = await findUserByEmail(supabase, config.email);

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      app_metadata: { role: config.role, username },
    });

    if (error) {
      throw error;
    }

    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: config.email,
    password,
    email_confirm: true,
    app_metadata: { role: config.role, username },
  });

  if (error) {
    throw error;
  }

  return data.user;
}

async function main() {
  loadLocalEnv();

  const url = requiredEnv("SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // ---- 1. 创建所有 Auth 用户 + profiles ----
  const authUsers = {};
  const profileRows = [];

  for (const config of users) {
    const authUser = await upsertAuthUser(supabase, config.username, config);
    authUsers[config.username] = authUser;
    profileRows.push({
      id: authUser.id,
      username: config.username,
      full_name: config.fullName,
      display_name: config.displayName,
      role: config.role,
      avatar_url: config.avatarUrl,
    });
  }

  const { error: profileError } = await supabase.from("profiles").upsert(profileRows, { onConflict: "id" });

  if (profileError) {
    throw profileError;
  }

  console.log(`Profiles: ${profileRows.length}`);

  // ---- 2. 创建银行总账 ----
  const { error: bankAccountError } = await supabase.from("accounts").upsert(
    {
      id: BANK_ACCOUNT_ID,
      slug: "stefbank-main",
      name: "车厘子银行总账",
      current_balance: 3300,
    },
    { onConflict: "id" },
  );

  if (bankAccountError) {
    throw bankAccountError;
  }

  const { error: goalError } = await supabase.from("goals").upsert(
    {
      id: `${BANK_ACCOUNT_ID}-goal`,
      account_id: BANK_ACCOUNT_ID,
      title: "旅行基金",
      target_amount: 10000,
      current_amount: 3300,
    },
    { onConflict: "id" },
  );

  if (goalError) {
    throw goalError;
  }

  // ---- 3. 写入 account_members ----
  const memberRows = [
    {
      account_id: BANK_ACCOUNT_ID,
      user_id: authUsers.admin.id,
      role: "manager",
    },
    {
      account_id: BANK_ACCOUNT_ID,
      user_id: authUsers.yezi.id,
      role: "depositor",
    },
  ];

  const { error: memberError } = await supabase.from("account_members").upsert(memberRows, {
    onConflict: "account_id,user_id",
  });

  if (memberError) {
    throw memberError;
  }

  console.log(`Account members: ${memberRows.length}`);

  // ---- 4. 写入历史流水 ----
  const seededTransactions = historyTransactions.map(([id, transaction_date, type, amount, balance_after]) => ({
    id,
    account_id: BANK_ACCOUNT_ID,
    type,
    amount,
    balance_after,
    category: type === "deposit" ? "存款" : "取款",
    description: type === "deposit" ? "历史转入" : "历史转出",
    transaction_date,
    status: "confirmed",
    created_by: authUsers.admin.id,
  }));

  const { error: transactionError } = await supabase.from("transactions").upsert(seededTransactions, {
    onConflict: "id",
  });

  if (transactionError) {
    throw transactionError;
  }

  console.log("StefBank Supabase initialization completed.");
  console.log(`Transactions: ${seededTransactions.length}`);
  console.log(`Current balance: 3300`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
