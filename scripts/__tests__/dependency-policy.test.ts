import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const require = createRequire(import.meta.url);
const manifest = JSON.parse(
  readFileSync(resolve(root, "package.json"), "utf8"),
);

describe("dependency policy", () => {
  it("excludes generated Cloudflare bundles from source linting", () => {
    const eslintConfig = readFileSync(resolve(root, "eslint.config.mjs"), "utf8");

    expect(eslintConfig).toContain('".wrangler/**"');
  });

  it("pins the supported runtime and direct production packages", () => {
    expect(manifest.engines).toEqual({ node: ">=20.19.0" });

    for (const name of [
      "@supabase/supabase-js",
      "gsap",
      "lucide-react",
      "next",
      "react",
      "react-dom",
    ]) {
      expect(manifest.dependencies[name]).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  it("forces patched transitive CSS and image processors", () => {
    expect(manifest.overrides).toMatchObject({
      "brace-expansion": "5.0.8",
      postcss: "8.5.23",
      sharp: "0.35.0",
    });
    expect(manifest.devDependencies.wrangler).toBe("4.114.0");
  });

  it("uses one package manager lockfile", () => {
    expect(existsSync(resolve(root, "package-lock.json"))).toBe(true);
    expect(existsSync(resolve(root, "pnpm-lock.yaml"))).toBe(false);
    expect(existsSync(resolve(root, "yarn.lock"))).toBe(false);
  });

  it("keeps the legacy minimatch API compatible with patched brace expansion", () => {
    const minimatch = require("minimatch") as (
      path: string,
      pattern: string,
    ) => boolean;

    expect(minimatch("src/page.tsx", "src/*.{ts,tsx}")).toBe(true);
  });
});
