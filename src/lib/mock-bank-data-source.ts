import type {
  AccountSummary,
  BankRequest,
  RequestTab,
  Transaction,
  UserProfile,
  UserRole,
} from "@/data/bank-types";
import type { BankDataSource, BankSnapshot, GoalInput, RequestInput, TransactionInput } from "./bank-data-source";

type MockProfile = {
  id: string;
  username: string;
  password: string;
  name: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
};

type MockAccount = {
  id: string;
  name: string;
  currentBalance: number;
  updatedAt: string;
};

type MockGoal = {
  id: string;
  accountId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  goalType: string;
  metadata: Record<string, string>;
};

type MockTransaction = Transaction & {
  accountId: string;
};

type MockRequest = BankRequest & {
  accountId: string;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay() {
  return delay(50 + Math.random() * 150);
}

function randomError() {
  if (Math.random() < 0.05) {
    throw new Error("模拟网络错误，请稍后再试");
  }
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

const PROFILES: MockProfile[] = [
  {
    id: "user-admin",
    username: "admin",
    password: "adminadmin",
    name: "车厘子行长",
    displayName: "车厘子行长",
    role: "manager",
  },
  {
    id: "user-yezi",
    username: "yezi",
    password: "Zhouge520",
    name: "应展硕",
    displayName: "应展硕",
    role: "depositor",
    avatarUrl: "/yezi-avatar-compressed.jpg",
  },
];

const ACCOUNT: MockAccount = {
  id: "stefbank-main-account",
  name: "车厘子银行总账",
  currentBalance: 330000,
  updatedAt: "2026-06-09",
};

const GOAL: MockGoal = {
  id: "stefbank-main-account-goal",
  accountId: ACCOUNT.id,
  title: "旅行基金",
  targetAmount: 1000000,
  currentAmount: 330000,
  goalType: "travel",
  metadata: { destination: "东京", departureDate: "2026-08-01" },
};

const TRANSACTIONS: MockTransaction[] = [
  { id: "tx-001", accountId: ACCOUNT.id, type: "deposit", amount: 200000, balanceAfter: 200000, category: "存款", description: "历史转入", transactionDate: "2025.10.31", status: "confirmed" },
  { id: "tx-002", accountId: ACCOUNT.id, type: "withdraw", amount: 100000, balanceAfter: 100000, category: "取款", description: "历史转出", transactionDate: "2025.11.10", status: "confirmed" },
  { id: "tx-003", accountId: ACCOUNT.id, type: "withdraw", amount: 50000, balanceAfter: 50000, category: "取款", description: "历史转出", transactionDate: "2025.11.16", status: "confirmed" },
  { id: "tx-004", accountId: ACCOUNT.id, type: "deposit", amount: 250000, balanceAfter: 300000, category: "存款", description: "历史转入", transactionDate: "2025.12.01", status: "confirmed" },
  { id: "tx-005", accountId: ACCOUNT.id, type: "withdraw", amount: 50000, balanceAfter: 250000, category: "取款", description: "历史转出", transactionDate: "2025.12.06", status: "confirmed" },
  { id: "tx-006", accountId: ACCOUNT.id, type: "withdraw", amount: 30000, balanceAfter: 220000, category: "取款", description: "历史转出", transactionDate: "2025.12.15", status: "confirmed" },
  { id: "tx-007", accountId: ACCOUNT.id, type: "withdraw", amount: 18000, balanceAfter: 202000, category: "取款", description: "历史转出", transactionDate: "2025.12.17", status: "confirmed" },
  { id: "tx-008", accountId: ACCOUNT.id, type: "withdraw", amount: 72000, balanceAfter: 130000, category: "取款", description: "历史转出", transactionDate: "2025.12.23", status: "confirmed" },
  { id: "tx-009", accountId: ACCOUNT.id, type: "deposit", amount: 250000, balanceAfter: 380000, category: "存款", description: "历史转入", transactionDate: "2026.01.03", status: "confirmed" },
  { id: "tx-010", accountId: ACCOUNT.id, type: "withdraw", amount: 50000, balanceAfter: 330000, category: "取款", description: "历史转出", transactionDate: "2026.01.08", status: "confirmed" },
  { id: "tx-011", accountId: ACCOUNT.id, type: "withdraw", amount: 50000, balanceAfter: 280000, category: "取款", description: "历史转出", transactionDate: "2026.01.16", status: "confirmed" },
  { id: "tx-012", accountId: ACCOUNT.id, type: "withdraw", amount: 30000, balanceAfter: 250000, category: "取款", description: "历史转出", transactionDate: "2026.01.26", status: "confirmed" },
  { id: "tx-013", accountId: ACCOUNT.id, type: "withdraw", amount: 60000, balanceAfter: 190000, category: "取款", description: "历史转出", transactionDate: "2026.02.02", status: "confirmed" },
  { id: "tx-014", accountId: ACCOUNT.id, type: "withdraw", amount: 60000, balanceAfter: 130000, category: "取款", description: "历史转出", transactionDate: "2026.02.18", status: "confirmed" },
  { id: "tx-015", accountId: ACCOUNT.id, type: "deposit", amount: 30000, balanceAfter: 160000, category: "存款", description: "历史转入", transactionDate: "2026.03.22", status: "confirmed" },
  { id: "tx-016", accountId: ACCOUNT.id, type: "withdraw", amount: 30000, balanceAfter: 130000, category: "取款", description: "历史转出", transactionDate: "2026.03.26", status: "confirmed" },
  { id: "tx-017", accountId: ACCOUNT.id, type: "withdraw", amount: 50000, balanceAfter: 80000, category: "取款", description: "历史转出", transactionDate: "2026.03.29", status: "confirmed" },
  { id: "tx-018", accountId: ACCOUNT.id, type: "withdraw", amount: 60000, balanceAfter: 20000, category: "取款", description: "历史转出", transactionDate: "2026.03.30", status: "confirmed" },
  { id: "tx-019", accountId: ACCOUNT.id, type: "deposit", amount: 200000, balanceAfter: 220000, category: "存款", description: "历史转入", transactionDate: "2026.03.31", status: "confirmed" },
  { id: "tx-020", accountId: ACCOUNT.id, type: "withdraw", amount: 50000, balanceAfter: 170000, category: "取款", description: "历史转出", transactionDate: "2026.04.13", status: "confirmed" },
  { id: "tx-021", accountId: ACCOUNT.id, type: "withdraw", amount: 50000, balanceAfter: 120000, category: "取款", description: "历史转出", transactionDate: "2026.04.17", status: "confirmed" },
  { id: "tx-022", accountId: ACCOUNT.id, type: "withdraw", amount: 50000, balanceAfter: 70000, category: "取款", description: "历史转出", transactionDate: "2026.04.20", status: "confirmed" },
  { id: "tx-023", accountId: ACCOUNT.id, type: "withdraw", amount: 50000, balanceAfter: 20000, category: "取款", description: "历史转出", transactionDate: "2026.04.22", status: "confirmed" },
  { id: "tx-024", accountId: ACCOUNT.id, type: "deposit", amount: 130000, balanceAfter: 150000, category: "存款", description: "历史转入", transactionDate: "2026.05.05", status: "confirmed" },
  { id: "tx-025", accountId: ACCOUNT.id, type: "withdraw", amount: 54000, balanceAfter: 96000, category: "取款", description: "历史转出", transactionDate: "2026.05.19", status: "confirmed" },
  { id: "tx-026", accountId: ACCOUNT.id, type: "withdraw", amount: 20000, balanceAfter: 76000, category: "取款", description: "历史转出", transactionDate: "2026.05.24", status: "confirmed" },
  { id: "tx-027", accountId: ACCOUNT.id, type: "withdraw", amount: 50000, balanceAfter: 26000, category: "取款", description: "历史转出", transactionDate: "2026.05.25", status: "confirmed" },
  { id: "tx-028", accountId: ACCOUNT.id, type: "withdraw", amount: 26000, balanceAfter: 0, category: "取款", description: "历史转出", transactionDate: "2026.05.30", status: "confirmed" },
  { id: "tx-029", accountId: ACCOUNT.id, type: "deposit", amount: 300000, balanceAfter: 300000, category: "存款", description: "历史转入", transactionDate: "2026.06.02", status: "confirmed" },
  { id: "tx-030", accountId: ACCOUNT.id, type: "withdraw", amount: 10000, balanceAfter: 290000, category: "取款", description: "历史转出", transactionDate: "2026.06.05", status: "confirmed" },
  { id: "tx-031", accountId: ACCOUNT.id, type: "withdraw", amount: 10000, balanceAfter: 280000, category: "取款", description: "历史转出", transactionDate: "2026.06.08", status: "confirmed" },
  { id: "tx-032", accountId: ACCOUNT.id, type: "withdraw", amount: 10000, balanceAfter: 270000, category: "取款", description: "历史转出", transactionDate: "2026.06.09", status: "confirmed" },
  { id: "tx-033", accountId: ACCOUNT.id, type: "deposit", amount: 60000, balanceAfter: 330000, category: "存款", description: "历史转入", transactionDate: "2026.06.09", status: "confirmed" },
];

const REQUESTS: MockRequest[] = [];

let nextRequestId = 1;
let nextTransactionId = 34;

export class MockBankDataSource implements BankDataSource {
  private transactions = [...TRANSACTIONS];
  private requests = [...REQUESTS];
  private account = { ...ACCOUNT };
  private goal = { ...GOAL };
  private currentUser: MockProfile | null = null;

  private buildSnapshot(): BankSnapshot {
    if (!this.currentUser) {
      throw new Error("未登录");
    }

    const transactions = this.transactions
      .filter((t) => t.accountId === this.account.id)
      .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));

    const now = new Date();
    const monthPrefix = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthTransactions = transactions.filter((t) => t.transactionDate.startsWith(monthPrefix));
    const monthDeposit = monthTransactions
      .filter((t) => t.type === "deposit")
      .reduce((sum, t) => sum + t.amount, 0);
    const monthWithdraw = monthTransactions
      .filter((t) => t.type === "withdraw")
      .reduce((sum, t) => sum + t.amount, 0);
    const progress = Math.max(0, Math.min(100, Math.round((this.account.currentBalance / this.goal.targetAmount) * 100)));

    const accountSummary: AccountSummary = {
      name: this.account.name,
      displayName: "车厘子银行存款系统",
      currentBalance: this.account.currentBalance,
      monthDeposit,
      monthWithdraw,
      totalRecords: transactions.length,
      lastUpdated: transactions[0]?.transactionDate ?? formatDateText(this.account.updatedAt),
      goal: {
        id: this.goal.id,
        title: this.goal.title,
        currentAmount: this.goal.currentAmount,
        targetAmount: this.goal.targetAmount,
        progress,
        goalType: this.goal.goalType,
        metadata: this.goal.metadata,
      },
    };

    const user: UserProfile = {
      id: this.currentUser.id,
      username: this.currentUser.username,
      name: this.currentUser.name,
      displayName: this.currentUser.displayName,
      role: this.currentUser.role,
      avatarUrl: this.currentUser.avatarUrl,
    };

    const requests: BankRequest[] = this.requests
      .filter((r) => r.accountId === this.account.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return {
      accountId: this.account.id,
      account: accountSummary,
      requests,
      transactions,
      user,
    };
  }

  private recalcBalances() {
    let balance = 0;
    const sorted = [...this.transactions].sort((a, b) => a.transactionDate.localeCompare(b.transactionDate) || a.id.localeCompare(b.id));

    for (const tx of sorted) {
      if (tx.type === "deposit") {
        balance += tx.amount;
      } else {
        balance -= tx.amount;
      }
      tx.balanceAfter = balance;
    }

    this.account.currentBalance = balance;
    this.goal.currentAmount = balance;
  }

  async signIn(username: string, password: string): Promise<BankSnapshot> {
    await randomDelay();
    randomError();

    const normalized = username.trim().toLowerCase();
    const profile = PROFILES.find((p) => p.username === normalized && p.password === password);

    if (!profile) {
      throw new Error("账号或密码不正确，请重新输入");
    }

    this.currentUser = profile;
    return this.buildSnapshot();
  }

  async signOut(): Promise<void> {
    await randomDelay();
    this.currentUser = null;
  }

  async getExistingSession(): Promise<BankSnapshot | null> {
    await randomDelay();

    if (!this.currentUser) {
      return null;
    }

    return this.buildSnapshot();
  }

  async loadSnapshot(): Promise<BankSnapshot> {
    await randomDelay();
    randomError();

    if (!this.currentUser) {
      throw new Error("登录已失效，请重新登录");
    }

    return this.buildSnapshot();
  }

  async submitRequest(accountId: string, input: RequestInput): Promise<void> {
    await randomDelay();
    randomError();

    if (input.requestType === "withdraw" && input.amount > this.account.currentBalance) {
      throw new Error("余额不足，暂时不能提交这笔申请");
    }

    const request: MockRequest = {
      id: `mock-req-${nextRequestId++}`,
      accountId,
      requestType: input.requestType,
      amount: input.amount,
      category: input.category,
      urgency: input.urgency,
      paymentMethod: input.paymentMethod,
      note: input.note,
      reviewNote: undefined,
      status: "pending",
      createdAt: formatDateText(new Date()),
    };

    this.requests.push(request);
  }

  async approveWithdrawal(requestId: string, reviewNote: string): Promise<void> {
    await randomDelay();
    randomError();

    const request = this.requests.find((r) => r.id === requestId);

    if (!request) {
      throw new Error("找不到该申请");
    }

    if (request.amount > this.account.currentBalance) {
      throw new Error("余额不足，无法批准这笔取款");
    }

    request.status = "approved";
    request.reviewNote = reviewNote;
  }

  async rejectRequest(requestId: string, reviewNote: string): Promise<void> {
    await randomDelay();
    randomError();

    const request = this.requests.find((r) => r.id === requestId);

    if (!request) {
      throw new Error("找不到该申请");
    }

    request.status = "rejected";
    request.reviewNote = reviewNote;
  }

  async completeRequest(requestId: string): Promise<void> {
    await randomDelay();
    randomError();

    const request = this.requests.find((r) => r.id === requestId);

    if (!request) {
      throw new Error("找不到该申请");
    }

    if (request.requestType === "withdraw") {
      if (request.amount > this.account.currentBalance) {
        throw new Error("余额不足，无法完成这笔取款");
      }

      const tx: MockTransaction = {
        id: `mock-tx-${nextTransactionId++}`,
        accountId: this.account.id,
        type: "withdraw",
        amount: request.amount,
        balanceAfter: 0,
        category: request.category,
        description: request.note,
        transactionDate: formatDateText(new Date()),
        status: "confirmed",
      };

      this.transactions.push(tx);
      this.recalcBalances();
    }

    request.status = "completed";
  }

  async confirmDepositRequest(requestId: string): Promise<void> {
    await randomDelay();
    randomError();

    const request = this.requests.find((r) => r.id === requestId);

    if (!request) {
      throw new Error("找不到该申请");
    }

    const tx: MockTransaction = {
      id: `mock-tx-${nextTransactionId++}`,
      accountId: this.account.id,
      type: "deposit",
      amount: request.amount,
      balanceAfter: 0,
      category: request.category,
      description: request.note,
      transactionDate: formatDateText(new Date()),
      status: "confirmed",
    };

    this.transactions.push(tx);
    this.recalcBalances();
    request.status = "completed";
  }

  async createAdminTransaction(accountId: string, input: TransactionInput): Promise<void> {
    await randomDelay();
    randomError();

    if (input.type === "withdraw" && input.amount > this.account.currentBalance) {
      throw new Error("余额不足，不能增加这笔取钱流水");
    }

    const tx: MockTransaction = {
      id: `mock-tx-${nextTransactionId++}`,
      accountId,
      type: input.type,
      amount: input.amount,
      balanceAfter: 0,
      category: input.category,
      description: input.description,
      transactionDate: formatDateText(new Date()),
      status: "confirmed",
    };

    this.transactions.push(tx);
    this.recalcBalances();
  }

  async updateTransaction(
    transactionId: string,
    input: TransactionInput & { transactionDate: string },
  ): Promise<void> {
    await randomDelay();
    randomError();

    const tx = this.transactions.find((t) => t.id === transactionId);

    if (!tx) {
      throw new Error("找不到该流水");
    }

    tx.type = input.type;
    tx.amount = input.amount;
    tx.category = input.category;
    tx.description = input.description;
    tx.transactionDate = input.transactionDate;

    this.recalcBalances();
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    await randomDelay();
    randomError();

    const index = this.transactions.findIndex((t) => t.id === transactionId);

    if (index === -1) {
      throw new Error("找不到该流水");
    }

    this.transactions.splice(index, 1);
    this.recalcBalances();
  }

  async deleteRequest(requestId: string): Promise<void> {
    await randomDelay();
    randomError();

    const index = this.requests.findIndex((r) => r.id === requestId);

    if (index === -1) {
      throw new Error("找不到该申请");
    }

    this.requests.splice(index, 1);
  }

  async upsertGoal(accountId: string, input: GoalInput): Promise<void> {
    await randomDelay();
    randomError();

    this.goal.title = input.title;
    this.goal.targetAmount = input.targetAmount;
    this.goal.goalType = input.goalType;
    this.goal.metadata = input.metadata;
    this.goal.currentAmount = this.account.currentBalance;
  }

  async deleteGoal(accountId: string): Promise<void> {
    await randomDelay();
    randomError();

    this.goal.title = "";
    this.goal.targetAmount = 0;
    this.goal.currentAmount = 0;
    this.goal.goalType = "custom";
    this.goal.metadata = {};
  }
}
