import type { BankDataSource } from "./bank-data-source";
import { MockBankDataSource } from "./mock-bank-data-source";
import { SupabaseBankDataSource } from "./stefbank-supabase";

let instance: BankDataSource | null = null;

export function getBankDataSource(): BankDataSource {
  if (!instance) {
    const source = process.env.NEXT_PUBLIC_DATA_SOURCE;

    if (source === "mock") {
      instance = new MockBankDataSource();
    } else {
      instance = new SupabaseBankDataSource();
    }
  }

  return instance;
}
