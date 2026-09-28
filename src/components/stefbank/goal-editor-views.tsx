import { ArrowLeft, Check, ChevronRight, Sparkles, Trash2 } from "lucide-react";
import { GOAL_TYPES, PRESET_AMOUNTS, getGoalType, type GoalTypeId } from "@/data/goal-types";
import { formatCurrency } from "@/lib/format";

export type GoalTypePickerViewProps = {
  onSelect: (typeId: GoalTypeId) => void;
  onBack: () => void;
  onClose: () => void;
};

export type GoalFormViewProps = {
  typeDef: ReturnType<typeof getGoalType>;
  TypeIcon: typeof Sparkles;
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
};

/* ──────────── Step 1: Type Picker ──────────── */

export function GoalTypePickerView({
  onSelect,
  onBack,
  onClose,
}: GoalTypePickerViewProps) {
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
        <p className="mt-1.5 text-[14px] text-[#6D625F]">选一个你最想存钱的方向</p>
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
                <p className="mt-1 text-[12px] leading-4 text-[#6D625F]">{type.description}</p>
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

export function GoalFormView({
  typeDef,
  TypeIcon,
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
}: GoalFormViewProps) {
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
          <p className="text-[13px] text-[#6D625F]">目标类型</p>
          <p className="text-[15px] font-semibold text-[#2F2F2F]">{typeDef.label}</p>
        </div>
        <span className="text-[12px] text-[#C9182B]">更换</span>
        <ChevronRight size={16} className="text-[#6D625F]" />
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
          className="h-[44px] w-full rounded-[14px] border border-[#EFE7E5] bg-white px-4 text-[15px] text-[#2F2F2F] outline-none placeholder:text-[#6D625F]"
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
            inputMode="numeric"
            type="number"
            min="1"
            step="1"
            placeholder="0"
            className="min-w-0 flex-1 bg-transparent text-[26px] font-semibold text-[#C9182B] outline-none placeholder:text-[#C9182B]"
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
                className="h-[44px] w-full rounded-[14px] border border-[#EFE7E5] bg-white px-4 text-[15px] text-[#2F2F2F] outline-none placeholder:text-[#6D625F]"
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
