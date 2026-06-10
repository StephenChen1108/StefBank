import type {
  AccountSummary,
  BankRequest,
  RequestTab,
  Transaction,
  TransactionType,
  UserProfile,
  UserRole,
} from "@/data/mock-bank";
import { getSupabaseClient } from "./supabase-client";

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
  title: string;
  target_amount: number;
  current_amount: number;
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

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    username: row.username,
    name: row.full_name,
    displayName: row.display_name,
    role: row.role,
    avatarUrl: row.avatar_url ?? undefined,
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

function mapAccount(row: AccountRow, goal: GoalRow, transactions: Transaction[]): AccountSummary {
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthTransactions = transactions.filter((transaction) => transaction.transactionDate.startsWith(monthPrefix));
  const monthDeposit = monthTransactions
    .filter((transaction) => transaction.type === "deposit")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthWithdraw = monthTransactions
    .filter((transaction) => transaction.type === "withdraw")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const progress = Math.max(0, Math.min(100, Math.round((row.current_balance / goal.target_amount) * 100)));

  return {
    name: row.name,
    displayName: "车厘子银行存款系统",
    currentBalance: row.current_balance,
    monthDeposit,
    monthWithdraw,
    totalRecords: transactions.length,
    lastUpdated: transactions[0]?.transactionDate ?? formatDateText(row.updated_at),
    goal: {
      title: goal.title,
      currentAmount: goal.current_amount,
      targetAmount: goal.target_amount,
      progress,
    },
  };
}

function requireNoError<T>(result: { data: T; error: { message: string } | null }) {
  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

async function callRpc(functionName: string, args: Record<string, unknown>) {
  const supabase = getSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (supabase.rpc as any)(functionName, args);
  requireNoError(result as { data: unknown; error: { message: string } | null });
}

export async function signInStefBank(username: string, password: string) {
  const normalizedUsername = username.trim().toLowerCase();
  const email = usernameToEmail(normalizedUsername);

  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error("账号或密码不正确，请重新输入");
  }

  return loadStefBankSnapshot();
}

export async function signOutStefBank() {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
}

export async function getExistingStefBankSession() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return loadStefBankSnapshot();
}

export async function loadStefBankSnapshot(): Promise<BankSnapshot> {
  const supabase = getSupabaseClient();
  const userResult = await supabase.auth.getUser();

  if (userResult.error || !userResult.data.user) {
    throw new Error("登录已失效，请重新登录");
  }

  const profile = requireNoError(
    await supabase.from("profiles").select("id, username, full_name, display_name, role, avatar_url").eq("id", userResult.data.user.id).single(),
  ) as ProfileRow;

  const memberRow = requireNoError(
    await supabase
      .from("account_members")
      .select("account_id")
      .eq("user_id", userResult.data.user.id)
      .limit(1)
      .single(),
  ) as { account_id: string };
  const selectedAccountId = memberRow.account_id;

  const account = requireNoError(
    await supabase
      .from("accounts")
      .select("id, name, current_balance, updated_at")
      .eq("id", selectedAccountId)
      .single(),
  ) as AccountRow;
  const goal = requireNoError(
    await supabase
      .from("goals")
      .select("title, target_amount, current_amount")
      .eq("account_id", account.id)
      .single(),
  ) as GoalRow;
  const transactionRows = requireNoError(
    await supabase
      .from("transactions")
      .select("id, type, amount, balance_after, category, description, transaction_date, status, created_at")
      .eq("account_id", account.id)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ) as TransactionRow[];
  const requestRows = requireNoError(
    await supabase
      .from("requests")
      .select("id, request_type, amount, category, urgency, payment_method, note, review_note, status, created_at")
      .eq("account_id", account.id)
      .order("created_at", { ascending: false }),
  ) as RequestRow[];

  const transactions = transactionRows.map(mapTransaction);

  return {
    accountId: account.id,
    account: mapAccount(account, goal, transactions),
    requests: requestRows.map(mapRequest),
    transactions,
    user: mapProfile(profile),
  };
}

export async function submitBankRequest(accountId: string, input: RequestInput) {
  await callRpc("submit_request", {
    p_account_id: accountId,
    p_request_type: input.requestType,
    p_amount: input.amount,
    p_category: input.category,
    p_urgency: input.urgency ?? null,
    p_payment_method: input.paymentMethod,
    p_note: input.note,
  });
}

export async function approveWithdrawal(requestId: string, reviewNote: string) {
  await callRpc("approve_withdraw_request", { p_request_id: requestId, p_review_note: reviewNote });
}

export async function rejectRequest(requestId: string, reviewNote: string) {
  await callRpc("reject_request", { p_request_id: requestId, p_review_note: reviewNote });
}

export async function completeRequest(requestId: string) {
  await callRpc("complete_withdraw_request", { p_request_id: requestId });
}

export async function confirmDepositRequest(requestId: string) {
  await callRpc("confirm_deposit_request", { p_request_id: requestId });
}

export async function createAdminTransaction(accountId: string, input: TransactionInput) {
  await callRpc("create_manual_transaction", {
    p_account_id: accountId,
    p_type: input.type,
    p_amount: input.amount,
    p_category: input.category,
    p_description: input.description,
  });
}

export async function updateTransaction(
  transactionId: string,
  input: TransactionInput & { transactionDate: string },
) {
  await callRpc("update_transaction", {
    p_transaction_id: transactionId,
    p_type: input.type,
    p_amount: input.amount,
    p_category: input.category,
    p_description: input.description,
    p_transaction_date: input.transactionDate.replace(/\./g, "-"),
  });
}

export async function deleteTransaction(transactionId: string) {
  await callRpc("delete_transaction", { p_transaction_id: transactionId });
}

export async function deleteRequest(requestId: string) {
  await callRpc("delete_request", { p_request_id: requestId });
}
