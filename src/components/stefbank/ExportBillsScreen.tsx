"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ArrowLeft, Download } from "lucide-react";
import type { Transaction } from "@/data/bank-types";
import { ALL_CATEGORIES } from "@/data/categories";
import { formatCurrency } from "@/lib/format";
import { centsToYuan } from "@/lib/money";

type ExportBillsScreenProps = {
  transactions: Transaction[];
  onClose: () => void;
};

type FilterType = "all" | "deposit" | "withdraw";

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function ExportBillsScreen({ transactions, onClose }: ExportBillsScreenProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterCategory, setFilterCategory] = useState<string>("全部");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-export-screen-item]",
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

  const filtered = transactions.filter((tx) => {
    if (filterType !== "all" && tx.type !== filterType) {
      return false;
    }
    if (filterCategory !== "全部" && tx.category !== filterCategory) {
      return false;
    }
    if (startDate) {
      const txDate = tx.transactionDate.replace(/\./g, "-");
      if (txDate < startDate) {
        return false;
      }
    }
    if (endDate) {
      const txDate = tx.transactionDate.replace(/\./g, "-");
      if (txDate > endDate) {
        return false;
      }
    }
    return true;
  });

  function handleExport() {
    if (filtered.length === 0) {
      setMessage("没有符合条件的流水");
      return;
    }

    const header = "日期,类型,金额,分类,备注,余额";
    const rows = filtered.map((tx) => {
      const type = tx.type === "deposit" ? "存入" : "取出";
      const amount = centsToYuan(tx.amount).toFixed(2);
      const balance = centsToYuan(tx.balanceAfter).toFixed(2);
      return [
        tx.transactionDate.replace(/\./g, "-"),
        type,
        amount,
        escapeCsv(tx.category),
        escapeCsv(tx.description),
        balance,
      ].join(",");
    });

    const csv = "﻿" + [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stefbank-bills-${dateStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage(`已导出 ${filtered.length} 条流水`);
  }

  const typeItems: { value: FilterType; label: string }[] = [
    { value: "all", label: "全部" },
    { value: "deposit", label: "存入" },
    { value: "withdraw", label: "取出" },
  ];

  return (
    <div ref={screenRef} className="fixed inset-0 z-[80] overflow-hidden bg-[#FFF8F1]">
      <main className="mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden px-6 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+18px)]">
        <header data-export-screen-item className="flex h-12 shrink-0 items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            aria-label="返回"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#C9182B] shadow-[0_6px_16px_rgba(160,80,80,0.08)] transition active:scale-95"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="text-center">
            <p className="text-[17px] font-bold leading-none text-[#2F2F2F]">导出账单</p>
          </div>
          <span className="h-11 w-11" />
        </header>

        <section
          data-export-screen-item
          className="no-scrollbar mt-4 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[22px] border border-[rgba(201,24,43,0.06)] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(160,80,80,0.08)]"
        >
          {/* 类型筛选 */}
          <div data-export-screen-item className="shrink-0">
            <p className="mb-1.5 text-[13px] font-medium text-[#4B3D3B]">类型</p>
            <div className="grid grid-cols-3 gap-2">
              {typeItems.map((item) => {
                const selected = filterType === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setFilterType(item.value);
                      setMessage("");
                    }}
                    className={`h-9 rounded-[13px] text-[14px] font-medium transition active:scale-[0.98] ${
                      selected ? "bg-[#FCE8EA] text-[#C9182B]" : "bg-[#F7F3F1] text-[#5C5250]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 日期范围 */}
          <div data-export-screen-item className="mt-3 shrink-0">
            <p className="mb-1.5 text-[13px] font-medium text-[#4B3D3B]">日期范围</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setMessage("");
                }}
                className="h-[40px] flex-1 rounded-[14px] border border-[#EFE7E5] bg-white px-3 text-[13px] text-[#2F2F2F] outline-none"
              />
              <span className="text-[13px] text-[#8A8A8A]">至</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setMessage("");
                }}
                className="h-[40px] flex-1 rounded-[14px] border border-[#EFE7E5] bg-white px-3 text-[13px] text-[#2F2F2F] outline-none"
              />
            </div>
          </div>

          {/* 分类筛选 */}
          <div data-export-screen-item className="mt-3 shrink-0">
            <p className="mb-1.5 text-[13px] font-medium text-[#4B3D3B]">分类</p>
            <div className="grid grid-cols-4 gap-2">
              {["全部", ...ALL_CATEGORIES].map((cat) => {
                const selected = filterCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setFilterCategory(cat);
                      setMessage("");
                    }}
                    className={`h-8 rounded-[13px] text-[13px] font-medium transition active:scale-[0.98] ${
                      selected ? "bg-[#FCE8EA] text-[#C9182B]" : "bg-[#F7F3F1] text-[#5C5250]"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 预览 */}
          <div data-export-screen-item className="mt-3 shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-[#4B3D3B]">预览</p>
              <p className="text-[12px] text-[#8A8A8A]">共 {filtered.length} 条</p>
            </div>
            <div className="mt-2 space-y-1.5">
              {filtered.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-[12px] bg-[#FFF8F1] px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-[#2F2F2F]">
                      {tx.type === "deposit" ? "存入" : "取出"} · {tx.category}
                    </p>
                    <p className="text-[11px] text-[#8A8A8A]">{tx.transactionDate}</p>
                  </div>
                  <p
                    className={`shrink-0 text-[14px] font-semibold ${
                      tx.type === "deposit" ? "text-[#2E7D32]" : "text-[#C9182B]"
                    }`}
                  >
                    {tx.type === "deposit" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </p>
                </div>
              ))}
              {filtered.length > 5 ? (
                <p className="text-center text-[12px] text-[#8A8A8A]">
                  还有 {filtered.length - 5} 条...
                </p>
              ) : null}
              {filtered.length === 0 ? (
                <p className="py-4 text-center text-[13px] text-[#8A8A8A]">
                  没有符合条件的流水
                </p>
              ) : null}
            </div>
          </div>

          {/* Spacer */}
          <div className="min-h-4 flex-1 shrink" />

          {/* 消息 */}
          {message ? (
            <p
              data-export-screen-item
              className={`mt-3 shrink-0 rounded-[14px] px-4 py-2 text-center text-[14px] ${
                message.includes("已导出")
                  ? "bg-[#EAF4EC] text-[#2E7D32]"
                  : "bg-[#FCE8EA] text-[#C9182B]"
              }`}
            >
              {message}
            </p>
          ) : null}

          {/* 导出按钮 */}
          <button
            type="button"
            onClick={handleExport}
            disabled={filtered.length === 0}
            data-export-screen-item
            className="mt-3 flex h-[48px] shrink-0 items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(135deg,#F46B7A_0%,#C9182B_100%)] text-[15px] font-semibold text-white shadow-[0_12px_22px_rgba(201,24,43,0.18)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={20} />
            导出 CSV 账单
          </button>
        </section>
      </main>
    </div>
  );
}
