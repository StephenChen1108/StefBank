"use client";

import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Clock3 } from "lucide-react";
import type { AccountSummary, BankRequest, RequestTab, UserRole } from "@/data/bank-types";
import { formatCurrency } from "@/lib/format";
import { RequestDetailDialog, ReviewDialog } from "./request-dialogs";
import { EmptyApprovalState, ManagerRequestCard, RequestList } from "./request-list";
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
          <RequestDetailDialog
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
            <p className="mt-2 text-[14px] text-[#6D625F]">需要用钱时可以在这里提交申请</p>
          </div>
        )}
      </Card>

      {/* 申请详情弹窗 */}
      {detailRequest ? (
        <RequestDetailDialog
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
