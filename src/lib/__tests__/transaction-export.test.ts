import { describe, expect, it } from "vitest";
import { createTransactionsCsv } from "../transaction-export";

describe("createTransactionsCsv", () => {
  it("exports Chinese fields and prevents spreadsheet formulas in user text", () => {
    const csv = createTransactionsCsv([{
      id: "tx-1",
      type: "withdraw",
      amount: 88,
      balanceAfter: 912,
      category: "购物",
      description: '=HYPERLINK("https://example.com","click")',
      transactionDate: "2026.09.28",
      status: "confirmed",
    }]);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"2026.09.28","取出","88","购物"');
    expect(csv).toContain('"\'=HYPERLINK(""https://example.com"",""click"")"');
    expect(csv).toContain('"912","已确认"');
  });
});
