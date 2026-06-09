import type { BankRequest } from "./mock-bank";

export const mockRequests: BankRequest[] = [
  {
    id: "req-001",
    requestType: "withdraw",
    amount: 300,
    category: "购物",
    urgency: "普通",
    paymentMethod: "微信",
    note: "想买衣服，今晚之前需要。",
    status: "pending",
    createdAt: "2026.06.08",
  },
  {
    id: "req-002",
    requestType: "deposit",
    amount: 600,
    category: "存款",
    paymentMethod: "微信",
    note: "6月9日历史转入记录。",
    status: "completed",
    createdAt: "2026.06.09",
  },
];
