import { describe, expect, it } from "vitest";

/* eslint-disable @typescript-eslint/no-require-imports */
const {
  findMissingPublicConfig,
  isSensitiveName,
} = require("../check-client-bundle.cjs");
/* eslint-enable @typescript-eslint/no-require-imports */

describe("bundle secret scanner", () => {
  it.each([
    "DEPOSITOR_PASSWORD",
    "BARK_DEVICE_KEY",
    "MY_SERVICE_ROLE_TOKEN",
    "INTERNAL_API_SECRET",
  ])("recognizes sensitive variable %s", (name) => {
    expect(isSensitiveName(name)).toBe(true);
  });

  it("does not treat a public URL as a secret", () => {
    expect(isSensitiveName("NEXT_PUBLIC_SUPABASE_URL")).toBe(false);
  });
});

describe("public Supabase config scanner", () => {
  it("rejects a bundle built without the configured Supabase values", () => {
    expect(
      findMissingPublicConfig(
        {
          NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-key",
        },
        "compiled client without configuration",
      ),
    ).toEqual([
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]);
  });

  it("accepts a bundle containing the configured URL and publishable key", () => {
    expect(
      findMissingPublicConfig(
        {
          NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-key",
        },
        'const url="https://example.supabase.co";const key="public-key";',
      ),
    ).toEqual([]);
  });
});
