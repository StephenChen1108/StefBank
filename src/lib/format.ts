import type {
  BankRequest,
  RequestStatus,
  Transaction,
  TransactionType,
  UserRole,
} from "@/data/mock-bank";

const currencyFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

export function signedAmount(transaction: Pick<Transaction, "type" | "amount">) {
  return `${transaction.type === "deposit" ? "+" : "-"}${formatCurrency(transaction.amount)}`;
}

export function transactionLabel(type: TransactionType) {
  return type === "deposit" ? "存入" : "取出";
}

export function requestLabel(type: BankRequest["requestType"]) {
  return type === "withdraw" ? "取款申请" : "存款记录";
}

export function roleLabel(role: UserRole) {
  return role === "manager" ? "你是本银行的行长" : "你是本银行的储户";
}

export function statusLabel(status: RequestStatus) {
  const labels: Record<RequestStatus, string> = {
    pending: "待审批",
    approved: "已批准",
    completed: "已完成",
    rejected: "已驳回",
  };

  return labels[status];
}

export function statusTone(status: RequestStatus) {
  const tones: Record<RequestStatus, string> = {
    pending: "bg-[#FFF2DA] text-[#C47B1E]",
    approved: "bg-[#FCE8EA] text-[#C9182B]",
    completed: "bg-[#EAF4EC] text-[#2E7D32]",
    rejected: "bg-[#FCE8EA] text-[#C9182B]",
  };

  return tones[status];
}

