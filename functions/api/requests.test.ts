import { beforeEach, describe, expect, it, vi } from "vitest";
import { onRequestPost } from "./requests";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  sendWithdrawalRequestBarkNotification: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));

vi.mock("../../src/lib/bark", () => ({
  sendWithdrawalRequestBarkNotification:
    mocks.sendWithdrawalRequestBarkNotification,
}));

const env = {
  BARK_DEVICE_KEY: "test-device-key",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
};

const createdRequest = {
  id: "request-1",
  requester_id: "user-1",
  request_type: "withdraw",
  amount: 100,
  note: "测试",
  status: "pending",
};

beforeEach(() => {
  vi.clearAllMocks();

  const single = vi.fn().mockResolvedValue({
    data: {
      username: "depositor",
      full_name: "储户",
      display_name: "储户",
    },
    error: null,
  });
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  const rpc = vi.fn().mockResolvedValue({ data: createdRequest, error: null });

  mocks.createClient.mockReturnValue({ rpc, from });
});

function requestWithAmount(amount: unknown) {
  return new Request("https://stefbank.pages.dev/api/requests", {
    method: "POST",
    headers: {
      Authorization: "Bearer test-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      accountId: "stefbank-main-account",
      input: {
        requestType: "withdraw",
        amount,
        category: "其他",
        urgency: "普通",
        paymentMethod: "微信",
        note: "测试",
      },
    }),
  });
}

describe("POST /api/requests", () => {
  it("marks JSON responses as non-cacheable", async () => {
    const response = await onRequestPost({
      request: new Request("https://stefbank.pages.dev/api/requests", {
        method: "POST",
      }),
      env: {},
    } as never);

    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("rejects decimal-yuan amounts before contacting Supabase", async () => {
    const response = await onRequestPost({
      request: requestWithAmount(1.5),
      env: {},
    } as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "amount is invalid." });
  });

  it("rejects request bodies larger than 16 KiB", async () => {
    const request = requestWithAmount(1);
    const oversized = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({
        accountId: "stefbank-main-account",
        input: {
          requestType: "withdraw",
          amount: 1,
          category: "其他",
          urgency: "普通",
          paymentMethod: "微信",
          note: "长".repeat(17_000),
        },
      }),
    });

    const response = await onRequestPost({ request: oversized, env: {} } as never);
    expect(response.status).toBe(413);
  });

  it("rejects overlong text fields", async () => {
    const request = new Request("https://stefbank.pages.dev/api/requests", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountId: "stefbank-main-account",
        input: {
          requestType: "withdraw",
          amount: 1,
          category: "其他",
          paymentMethod: "微信",
          note: "长".repeat(501),
        },
      }),
    });

    const response = await onRequestPost({ request, env: {} } as never);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "note is too long." });
  });

  it("returns after the bank write and tracks Bark work with waitUntil", async () => {
    let releaseNotification!: () => void;
    const notificationGate = new Promise<void>((resolve) => {
      releaseNotification = resolve;
    });
    mocks.sendWithdrawalRequestBarkNotification.mockReturnValue(
      notificationGate,
    );
    let background: Promise<unknown> | undefined;
    const waitUntil = vi.fn((promise: Promise<unknown>) => {
      background = promise;
    });

    const response = await Promise.race([
      onRequestPost({
        request: requestWithAmount(100),
        env,
        waitUntil,
      } as never),
      new Promise<never>((_resolve, reject) => {
        setTimeout(() => reject(new Error("handler blocked on Bark")), 100);
      }),
    ]);

    expect(response.status).toBe(200);
    expect(waitUntil).toHaveBeenCalledTimes(1);
    expect(mocks.sendWithdrawalRequestBarkNotification).toHaveBeenCalledTimes(
      1,
    );
    releaseNotification();
    await background;
  });

  it("keeps a successful response when background Bark delivery fails", async () => {
    mocks.sendWithdrawalRequestBarkNotification.mockRejectedValue(
      new Error("Bark unavailable"),
    );
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    let background: Promise<unknown> | undefined;
    const waitUntil = vi.fn((promise: Promise<unknown>) => {
      background = promise;
    });

    const response = await onRequestPost({
      request: requestWithAmount(100),
      env,
      waitUntil,
    } as never);

    expect(response.status).toBe(200);
    await expect(background).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });
});
