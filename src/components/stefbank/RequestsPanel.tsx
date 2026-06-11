"use client";

import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowRight, ArrowUpFromLine, CheckCircle2, Clock3, MessageSquareText, Send, Trash2, X, XCircle } from "lucide-react";
import type { AccountSummary, BankRequest, RequestTab, UserRole } from "@/data/mock-bank";
import { formatCurrency, requestLabel, statusLabel, statusTone } from "@/lib/format";
import { ActionButton, Card, FeatureCard } from "./ui";

type RequestsPanelProps = {
  account: AccountSummary;
  requests: BankRequest[];
  onStartMoneyAction: (tab: RequestTab) => void;
  onApproveRequest: (id: string, reviewNote: string) => Promise<void>;
  onCompleteRequest: (request: BankRequest) => Promise<void>;
  onRejectRequest: (id: string, reviewNote: string) => Promise<void>;
  onDeleteRequest: (id: string) => Promise<void>;
  role: UserRole;
};

export function RequestsPanel({
  account,
  requests,
  onStartMoneyAction,
  onApproveRequest,
  onCompleteRequest,
  onRejectRequest,
  onDeleteRequest,
  role,
}: RequestsPanelProps) {
  const [submittingId, setSubmittingId] = useState("");
  const [error, setError] = useState("");

  // 储户：查看申请详情弹窗
  const [detailRequest, setDetailRequest] = useState<BankRequest | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // 行长：审批留言对话框
  const [reviewTarget, setReviewTarget] = useState<{
    request: BankRequest;
    action: "approve" | "reject";
  } | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewError, setReviewError] = useState("");

  async function runRequestAction(id: string, action: () => Promise<void>) {
    if (submittingId) {
      return;
    }

    setSubmittingId(id);
    setError("");

    try {
      await action();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "操作失败，请稍后再试");
    } finally {
      setSubmittingId("");
    }
  }

  function openReviewDialog(request: BankRequest, action: "approve" | "reject") {
    setReviewTarget({ request, action });
    setReviewNote("");
    setReviewError("");
  }

  function closeReviewDialog() {
    setReviewTarget(null);
    setReviewNote("");
    setReviewError("");
  }

  async function confirmReview() {
    if (!reviewTarget) {
      return;
    }

    const trimmedNote = reviewNote.trim();

    if (!trimmedNote) {
      setReviewError("请填写审批留言");
      return;
    }

    const { request, action } = reviewTarget;

    closeReviewDialog();

    await runRequestAction(request.id, () =>
      action === "approve"
        ? onApproveRequest(request.id, trimmedNote)
        : onRejectRequest(request.id, trimmedNote),
    );
  }

  async function handleDeleteRequest(requestId: string) {
    setDetailRequest(null);
    setDeleteConfirm(false);
    await runRequestAction(requestId, () => onDeleteRequest(requestId));
  }

  const pendingRequests = useMemo(() => requests.filter((request) => request.status === "pending"), [requests]);
  const approvedRequests = useMemo(() => requests.filter((request) => request.status === "approved"), [requests]);
  const handledRequests = useMemo(
    () => requests.filter((request) => request.status === "completed" || request.status === "rejected"),
    [requests],
  );

  if (role === "manager") {

    return (
      <div className="space-y-4">
        <FeatureCard className="px-5 py-6" data-animate-item>
          <p className="text-[16px] font-medium text-[#6D5553]">行长审批</p>
          <p className="mt-4 text-[15px] text-[#6D5553]">待处理申请</p>
          <p className="mt-2 text-[42px] font-bold leading-none text-[#C9182B]">
            {pendingRequests.length}
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-[15px] text-[#6D5553]">
            <Clock3 size={18} />
            当前余额 {formatCurrency(account.currentBalance)}
          </p>
        </FeatureCard>

        {error ? (
          <p className="rounded-[16px] bg-[#FCE8EA] px-4 py-3 text-[14px] text-[#C9182B]">
            {error}
          </p>
        ) : null}

        <Card className="px-5 py-4" data-animate-item>
          <h2 className="mb-4 text-[18px] font-semibold text-[#2F2F2F]">待审批申请</h2>
          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <ManagerRequestCard
                  key={request.id}
                  request={request}
                  primaryLabel={request.requestType === "deposit" ? "确认到账" : "批准"}
                  disabled={submittingId === request.id}
                  onPrimary={() =>
                    request.requestType === "deposit"
                      ? runRequestAction(request.id, () => onCompleteRequest(request))
                      : openReviewDialog(request, "approve")
                  }
                  onReject={() => openReviewDialog(request, "reject")}
                />
              ))}
            </div>
          ) : (
            <EmptyApprovalState text="暂时没有待审批申请" />
          )}
        </Card>

        <Card className="px-5 py-4" data-animate-item>
          <h2 className="mb-4 text-[18px] font-semibold text-[#2F2F2F]">已批准待完成</h2>
          {approvedRequests.length > 0 ? (
            <div className="space-y-4">
              {approvedRequests.map((request) => (
                <ManagerRequestCard
                  key={request.id}
                  request={request}
                  primaryLabel={request.requestType === "deposit" ? "标记已入账" : "标记已打款"}
                  disabled={submittingId === request.id}
                  onPrimary={() => runRequestAction(request.id, () => onCompleteRequest(request))}
                />
              ))}
            </div>
          ) : (
            <EmptyApprovalState text="没有已批准待完成的申请" />
          )}
        </Card>

        <Card className="px-5 py-4" data-animate-item>
          <h2 className="mb-4 text-[18px] font-semibold text-[#2F2F2F]">最近处理</h2>
          {handledRequests.length > 0 ? (
            <RequestList requests={handledRequests} onSelect={setDetailRequest} />
          ) : (
            <EmptyApprovalState text="还没有处理记录" />
          )}
        </Card>

        {/* 审批留言对话框 */}
        {reviewTarget ? (
          <ReviewDialog
            request={reviewTarget.request}
            action={reviewTarget.action}
            reviewNote={reviewNote}
            reviewError={reviewError}
            isSubmitting={submittingId === reviewTarget.request.id}
            onChangeNote={setReviewNote}
            onConfirm={confirmReview}
            onClose={closeReviewDialog}
          />
        ) : null}

        {/* 申请详情弹窗（储户 + 行长共用） */}
        {detailRequest ? (
          <RequestDetailModal
            request={detailRequest}
            role={role}
            isDeleting={submittingId === detailRequest.id}
            deleteConfirm={deleteConfirm}
            onClose={() => { setDetailRequest(null); setDeleteConfirm(false); }}
            onDelete={() => setDeleteConfirm(true)}
            onConfirmDelete={() => handleDeleteRequest(detailRequest.id)}
            onCancelDelete={() => setDeleteConfirm(false)}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="px-5 py-4" data-animate-item>
        <h2 className="mb-4 text-[18px] font-semibold text-[#2F2F2F]">申请中心</h2>
        <div className="grid grid-cols-2 gap-3">
          <ActionButton icon={ArrowDownToLine} onClick={() => onStartMoneyAction("deposit")}>
            我要存钱
          </ActionButton>
          <ActionButton
            variant="secondary"
            icon={ArrowUpFromLine}
            onClick={() => onStartMoneyAction("withdraw")}
          >
            我要取钱
          </ActionButton>
        </div>
      </Card>

      <Card className="px-5 py-4" data-animate-item>
        <h2 className="mb-4 text-[18px] font-semibold text-[#2F2F2F]">最近申请</h2>
        {requests.length > 0 ? (
          <RequestList requests={requests} onSelect={setDetailRequest} />
        ) : (
          <div className="py-10 text-center">
            <p className="text-[15px] font-semibold text-[#2F2F2F]">还没有申请记录</p>
            <p className="mt-2 text-[14px] text-[#8A8A8A]">需要用钱时可以在这里提交申请</p>
          </div>
        )}
      </Card>

      {/* 申请详情弹窗 */}
      {detailRequest ? (
        <RequestDetailModal
          request={detailRequest}
          role={role}
          isDeleting={submittingId === detailRequest.id}
          deleteConfirm={deleteConfirm}
          onClose={() => { setDetailRequest(null); setDeleteConfirm(false); }}
          onDelete={() => setDeleteConfirm(true)}
          onConfirmDelete={() => handleDeleteRequest(detailRequest.id)}
          onCancelDelete={() => setDeleteConfirm(false)}
        />
      ) : null}
    </div>
  );
}

