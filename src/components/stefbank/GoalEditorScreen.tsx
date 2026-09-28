"use client";

import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { ArrowLeft } from "lucide-react";
import type { AccountSummary, SavingGoal } from "@/data/bank-types";
import { GOAL_TYPES, getGoalType, type GoalTypeId } from "@/data/goal-types";
import { formatCurrency } from "@/lib/format";
import type { GoalInput } from "@/lib/bank-data-source";
import { parsePositiveIntegerYuan } from "@/lib/money";
import { useDialogAccessibility } from "@/lib/dialog-accessibility";
import { GoalFormView, GoalTypePickerView } from "./goal-editor-views";

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
  const dialogProps = useDialogAccessibility(onClose);
  const screenRef = dialogProps.ref;
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
  }, [screenRef, step]);

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

    const amount = parsePositiveIntegerYuan(targetAmount);

    if (amount === null) {
      setMessage("请填写整数目标金额");
      return;
    }

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
    <div
      {...dialogProps}
      aria-label={isEditing ? "编辑储蓄目标" : "创建储蓄目标"}
      className="fixed inset-0 z-[80] overflow-hidden bg-[#FFF8F1]"
    >
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
            <p className="text-[12px] leading-none text-[#6D625F]">当前余额</p>
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
            <GoalTypePickerView
              onSelect={selectType}
              onBack={() => (isEditing ? setStep("form") : onClose())}
              onClose={onClose}
            />
          ) : (
            <GoalFormView
              typeDef={typeDef}
              TypeIcon={TypeIcon}
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
            />
          )}
        </section>
      </main>
    </div>
  );
}
