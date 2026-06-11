"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarDays,
  ChevronDown,
  Eye,
  PencilLine,
  Plus,
  ReceiptText,
} from "lucide-react";
import type { Transaction, TransactionFilter, TransactionType, UserRole } from "@/data/mock-bank";
import { formatCurrency, signedAmount, transactionLabel } from "@/lib/format";
import { Card, IconBadge, SegmentedControl } from "./ui";

type SortMode = "latest" | "oldest";

type TransactionsPanelProps = {
  transactions: Transaction[];
  role: UserRole;
  onStartTransactionAction: (type: TransactionType | "new") => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onViewTransaction?: (transaction: Transaction) => void;
};

const filterItems: { value: TransactionFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "deposit", label: "存入" },
  { value: "withdraw", label: "取出" },
];

function dateNumber(date: string) {
  return Number(date.replace(/\./g, ""));
}

export function TransactionsPanel({
  transactions,
  role,
  onStartTransactionAction,
  onEditTransaction,
  onViewTransaction,
}: TransactionsPanelProps) {
  const [filter, setFilter] = useState<TransactionFilter>("all");
  const [year, setYear] = useState(() => String(new Date().getFullYear()));
  const [sortMode, setSortMode] = useState<SortMode>("latest");

  const years = useMemo(
    () => Array.from(new Set(transactions.map((item) => item.transactionDate.slice(0, 4)))).sort((a, b) => b.localeCompare(a)),
    [transactions],
  );

  const visibleTransactions = useMemo(() => {
    return transactions
      .filter((item) => item.transactionDate.startsWith(year))
      .filter((item) => (filter === "all" ? true : item.type === filter))
      .toSorted((a, b) => {
        const diff = dateNumber(b.transactionDate) - dateNumber(a.transactionDate);
        return sortMode === "latest" ? diff : -diff;
      });
  }, [filter, sortMode, transactions, year]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <div data-animate-item>
        <SegmentedControl items={filterItems} value={filter} onChange={setFilter} />
      </div>

      <div data-animate-item className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[16px] border border-[#EFE7E5] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(160,80,80,0.06)]">
        <label className="relative flex items-center gap-2 text-[15px] font-medium text-[#2F2F2F]">
          <select
            aria-label="选择年份"
            value={year}
            onChange={(event) => setYear(event.target.value)}
            className="min-w-24 appearance-none bg-transparent pr-7 outline-none"
          >
            {years.map((item) => (
              <option key={item} value={item}>
                {item}年
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute left-[74px] top-1/2 -translate-y-1/2 text-[#8A8A8A]" size={18} />
        </label>

        <label className="relative flex h-12 items-center gap-2 rounded-[16px] bg-[#FFF1F2] px-4 text-[15px] text-[#6D5553]">
          <CalendarDays size={18} />
          <select
            aria-label="选择排序"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            className="appearance-none bg-transparent pr-6 outline-none"
          >
            <option value="latest">最近记录</option>
            <option value="oldest">最早记录</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" size={16} />
        </label>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col px-5 py-4" data-animate-item>
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-semibold text-[#2F2F2F]">交易明细</h2>
            {role === "manager" ? (
              <button
                type="button"
                onClick={() => onStartTransactionAction("new")}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C9182B] text-white transition active:scale-95"
                aria-label="新增流水"
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            ) : null}
          </div>
          <span className="text-[13px] text-[#8A8A8A]">
            共 {visibleTransactions.length} 条
          </span>
        </div>
        {visibleTransactions.length > 0 ? (
          <div className="no-scrollbar -mr-2 min-h-0 flex-1 divide-y divide-[#EFE7E5] overflow-y-auto pr-2">
            {visibleTransactions.map((transaction) => {
              const isDeposit = transaction.type === "deposit";

              return (
                <button
                  key={transaction.id}
                  type="button"
                  onClick={() => {
                    if (role === "manager" && onEditTransaction) {
                      onEditTransaction(transaction);
                    } else if (role !== "manager" && onViewTransaction) {
                      onViewTransaction(transaction);
                    }
                  }}
                  className="grid w-full grid-cols-[44px_1fr_auto_18px] items-center gap-3 py-3.5 text-left transition active:scale-[0.99]"
                >
                  <IconBadge
                    icon={isDeposit ? ArrowDownToLine : ArrowUpFromLine}
                    tone={isDeposit ? "green" : "red"}
                  />
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium text-[#4B3D3B]">{transaction.transactionDate}</p>
                    <p className="mt-1 text-[15px] text-[#2F2F2F]">{transactionLabel(transaction.type)}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-[21px] font-semibold ${
                        isDeposit ? "text-[#2E7D32]" : "text-[#C9182B]"
                      }`}
                    >
                      {signedAmount(transaction)}
                    </p>
                    <p className="mt-1 text-[14px] text-[#8A8A8A]">
                      余额 {formatCurrency(transaction.balanceAfter)}
                    </p>
                  </div>
                  {role === "manager" ? (
                    <PencilLine size={16} className="text-[#A8A8A8]" />
                  ) : (
                    <Eye size={16} className="text-[#A8A8A8]" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <IconBadge icon={ReceiptText} tone="plain" size="lg" />
            <p className="mt-4 text-[15px] font-semibold text-[#2F2F2F]">还没有流水记录</p>
            <p className="mt-2 text-[14px] text-[#8A8A8A]">第一笔存款会出现在这里</p>
          </div>
        )}
      </Card>
    </div>
  );
}
