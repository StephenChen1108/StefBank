"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AccountSummary, BankRequest, RequestTab, TabId, Transaction, TransactionType, UserProfile } from "@/data/mock-bank";
import {
  approveWithdrawal,
  completeRequest,
  confirmDepositRequest,
  createAdminTransaction,
  deleteRequest,
  deleteTransaction,
  getExistingStefBankSession,
  loadStefBankSnapshot,
  rejectRequest,
  signInStefBank,
  signOutStefBank,
  submitBankRequest,
  updateTransaction,
} from "@/lib/stefbank-supabase";
import type { RequestInput, TransactionInput } from "@/lib/stefbank-supabase";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";
import { HomePanel } from "./HomePanel";
import { LoginPanel } from "./LoginPanel";
import { MoneyActionScreen } from "./MoneyActionScreen";
import { PageMotion } from "./PageMotion";
import { ProfilePanel } from "./ProfilePanel";
import { RequestsPanel } from "./RequestsPanel";
import { TransactionActionScreen } from "./TransactionActionScreen";
import { TransactionsPanel } from "./TransactionsPanel";

export function StefBankApp() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [moneyAction, setMoneyAction] = useState<RequestTab | null>(null);
  const [transactionAction, setTransactionAction] = useState<TransactionType | "new" | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accountId, setAccountId] = useState("");
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [requests, setRequests] = useState<BankRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isBooting, setIsBooting] = useState(true);
  const [appError, setAppError] = useState("");
  const contentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let ignore = false;

    getExistingStefBankSession()
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

  function applySnapshot(snapshot: Awaited<ReturnType<typeof loadStefBankSnapshot>>) {
    setUser(snapshot.user);
    setAccountId(snapshot.accountId);
    setAccount(snapshot.account);
    setRequests(snapshot.requests);
    setTransactions(snapshot.transactions);
    setAppError("");
  }

  async function refreshSnapshot() {
    const snapshot = await loadStefBankSnapshot();
    applySnapshot(snapshot);
  }

  async function handleLogin(credentials: { username: string; password: string }) {
    const snapshot = await signInStefBank(credentials.username, credentials.password);
    applySnapshot(snapshot);
    setActiveTab("home");
    setMoneyAction(null);
    setTransactionAction(null);
  }

  async function handleRequestSubmit(input: RequestInput) {
    await submitBankRequest(accountId, input);
    await refreshSnapshot();
  }

  async function runAndRefresh(action: () => Promise<void>) {
    await action();
    await refreshSnapshot();
  }

  if (isBooting) {
    return <FullScreenState text="正在打开车厘子银行..." />;
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
    await signOutStefBank();
    setUser(null);
    setAccount(null);
    setAccountId("");
    setRequests([]);
    setTransactions([]);
    setActiveTab("home");
    setMoneyAction(null);
    setTransactionAction(null);
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
          runAndRefresh(() => createAdminTransaction(accountId, transaction))
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
            updateTransaction(editingTransaction.id, transaction),
          )
        }
        onDelete={() =>
          runAndRefresh(() => deleteTransaction(editingTransaction.id))
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

  return (
    <div className="h-dvh overflow-hidden bg-[#FFF8F1]">
      <div className="mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden px-5 pb-[calc(env(safe-area-inset-bottom)+94px)] pt-[calc(env(safe-area-inset-top)+24px)]">
        <AppHeader
          showNotification={activeTab === "profile"}
          user={user}
          onProfileClick={activeTab === "profile" ? undefined : () => navigate("profile")}
        />
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
              onApproveRequest={(requestId, reviewNote) => runAndRefresh(() => approveWithdrawal(requestId, reviewNote))}
              onCompleteRequest={(request) =>
                runAndRefresh(() =>
                  request.requestType === "deposit"
                    ? confirmDepositRequest(request.id)
                    : completeRequest(request.id),
                )
              }
              onRejectRequest={(requestId, reviewNote) => runAndRefresh(() => rejectRequest(requestId, reviewNote))}
              onDeleteRequest={(requestId) => runAndRefresh(() => deleteRequest(requestId))}
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
            />
          </section>
        </main>
      </div>

      <BottomNav activeTab={activeTab} onChange={navigate} role={role} />
    </div>
  );
}

function FullScreenState({ text }: { text: string }) {
  return (
    <div className="min-h-dvh bg-[#FFF8F1]">
      <main className="mx-auto flex min-h-dvh max-w-[430px] items-center justify-center px-6 text-center">
        <p className="rounded-[18px] bg-white px-5 py-4 text-[15px] font-medium text-[#6D5553] shadow-[0_8px_24px_rgba(160,80,80,0.08)]">
          {text}
        </p>
      </main>
    </div>
  );
}
