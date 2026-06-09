"use client";

import type { Dispatch, SetStateAction } from "react";
import { ArrowDownToLine, ArrowRight, ArrowUpFromLine, CheckCircle2, Clock3, XCircle } from "lucide-react";
import type { AccountSummary, BankRequest, RequestTab, UserRole } from "@/data/mock-bank";
import { formatCurrency, requestLabel, statusLabel, statusTone } from "@/lib/format";
import { ActionButton, Card, FeatureCard } from "./ui";

type RequestsPanelProps = {
  account: AccountSummary;
  requests: BankRequest[];
  setRequests: Dispatch<SetStateAction<BankRequest[]>>;
  onStartMoneyAction: (tab: RequestTab) => void;
  role: UserRole;
};

export function RequestsPanel({
  account,
  requests,
  setRequests,
  onStartMoneyAction,
  role,
}: RequestsPanelProps) {
  function updateRequestStatus(id: string, status: BankRequest["status"]) {
    setRequests((current) =>
      current.map((request) => (request.id === id ? { ...request, status } : request)),
    );
  }

  if (role === "manager") {
    const pendingRequests = requests.filter((request) => request.status === "pending");
    const approvedRequests = requests.filter((request) => request.status === "approved");
    const handledRequests = requests.filter(
      (request) => request.status === "completed" || request.status === "rejected",
    );

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

        <Card className="px-5 py-4" data-animate-item>
          <h2 className="mb-4 text-[18px] font-semibold text-[#2F2F2F]">待审批申请</h2>
          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <ManagerRequestCard
                  key={request.id}
                  request={request}
                  primaryLabel={request.requestType === "deposit" ? "确认到账" : "批准"}
                  onPrimary={() => updateRequestStatus(request.id, "approved")}
                  onReject={() => updateRequestStatus(request.id, "rejected")}
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
                  onPrimary={() => updateRequestStatus(request.id, "completed")}
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
            <RequestList requests={handledRequests} />
          ) : (
            <EmptyApprovalState text="还没有处理记录" />
          )}
        </Card>
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
          <RequestList requests={requests} />
        ) : (
          <div className="py-10 text-center">
            <p className="text-[15px] font-semibold text-[#2F2F2F]">还没有申请记录</p>
            <p className="mt-2 text-[14px] text-[#8A8A8A]">需要用钱时可以在这里提交申请</p>
          </div>
        )}
      </Card>
    </div>
  );
}

function RequestList({ requests }: { requests: BankRequest[] }) {
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
}: {
  request: BankRequest;
  primaryLabel: string;
  onPrimary: () => void;
  onReject?: () => void;
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
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onPrimary}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(135deg,#F46B7A_0%,#C9182B_100%)] text-[15px] font-semibold text-white transition active:scale-[0.98]"
        >
          <CheckCircle2 size={18} />
          {primaryLabel}
        </button>
        {onReject ? (
          <button
            type="button"
            onClick={onReject}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[16px] bg-[#FCE8EA] text-[15px] font-semibold text-[#C9182B] transition active:scale-[0.98]"
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
