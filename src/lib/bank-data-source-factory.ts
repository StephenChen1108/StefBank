import type { BankDataSource } from "./bank-data-source";
import { SupabaseBankDataSource } from "./stefbank-supabase";

let instance: BankDataSource | null = null;

export function getBankDataSource(): BankDataSource {
  instance ??= new SupabaseBankDataSource();
  return instance;
}
