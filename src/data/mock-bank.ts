export type UserRole = "manager" | "depositor";
export type TabId = "home" | "transactions" | "requests" | "profile";
export type TransactionType = "deposit" | "withdraw";
export type RequestTab = "withdraw" | "deposit";
export type RequestStatus = "pending" | "approved" | "completed" | "rejected";
export type TransactionFilter = "all" | TransactionType;

export type UserProfile = {
  id: string;
  username: string;
  name: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
};

export type SavingGoal = {
  title: string;
  currentAmount: number;
  targetAmount: number;
  progress: number;
};

export type AccountSummary = {
  name: string;
  displayName: string;
  currentBalance: number;
  monthDeposit: number;
  monthWithdraw: number;
  totalRecords: number;
  lastUpdated: string;
  goal: SavingGoal;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  category: string;
  description: string;
  transactionDate: string;
  status: "confirmed" | "pending";
};

export type BankRequest = {
  id: string;
  requestType: RequestTab;
  amount: number;
  category: string;
  urgency?: string;
  paymentMethod: string;
  note: string;
  reviewNote?: string;
  status: RequestStatus;
  createdAt: string;
};
