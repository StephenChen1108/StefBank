import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { AccountSummary, Transaction, UserRole } from "@/data/bank-types";
import { HomePanel } from "../HomePanel";

const makeAccount = (): AccountSummary => ({
  name: "测试账户",
  displayName: "测试显示名",
  currentBalance: 330000,
  monthDeposit: 60000,
  monthWithdraw: 20000,
  totalRecords: 33,
  lastUpdated: "2026.06.09",
  goal: {
    id: "goal-1",
    title: "旅行基金",
    targetAmount: 1000000,
    currentAmount: 330000,
    progress: 33,
    goalType: "travel",
    metadata: {},
  },
});

const makeTransactions = (count: number): Transaction[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `tx-${i}`,
    type: (i % 2 === 0 ? "deposit" : "withdraw") as Transaction["type"],
    amount: 10000 * (i + 1),
    balanceAfter: 100000 - i * 10000,
    category: i % 2 === 0 ? "存款" : "取款",
    description: `测试交易 ${i + 1}`,
    transactionDate: `2026.06.${String(9 - i).padStart(2, "0")}`,
    status: "confirmed" as const,
  }));

const defaultProps = {
  account: makeAccount(),
  transactions: makeTransactions(5),
  role: "depositor" as UserRole,
  onNavigate: vi.fn(),
  onStartMoneyAction: vi.fn(),
  onStartTransactionAction: vi.fn(),
  onOpenGoalEditor: vi.fn(),
};

describe("HomePanel", () => {
  it("displays current balance", () => {
    render(<HomePanel {...defaultProps} />);
    expect(screen.getByText("当前余额")).toBeInTheDocument();
  });

  it("displays monthly deposit and withdraw", () => {
    render(<HomePanel {...defaultProps} />);
    expect(screen.getByText("本月存入")).toBeInTheDocument();
    expect(screen.getByText("本月取出")).toBeInTheDocument();
  });

  describe("role-based actions", () => {
    it("shows deposit/withdraw buttons for depositor", () => {
      render(<HomePanel {...defaultProps} role="depositor" />);
      expect(screen.getByText("我要存钱")).toBeInTheDocument();
      expect(screen.getByText("我要取钱")).toBeInTheDocument();
    });

    it("shows management buttons for manager", () => {
      render(<HomePanel {...defaultProps} role="manager" />);
      expect(screen.getByText("处理申请")).toBeInTheDocument();
      expect(screen.getByText("新增流水")).toBeInTheDocument();
      expect(screen.getByText("查看流水")).toBeInTheDocument();
    });

    it("does not show deposit/withdraw buttons for manager", () => {
      render(<HomePanel {...defaultProps} role="manager" />);
      expect(screen.queryByText("我要存钱")).not.toBeInTheDocument();
      expect(screen.queryByText("我要取钱")).not.toBeInTheDocument();
    });
  });

  describe("savings goal", () => {
    it("shows savings goal section for depositor", () => {
      render(<HomePanel {...defaultProps} role="depositor" />);
      expect(screen.getByText("储蓄目标")).toBeInTheDocument();
      expect(screen.getByText("旅行基金")).toBeInTheDocument();
    });

    it("hides savings goal section for manager", () => {
      render(<HomePanel {...defaultProps} role="manager" />);
      expect(screen.queryByText("储蓄目标")).not.toBeInTheDocument();
    });

    it("calls onOpenGoalEditor when goal section is clicked", () => {
      const onOpenGoalEditor = vi.fn();
      render(<HomePanel {...defaultProps} onOpenGoalEditor={onOpenGoalEditor} />);
      // The goal title is inside a clickable button
      fireEvent.click(screen.getByText("旅行基金"));
      expect(onOpenGoalEditor).toHaveBeenCalled();
    });
  });

  describe("recent transactions", () => {
    it("shows only first 3 transactions", () => {
      const transactions = makeTransactions(10);
      render(<HomePanel {...defaultProps} transactions={transactions} />);
      // HomePanel renders signedAmount (e.g. "+¥10,000") and transactionLabel, not description.
      // tx-0, tx-1, and tx-2 are shown. tx-3 is NOT shown.
      // Check by balanceAfter values which are unique per transaction
      expect(screen.getByText("余额 ¥100,000")).toBeInTheDocument(); // tx-0
      expect(screen.getByText("余额 ¥90,000")).toBeInTheDocument(); // tx-1
      expect(screen.getByText("余额 ¥80,000")).toBeInTheDocument(); // tx-2
      expect(screen.queryByText("余额 ¥70,000")).not.toBeInTheDocument(); // tx-3 not shown
    });

    it("shows 查看全部 link to navigate to transactions", () => {
      const onNavigate = vi.fn();
      render(<HomePanel {...defaultProps} onNavigate={onNavigate} />);
      fireEvent.click(screen.getByText("查看全部"));
      expect(onNavigate).toHaveBeenCalledWith("transactions");
    });
  });

  describe("navigation callbacks", () => {
    it("calls onStartMoneyAction for deposit", () => {
      const onStartMoneyAction = vi.fn();
      render(<HomePanel {...defaultProps} role="depositor" onStartMoneyAction={onStartMoneyAction} />);
      fireEvent.click(screen.getByText("我要存钱"));
      expect(onStartMoneyAction).toHaveBeenCalledWith("deposit");
    });

    it("calls onStartMoneyAction for withdraw", () => {
      const onStartMoneyAction = vi.fn();
      render(<HomePanel {...defaultProps} role="depositor" onStartMoneyAction={onStartMoneyAction} />);
      fireEvent.click(screen.getByText("我要取钱"));
      expect(onStartMoneyAction).toHaveBeenCalledWith("withdraw");
    });

    it("calls onStartTransactionAction for new transaction (manager)", () => {
      const onStartTransactionAction = vi.fn();
      render(<HomePanel {...defaultProps} role="manager" onStartTransactionAction={onStartTransactionAction} />);
      fireEvent.click(screen.getByText("新增流水"));
      expect(onStartTransactionAction).toHaveBeenCalledWith("new");
    });
  });
});
