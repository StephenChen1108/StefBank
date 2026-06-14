import type {
  AccountSummary,
  BankRequest,
  RequestTab,
  Transaction,
  TransactionType,
  UserProfile,
} from "@/data/bank-types";

export type BankSnapshot = {
  accountId: string;
  account: AccountSummary;
  requests: BankRequest[];
  transactions: Transaction[];
  user: UserProfile;
};

export type RequestInput = {
  requestType: RequestTab;
  amount: number;
  category: string;
  urgency?: string;
  paymentMethod: string;
  note: string;
};

export type TransactionInput = {
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
};

export type GoalInput = {
  title: string;
  targetAmount: number;
  goalType: string;
  metadata: Record<string, string>;
};

export type UserSettings = {
  barkDeviceKey?: string;
  notifyWithdrawal?: boolean;
  notifyDeposit?: boolean;
  enabledCategories?: string[];
};

export type CustomTag = {
  id: string;
  name: string;
  createdAt: string;
};

export type NotificationLog = {
  id: string;
  type: "withdrawal_request" | "deposit_confirmed" | "test";
  title: string;
  body: string;
  status: "sent" | "failed";
  createdAt: string;
};

export interface BankDataSource {
  signIn(username: string, password: string): Promise<BankSnapshot>;
  signOut(): Promise<void>;
  getExistingSession(): Promise<BankSnapshot | null>;
  loadSnapshot(): Promise<BankSnapshot>;

  submitRequest(accountId: string, input: RequestInput): Promise<void>;
  approveWithdrawal(requestId: string, reviewNote: string): Promise<void>;
  rejectRequest(requestId: string, reviewNote: string): Promise<void>;
  completeRequest(requestId: string): Promise<void>;
  confirmDepositRequest(requestId: string): Promise<void>;
  createAdminTransaction(accountId: string, input: TransactionInput): Promise<void>;
  updateTransaction(transactionId: string, input: TransactionInput & { transactionDate: string }): Promise<void>;
  deleteTransaction(transactionId: string): Promise<void>;
  deleteRequest(requestId: string): Promise<void>;
  upsertGoal(accountId: string, input: GoalInput): Promise<void>;
  deleteGoal(accountId: string): Promise<void>;

  changePassword(currentPassword: string, newPassword: string): Promise<void>;
  getUserSettings(): Promise<UserSettings>;
  updateUserSettings(settings: UserSettings): Promise<void>;
  getCustomTags(): Promise<CustomTag[]>;
  addCustomTag(name: string): Promise<CustomTag>;
  deleteCustomTag(tagId: string): Promise<void>;
  getNotificationLogs(): Promise<NotificationLog[]>;
}
