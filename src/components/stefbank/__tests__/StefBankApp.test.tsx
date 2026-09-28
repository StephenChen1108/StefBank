import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { BankSnapshot, RequestInput } from "@/lib/bank-data-source";
import { getBankDataSource } from "@/lib/bank-data-source-factory";
import { ToastProvider } from "../ToastProvider";
import { StefBankApp } from "../StefBankApp";

vi.mock("@/lib/bank-data-source-factory", () => ({ getBankDataSource: vi.fn() }));
vi.mock("../PageMotion", () => ({ PageMotion: () => null }));

let submitted: Promise<void> | undefined;
vi.mock("../MoneyActionScreen", () => ({
  MoneyActionScreen: ({ onSubmitRequest }: { onSubmitRequest: (input: RequestInput) => Promise<void> }) => (
    <button type="button" onClick={() => {
      submitted = onSubmitRequest({ requestType: "deposit", amount: 100, category: "存款", paymentMethod: "微信", note: "测试" });
    }}>模拟提交</button>
  ),
}));

const snapshot: BankSnapshot = {
  user: { id: "user-1", username: "depositor", name: "储户", displayName: "储户", role: "depositor" },
  accountId: "account-1",
  account: {
    name: "测试账户", displayName: "车厘子银行", currentBalance: 1000,
    monthDeposit: 0, monthWithdraw: 0, totalRecords: 0, lastUpdated: "2026.09.28", goal: null,
  },
  transactions: [],
  requests: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  submitted = undefined;
});

describe("StefBankApp refresh behavior", () => {
  it("refreshes the snapshot when the app becomes visible again", async () => {
    const loadSnapshot = vi.fn().mockResolvedValue(snapshot);
    vi.mocked(getBankDataSource).mockReturnValue({
      getExistingSession: vi.fn().mockResolvedValue(snapshot), loadSnapshot,
    } as never);

    render(<ToastProvider><StefBankApp /></ToastProvider>);
    await screen.findByText("当前余额");
    fireEvent(document, new Event("visibilitychange"));
    await waitFor(() => expect(loadSnapshot).toHaveBeenCalledTimes(1));
  });

  it("does not report a successful submission as failed when only refresh fails", async () => {
    const submitRequest = vi.fn().mockResolvedValue(undefined);
    const loadSnapshot = vi.fn().mockRejectedValue(new Error("网络暂时不可用"));
    vi.mocked(getBankDataSource).mockReturnValue({
      getExistingSession: vi.fn().mockResolvedValue(snapshot), submitRequest, loadSnapshot,
    } as never);

    render(<ToastProvider><StefBankApp /></ToastProvider>);
    fireEvent.click(await screen.findByRole("button", { name: "我要存钱" }));
    fireEvent.click(screen.getByRole("button", { name: "模拟提交" }));

    await waitFor(() => expect(submitted).toBeDefined());
    await expect(submitted).resolves.toBeUndefined();
    expect(submitRequest).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/数据更新失败：网络暂时不可用/)).toBeInTheDocument();
  });
});
