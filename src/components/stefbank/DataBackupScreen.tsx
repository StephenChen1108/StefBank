"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ArrowLeft, Download, FileJson } from "lucide-react";
import type { AccountSummary, BankRequest, Transaction } from "@/data/bank-types";
import { formatCurrency } from "@/lib/format";

type DataBackupScreenProps = {
  account: AccountSummary;
  transactions: Transaction[];
  requests: BankRequest[];
  onClose: () => void;
};

export function DataBackupScreen({
  account,
  transactions,
  requests,
  onClose,
}: DataBackupScreenProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-backup-screen-item]",
        { autoAlpha: 0, y: 18, scale: 0.985 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.42,
          ease: "power2.out",
          stagger: 0.055,
          clearProps: "all",
        },
      );
    }, screenRef);

    return () => ctx.revert();
  }, []);

  function handleBackup() {
    const backupData = {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      account: {
        name: account.name,
        displayName: account.displayName,
        currentBalance: account.currentBalance,
      },
      transactions,
      requests,
      goal: account.goal,
    };

    const json = JSON.stringify(backupData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stefbank-backup-${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("数据备份已下载");
  }

  return (
    <div ref={screenRef} className="fixed inset-0 z-[80] overflow-hidden bg-[#FFF8F1]">
      <main className="mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden px-6 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+18px)]">
        <header data-backup-screen-item className="flex h-12 shrink-0 items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            aria-label="返回"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#C9182B] shadow-[0_6px_16px_rgba(160,80,80,0.08)] transition active:scale-95"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="text-center">
            <p className="text-[17px] font-bold leading-none text-[#2F2F2F]">数据备份</p>
          </div>
          <span className="h-11 w-11" />
        </header>

        <section
          data-backup-screen-item
          className="no-scrollbar mt-4 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[22px] border border-[rgba(201,24,43,0.06)] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(160,80,80,0.08)]"
        >
          {/* 数据概览 */}
          <div data-backup-screen-item className="space-y-3">
            <p className="text-[13px] font-medium text-[#4B3D3B]">数据概览</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-[14px] bg-[#FFF8F1] px-3 py-3 text-center">
                <p className="text-[20px] font-bold text-[#C9182B]">{transactions.length}</p>
                <p className="mt-1 text-[12px] text-[#8A8A8A]">条流水</p>
              </div>
              <div className="rounded-[14px] bg-[#FFF8F1] px-3 py-3 text-center">
                <p className="text-[20px] font-bold text-[#C9182B]">{requests.length}</p>
                <p className="mt-1 text-[12px] text-[#8A8A8A]">条申请</p>
              </div>
              <div className="rounded-[14px] bg-[#FFF8F1] px-3 py-3 text-center">
                <p className="text-[16px] font-bold text-[#C9182B]">{formatCurrency(account.currentBalance)}</p>
                <p className="mt-1 text-[12px] text-[#8A8A8A]">当前余额</p>
              </div>
            </div>
          </div>

          {/* 备份说明 */}
          <div data-backup-screen-item className="mt-4 rounded-[16px] bg-[#FFF8F1] px-4 py-3">
            <p className="text-[14px] leading-relaxed text-[#6D5553]">
              备份文件包含所有流水记录、申请记录和储蓄目标数据。
              下载后请妥善保管，可以随时恢复。
            </p>
          </div>

          {/* Spacer */}
          <div className="min-h-4 flex-1 shrink" />

          {/* 消息 */}
          {message ? (
            <p
              data-backup-screen-item
              className="mt-3 shrink-0 rounded-[14px] bg-[#EAF4EC] px-4 py-2 text-center text-[14px] text-[#2E7D32]"
            >
              {message}
            </p>
          ) : null}

          {/* 下载按钮 */}
          <button
            type="button"
            onClick={handleBackup}
            data-backup-screen-item
            className="mt-3 flex h-[48px] shrink-0 items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(135deg,#F46B7A_0%,#C9182B_100%)] text-[15px] font-semibold text-white shadow-[0_12px_22px_rgba(201,24,43,0.18)] transition active:scale-[0.98]"
          >
            <FileJson size={20} />
            下载完整数据备份
          </button>
        </section>
      </main>
    </div>
  );
}
