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
    username: "depositor",
    email: "depositor@stefbank.local",
    envPassword: "STEFBANK_DEPOSITOR_PASSWORD",
    role: "depositor",
    fullName: "储户",
    displayName: "储户",
    avatarUrl: null,
  },
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

  const { data: existingAccount, error: existingAccountError } = await supabase
    .from("accounts")
    .select("id")
    .eq("id", BANK_ACCOUNT_ID)
    .maybeSingle();

  if (existingAccountError) {
    throw existingAccountError;
  }

  if (existingAccount) {
    throw new Error("StefBank is already initialized; refusing to overwrite live bank data.");
  }

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
      current_balance: 0,
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
      current_amount: 0,
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
      user_id: authUsers.depositor.id,
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

  console.log("StefBank Supabase initialization completed.");
  console.log("Current balance: 0 yuan");
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
