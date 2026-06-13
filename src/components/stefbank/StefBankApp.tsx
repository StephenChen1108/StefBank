"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AccountSummary, BankRequest, RequestTab, TabId, Transaction, TransactionType, UserProfile } from "@/data/bank-types";
import { getBankDataSource } from "@/lib/bank-data-source-factory";
import type { BankSnapshot, GoalInput, RequestInput, TransactionInput } from "@/lib/bank-data-source";
import { useToast } from "./ToastProvider";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";
import { HomePanel } from "./HomePanel";
import { LoginPanel } from "./LoginPanel";
import { GoalEditorScreen } from "./GoalEditorScreen";
import { MoneyActionScreen } from "./MoneyActionScreen";
import { PageMotion } from "./PageMotion";
import { ProfilePanel } from "./ProfilePanel";
import { RequestsPanel } from "./RequestsPanel";
import { TransactionActionScreen } from "./TransactionActionScreen";
import { TransactionsPanel } from "./TransactionsPanel";

type StefBankAppProps = {
  initialTab?: TabId;
};

export function StefBankApp({ initialTab = "home" }: StefBankAppProps = {}) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [moneyAction, setMoneyAction] = useState<RequestTab | null>(null);
  const [transactionAction, setTransactionAction] = useState<TransactionType | "new" | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [isGoalEditorOpen, setIsGoalEditorOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accountId, setAccountId] = useState("");
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [requests, setRequests] = useState<BankRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isBooting, setIsBooting] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [appError, setAppError] = useState("");
  const contentRef = useRef<HTMLElement>(null);
  const toast = useToast();

  useEffect(() => {
    let ignore = false;

    getBankDataSource()
      .getExistingSession()
      .then((snapshot) => {
        if (ignore || !snapshot) {
          return;
        }

        applySnapshot(snapshot);
      })
      .catch((error) => {
        if (!ignore) {
          setAppError(error instanceof Error ? error.message : "加载数据失败");
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsBooting(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  function applySnapshot(snapshot: BankSnapshot) {
    setUser(snapshot.user);
    setAccountId(snapshot.accountId);
    setAccount(snapshot.account);
    setRequests(snapshot.requests);
    setTransactions(snapshot.transactions);
    setAppError("");
  }

  async function refreshSnapshot() {
    setIsRefreshing(true);

    try {
      const snapshot = await getBankDataSource().loadSnapshot();
      applySnapshot(snapshot);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "加载数据失败");
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleLogin(credentials: { username: string; password: string }) {
    try {
      const snapshot = await getBankDataSource().signIn(credentials.username, credentials.password);
      applySnapshot(snapshot);
      setActiveTab(initialTab);
      setMoneyAction(null);
      setTransactionAction(null);
      setIsGoalEditorOpen(false);
      toast.success("登录成功");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "登录失败");
      throw error;
    }
  }

  async function handleRequestSubmit(input: RequestInput) {
    try {
      await getBankDataSource().submitRequest(accountId, input);
      await refreshSnapshot();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "提交失败");
      throw error;
    }
  }

  async function runAndRefresh(action: () => Promise<void>) {
    try {
      await action();
      await refreshSnapshot();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "操作失败");
      throw error;
    }
  }

  if (isBooting) {
    return <FullScreenState text="正在打开车厘子银行..." showSpinner />;
  }

  if (!user || !account) {
    return (
      <LoginPanel
        onLogin={handleLogin}
      />
    );
  }

  const role = user.role;

  async function logout() {
    try {
      await getBankDataSource().signOut();
      setUser(null);
      setAccount(null);
      setAccountId("");
      setRequests([]);
      setTransactions([]);
      setActiveTab("home");
      setMoneyAction(null);
      setTransactionAction(null);
      toast.success("已退出登录");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "退出失败");
    }
  }

  function navigate(tab: TabId) {
    setActiveTab(tab);
    contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }

  if (moneyAction) {
    return (
      <MoneyActionScreen
        account={account}
        mode={moneyAction}
        onSubmitRequest={handleRequestSubmit}
        onClose={() => setMoneyAction(null)}
      />
    );
  }

  if (transactionAction) {
    return (
      <TransactionActionScreen
        account={account}
        initialType={transactionAction === "new" ? null : transactionAction}
        onClose={() => setTransactionAction(null)}
        onSubmit={(transaction: TransactionInput & { transactionDate: string }) =>
          runAndRefresh(() => getBankDataSource().createAdminTransaction(accountId, transaction))
        }
      />
    );
  }

  if (editingTransaction) {
    return (
      <TransactionActionScreen
        account={account}
        existingTransaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSubmit={(transaction: TransactionInput & { transactionDate: string }) =>
          runAndRefresh(() =>
            getBankDataSource().updateTransaction(editingTransaction.id, transaction),
          )
        }
        onDelete={() =>
          runAndRefresh(() => getBankDataSource().deleteTransaction(editingTransaction.id))
        }
      />
    );
  }

  if (viewingTransaction) {
    return (
      <TransactionActionScreen
        account={account}
        existingTransaction={viewingTransaction}
        readOnly
        onClose={() => setViewingTransaction(null)}
      />
    );
  }

  if (isGoalEditorOpen) {
    return (
      <GoalEditorScreen
        account={account}
        existingGoal={account.goal}
        onSave={async (input: GoalInput) => {
          try {
            await getBankDataSource().upsertGoal(accountId, input);
            await refreshSnapshot();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "保存失败");
            throw error;
          }
        }}
        onDelete={async () => {
          try {
            await getBankDataSource().deleteGoal(accountId);
            await refreshSnapshot();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "删除失败");
            throw error;
          }
        }}
        onClose={() => setIsGoalEditorOpen(false)}
      />
    );
  }

  return (
    <div className="h-dvh overflow-hidden bg-[#FFF8F1]">
      <div className="mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden px-5 pb-[calc(env(safe-area-inset-bottom)+94px)] pt-[calc(env(safe-area-inset-top)+24px)]">
        <AppHeader
          showNotification={activeTab === "profile"}
          user={user}
          onProfileClick={activeTab === "profile" ? undefined : () => navigate("profile")}
        />
        {isRefreshing ? (
          <div className="mt-2 overflow-hidden rounded-full bg-[#F3ECEA]">
            <div className="progress-bar" />
          </div>
        ) : null}
        {appError ? (
          <p className="mt-4 rounded-[16px] bg-[#FCE8EA] px-4 py-3 text-[14px] text-[#C9182B]">
            {appError}
          </p>
        ) : null}

        <main
          ref={contentRef}
          className={`no-scrollbar mt-5 min-h-0 flex-1 ${
            activeTab === "transactions" ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          <PageMotion activeTab={activeTab} />
          <section
            data-active-panel={activeTab === "home"}
            className={activeTab === "transactions" ? "h-full min-h-0" : ""}
            hidden={activeTab !== "home"}
          >
            <HomePanel
              account={account}
              transactions={transactions}
              role={role}
              onNavigate={navigate}
              onStartMoneyAction={setMoneyAction}
              onStartTransactionAction={setTransactionAction}
              onOpenGoalEditor={() => setIsGoalEditorOpen(true)}
            />
          </section>

          <section
            data-active-panel={activeTab === "transactions"}
            className={activeTab === "transactions" ? "h-full min-h-0" : ""}
            hidden={activeTab !== "transactions"}
          >
            <TransactionsPanel
              transactions={transactions}
              role={role}
              onStartTransactionAction={setTransactionAction}
              onEditTransaction={setEditingTransaction}
              onViewTransaction={setViewingTransaction}
            />
          </section>

          <section
            data-active-panel={activeTab === "requests"}
            className={activeTab === "transactions" ? "h-full min-h-0" : ""}
            hidden={activeTab !== "requests"}
          >
            <RequestsPanel
              account={account}
              requests={requests}
              onStartMoneyAction={setMoneyAction}
              onApproveRequest={(requestId, reviewNote) => runAndRefresh(() => getBankDataSource().approveWithdrawal(requestId, reviewNote))}
              onCompleteRequest={(request) =>
                runAndRefresh(() =>
                  request.requestType === "deposit"
                    ? getBankDataSource().confirmDepositRequest(request.id)
                    : getBankDataSource().completeRequest(request.id),
                )
              }
              onRejectRequest={(requestId, reviewNote) => runAndRefresh(() => getBankDataSource().rejectRequest(requestId, reviewNote))}
              onDeleteRequest={(requestId) => runAndRefresh(() => getBankDataSource().deleteRequest(requestId))}
              role={role}
            />
          </section>

          <section
            data-active-panel={activeTab === "profile"}
            className={activeTab === "transactions" ? "h-full min-h-0" : ""}
            hidden={activeTab !== "profile"}
          >
            <ProfilePanel
              user={user}
              onLogout={logout}
              onOpenGoalEditor={() => setIsGoalEditorOpen(true)}
            />
          </section>
        </main>
      </div>

      <BottomNav activeTab={activeTab} onChange={navigate} role={role} />
    </div>
  );
}

function FullScreenState({ text, showSpinner = false }: { text: string; showSpinner?: boolean }) {
  return (
    <div className="min-h-dvh bg-[#FFF8F1]">
      <main className="mx-auto flex min-h-dvh max-w-[430px] flex-col items-center justify-center gap-4 px-6 text-center">
        {showSpinner ? <div className="spinner" /> : null}
        <p className="rounded-[18px] bg-white px-5 py-4 text-[15px] font-medium text-[#6D5553] shadow-[0_8px_24px_rgba(160,80,80,0.08)]">
          {text}
        </p>
      </main>
    </div>
  );
}
