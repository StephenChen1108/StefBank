import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSupabaseClient } from "../supabase-client";
import {
  mapAccountSummary,
  SupabaseBankDataSource,
  toCreateManualTransactionArgs,
} from "../stefbank-supabase";

vi.mock("../supabase-client", () => ({ getSupabaseClient: vi.fn() }));

const mockGetSupabaseClient = vi.mocked(getSupabaseClient);

const snapshotPayload = {
  user: {
    id: "user-1",
    username: "depositor",
    full_name: "储户",
    display_name: "储户",
    role: "depositor",
    avatar_url: null,
  },
  accountId: "stefbank-main-account",
  account: {
    id: "stefbank-main-account",
    name: "车厘子银行总账",
    current_balance: 2897,
    updated_at: "2026-07-22T00:00:00.000Z",
  },
  goal: null,
  transactions: [
    {
      id: "transaction-1",
      type: "deposit",
      amount: 100,
      balance_after: 2897,
      category: "存款",
      description: "测试存款",
      transaction_date: "2026-07-22",
      status: "confirmed",
      created_at: "2026-07-22T00:00:00.000Z",
    },
  ],
  requests: [
    {
      id: "request-1",
      request_type: "withdraw",
      amount: 50,
      category: "其他",
      urgency: null,
      payment_method: "微信",
      note: "测试申请",
      review_note: null,
      status: "pending",
      created_at: "2026-07-22T00:00:00.000Z",
    },
  ],
} as const;

beforeEach(() => {
  vi.clearAllMocks();
});

const accountRow = {
  id: "stefbank-main-account",
  name: "车厘子银行总账",
  current_balance: 2897,
  updated_at: "2026-07-22T00:00:00.000Z",
};

describe("mapAccountSummary", () => {
  it("loads an account without a savings goal", () => {
    const account = mapAccountSummary(accountRow, null, []);

    expect(account.currentBalance).toBe(2897);
    expect(account.goal).toBeNull();
  });
});

describe("toCreateManualTransactionArgs", () => {
  it("passes the selected date to the create RPC", () => {
    expect(
      toCreateManualTransactionArgs("stefbank-main-account", {
        type: "withdraw",
        amount: 100,
        category: "其他",
        description: "测试",
        transactionDate: "2026.07.01",
      }),
    ).toEqual({
      p_account_id: "stefbank-main-account",
      p_type: "withdraw",
      p_amount: 100,
      p_category: "其他",
      p_description: "测试",
      p_transaction_date: "2026-07-01",
    });
  });
});

describe("SupabaseBankDataSource snapshot loading", () => {
  it("loads the complete snapshot with one RPC and no table reads", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: snapshotPayload,
      error: null,
    });
    const from = vi.fn();
    mockGetSupabaseClient.mockReturnValue({ rpc, from } as never);

    await expect(
      new SupabaseBankDataSource().loadSnapshot(),
    ).resolves.toMatchObject({
      accountId: "stefbank-main-account",
      transactions: [{ id: "transaction-1" }],
      requests: [{ id: "request-1" }],
    });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("get_bank_snapshot");
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects a malformed snapshot at the data boundary", async () => {
    mockGetSupabaseClient.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: { accountId: 42 },
        error: null,
      }),
    } as never);

    await expect(
      new SupabaseBankDataSource().loadSnapshot(),
    ).rejects.toThrow("银行快照格式无效");
  });

  it.each([
    [
      "non-positive transaction amount",
      {
        ...snapshotPayload,
        transactions: [{ ...snapshotPayload.transactions[0], amount: 0 }],
      },
    ],
    [
      "unknown request status",
      {
        ...snapshotPayload,
        requests: [{ ...snapshotPayload.requests[0], status: "unknown" }],
      },
    ],
  ])("rejects a snapshot with %s", async (_caseName, payload) => {
    mockGetSupabaseClient.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({ data: payload, error: null }),
    } as never);

    await expect(
      new SupabaseBankDataSource().loadSnapshot(),
    ).rejects.toThrow("银行快照格式无效");
  });

  it("returns null without a local session", async () => {
    const rpc = vi.fn();
    mockGetSupabaseClient.mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        }),
      },
      rpc,
    } as never);

    await expect(
      new SupabaseBankDataSource().getExistingSession(),
    ).resolves.toBeNull();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("uses the snapshot RPC for an existing session without refreshing the user", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: snapshotPayload,
      error: null,
    });
    const getUser = vi.fn();
    mockGetSupabaseClient.mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              access_token: "access-token",
              token_type: "bearer",
              expires_in: 3600,
              expires_at: 1785073200,
              refresh_token: "refresh-token",
              user: { id: "user-1" },
            },
          },
          error: null,
        }),
        getUser,
      },
      rpc,
    } as never);

    await expect(
      new SupabaseBankDataSource().getExistingSession(),
    ).resolves.toMatchObject({ accountId: "stefbank-main-account" });
    expect(getUser).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});

describe("SupabaseBankDataSource sign out", () => {
  it("surfaces a sign-out error instead of silently clearing the UI", async () => {
    mockGetSupabaseClient.mockReturnValue({
      auth: { signOut: vi.fn().mockResolvedValue({ error: new Error("退出失败") }) },
    } as never);

    await expect(new SupabaseBankDataSource().signOut()).rejects.toThrow("退出失败");
  });
});
