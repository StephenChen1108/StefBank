import type {
  AccountSummary,
  BankRequest,
  RequestTab,
  Transaction,
  TransactionType,
  UserRole,
} from "@/data/bank-types";
import type { BankSnapshot, GoalInput, RequestInput, TransactionInput } from "./bank-data-source";
import { toLoginError } from "./auth-error";
import type { Database } from "./database.types";
import { getSupabaseClient } from "./supabase-client";

export type { BankSnapshot, GoalInput, RequestInput, TransactionInput } from "./bank-data-source";

type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
};

type AccountRow = {
  id: string;
  name: string;
  current_balance: number;
  updated_at: string;
};

type GoalRow = {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  goal_type: string;
  metadata: Record<string, string>;
};

type TransactionRow = {
  id: string;
  type: TransactionType;
  amount: number;
  balance_after: number;
  category: string;
  description: string;
  transaction_date: string;
  status: "confirmed" | "pending";
  created_at: string;
};

type RequestRow = {
  id: string;
  request_type: RequestTab;
  amount: number;
  category: string;
  urgency: string | null;
  payment_method: string;
  note: string;
  review_note: string | null;
  status: BankRequest["status"];
  created_at: string;
};

export type BankSnapshotPayload = {
  user: ProfileRow;
  accountId: string;
  account: AccountRow;
  goal: GoalRow | null;
  transactions: TransactionRow[];
  requests: RequestRow[];
};

type PublicFunctions = Database["public"]["Functions"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function isUserRole(value: unknown): value is UserRole {
  return value === "manager" || value === "depositor";
}

function isTransactionType(value: unknown): value is TransactionType {
  return value === "deposit" || value === "withdraw";
}

function isTransactionStatus(
  value: unknown,
): value is TransactionRow["status"] {
  return value === "confirmed" || value === "pending";
}

function isRequestStatus(value: unknown): value is BankRequest["status"] {
  return (
    value === "pending" ||
    value === "approved" ||
    value === "completed" ||
    value === "rejected"
  );
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    isRecord(value) && Object.values(value).every((entry) => isString(entry))
  );
}

function isProfileRow(value: unknown): value is ProfileRow {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.username) &&
    isString(value.display_name) &&
    isString(value.full_name) &&
    isUserRole(value.role) &&
    isNullableString(value.avatar_url)
  );
}

function isAccountRow(value: unknown): value is AccountRow {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isNonNegativeInteger(value.current_balance) &&
    isString(value.updated_at)
  );
}

function isGoalRow(value: unknown): value is GoalRow {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.title) &&
    isPositiveInteger(value.target_amount) &&
    isNonNegativeInteger(value.current_amount) &&
    isString(value.goal_type) &&
    isStringRecord(value.metadata)
  );
}

function isTransactionRow(value: unknown): value is TransactionRow {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isTransactionType(value.type) &&
    isPositiveInteger(value.amount) &&
    isNonNegativeInteger(value.balance_after) &&
    isString(value.category) &&
    isString(value.description) &&
    isString(value.transaction_date) &&
    isTransactionStatus(value.status) &&
    isString(value.created_at)
  );
}

function isRequestRow(value: unknown): value is RequestRow {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isTransactionType(value.request_type) &&
    isPositiveInteger(value.amount) &&
    isString(value.category) &&
    isNullableString(value.urgency) &&
    isString(value.payment_method) &&
    isString(value.note) &&
    isNullableString(value.review_note) &&
    isRequestStatus(value.status) &&
    isString(value.created_at)
  );
}

export function isBankSnapshotPayload(
  value: unknown,
): value is BankSnapshotPayload {
  return (
    isRecord(value) &&
    isProfileRow(value.user) &&
    isString(value.accountId) &&
    isAccountRow(value.account) &&
    value.accountId === value.account.id &&
    (value.goal === null || isGoalRow(value.goal)) &&
    Array.isArray(value.transactions) &&
    value.transactions.every(isTransactionRow) &&
    Array.isArray(value.requests) &&
    value.requests.every(isRequestRow)
  );
}

function usernameToEmail(username: string) {
  return `${username}@stefbank.local`;
}

function formatDateText(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replace(/\//g, ".");
}

function mapProfile(row: ProfileRow) {
  const avatarUrl = row.avatar_url ? "/cherry-bank-logo-small.webp" : null;

  return {
    id: row.id,
    username: row.username,
    name: row.full_name,
    displayName: row.display_name,
    role: row.role,
    avatarUrl: avatarUrl ?? undefined,
  };
}

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    balanceAfter: row.balance_after,
    category: row.category,
    description: row.description,
    transactionDate: row.transaction_date.replace(/-/g, "."),
    status: row.status,
  };
}

function mapRequest(row: RequestRow): BankRequest {
  return {
    id: row.id,
    requestType: row.request_type,
    amount: row.amount,
    category: row.category,
    urgency: row.urgency ?? undefined,
    paymentMethod: row.payment_method,
    note: row.note,
    reviewNote: row.review_note ?? undefined,
    status: row.status,
    createdAt: formatDateText(row.created_at),
  };
}

