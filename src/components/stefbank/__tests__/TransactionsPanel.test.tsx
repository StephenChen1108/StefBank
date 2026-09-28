import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TransactionsPanel } from "../TransactionsPanel";

const transaction = {
  id: "old-transaction",
  type: "deposit" as const,
  amount: 100,
  balanceAfter: 100,
  category: "存款",
  description: "往年存款",
  transactionDate: "2024.06.01",
  status: "confirmed" as const,
};

const props = {
  role: "depositor" as const,
  onStartTransactionAction: vi.fn(),
};

describe("TransactionsPanel", () => {
  it("selects the latest year with data when there are no current-year records", () => {
    render(<TransactionsPanel {...props} transactions={[transaction]} />);
    expect(screen.getByRole("combobox", { name: "选择年份" })).toHaveValue("2024");
    expect(screen.getByText("余额 ¥100")).toBeInTheDocument();
  });

  it("distinguishes an empty filter from an empty account", () => {
    render(<TransactionsPanel {...props} transactions={[transaction]} />);
    fireEvent.click(screen.getByRole("button", { name: "取出" }));
    expect(screen.getByText("当前筛选没有流水")).toBeInTheDocument();
    expect(screen.queryByText("还没有流水记录")).not.toBeInTheDocument();
  });
});
