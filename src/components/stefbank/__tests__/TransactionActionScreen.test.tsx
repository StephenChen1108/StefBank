import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { AccountSummary, Transaction } from "@/data/bank-types";
import { TransactionActionScreen } from "../TransactionActionScreen";

const account: AccountSummary = {
  name: "test",
  displayName: "test",
  currentBalance: 3300,
  monthDeposit: 0,
  monthWithdraw: 0,
  totalRecords: 1,
  lastUpdated: "2026.07.22",
  goal: {
    id: "goal-1",
    title: "goal",
    targetAmount: 10000,
    currentAmount: 3300,
    progress: 33,
    goalType: "travel",
    metadata: {},
  },
};

const transaction: Transaction = {
  id: "tx-1",
  type: "deposit",
  amount: 3300,
  balanceAfter: 3300,
  category: "存款",
  description: "test transaction",
  transactionDate: "2026.07.22",
  status: "confirmed",
};

beforeAll(() => {
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

describe("TransactionActionScreen", () => {
  it("shows transaction detail amounts without scaling them down", () => {
    render(
      <TransactionActionScreen
        account={account}
        existingTransaction={transaction}
        readOnly
        onClose={vi.fn()}
      />,
    );

    expect(screen.getAllByText(/¥3,300/).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText(/¥33/)).not.toBeInTheDocument();
  });
});
