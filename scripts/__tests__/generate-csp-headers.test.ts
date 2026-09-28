import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { afterEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { generateCspHeaders } = require("../generate-csp-headers.cjs") as {
  generateCspHeaders: (options: {
    outDir: string;
    templatePath: string;
  }) => { hashes: string[]; outputPath: string };
};

const temporaryDirectories: string[] = [];

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), "stefbank-csp-"));
  const outDir = join(root, "out");
  const templatePath = join(root, "_headers");
  mkdirSync(outDir);
  temporaryDirectories.push(root);
  return { outDir, templatePath };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("Cloudflare CSP header generation", () => {
  it("hashes each unique inline script and preserves the remaining headers", () => {
    const { outDir, templatePath } = createFixture();
    const nestedDirectory = join(outDir, "requests");
    mkdirSync(nestedDirectory);
    writeFileSync(
      templatePath,
      "/*\n  Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'\n  X-Content-Type-Options: nosniff\n",
    );
    writeFileSync(
      join(outDir, "index.html"),
      '<script>self.__next_f=[]</script><script src="/app.js"></script><script>self.__next_f=[]</script>',
    );
    writeFileSync(
      join(nestedDirectory, "index.html"),
      "<script async>self.__next_f.push([1])</script>",
    );

    const result = generateCspHeaders({ outDir, templatePath });
    const output = readFileSync(join(outDir, "_headers"), "utf8");

    expect(result).toEqual({
      hashes: [
        "'sha256-F8A7wEM/CBx+3vieKcubbMfWdgsy54B5PdWeRfp3zYU='",
        "'sha256-MtNathcL7FFo76nJ83KzxKslrQM9BY73dB09RyHWaLo='",
      ],
      outputPath: join(outDir, "_headers"),
    });
    expect(output).toBe(
      "/*\n  Content-Security-Policy: default-src 'self'; script-src 'self' 'sha256-F8A7wEM/CBx+3vieKcubbMfWdgsy54B5PdWeRfp3zYU=' 'sha256-MtNathcL7FFo76nJ83KzxKslrQM9BY73dB09RyHWaLo='; object-src 'none'\n  X-Content-Type-Options: nosniff\n",
    );
  });

  it("fails when the export contains no HTML files", () => {
    const { outDir, templatePath } = createFixture();
    writeFileSync(templatePath, "/*\n  Content-Security-Policy: script-src 'self'\n");

    expect(() => generateCspHeaders({ outDir, templatePath })).toThrow(
      "No HTML files found in the static export",
    );
  });

  it("fails when exported HTML contains no inline scripts", () => {
    const { outDir, templatePath } = createFixture();
    writeFileSync(templatePath, "/*\n  Content-Security-Policy: script-src 'self'\n");
    writeFileSync(join(outDir, "index.html"), '<script src="/app.js"></script><script> </script>');

    expect(() => generateCspHeaders({ outDir, templatePath })).toThrow(
      "No inline scripts found in the static export",
    );
  });

  it("fails when the CSP template does not contain script-src", () => {
    const { outDir, templatePath } = createFixture();
    writeFileSync(templatePath, "/*\n  Content-Security-Policy: default-src 'self'\n");
    writeFileSync(join(outDir, "index.html"), "<script>self.__next_f=[]</script>");

    expect(() => generateCspHeaders({ outDir, templatePath })).toThrow(
      "CSP template must contain exactly one script-src directive",
    );
  });
});
