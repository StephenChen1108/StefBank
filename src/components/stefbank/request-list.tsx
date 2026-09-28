import { ArrowRight, CheckCircle2, MessageSquareText, XCircle } from "lucide-react";
import type { BankRequest } from "@/data/bank-types";
import { formatCurrency, requestLabel, statusLabel, statusTone } from "@/lib/format";

export type RequestListProps = {
  requests: BankRequest[];
  onSelect: (request: BankRequest) => void;
};

export type ManagerRequestCardProps = {
  request: BankRequest;
  primaryLabel: string;
  onPrimary: () => void;
  onReject?: () => void;
  disabled?: boolean;
};

export function RequestList({
  requests,
  onSelect,
}: RequestListProps) {
  return (
    <div className="divide-y divide-[#EFE7E5]">
      {requests.map((request) => {
        const label =
          request.requestType === "deposit" && request.status === "pending"
            ? "待确认"
            : statusLabel(request.status);

        return (
          <button
            key={request.id}
            type="button"
            onClick={() => onSelect(request)}
            className="grid w-full grid-cols-[1fr_auto_auto_auto] items-center gap-3 py-4 text-left transition active:scale-[0.99]"
          >
            <div className="min-w-0">
              <p className="text-[15px] font-medium text-[#2F2F2F]">{requestLabel(request.requestType)}</p>
              <p className="mt-1 text-[14px] text-[#6D625F]">{request.category}</p>
            </div>
            <p className="text-[17px] font-semibold text-[#C9182B]">{formatCurrency(request.amount)}</p>
            <span className={`rounded-full px-3 py-1 text-[13px] font-medium ${statusTone(request.status)}`}>
              {label}
            </span>
            <div className="flex items-center justify-end gap-2 text-[#6D625F]">
              <span className="hidden text-[14px] min-[390px]:inline">{request.createdAt}</span>
              <ArrowRight size={18} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function ManagerRequestCard({
  request,
  primaryLabel,
  onPrimary,
  onReject,
  disabled = false,
}: ManagerRequestCardProps) {
  return (
    <article className="rounded-[16px] border border-[#EFE7E5] bg-[#FFFCFA] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-[#2F2F2F]">{requestLabel(request.requestType)}</p>
          <p className="mt-2 text-[14px] leading-5 text-[#6D625F]">
            {request.category} · {request.paymentMethod} · {request.createdAt}
          </p>
        </div>
        <p className="shrink-0 text-[21px] font-bold text-[#C9182B]">{formatCurrency(request.amount)}</p>
      </div>
      <p className="mt-3 rounded-[14px] bg-white px-3 py-2 text-[14px] leading-5 text-[#6D5553]">
        {request.note}
      </p>
      {request.reviewNote ? (
        <div className="mt-2 flex items-start gap-2 rounded-[14px] bg-[#FFF2DA] px-3 py-2 text-[14px] leading-5 text-[#C47B1E]">
          <MessageSquareText size={16} className="mt-0.5 shrink-0" />
          <span>{request.reviewNote}</span>
        </div>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onPrimary}
          disabled={disabled}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(135deg,#F46B7A_0%,#C9182B_100%)] text-[15px] font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CheckCircle2 size={18} />
          {disabled ? "处理中..." : primaryLabel}
        </button>
        {onReject ? (
          <button
            type="button"
            onClick={onReject}
            disabled={disabled}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[16px] bg-[#FCE8EA] text-[15px] font-semibold text-[#C9182B] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <XCircle size={18} />
            驳回
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function EmptyApprovalState({ text }: { text: string }) {
  return (
    <div className="rounded-[16px] bg-[#FFF8F1] px-4 py-8 text-center text-[15px] text-[#6D625F]">
      {text}
    </div>
  );
}

/** 申请详情弹窗 — 储户点击申请记录时显示，行长可删除 */
