const { createHash } = require("node:crypto");
const { readdirSync, readFileSync, writeFileSync } = require("node:fs");
const { join, resolve } = require("node:path");

function findHtmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        return findHtmlFiles(fullPath);
      }

      return entry.isFile() && entry.name.endsWith(".html") ? [fullPath] : [];
    })
    .sort();
}

function extractInlineScripts(html) {
  const scripts = [];
  const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;

  for (const match of html.matchAll(scriptPattern)) {
    const attributes = match[1];
    const source = match[2];

    if (/\bsrc\s*=/i.test(attributes) || source.trim() === "") {
      continue;
    }

    scripts.push(source);
  }

  return scripts;
}

function hashInlineScript(source) {
  const digest = createHash("sha256").update(source, "utf8").digest("base64");
  return `'sha256-${digest}'`;
}

function generateCspHeaders({ outDir, templatePath }) {
  const htmlFiles = findHtmlFiles(outDir);

  if (htmlFiles.length === 0) {
    throw new Error("No HTML files found in the static export");
  }

  const hashes = [
    ...new Set(
      htmlFiles.flatMap((filename) =>
        extractInlineScripts(readFileSync(filename, "utf8")).map(hashInlineScript),
      ),
    ),
  ].sort();

  if (hashes.length === 0) {
    throw new Error("No inline scripts found in the static export");
  }

  const template = readFileSync(templatePath, "utf8");
  const scriptSourcePattern = /\bscript-src\s+[^;\r\n]*(?=;|$)/g;
  const directives = template.match(scriptSourcePattern) ?? [];

  if (directives.length !== 1) {
    throw new Error("CSP template must contain exactly one script-src directive");
  }

  const headers = template.replace(
    scriptSourcePattern,
    (directive) => `${directive.trimEnd()} ${hashes.join(" ")}`,
  );
  const outputPath = join(outDir, "_headers");
  writeFileSync(outputPath, headers);

  return { hashes, outputPath };
}

if (require.main === module) {
  const repositoryRoot = resolve(__dirname, "..");
  const result = generateCspHeaders({
    outDir: join(repositoryRoot, "out"),
    templatePath: join(repositoryRoot, "public", "_headers"),
  });
  console.log(`Generated ${result.hashes.length} CSP script hashes in ${result.outputPath}`);
}

module.exports = { generateCspHeaders };
