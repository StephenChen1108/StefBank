"use client";

import { useRef, useState } from "react";
import type { BankRequest, RequestTab, TabId, UserRole } from "@/data/mock-bank";
import { mockAccount, mockRequests, mockTransactions, mockUsers } from "@/data/mock-bank";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";
import { HomePanel } from "./HomePanel";
import { LoginPanel } from "./LoginPanel";
import { MoneyActionScreen } from "./MoneyActionScreen";
import { PageMotion } from "./PageMotion";
import { ProfilePanel } from "./ProfilePanel";
import { RequestsPanel } from "./RequestsPanel";
import { TransactionsPanel } from "./TransactionsPanel";

export function StefBankApp() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [moneyAction, setMoneyAction] = useState<RequestTab | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [requests, setRequests] = useState<BankRequest[]>(mockRequests);
  const contentRef = useRef<HTMLElement>(null);

  if (!role) {
    return (
      <LoginPanel
        onLogin={(nextRole) => {
          setRole(nextRole);
          setActiveTab("home");
          setMoneyAction(null);
        }}
      />
    );
  }

  const user = mockUsers[role];

  function logout() {
    setRole(null);
    setActiveTab("home");
    setMoneyAction(null);
  }

  function navigate(tab: TabId) {
    setActiveTab(tab);
    contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }

  if (moneyAction) {
    return (
      <MoneyActionScreen
        account={mockAccount}
        mode={moneyAction}
        setRequests={setRequests}
        onClose={() => setMoneyAction(null)}
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
              account={mockAccount}
              transactions={mockTransactions}
              role={role}
              onNavigate={navigate}
              onStartMoneyAction={setMoneyAction}
            />
          </section>

          <section
            data-active-panel={activeTab === "transactions"}
            className={activeTab === "transactions" ? "h-full min-h-0" : ""}
            hidden={activeTab !== "transactions"}
          >
            <TransactionsPanel transactions={mockTransactions} />
          </section>

          <section
            data-active-panel={activeTab === "requests"}
            className={activeTab === "transactions" ? "h-full min-h-0" : ""}
            hidden={activeTab !== "requests"}
          >
            <RequestsPanel
              account={mockAccount}
              requests={requests}
              setRequests={setRequests}
              onStartMoneyAction={setMoneyAction}
              role={role}
            />
          </section>

          <section
            data-active-panel={activeTab === "profile"}
            className={activeTab === "transactions" ? "h-full min-h-0" : ""}
            hidden={activeTab !== "profile"}
          >
            <ProfilePanel user={user} onLogout={logout} />
          </section>
        </main>
      </div>

      <BottomNav activeTab={activeTab} onChange={navigate} role={role} />
    </div>
  );
}
