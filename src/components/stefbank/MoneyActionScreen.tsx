"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ArrowLeft, Check, Send } from "lucide-react";
import Image from "next/image";
import type { AccountSummary, RequestTab } from "@/data/mock-bank";
import type { RequestInput } from "@/lib/stefbank-supabase";
import { formatCurrency } from "@/lib/format";

type MoneyActionScreenProps = {
  account: AccountSummary;
  mode: RequestTab;
  onSubmitRequest: (input: RequestInput) => Promise<void>;
  onClose: () => void;
};

const categories = ["购物", "吃饭", "学习", "交通", "应急", "其他"] as const;
const urgencyLevels = ["普通", "今天要", "救命啊"] as const;
const paymentMethods = ["微信", "支付宝", "银行卡"] as const;

export function MoneyActionScreen({
  account,
  mode,
  onSubmitRequest,
  onClose,
}: MoneyActionScreenProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const isWithdraw = mode === "withdraw";
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("购物");
  const [urgency, setUrgency] = useState<(typeof urgencyLevels)[number]>("普通");
  const [paymentMethod, setPaymentMethod] = useState<(typeof paymentMethods)[number]>("微信");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-money-screen-item]",
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
      setMessage(isWithdraw ? "请输入取款金额" : "请输入存款金额");
      return;
    }

    if (isWithdraw && numericAmount > account.currentBalance) {
      setMessage("余额不足，暂时不能提交这笔申请");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmitRequest({
        requestType: mode,
        amount: numericAmount,
        category: isWithdraw ? category : "存款",
        urgency: isWithdraw ? urgency : undefined,
        paymentMethod,
        note: note || "未填写备注",
      });
      setAmount("");
      setNote("");
      setMessage(isWithdraw ? "取款申请已提交" : "存款记录已提交");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交失败，请稍后再试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div ref={screenRef} className="fixed inset-0 z-[80] overflow-hidden bg-[#FFF8F1]">
      <main className="mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden px-6 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+18px)]">
        <header data-money-screen-item className="flex h-12 shrink-0 items-center justify-between">
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

        <section data-money-screen-item className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-[rgba(201,24,43,0.06)] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(160,80,80,0.08)]">
          <h1 className="mb-2.5 shrink-0 text-center text-[18px] font-bold text-[#2F2F2F]">
            {isWithdraw ? "我要取钱" : "我要存钱"}
          </h1>
          <div className="shrink-0">
            <label htmlFor="quick-amount" className="mb-1.5 block text-[13px] font-medium text-[#4B3D3B]">
              {isWithdraw ? "取款金额" : "存款金额"}
            </label>
            <div className="flex h-[48px] items-center rounded-[16px] border border-[#EFE7E5] px-4">
              <span className="mr-2 text-[15px] font-semibold text-[#C9182B]">¥</span>
              <input
                id="quick-amount"
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

          {isWithdraw ? (
            <div className="mt-2.5 shrink-0 space-y-2">
              <CompactChoiceGroup label="用途" items={categories} value={category} onChange={setCategory} />
              <CompactChoiceGroup label="紧急" items={urgencyLevels} value={urgency} onChange={setUrgency} />
            </div>
          ) : null}

          <div className="mt-2.5 shrink-0">
            <CompactChoiceGroup
              label={isWithdraw ? "到账" : "方式"}
              items={paymentMethods}
              value={paymentMethod}
              onChange={setPaymentMethod}
            />
          </div>

          <div className="mt-2.5 flex min-h-0 flex-1 flex-col">
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="quick-note" className="text-[13px] font-medium text-[#4B3D3B]">
                备注
              </label>
              <span className="text-[12px] text-[#8A8A8A]">{note.length}/60</span>
            </div>
            <textarea
              id="quick-note"
              value={note}
              onChange={(event) => {
                setNote(event.target.value.slice(0, 60));
                setMessage("");
              }}
              placeholder={isWithdraw ? "简单说一下用途" : "简单备注一下"}
              className="h-[70px] w-full shrink-0 resize-none rounded-[16px] border border-[#EFE7E5] bg-white px-4 py-3 text-[15px] leading-relaxed text-[#2F2F2F] outline-none placeholder:text-[#B9AEAC]"
            />
            <div className="mt-1.5 min-h-[120px] flex-1 overflow-hidden rounded-[16px]">
              <Image
                src={isWithdraw ? "/save-illustration.webp" : "/bank-illustration.webp"}
                alt="车厘子银行"
                width={600}
                height={160}
                unoptimized
                className={`h-full w-full ${isWithdraw ? "object-contain" : "object-cover object-[50%_40%]"}`}
              />
            </div>
          </div>

          {message ? (
            <p
              className={`mt-2 shrink-0 rounded-[14px] px-4 py-2 text-center text-[14px] ${
                message.includes("已提交")
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
            className="mt-3 flex h-[48px] shrink-0 items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(135deg,#F46B7A_0%,#C9182B_100%)] text-[15px] font-semibold text-white shadow-[0_12px_22px_rgba(201,24,43,0.18)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {message.includes("已提交") ? <Check size={20} /> : <Send size={20} />}
            {isSubmitting ? "提交中..." : isWithdraw ? "提交取款申请" : "提交存款记录"}
          </button>
        </section>
      </main>
    </div>
  );
}

function CompactChoiceGroup<T extends string>({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-medium text-[#4B3D3B]">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const selected = value === item;

          return (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              className={`h-9 rounded-[13px] text-[14px] font-medium transition active:scale-[0.98] ${
                selected ? "bg-[#FCE8EA] text-[#C9182B]" : "bg-[#F7F3F1] text-[#5C5250]"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}
