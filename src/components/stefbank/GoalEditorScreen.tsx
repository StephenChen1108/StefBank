"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ArrowLeft, Check, ChevronRight, Sparkles, Trash2 } from "lucide-react";
import type { AccountSummary, SavingGoal } from "@/data/bank-types";
import { GOAL_TYPES, PRESET_AMOUNTS, getGoalType, type GoalTypeId } from "@/data/goal-types";
import { formatCurrency } from "@/lib/format";
import type { GoalInput } from "@/lib/bank-data-source";
import { isValidYuanInput } from "@/lib/money";

type GoalEditorScreenProps = {
  account: AccountSummary;
  existingGoal: SavingGoal | null;
  onSave: (input: GoalInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
};

type Step = "type" | "form";

export function GoalEditorScreen({
  account,
  existingGoal,
  onSave,
  onDelete,
  onClose,
}: GoalEditorScreenProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>(existingGoal ? "form" : "type");
  const [goalType, setGoalType] = useState<GoalTypeId>(
    (existingGoal?.goalType as GoalTypeId) ?? "travel",
  );
  const [title, setTitle] = useState(existingGoal?.title ?? "");
  const [targetAmount, setTargetAmount] = useState(
    existingGoal ? String(existingGoal.targetAmount) : "",
  );
  const [metadata, setMetadata] = useState<Record<string, string>>(
    existingGoal?.metadata ?? {},
  );
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const isEditing = !!existingGoal;
  const typeDef = getGoalType(goalType);
  const TypeIcon = typeDef.icon;

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-goal-screen-item]",
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
  }, [step]);

  // Auto-fill title with default when switching types (only if empty or default)
  function selectType(typeId: GoalTypeId) {
    const def = getGoalType(typeId);
    setGoalType(typeId);
    if (!title || GOAL_TYPES.some((g) => g.defaultTitle === title)) {
      setTitle(def.defaultTitle);
    }
    // Reset metadata when switching type
    setMetadata({});
    setStep("form");
  }

  function updateMetadata(key: string, value: string) {
    setMetadata((prev) => ({ ...prev, [key]: value }));
  }

  function selectPresetAmount(amount: number) {
    setTargetAmount(String(amount));
    setMessage("");
  }

  async function submit() {
    if (isSubmitting) {
      return;
    }

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setMessage("请填写目标名称");
      return;
    }

    if (!isValidYuanInput(targetAmount)) {
      setMessage("请填写目标金额");
      return;
    }

    const amount = Number(targetAmount);

    setIsSubmitting(true);

    try {
      await onSave({
        title: trimmedTitle,
        targetAmount: amount,
        goalType,
        metadata,
      });
      setMessage("储蓄目标已保存");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败，请稍后再试");
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
        <header data-goal-screen-item className="flex h-12 shrink-0 items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (isEditing && step === "type") {
                setStep("form");
              } else {
                onClose();
              }
            }}
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

        <section
          data-goal-screen-item
          className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-[rgba(201,24,43,0.06)] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(160,80,80,0.08)]"
        >
          {step === "type" ? (
            <TypePickerView
              onSelect={selectType}
              onBack={() => (isEditing ? setStep("form") : onClose())}
              onClose={onClose}
            />
          ) : (
            <GoalFormView
              typeDef={typeDef}
              TypeIcon={TypeIcon}
              goalType={goalType}
              title={title}
              targetAmount={targetAmount}
              metadata={metadata}
              message={message}
              isSubmitting={isSubmitting}
              isEditing={isEditing}
              deleteConfirm={deleteConfirm}
              onChangeTitle={setTitle}
              onChangeAmount={setTargetAmount}
              onSelectPreset={selectPresetAmount}
              onUpdateMetadata={updateMetadata}
              onClearMessage={() => setMessage("")}
              onSubmit={submit}
              onDelete={handleDelete}
              onDeleteConfirm={() => setDeleteConfirm(true)}
              onCancelDelete={() => setDeleteConfirm(false)}
              onChangeType={() => setStep("type")}
              onClose={onClose}
            />
          )}
        </section>
      </main>
    </div>
  );
}

/* ──────────── Step 1: Type Picker ──────────── */

