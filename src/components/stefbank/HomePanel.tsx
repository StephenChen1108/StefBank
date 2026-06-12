import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  ClipboardCheck,
  PencilLine,
  Target,
  WalletCards,
} from "lucide-react";
import type { AccountSummary, RequestTab, TabId, Transaction, TransactionType, UserRole } from "@/data/bank-types";
import { formatCurrency, signedAmount, transactionLabel } from "@/lib/format";
import { goalTypeIcon } from "@/data/goal-types";
import { ActionButton, Card, FeatureCard, IconBadge } from "./ui";

type HomePanelProps = {
  account: AccountSummary;
  transactions: Transaction[];
  role: UserRole;
  onNavigate: (tab: TabId) => void;
  onStartMoneyAction: (tab: RequestTab) => void;
  onStartTransactionAction: (type: TransactionType | "new") => void;
  onOpenGoalEditor: () => void;
};

export function HomePanel({
  account,
  transactions,
  role,
  onNavigate,
  onStartMoneyAction,
  onStartTransactionAction,
  onOpenGoalEditor,
}: HomePanelProps) {
  const recentTransactions = transactions.slice(0, 3);
  const isManager = role === "manager";

  return (
    <div className="space-y-4">
      <FeatureCard className="px-5 py-5" data-animate-item>
        <p className="text-[16px] font-medium text-[#6D5553]">当前余额</p>
        <p className="mt-3 text-[44px] font-bold leading-none text-[#C9182B]">
          {formatCurrency(account.currentBalance)}
        </p>
        <div className="mt-3 flex items-center gap-2.5 text-[14px] text-[#6D5553]">
          <span className="h-3 w-3 rounded-full bg-[#94C894]" />
          今日正常营业中
        </div>
      </FeatureCard>

      {isManager ? (
        <div className="grid grid-cols-2 gap-3" data-animate-item>
          <ActionButton icon={ClipboardCheck} onClick={() => onNavigate("requests")}>
            处理申请
          </ActionButton>
          <ActionButton variant="secondary" icon={PencilLine} onClick={() => onStartTransactionAction("new")}>
            新增流水
          </ActionButton>
          <ActionButton variant="secondary" icon={ArrowRight} onClick={() => onNavigate("transactions")}>
            查看流水
          </ActionButton>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3" data-animate-item>
          <ActionButton
            icon={ArrowDownToLine}
            onClick={() => onStartMoneyAction("deposit")}
          >
            我要存钱
          </ActionButton>
          <ActionButton
            variant="secondary"
            icon={ArrowUpFromLine}
            onClick={() => onStartMoneyAction("withdraw")}
          >
            我要取钱
          </ActionButton>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3" data-animate-item>
        <Card className="flex items-center justify-between bg-[#FFF4F5] px-4 py-3.5">
          <div>
            <p className="text-[15px] text-[#4B3D3B]">本月存入</p>
            <p className="mt-2 text-[22px] font-semibold text-[#C9182B]">
              {formatCurrency(account.monthDeposit)}
            </p>
          </div>
          <IconBadge icon={WalletCards} tone="red" />
        </Card>
        <Card className="flex items-center justify-between bg-[#F8FCF8] px-4 py-3.5">
          <div>
            <p className="text-[15px] text-[#4B3D3B]">本月取出</p>
            <p className="mt-2 text-[22px] font-semibold text-[#2E7D32]">
              {formatCurrency(account.monthWithdraw)}
            </p>
          </div>
          <IconBadge icon={WalletCards} tone="green" />
        </Card>
      </div>

      {!isManager ? (
        <Card className="px-5 py-3.5" data-animate-item>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[18px] font-semibold text-[#2F2F2F]">储蓄目标</h2>
            <button
              type="button"
              onClick={onOpenGoalEditor}
              aria-label="编辑储蓄目标"
              className="text-[#8A8A8A] transition active:scale-95"
            >
              <ArrowRight size={22} />
            </button>
          </div>
          <button
            type="button"
            onClick={onOpenGoalEditor}
            className="flex w-full items-center gap-3 text-left transition active:scale-[0.99]"
          >
            <IconBadge icon={goalTypeIcon(account.goal.goalType)} tone="red" size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[17px] font-semibold text-[#2F2F2F]">{account.goal.title}</p>
                  <p className="mt-2 text-[15px] text-[#8A8A8A]">
                    <span className="font-semibold text-[#C9182B]">
                      {formatCurrency(account.goal.currentAmount)}
                    </span>{" "}
                    / {formatCurrency(account.goal.targetAmount)}
                  </p>
                </div>
                <p className="text-[21px] font-semibold text-[#C9182B]">{account.goal.progress}%</p>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#F3ECEA]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(135deg,#F46B7A_0%,#C9182B_100%)]"
                  style={{ width: `${account.goal.progress}%` }}
                />
              </div>
            </div>
          </button>
        </Card>
      ) : null}

      <Card className="px-5 py-3.5" data-animate-item>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-[#2F2F2F]">最近流水</h2>
          <button
            type="button"
            onClick={() => onNavigate("transactions")}
            className="flex items-center gap-1 text-[15px] text-[#8A8A8A] transition active:scale-95"
          >
            全部
            <ArrowRight size={18} />
          </button>
        </div>
        <div className="divide-y divide-[#EFE7E5]">
          {recentTransactions.map((transaction) => {
            const isDeposit = transaction.type === "deposit";

            return (
              <div key={transaction.id} className="grid grid-cols-[44px_1fr_auto] items-center gap-3 py-2.5">
                <IconBadge
                  icon={isDeposit ? ArrowDownToLine : ArrowUpFromLine}
                  tone={isDeposit ? "green" : "red"}
                />
                <div className="min-w-0">
                  <p
                    className={`text-[18px] font-semibold ${
                      isDeposit ? "text-[#2E7D32]" : "text-[#C9182B]"
                    }`}
                  >
                    {signedAmount(transaction)}
                  </p>
                  <p className="mt-1 text-[14px] text-[#8A8A8A]">
                    {transactionLabel(transaction.type)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[14px] text-[#8A8A8A]">{transaction.transactionDate}</p>
                  <p className="mt-1 text-[14px] text-[#8A8A8A]">
                    余额 {formatCurrency(transaction.balanceAfter)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
