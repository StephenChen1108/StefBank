import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const libDirectory = resolve(testDirectory, "..");

describe("production data source", () => {
  it("does not include the removed Mock data source", () => {
    const factorySource = readFileSync(resolve(libDirectory, "bank-data-source-factory.ts"), "utf8");

    expect(factorySource).not.toContain("MockBankDataSource");
    expect(factorySource).not.toContain("NEXT_PUBLIC_DATA_SOURCE");
    expect(existsSync(resolve(libDirectory, "mock-bank-data-source.ts"))).toBe(false);
  });
});
