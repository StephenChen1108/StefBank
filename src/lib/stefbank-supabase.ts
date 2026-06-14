import type {
  AccountSummary,
  BankRequest,
  RequestTab,
  Transaction,
  TransactionType,
  UserRole,
} from "@/data/bank-types";
import type { BankSnapshot, CustomTag, GoalInput, NotificationLog, RequestInput, TransactionInput, UserSettings } from "./bank-data-source";
import { getSupabaseClient } from "./supabase-client";

export type { BankSnapshot, CustomTag, GoalInput, NotificationLog, RequestInput, TransactionInput, UserSettings } from "./bank-data-source";

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
  const avatarUrl = row.avatar_url === "/yezi-avatar-compressed.jpg" ? "/yezi-avatar.jpg" : row.avatar_url;

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
      id: goal.id,
      title: goal.title,
      currentAmount: goal.current_amount,
      targetAmount: goal.target_amount,
      progress,
      goalType: goal.goal_type,
      metadata: goal.metadata,
    },
  };
}

export class SupabaseBankDataSource {
  private requireNoError<T>(result: { data: T; error: { message: string } | null }) {
    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data;
  }

  private async callRpc<T = void>(functionName: string, args: Record<string, unknown>): Promise<T> {
    const supabase = getSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (supabase.rpc as any)(functionName, args);
    this.requireNoError(result as { data: unknown; error: { message: string } | null });
    return (result as { data: T }).data;
  }

  async signIn(username: string, password: string): Promise<BankSnapshot> {
    const normalizedUsername = username.trim().toLowerCase();
    const email = usernameToEmail(normalizedUsername);

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw new Error("账号或密码不正确，请重新输入");
    }

