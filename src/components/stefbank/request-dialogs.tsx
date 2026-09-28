import { ArrowDownToLine, ArrowUpFromLine, MessageSquareText, Send, Trash2, X } from "lucide-react";
import type { BankRequest, UserRole } from "@/data/bank-types";
import { useDialogAccessibility } from "@/lib/dialog-accessibility";
import { formatCurrency, requestLabel, statusLabel, statusTone } from "@/lib/format";

export type RequestDetailDialogProps = {
  request: BankRequest;
  role: UserRole;
  isDeleting: boolean;
  deleteConfirm: boolean;
  onClose: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
};

export type ReviewDialogProps = {
  request: BankRequest;
  action: "approve" | "reject";
  reviewNote: string;
  reviewError: string;
  isSubmitting: boolean;
  onChangeNote: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function RequestDetailDialog({
  request,
  role,
  isDeleting,
  deleteConfirm,
  onClose,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
}: RequestDetailDialogProps) {
  const isWithdraw = request.requestType === "withdraw";
  const isManager = role === "manager";
  const dialogProps = useDialogAccessibility(onClose);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 sm:items-center"
      onClick={onClose}
    >
      <div
        {...dialogProps}
        aria-label="申请详情"
        className="w-full max-w-[430px] rounded-t-[22px] border border-[rgba(201,24,43,0.06)] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-5 shadow-[0_-12px_36px_rgba(160,80,80,0.12)] sm:rounded-[22px] sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[14px] font-semibold ${
                isWithdraw
                  ? "bg-[#FCE8EA] text-[#C9182B]"
                  : "bg-[#EAF4EC] text-[#2E7D32]"
              }`}
            >
              {isWithdraw ? (
                <ArrowUpFromLine size={15} strokeWidth={2.5} />
              ) : (
                <ArrowDownToLine size={15} strokeWidth={2.5} />
              )}
              {requestLabel(request.requestType)}
            </span>
            <span className={`rounded-full px-3 py-1 text-[13px] font-medium ${statusTone(request.status)}`}>
              {statusLabel(request.status)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="关闭申请详情"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7F3F1] text-[#6D625F] transition active:scale-95"
          >
            <X size={16} />
          </button>
        </div>

        {/* 金额 */}
        <p className="text-center text-[40px] font-bold tracking-[-0.5px] text-[#C9182B]">
          {formatCurrency(request.amount)}
        </p>

        {/* 详情列表 */}
        <div className="mt-4 space-y-2 rounded-[18px] bg-[#FFF8F1] px-4 py-3">
          <ModalInfoRow label="分类" value={request.category} />
          <div className="h-px bg-[#EFE7E5]" />
          <ModalInfoRow label="方式" value={request.paymentMethod} />
          {isWithdraw && request.urgency ? (
            <>
              <div className="h-px bg-[#EFE7E5]" />
              <ModalInfoRow label="紧急" value={request.urgency} />
            </>
          ) : null}
          <div className="h-px bg-[#EFE7E5]" />
          <ModalInfoRow label="日期" value={request.createdAt} />
        </div>

        {/* 储户备注 */}
        <div className="mt-3 rounded-[18px] bg-[#FFF8F1] px-4 py-3">
          <p className="text-[13px] font-medium text-[#6D625F]">备注</p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-[#2F2F2F]">
            {request.note || "无"}
          </p>
        </div>

        {/* 行长留言 */}
        {request.reviewNote ? (
          <div className="mt-3 rounded-[18px] bg-[#FFF2DA] px-4 py-3">
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-[#C47B1E]">
              <MessageSquareText size={15} />
              行长留言
            </p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-[#C47B1E]">
              {request.reviewNote}
            </p>
          </div>
        ) : null}

        {/* 行长删除按钮 */}
        {isManager ? (
          <div className="mt-4">
            {deleteConfirm ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCancelDelete}
                  disabled={isDeleting}
                  className="flex-1 rounded-[14px] border border-[#EFE7E5] bg-white py-2.5 text-[14px] font-medium text-[#5C5250] transition active:scale-[0.98]"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={onConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 rounded-[14px] bg-[#C9182B] py-2.5 text-[14px] font-medium text-white transition active:scale-[0.98] disabled:opacity-60"
                >
                  {isDeleting ? "删除中..." : "确认删除"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onDelete}
                className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-[#FCE8EA] bg-white py-2.5 text-[14px] font-medium text-[#C9182B] transition active:scale-[0.98]"
              >
                <Trash2 size={16} />
                删除这条记录
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ModalInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[14px] text-[#6D625F]">{label}</span>
      <span className="text-[15px] font-medium text-[#2F2F2F]">{value}</span>
    </div>
  );
}

/** 行长审批留言对话框 */
export function ReviewDialog({
  request,
  action,
  reviewNote,
  reviewError,
  isSubmitting,
  onChangeNote,
  onConfirm,
  onClose,
}: ReviewDialogProps) {
  const isApprove = action === "approve";
  const dialogProps = useDialogAccessibility(onClose);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 sm:items-center"
      onClick={onClose}
    >
      <div
        {...dialogProps}
        aria-label={isApprove ? "批准申请" : "驳回申请"}
        className="w-full max-w-[430px] rounded-t-[22px] border border-[rgba(201,24,43,0.06)] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-5 shadow-[0_-12px_36px_rgba(160,80,80,0.12)] sm:rounded-[22px] sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[18px] font-semibold text-[#2F2F2F]">
            {isApprove ? "批准申请" : "驳回申请"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="关闭审批对话框"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7F3F1] text-[#6D625F] transition active:scale-95"
          >
            <X size={16} />
          </button>
        </div>

        {/* 申请摘要 */}
        <div className="rounded-[16px] bg-[#FFF8F1] px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#6D625F]">{requestLabel(request.requestType)}</span>
            <span className="text-[18px] font-bold text-[#C9182B]">{formatCurrency(request.amount)}</span>
          </div>
          <p className="mt-1 text-[14px] text-[#6D5553]">
            {request.category} · {request.paymentMethod}
          </p>
          <p className="mt-1 text-[14px] leading-5 text-[#6D625F]">{request.note}</p>
        </div>

        {/* 留言输入 */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="review-note" className="text-[14px] font-medium text-[#4B3D3B]">
              {isApprove ? "批准留言" : "驳回留言"}
              <span className="ml-1 text-[#C9182B]">*</span>
            </label>
            <span className="text-[12px] text-[#6D625F]">{reviewNote.length}/120</span>
          </div>
          <textarea
            id="review-note"
            value={reviewNote}
            onChange={(event) => {
              onChangeNote(event.target.value.slice(0, 120));
            }}
            placeholder={isApprove ? "写下批准理由或提醒..." : "写下驳回原因..."}
            autoFocus
            className="h-[100px] w-full resize-none rounded-[16px] border border-[#EFE7E5] bg-white px-4 py-3 text-[15px] leading-relaxed text-[#2F2F2F] outline-none placeholder:text-[#6D625F]"
          />
          {reviewError ? (
            <p className="mt-1.5 text-[13px] text-[#C9182B]">{reviewError}</p>
          ) : null}
        </div>

        {/* 操作按钮 */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-11 rounded-[16px] border border-[#EFE7E5] bg-white text-[15px] font-medium text-[#5C5250] transition active:scale-[0.98] disabled:opacity-60"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-[16px] text-[15px] font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
              isApprove
                ? "bg-[linear-gradient(135deg,#F46B7A_0%,#C9182B_100%)]"
                : "bg-[#C9182B]"
            }`}
          >
            {isSubmitting ? (
              "处理中..."
            ) : (
              <>
                <Send size={17} />
                {isApprove ? "确认批准" : "确认驳回"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
