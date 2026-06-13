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
    avatarUrl: "/yezi-avatar-compressed.jpg",
  },
];

const historyTransactions = [
  ["tx-001", "2025-10-31", "deposit", 200000, 200000],
  ["tx-002", "2025-11-10", "withdraw", 100000, 100000],
  ["tx-003", "2025-11-16", "withdraw", 50000, 50000],
  ["tx-004", "2025-12-01", "deposit", 250000, 300000],
  ["tx-005", "2025-12-06", "withdraw", 50000, 250000],
  ["tx-006", "2025-12-15", "withdraw", 30000, 220000],
  ["tx-007", "2025-12-17", "withdraw", 18000, 202000],
  ["tx-008", "2025-12-23", "withdraw", 72000, 130000],
  ["tx-009", "2026-01-03", "deposit", 250000, 380000],
  ["tx-010", "2026-01-08", "withdraw", 50000, 330000],
  ["tx-011", "2026-01-16", "withdraw", 50000, 280000],
  ["tx-012", "2026-01-26", "withdraw", 30000, 250000],
  ["tx-013", "2026-02-02", "withdraw", 60000, 190000],
  ["tx-014", "2026-02-18", "withdraw", 60000, 130000],
  ["tx-015", "2026-03-22", "deposit", 30000, 160000],
  ["tx-016", "2026-03-26", "withdraw", 30000, 130000],
  ["tx-017", "2026-03-29", "withdraw", 50000, 80000],
  ["tx-018", "2026-03-30", "withdraw", 60000, 20000],
  ["tx-019", "2026-03-31", "deposit", 200000, 220000],
  ["tx-020", "2026-04-13", "withdraw", 50000, 170000],
  ["tx-021", "2026-04-17", "withdraw", 50000, 120000],
  ["tx-022", "2026-04-20", "withdraw", 50000, 70000],
  ["tx-023", "2026-04-22", "withdraw", 50000, 20000],
  ["tx-024", "2026-05-05", "deposit", 130000, 150000],
  ["tx-025", "2026-05-19", "withdraw", 54000, 96000],
  ["tx-026", "2026-05-24", "withdraw", 20000, 76000],
  ["tx-027", "2026-05-25", "withdraw", 50000, 26000],
  ["tx-028", "2026-05-30", "withdraw", 26000, 0],
  ["tx-029", "2026-06-02", "deposit", 300000, 300000],
  ["tx-030", "2026-06-05", "withdraw", 10000, 290000],
  ["tx-031", "2026-06-08", "withdraw", 10000, 280000],
  ["tx-032", "2026-06-09", "withdraw", 10000, 270000],
  ["tx-033", "2026-06-09", "deposit", 60000, 330000],
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
      current_balance: 330000,
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
      target_amount: 1000000,
      current_amount: 330000,
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
  console.log(`Current balance: 330000 (cents)`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
