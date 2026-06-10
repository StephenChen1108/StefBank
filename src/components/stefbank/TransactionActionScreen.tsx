"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ArrowDownToLine, ArrowLeft, ArrowUpFromLine, CalendarDays, Check, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import Image from "next/image";
import type { AccountSummary, Transaction, TransactionType } from "@/data/mock-bank";
import { formatCurrency } from "@/lib/format";
import { SegmentedControl } from "./ui";

type TransactionActionScreenProps = {
  account: AccountSummary;
  initialType?: TransactionType | null;
  existingTransaction?: Transaction;
  readOnly?: boolean;
  onClose: () => void;
  onSubmit?: (transaction: { type: TransactionType; amount: number; category: string; description: string; transactionDate: string }) => Promise<void> | void;
  onDelete?: () => Promise<void>;
};

const typeItems: { value: TransactionType; label: string }[] = [
  { value: "deposit", label: "存钱" },
  { value: "withdraw", label: "取钱" },
];

const categories = ["存款", "购物", "吃饭", "学习", "交通", "应急", "其他"] as const;

function dateForInput(dateText: string) {
  return dateText.replace(/\./g, "-");
}

export function TransactionActionScreen({
  account,
  initialType,
  existingTransaction,
  readOnly = false,
  onClose,
  onSubmit,
  onDelete,
}: TransactionActionScreenProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const isEdit = !!existingTransaction;
  const [type, setType] = useState<TransactionType>(
    existingTransaction?.type ?? initialType ?? "deposit",
  );
  const [amount, setAmount] = useState(existingTransaction ? String(existingTransaction.amount) : "");
  const [category, setCategory] = useState<(typeof categories)[number]>(
    existingTransaction?.category as (typeof categories)[number] ?? (initialType === "withdraw" ? "其他" : "存款"),
  );
  const [description, setDescription] = useState(existingTransaction?.description ?? "");
  const [transactionDate, setTransactionDate] = useState(
    existingTransaction ? dateForInput(existingTransaction.transactionDate) : new Date().toISOString().slice(0, 10),
  );
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const isDeposit = type === "deposit";

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-transaction-screen-item]",
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

  async function submit() {
    if (isSubmitting) {
      return;
    }

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setMessage(isDeposit ? "请输入存钱金额" : "请输入取钱金额");
      return;
    }

    if (!isDeposit && !isEdit && numericAmount > account.currentBalance) {
      setMessage("余额不足，不能增加这笔取钱流水");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit?.({
        type,
        amount: numericAmount,
        category,
        description: description || (isDeposit ? "行长手动存入" : "行长手动取出"),
        transactionDate: transactionDate.replace(/-/g, "."),
      });
      setMessage(isEdit ? "流水已更新" : isDeposit ? "存钱流水已增加" : "取钱流水已增加");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : isEdit ? "保存失败，请稍后再试" : "新增流水失败，请稍后再试");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (isSubmitting || !onDelete) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onDelete();
      onClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除失败，请稍后再试");
      setIsSubmitting(false);
      setDeleteConfirm(false);
    }
  }

  return (
    <div ref={screenRef} className="fixed inset-0 z-[80] overflow-hidden bg-[#FFF8F1]">
      <main className="mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden px-6 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+18px)]">
        <header data-transaction-screen-item className="flex h-12 shrink-0 items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            aria-label="返回"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#C9182B] shadow-[0_6px_16px_rgba(160,80,80,0.08)] transition active:scale-95"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="text-center">
            <p className="text-[12px] leading-none text-[#8A8A8A]">当前余额</p>
            <p className="mt-1 text-[17px] font-bold leading-none text-[#C9182B]">
              {formatCurrency(account.currentBalance)}
            </p>
          </div>
          <span className="h-11 w-11" />
        </header>

        <section data-transaction-screen-item className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-[rgba(201,24,43,0.06)] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(160,80,80,0.08)]">
          {readOnly ? (
            /* ──────── 只读展示页 ──────── */
            <div className="flex min-h-0 flex-1 flex-col items-center">
              {/* 类型标签 */}
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-[14px] font-semibold ${
                  isDeposit
                    ? "bg-[#EAF4EC] text-[#2E7D32]"
                    : "bg-[#FCE8EA] text-[#C9182B]"
                }`}
              >
                {isDeposit ? (
                  <ArrowDownToLine size={16} strokeWidth={2.5} />
                ) : (
                  <ArrowUpFromLine size={16} strokeWidth={2.5} />
                )}
                {isDeposit ? "存入" : "取出"}
              </span>

              {/* 金额 */}
              <p
                className={`mt-3 shrink-0 text-[44px] font-bold leading-none tracking-[-0.5px] ${
                  isDeposit ? "text-[#2E7D32]" : "text-[#C9182B]"
                }`}
              >
                {isDeposit ? "+" : "-"}
                {formatCurrency(Number(amount) || 0)}
              </p>

              {/* 信息卡片 */}
              <div className="mt-3 w-full shrink-0 space-y-2 rounded-[18px] bg-[#FFF8F1] px-4 py-3">
                <InfoRow icon={CalendarDays} label="日期">
                  {existingTransaction?.transactionDate ?? transactionDate.replace(/-/g, ".")}
                </InfoRow>
                <div className="h-px bg-[#EFE7E5]" />
                <InfoRow icon={Tag} label="分类">{category}</InfoRow>
                <div className="h-px bg-[#EFE7E5]" />
                <button
                  type="button"
                  onClick={() => setShowNoteModal(true)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <Pencil size={18} className="shrink-0 text-[#8A8A8A]" />
                  <span className="shrink-0 text-[14px] text-[#8A8A8A]">备注</span>
                  <span className="ml-auto min-w-0 text-[15px] font-medium leading-snug text-[#2F2F2F] line-clamp-2">
                    {description || "无"}
                  </span>
                </button>
              </div>

              {/* 交易后余额 */}
              <div className="mt-3 shrink-0 text-center">
                <p className="text-[12px] text-[#8A8A8A]">交易后余额</p>
                <p className="text-[22px] font-bold tracking-[-0.5px] text-[#2F2F2F]">
                  {formatCurrency(existingTransaction?.balanceAfter ?? 0)}
                </p>
              </div>

              {/* 底部插画 — 裁剪填充剩余空间 */}
              <div className="mt-3 min-h-0 w-full flex-1 overflow-hidden rounded-[22px]">
                <Image
                  src="/bank-illustration.webp"
                  alt="车厘子银行"
                  width={600}
                  height={300}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              </div>

              {/* 备注详情弹窗 */}
              {showNoteModal ? (
                <div
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 px-6"
                  onClick={() => setShowNoteModal(false)}
                >
                  <div
                    className="w-full max-w-[380px] rounded-[22px] border border-[rgba(201,24,43,0.06)] bg-white px-5 py-5 shadow-[0_12px_36px_rgba(160,80,80,0.15)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-[18px] font-semibold text-[#2F2F2F]">备注详情</h3>
                      <button
                        type="button"
                        onClick={() => setShowNoteModal(false)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7F3F1] text-[#8A8A8A] transition active:scale-95"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <p className="text-[15px] leading-relaxed text-[#2F2F2F]">
                      {description || "无"}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            /* ──────── 编辑 / 新增表单 ──────── */
            <>
              <h1 className="mb-2.5 shrink-0 text-center text-[18px] font-bold text-[#2F2F2F]">
                {isEdit ? "编辑流水" : initialType ? (isDeposit ? "增加存钱" : "增加取钱") : "新增流水"}
              </h1>

              <div className="shrink-0">
                <SegmentedControl
                  items={typeItems}
                  value={type}
                  onChange={(nextType) => {
                    setType(nextType);
                    setCategory(nextType === "deposit" ? "存款" : "其他");
                    setMessage("");
                  }}
                />
              </div>

              <div className="mt-2.5 shrink-0">
                <label htmlFor="transaction-amount" className="mb-1.5 block text-[13px] font-medium text-[#4B3D3B]">
                  {isDeposit ? "存钱金额" : "取钱金额"}
                </label>
                <div className="flex h-[48px] items-center rounded-[16px] border border-[#EFE7E5] px-4">
                  <span className="mr-2 text-[15px] font-semibold text-[#C9182B]">¥</span>
                  <input
                    id="transaction-amount"
                    value={amount}
                    onChange={(event) => {
                      setAmount(event.target.value);
                      setMessage("");
                    }}
                    inputMode="decimal"
                    type="number"
                    min="0"
                    placeholder="0"
                    className="min-w-0 flex-1 bg-transparent text-[28px] font-semibold text-[#C9182B] outline-none placeholder:text-[#E2B0B5]"
                  />
                </div>
              </div>

              <div className="mt-2.5 shrink-0">
                <label htmlFor="transaction-date" className="mb-1.5 block text-[13px] font-medium text-[#4B3D3B]">
                  日期
                </label>
                <input
                  id="transaction-date"
                  type="date"
                  value={transactionDate}
                  onChange={(event) => {
                    setTransactionDate(event.target.value);
                    setMessage("");
                  }}
                  className="h-[40px] w-full rounded-[14px] border border-[#EFE7E5] bg-white px-4 text-[14px] text-[#2F2F2F] outline-none"
                />
              </div>

              <div className="mt-2.5 shrink-0">
                <p className="mb-1.5 text-[13px] font-medium text-[#4B3D3B]">分类</p>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((item) => {
                    const selected = category === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCategory(item)}
                        className={`h-8 rounded-[13px] text-[13px] font-medium transition active:scale-[0.98] ${
                          selected ? "bg-[#FCE8EA] text-[#C9182B]" : "bg-[#F7F3F1] text-[#5C5250]"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-2.5 min-h-0 shrink">
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="transaction-description" className="text-[13px] font-medium text-[#4B3D3B]">
                    备注
                  </label>
                  <span className="text-[12px] text-[#8A8A8A]">{description.length}/60</span>
                </div>
                <textarea
                  id="transaction-description"
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value.slice(0, 60));
                    setMessage("");
                  }}
                  placeholder="简单备注一下"
                  className="h-[72px] w-full resize-none rounded-[16px] border border-[#EFE7E5] bg-white px-4 py-3 text-[15px] text-[#2F2F2F] outline-none placeholder:text-[#B9AEAC]"
                />
              </div>

              {message ? (
                <p
                  className={`mt-2 shrink-0 rounded-[14px] px-4 py-2 text-center text-[14px] ${
                    message.includes("已增加") || message.includes("已更新")
                      ? "bg-[#EAF4EC] text-[#2E7D32]"
                      : "bg-[#FCE8EA] text-[#C9182B]"
                  }`}
                >
                  {message}
                </p>
              ) : null}

              <button
                type="button"
                onClick={submit}
                disabled={isSubmitting}
                className="mt-auto flex h-[48px] shrink-0 items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(135deg,#F46B7A_0%,#C9182B_100%)] text-[15px] font-semibold text-white shadow-[0_12px_22px_rgba(201,24,43,0.18)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {message.includes("已增加") || message.includes("已更新") ? (
                  <Check size={20} />
                ) : isDeposit ? (
                  <ArrowDownToLine size={20} />
                ) : (
                  <ArrowUpFromLine size={20} />
                )}
                {isSubmitting ? "保存中..." : isEdit ? "保存修改" : message.includes("已增加") ? "继续增加" : "增加流水"}
                {isEdit ? null : <Plus size={18} />}
              </button>

              {isEdit ? (
                <div className="mt-2 shrink-0">
                  {deleteConfirm ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(false)}
                        disabled={isSubmitting}
                        className="flex-1 rounded-[14px] border border-[#EFE7E5] bg-white py-2.5 text-[14px] font-medium text-[#5C5250] transition active:scale-[0.98]"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        className="flex-1 rounded-[14px] bg-[#C9182B] py-2.5 text-[14px] font-medium text-white transition active:scale-[0.98] disabled:opacity-60"
                      >
                        {isSubmitting ? "删除中..." : "确认删除"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(true)}
                      disabled={isSubmitting}
                      className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-[#FCE8EA] bg-white py-2.5 text-[14px] font-medium text-[#C9182B] transition active:scale-[0.98]"
                    >
                      <Trash2 size={16} />
                      删除这条流水
                    </button>
                  )}
                </div>
              ) : null}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
  truncate = false,
}: {
  icon: typeof CalendarDays;
  label: string;
  children: React.ReactNode;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={18} className="shrink-0 text-[#8A8A8A]" />
      <span className="shrink-0 text-[14px] text-[#8A8A8A]">{label}</span>
      <span
        className={`ml-auto min-w-0 text-[15px] font-medium text-[#2F2F2F] ${
          truncate ? "truncate" : ""
        }`}
      >
        {children}
      </span>
    </div>
  );
}
