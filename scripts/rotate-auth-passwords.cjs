const { createClient } = require("@supabase/supabase-js");
const fs = require("node:fs");
const path = require("node:path");

function loadLocalEnv() {
  const filename = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(filename)) {
    return;
  }

  for (const line of fs.readFileSync(filename, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    const equalsAt = trimmed.indexOf("=");

    if (!trimmed || trimmed.startsWith("#") || equalsAt === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsAt).trim();
    const value = trimmed.slice(equalsAt + 1).trim().replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function required(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

async function findUser(supabase, email) {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (error) {
    throw error;
  }

  const user = data.users.find((candidate) => candidate.email === email);

  if (!user) {
    throw new Error(`Auth user not found: ${email}`);
  }

  return user;
}

async function main() {
  loadLocalEnv();
  const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const authClient = createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const users = [
    ["admin@stefbank.local", "STEFBANK_ADMIN_PASSWORD"],
    ["depositor@stefbank.local", "STEFBANK_DEPOSITOR_PASSWORD"],
  ];

  for (const [email, passwordName] of users) {
    const user = await findUser(supabase, email);
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: required(passwordName),
    });

    if (error) {
      throw error;
    }

    console.log(`Rotated password for ${email}.`);

    const { error: signInError } = await authClient.auth.signInWithPassword({
      email,
      password: required(passwordName),
    });

    if (signInError) {
      throw new Error(`Password verification failed for ${email}: ${signInError.message}`);
    }

    await authClient.auth.signOut();
    console.log(`Verified sign-in for ${email}.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