    return this.loadSnapshot();
  }

  async signOut(): Promise<void> {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  }

  async getExistingSession(): Promise<BankSnapshot | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return this.loadSnapshot();
  }

  async loadSnapshot(): Promise<BankSnapshot> {
    const supabase = getSupabaseClient();
    const userResult = await supabase.auth.getUser();

    if (userResult.error || !userResult.data.user) {
      throw new Error("登录已失效，请重新登录");
    }

    const profile = this.requireNoError(
      await supabase.from("profiles").select("id, username, full_name, display_name, role, avatar_url").eq("id", userResult.data.user.id).single(),
    ) as ProfileRow;

    const memberRow = this.requireNoError(
      await supabase
        .from("account_members")
        .select("account_id")
        .eq("user_id", userResult.data.user.id)
        .limit(1)
        .single(),
    ) as { account_id: string };
    const selectedAccountId = memberRow.account_id;

    const account = this.requireNoError(
      await supabase
        .from("accounts")
        .select("id, name, current_balance, updated_at")
        .eq("id", selectedAccountId)
        .single(),
    ) as AccountRow;

    // goals / transactions / requests 只依赖 account.id，可并行查询
    const [goalResult, transactionResult, requestResult] = await Promise.all([
      supabase
        .from("goals")
        .select("id, title, target_amount, current_amount, goal_type, metadata")
        .eq("account_id", account.id)
        .single(),
      supabase
        .from("transactions")
        .select("id, type, amount, balance_after, category, description, transaction_date, status, created_at")
        .eq("account_id", account.id)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("requests")
        .select("id, request_type, amount, category, urgency, payment_method, note, review_note, status, created_at")
        .eq("account_id", account.id)
        .order("created_at", { ascending: false }),
    ]);

    const goal = this.requireNoError(goalResult) as unknown as GoalRow;
    const transactionRows = this.requireNoError(transactionResult) as unknown as TransactionRow[];
    const requestRows = this.requireNoError(requestResult) as unknown as RequestRow[];

    const transactions = transactionRows.map(mapTransaction);

    return {
      accountId: account.id,
      account: mapAccount(account, goal, transactions),
      requests: requestRows.map(mapRequest),
      transactions,
      user: mapProfile(profile),
    };
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
      const result = await response.json().catch(() => null);
      throw new Error(result?.error ?? "提交失败，请稍后再试");
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

  async createAdminTransaction(accountId: string, input: TransactionInput): Promise<void> {
    await this.callRpc("create_manual_transaction", {
      p_account_id: accountId,
      p_type: input.type,
      p_amount: input.amount,
      p_category: input.category,
      p_description: input.description,
    });
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

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      throw new Error("登录已失效，请重新登录");
    }

    const email = sessionData.session.user.email;

    if (!email) {
      throw new Error("无法获取账号信息");
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      throw new Error("当前密码不正确");
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw new Error("密码修改失败，请稍后再试");
    }
  }

  async getUserSettings(): Promise<UserSettings> {
    const supabase = getSupabaseClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new Error("登录已失效，请重新登录");
    }

    const result = (await supabase
      .from("user_settings")
      .select("settings")
      .eq("user_id", userData.user.id)
      .single()) as { error: unknown; data: { settings: Record<string, unknown> } | null };

    if (result.error || !result.data) {
      return {};
    }

    const raw = result.data.settings;

    return {
      barkDeviceKey: typeof raw.bark_device_key === "string" ? (raw.bark_device_key as string) : undefined,
      notifyWithdrawal: typeof raw.notify_withdrawal === "boolean" ? (raw.notify_withdrawal as boolean) : true,
      notifyDeposit: typeof raw.notify_deposit === "boolean" ? (raw.notify_deposit as boolean) : true,
      enabledCategories: Array.isArray(raw.enabled_categories) ? (raw.enabled_categories as string[]) : undefined,
    };
  }

  async updateUserSettings(settings: UserSettings): Promise<void> {
    const supabase = getSupabaseClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new Error("登录已失效，请重新登录");
    }

    const dbSettings: Record<string, unknown> = {};

    if (settings.barkDeviceKey !== undefined) {
      dbSettings.bark_device_key = settings.barkDeviceKey;
    }

    if (settings.notifyWithdrawal !== undefined) {
      dbSettings.notify_withdrawal = settings.notifyWithdrawal;
    }

    if (settings.notifyDeposit !== undefined) {
      dbSettings.notify_deposit = settings.notifyDeposit;
    }

    if (settings.enabledCategories !== undefined) {
      dbSettings.enabled_categories = settings.enabledCategories;
    }

    await this.callRpc("upsert_user_settings", {
      p_user_id: userData.user.id,
      p_settings: dbSettings,
    });
  }

  async getCustomTags(): Promise<CustomTag[]> {
    const supabase = getSupabaseClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new Error("登录已失效，请重新登录");
    }

    const result = await supabase
      .from("custom_tags")
      .select("id, name, created_at")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: true });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return (result.data ?? []).map((row: { id: string; name: string; created_at: string }) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
    }));
  }

  async addCustomTag(name: string): Promise<CustomTag> {
    const supabase = getSupabaseClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new Error("登录已失效，请重新登录");
    }

    const row = await this.callRpc<{ id: string; name: string; created_at: string }>("add_custom_tag", {
      p_user_id: userData.user.id,
      p_name: name.trim(),
    });

    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
    };
  }

  async deleteCustomTag(tagId: string): Promise<void> {
    await this.callRpc("delete_custom_tag", { p_tag_id: tagId });
  }

  async getNotificationLogs(): Promise<NotificationLog[]> {
    const supabase = getSupabaseClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new Error("登录已失效，请重新登录");
    }

    const result = await supabase
      .from("notification_logs")
      .select("id, type, title, body, status, created_at")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return (result.data ?? []).map((row: { id: string; type: string; title: string; body: string; status: string; created_at: string }) => ({
      id: row.id,
      type: row.type as NotificationLog["type"],
      title: row.title,
      body: row.body,
      status: row.status as NotificationLog["status"],
      createdAt: row.created_at,
    }));
  }
}