function RequestList({
  requests,
  onSelect,
}: {
  requests: BankRequest[];
  onSelect: (request: BankRequest) => void;
}) {
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
              <p className="mt-1 text-[14px] text-[#8A8A8A]">{request.category}</p>
            </div>
            <p className="text-[17px] font-semibold text-[#C9182B]">{formatCurrency(request.amount)}</p>
            <span className={`rounded-full px-3 py-1 text-[13px] font-medium ${statusTone(request.status)}`}>
              {label}
            </span>
            <div className="flex items-center justify-end gap-2 text-[#8A8A8A]">
              <span className="hidden text-[14px] min-[390px]:inline">{request.createdAt}</span>
              <ArrowRight size={18} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ManagerRequestCard({
  request,
  primaryLabel,
  onPrimary,
  onReject,
  disabled = false,
}: {
  request: BankRequest;
  primaryLabel: string;
  onPrimary: () => void;
  onReject?: () => void;
  disabled?: boolean;
}) {
  return (
    <article className="rounded-[16px] border border-[#EFE7E5] bg-[#FFFCFA] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-[#2F2F2F]">{requestLabel(request.requestType)}</p>
          <p className="mt-2 text-[14px] leading-5 text-[#8A8A8A]">
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

function EmptyApprovalState({ text }: { text: string }) {
  return (
    <div className="rounded-[16px] bg-[#FFF8F1] px-4 py-8 text-center text-[15px] text-[#8A8A8A]">
      {text}
    </div>
  );
}

/** 申请详情弹窗 — 储户点击申请记录时显示，行长可删除 */
function RequestDetailModal({
  request,
  role,
  isDeleting,
  deleteConfirm,
  onClose,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  request: BankRequest;
  role: UserRole;
  isDeleting: boolean;
  deleteConfirm: boolean;
  onClose: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  const isWithdraw = request.requestType === "withdraw";
  const isManager = role === "manager";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 sm:items-center"
      onClick={onClose}
    >
      <div
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
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7F3F1] text-[#8A8A8A] transition active:scale-95"
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
          <p className="text-[13px] font-medium text-[#8A8A8A]">备注</p>
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
      <span className="text-[14px] text-[#8A8A8A]">{label}</span>
      <span className="text-[15px] font-medium text-[#2F2F2F]">{value}</span>
    </div>
  );
}

/** 行长审批留言对话框 */
function ReviewDialog({
  request,
  action,
  reviewNote,
  reviewError,
  isSubmitting,
  onChangeNote,
  onConfirm,
  onClose,
}: {
  request: BankRequest;
  action: "approve" | "reject";
  reviewNote: string;
  reviewError: string;
  isSubmitting: boolean;
  onChangeNote: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const isApprove = action === "approve";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 sm:items-center"
      onClick={onClose}
    >
      <div
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
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7F3F1] text-[#8A8A8A] transition active:scale-95"
          >
            <X size={16} />
          </button>
        </div>

        {/* 申请摘要 */}
        <div className="rounded-[16px] bg-[#FFF8F1] px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#8A8A8A]">{requestLabel(request.requestType)}</span>
            <span className="text-[18px] font-bold text-[#C9182B]">{formatCurrency(request.amount)}</span>
          </div>
          <p className="mt-1 text-[14px] text-[#6D5553]">
            {request.category} · {request.paymentMethod}
          </p>
          <p className="mt-1 text-[14px] leading-5 text-[#8A8A8A]">{request.note}</p>
        </div>

        {/* 留言输入 */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="review-note" className="text-[14px] font-medium text-[#4B3D3B]">
              {isApprove ? "批准留言" : "驳回留言"}
              <span className="ml-1 text-[#C9182B]">*</span>
            </label>
            <span className="text-[12px] text-[#8A8A8A]">{reviewNote.length}/120</span>
          </div>
          <textarea
            id="review-note"
            value={reviewNote}
            onChange={(event) => {
              onChangeNote(event.target.value.slice(0, 120));
            }}
            placeholder={isApprove ? "写下批准理由或提醒..." : "写下驳回原因..."}
            autoFocus
            className="h-[100px] w-full resize-none rounded-[16px] border border-[#EFE7E5] bg-white px-4 py-3 text-[15px] leading-relaxed text-[#2F2F2F] outline-none placeholder:text-[#B9AEAC]"
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