function TypePickerView({
  onSelect,
  onBack,
  onClose,
}: {
  onSelect: (typeId: GoalTypeId) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div data-goal-screen-item className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={onBack}
          aria-label="返回"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF0F0] text-[#C9182B] transition active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
      </div>
      <div data-goal-screen-item className="mt-2 text-center">
        <h1 className="text-[18px] font-bold text-[#2F2F2F]">选择储蓄目标</h1>
        <p className="mt-1.5 text-[14px] text-[#8A8A8A]">选一个你最想存钱的方向</p>
      </div>

      <div data-goal-screen-item className="no-scrollbar mt-4 min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          {GOAL_TYPES.map((type) => {
            const Icon = type.icon;

            return (
              <button
                key={type.id}
                type="button"
                onClick={() => onSelect(type.id)}
                className="flex flex-col items-start rounded-[18px] border border-[rgba(201,24,43,0.04)] bg-[#FFFCFA] px-4 py-4 text-left transition active:scale-[0.98]"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-[14px]"
                  style={{ backgroundColor: type.tint.bg, color: type.tint.text }}
                >
                  <Icon size={22} strokeWidth={2} />
                </span>
                <p className="mt-3 text-[15px] font-semibold text-[#2F2F2F]">{type.label}</p>
                <p className="mt-1 text-[12px] leading-4 text-[#8A8A8A]">{type.description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[12px] text-[#C9182B]">
                  选择 <ChevronRight size={14} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        data-goal-screen-item
        className="mt-3 flex h-[44px] shrink-0 items-center justify-center rounded-[16px] border border-[#EFE7E5] bg-white text-[14px] font-medium text-[#5C5250] transition active:scale-[0.98]"
      >
        暂时不设置
      </button>
    </div>
  );
}

/* ──────────── Step 2: Goal Form ──────────── */

function GoalFormView({
  typeDef,
  TypeIcon,
  goalType,
  title,
  targetAmount,
  metadata,
  message,
  isSubmitting,
  isEditing,
  deleteConfirm,
  onChangeTitle,
  onChangeAmount,
  onSelectPreset,
  onUpdateMetadata,
  onClearMessage,
  onSubmit,
  onDelete,
  onDeleteConfirm,
  onCancelDelete,
  onChangeType,
  onClose,
}: {
  typeDef: ReturnType<typeof getGoalType>;
  TypeIcon: typeof Sparkles;
  goalType: GoalTypeId;
  title: string;
  targetAmount: string;
  metadata: Record<string, string>;
  message: string;
  isSubmitting: boolean;
  isEditing: boolean;
  deleteConfirm: boolean;
  onChangeTitle: (value: string) => void;
  onChangeAmount: (value: string) => void;
  onSelectPreset: (amount: number) => void;
  onUpdateMetadata: (key: string, value: string) => void;
  onClearMessage: () => void;
  onSubmit: () => void;
  onDelete: () => void;
  onDeleteConfirm: () => void;
  onCancelDelete: () => void;
  onChangeType: () => void;
  onClose: () => void;
}) {
  return (
    <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* Type selector bar */}
      <button
        type="button"
        onClick={onChangeType}
        data-goal-screen-item
        className="flex shrink-0 items-center gap-3 rounded-[16px] border border-[rgba(201,24,43,0.04)] bg-[#FFFCFA] px-4 py-3 text-left transition active:scale-[0.99]"
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
          style={{ backgroundColor: typeDef.tint.bg, color: typeDef.tint.text }}
        >
          <TypeIcon size={20} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-[#8A8A8A]">目标类型</p>
          <p className="text-[15px] font-semibold text-[#2F2F2F]">{typeDef.label}</p>
        </div>
        <span className="text-[12px] text-[#C9182B]">更换</span>
        <ChevronRight size={16} className="text-[#8A8A8A]" />
      </button>

      {/* Title */}
      <div data-goal-screen-item className="mt-3 shrink-0">
        <label htmlFor="goal-title" className="mb-1.5 block text-[13px] font-medium text-[#4B3D3B]">
          目标名称
        </label>
        <input
          id="goal-title"
          value={title}
          onChange={(e) => {
            onChangeTitle(e.target.value.slice(0, 20));
            onClearMessage();
          }}
          placeholder="例如：东京旅行基金"
          maxLength={20}
          className="h-[44px] w-full rounded-[14px] border border-[#EFE7E5] bg-white px-4 text-[15px] text-[#2F2F2F] outline-none placeholder:text-[#B9AEAC]"
        />
      </div>

      {/* Target amount */}
      <div data-goal-screen-item className="mt-3 shrink-0">
        <label htmlFor="goal-amount" className="mb-1.5 block text-[13px] font-medium text-[#4B3D3B]">
          目标金额
        </label>
        <div className="flex h-[48px] items-center rounded-[16px] border border-[#EFE7E5] px-4">
          <span className="mr-2 text-[15px] font-semibold text-[#C9182B]">¥</span>
          <input
            id="goal-amount"
            value={targetAmount}
            onChange={(e) => {
              onChangeAmount(e.target.value);
              onClearMessage();
            }}
            inputMode="decimal"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            className="min-w-0 flex-1 bg-transparent text-[26px] font-semibold text-[#C9182B] outline-none placeholder:text-[#E2B0B5]"
          />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {PRESET_AMOUNTS.map((amount) => {
            const selected = targetAmount === String(amount);

            return (
              <button
                key={amount}
                type="button"
                onClick={() => onSelectPreset(amount)}
                className={`h-9 rounded-[13px] text-[14px] font-medium transition active:scale-[0.98] ${
                  selected ? "bg-[#FCE8EA] text-[#C9182B]" : "bg-[#F7F3F1] text-[#5C5250]"
                }`}
              >
                {formatCurrency(amount)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Type-specific fields */}
      {typeDef.fields.length > 0 ? (
        <div data-goal-screen-item className="mt-3 shrink-0 space-y-2.5">
          {typeDef.fields.map((field) => (
            <div key={field.key}>
              <label
                htmlFor={`goal-meta-${field.key}`}
                className="mb-1.5 block text-[13px] font-medium text-[#4B3D3B]"
              >
                {field.label}
              </label>
              <input
                id={`goal-meta-${field.key}`}
                type={field.type === "date" ? "date" : "text"}
                value={metadata[field.key] ?? ""}
                onChange={(e) => {
                  onUpdateMetadata(field.key, e.target.value.slice(0, field.maxLength ?? 60));
                  onClearMessage();
                }}
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                className="h-[44px] w-full rounded-[14px] border border-[#EFE7E5] bg-white px-4 text-[15px] text-[#2F2F2F] outline-none placeholder:text-[#B9AEAC]"
              />
            </div>
          ))}
        </div>
      ) : null}

      {/* Spacer */}
      <div className="min-h-4 flex-1 shrink" />

      {/* Message */}
      {message ? (
        <p
          data-goal-screen-item
          className={`mt-3 shrink-0 rounded-[14px] px-4 py-2 text-center text-[14px] ${
            message.includes("已保存")
              ? "bg-[#EAF4EC] text-[#2E7D32]"
              : "bg-[#FCE8EA] text-[#C9182B]"
          }`}
        >
          {message}
        </p>
      ) : null}

      {/* Submit */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        data-goal-screen-item
        className="mt-3 flex h-[48px] shrink-0 items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(135deg,#F46B7A_0%,#C9182B_100%)] text-[15px] font-semibold text-white shadow-[0_12px_22px_rgba(201,24,43,0.18)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Check size={20} />
        {isSubmitting ? "保存中..." : "保存目标"}
      </button>

      {/* Delete (edit mode only) */}
      {isEditing && onDelete ? (
        <div data-goal-screen-item className="mt-2 shrink-0">
          {deleteConfirm ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancelDelete}
                disabled={isSubmitting}
                className="flex-1 rounded-[14px] border border-[#EFE7E5] bg-white py-2.5 text-[14px] font-medium text-[#5C5250] transition active:scale-[0.98]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={isSubmitting}
                className="flex-1 rounded-[14px] bg-[#C9182B] py-2.5 text-[14px] font-medium text-white transition active:scale-[0.98] disabled:opacity-60"
              >
                {isSubmitting ? "删除中..." : "确认删除"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onDeleteConfirm}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-[#FCE8EA] bg-white py-2.5 text-[14px] font-medium text-[#C9182B] transition active:scale-[0.98]"
            >
              <Trash2 size={16} />
              删除这个目标
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