export function mapAccountSummary(
  row: AccountRow,
  goal: GoalRow | null,
  transactions: Transaction[],
): AccountSummary {
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthTransactions = transactions.filter((transaction) => transaction.transactionDate.startsWith(monthPrefix));
  const monthDeposit = monthTransactions
    .filter((transaction) => transaction.type === "deposit")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthWithdraw = monthTransactions
    .filter((transaction) => transaction.type === "withdraw")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const progress = goal
    ? Math.max(0, Math.min(100, Math.round((row.current_balance / goal.target_amount) * 100)))
    : 0;

  return {
    name: row.name,
    displayName: "车厘子银行存款系统",
    currentBalance: row.current_balance,
    monthDeposit,
    monthWithdraw,
    totalRecords: transactions.length,
    lastUpdated: transactions[0]?.transactionDate ?? formatDateText(row.updated_at),
    goal: goal ? {
      id: goal.id,
      title: goal.title,
      currentAmount: goal.current_amount,
      targetAmount: goal.target_amount,
      progress,
      goalType: goal.goal_type,
      metadata: goal.metadata,
    } : null,
  };
}

export function mapBankSnapshotPayload(
  payload: BankSnapshotPayload,
): BankSnapshot {
  const transactions = payload.transactions.map(mapTransaction);

  return {
    accountId: payload.accountId,
    account: mapAccountSummary(payload.account, payload.goal, transactions),
    requests: payload.requests.map(mapRequest),
    transactions,
    user: mapProfile(payload.user),
  };
}

export function toCreateManualTransactionArgs(
  accountId: string,
  input: TransactionInput & { transactionDate: string },
) {
  return {
    p_account_id: accountId,
    p_type: input.type,
    p_amount: input.amount,
    p_category: input.category,
    p_description: input.description,
    p_transaction_date: input.transactionDate.replace(/\./g, "-"),
  };
}

export class SupabaseBankDataSource {
  private requireNoError<T>(result: { data: T; error: { message: string } | null }) {
    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data;
  }

  private async callRpc<Name extends keyof PublicFunctions>(
    functionName: Name,
    args: PublicFunctions[Name]["Args"],
  ): Promise<PublicFunctions[Name]["Returns"]> {
    const supabase = getSupabaseClient();
    const result = await supabase.rpc(functionName, args);

    return this.requireNoError(result) as PublicFunctions[Name]["Returns"];
  }

  async signIn(username: string, password: string): Promise<BankSnapshot> {
    const normalizedUsername = username.trim().toLowerCase();
    const email = usernameToEmail(normalizedUsername);

    const error = await (async () => {
      try {
        const supabase = getSupabaseClient();
        const result = await supabase.auth.signInWithPassword({ email, password });
        return result.error;
      } catch (caughtError) {
        throw toLoginError(caughtError);
      }
    })();

    if (error) {
      throw toLoginError(error);
    }

    return this.loadSnapshot();
  }

  async signOut(): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }

  async getExistingSession(): Promise<BankSnapshot | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      return null;
    }

    return this.loadSnapshot();
  }

  async loadSnapshot(): Promise<BankSnapshot> {
    const payload = this.requireNoError(
      await getSupabaseClient().rpc("get_bank_snapshot"),
    );

    if (!isBankSnapshotPayload(payload)) {
      throw new Error("银行快照格式无效，请稍后重试");
    }

    return mapBankSnapshotPayload(payload);
  }

  async submitRequest(accountId: string, input: RequestInput): Promise<void> {
    const supabase = getSupabaseClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session?.access_token) {
      throw new Error("登录已失效，请重新登录");
    }

    const response = await fetch("/api/requests", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accountId, input }),
    });

    if (!response.ok) {
      const result: unknown = await response.json().catch(() => null);
      const message =
        isRecord(result) && typeof result.error === "string"
          ? result.error
          : "提交失败，请稍后再试";
      throw new Error(message);
    }
  }

  async approveWithdrawal(requestId: string, reviewNote: string): Promise<void> {
    await this.callRpc("approve_withdraw_request", { p_request_id: requestId, p_review_note: reviewNote });
  }

  async rejectRequest(requestId: string, reviewNote: string): Promise<void> {
    await this.callRpc("reject_request", { p_request_id: requestId, p_review_note: reviewNote });
  }

  async completeRequest(requestId: string): Promise<void> {
    await this.callRpc("complete_withdraw_request", { p_request_id: requestId });
  }

  async confirmDepositRequest(requestId: string): Promise<void> {
    await this.callRpc("confirm_deposit_request", { p_request_id: requestId });
  }

  async createAdminTransaction(
    accountId: string,
    input: TransactionInput & { transactionDate: string },
  ): Promise<void> {
    await this.callRpc("create_manual_transaction", toCreateManualTransactionArgs(accountId, input));
  }

  async updateTransaction(
    transactionId: string,
    input: TransactionInput & { transactionDate: string },
  ): Promise<void> {
    await this.callRpc("update_transaction", {
      p_transaction_id: transactionId,
      p_type: input.type,
      p_amount: input.amount,
      p_category: input.category,
      p_description: input.description,
      p_transaction_date: input.transactionDate.replace(/\./g, "-"),
    });
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    await this.callRpc("delete_transaction", { p_transaction_id: transactionId });
  }

  async deleteRequest(requestId: string): Promise<void> {
    await this.callRpc("delete_request", { p_request_id: requestId });
  }

  async upsertGoal(accountId: string, input: GoalInput): Promise<void> {
    await this.callRpc("upsert_goal", {
      p_account_id: accountId,
      p_title: input.title,
      p_target_amount: input.targetAmount,
      p_goal_type: input.goalType,
      p_metadata: input.metadata,
    });
  }

  async deleteGoal(accountId: string): Promise<void> {
    await this.callRpc("delete_goal", { p_account_id: accountId });
  }
}
