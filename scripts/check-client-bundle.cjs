const fs = require("node:fs");
const path = require("node:path");
const { loadEnvConfig } = require("@next/env");

function isSensitiveName(name) {
  if (name.startsWith("NEXT_PUBLIC_") || name.startsWith("PUBLIC_")) {
    return false;
  }

  return /(?:PASSWORD|PASSCODE|SECRET|SERVICE_ROLE|PRIVATE_KEY|DEVICE_KEY|TOKEN|API_KEY)$/i.test(
    name,
  );
}

function readEnvFile(filename) {
  if (!fs.existsSync(filename)) {
    return {};
  }

  const values = {};

  for (const line of fs.readFileSync(filename, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsAt = trimmed.indexOf("=");

    if (equalsAt === -1) {
      continue;
    }

    const name = trimmed.slice(0, equalsAt).trim();
    const value = trimmed.slice(equalsAt + 1).trim().replace(/^["']|["']$/g, "");
    values[name] = value;
  }

  return values;
}

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  });
}

function findMissingPublicConfig(configuredValues, clientBundle) {
  const url = configuredValues.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    configuredValues.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    configuredValues.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const missing = [];

  if (!url || !clientBundle.includes(url)) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!key || !clientBundle.includes(key)) {
    missing.push(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return missing;
}

function run() {
  const envFile = process.env.STEFBANK_ENV_FILE;

  if (!envFile) {
    loadEnvConfig(process.cwd());
  }

  const configuredValues = envFile
    ? { ...readEnvFile(envFile), ...process.env }
    : { ...process.env };
  const secrets = Object.entries(configuredValues).flatMap(([name, value]) =>
    isSensitiveName(name) && typeof value === "string" && value.length >= 8
      ? [{ name, value }]
      : [],
  );
  const clientDirectory = path.join(process.cwd(), "out");

  if (!fs.existsSync(clientDirectory)) {
    console.error("Client bundle is missing. Run the production build first.");
    process.exitCode = 1;
    return;
  }

  const clientBundle = listFiles(clientDirectory)
    .filter((filename) => /\.(?:html?|js|css|json|txt|xml)$/i.test(filename))
    .map((filename) => fs.readFileSync(filename, "utf8"))
    .join("\n");
  const missingPublicConfig = findMissingPublicConfig(
    configuredValues,
    clientBundle,
  );

  if (missingPublicConfig.length > 0) {
    console.error(
      `Client bundle is missing required public config: ${missingPublicConfig.join(", ")}`,
    );
    process.exitCode = 1;
    return;
  }

  const leakedNames = secrets
    .filter(({ value }) => clientBundle.includes(value))
    .map(({ name }) => name);

  if (leakedNames.length > 0) {
    console.error(`Client bundle contains configured secrets: ${leakedNames.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Client bundle secret scan passed (${secrets.length} configured secrets checked).`);
}

module.exports = { findMissingPublicConfig, isSensitiveName, readEnvFile, run };

if (require.main === module) {
  run();
}
