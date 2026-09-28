import { describe, expect, it } from "vitest";
import { resolveSupabasePublicKey } from "../supabase-config";

describe("resolveSupabasePublicKey", () => {
  it("prefers the publishable key", () => {
    expect(resolveSupabasePublicKey("publishable", "anon")).toBe("publishable");
  });

  it("falls back to the legacy anon key", () => {
    expect(resolveSupabasePublicKey(undefined, "anon")).toBe("anon");
  });

  it("ignores blank values", () => {
    expect(resolveSupabasePublicKey("   ", " anon ")).toBe("anon");
  });

  it("returns null when neither key is configured", () => {
    expect(resolveSupabasePublicKey(" ", undefined)).toBeNull();
  });
});
