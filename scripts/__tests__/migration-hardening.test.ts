import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260722094836_harden_bank_schema.sql"),
  "utf8",
);

const snapshotMigrationName = readdirSync(
  resolve(process.cwd(), "supabase/migrations"),
).filter((name) => name.endsWith("_bank_snapshot_rpc.sql"));

expect(snapshotMigrationName).toHaveLength(1);

const snapshotMigration = readFileSync(
  resolve(process.cwd(), "supabase/migrations", snapshotMigrationName[0]),
  "utf8",
);

describe("bank schema hardening migration", () => {
  it("adds a selected date to manual transactions", () => {
    expect(migration).toContain("p_transaction_date date");
    expect(migration).toContain("coalesce(p_transaction_date, current_date)");
  });

  it("removes implicit function execution and fixes RLS init plans", () => {
    expect(migration).toContain("alter default privileges in schema public");
    expect(migration).toContain("revoke execute on all functions in schema stefbank_private");
    expect(migration).toContain("(select auth.uid())");
  });

  it("adds indexes for foreign keys used by the bank", () => {
    expect(migration).toContain("requests_requester_id_idx");
    expect(migration).toContain("transactions_created_by_idx");
  });
});

describe("bank snapshot migration", () => {
  it("requires authentication and reads account membership", () => {
    expect(snapshotMigration).toContain(
      "create function stefbank_private.get_bank_snapshot()",
    );
    expect(snapshotMigration).toContain("if v_user_id is null then");
    expect(snapshotMigration).toContain("from public.account_members");
  });

  it("aggregates the snapshot and exposes only authenticated execution", () => {
    expect(snapshotMigration).toContain("jsonb_agg");
    expect(snapshotMigration).toContain(
      "revoke all on function public.get_bank_snapshot() from public, anon",
    );
    expect(snapshotMigration).toContain(
      "grant execute on function public.get_bank_snapshot() to authenticated, service_role",
    );
  });
});
