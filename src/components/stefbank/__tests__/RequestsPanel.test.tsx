import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AccountSummary, BankRequest } from "@/data/bank-types";
import { RequestsPanel } from "../RequestsPanel";

const account: AccountSummary = {
  name: "车厘子银行总账",
  displayName: "车厘子银行存款系统",
  currentBalance: 2897,
  monthDeposit: 100,
  monthWithdraw: 50,
  totalRecords: 1,
  lastUpdated: "2026.07.22",
  goal: null,
};

const request: BankRequest = {
  id: "request-1",
  requestType: "withdraw",
  amount: 100,
  category: "学习",
  urgency: "普通",
  paymentMethod: "微信",
  note: "购买学习资料",
  status: "pending",
  createdAt: "2026.07.22",
};

function renderPanel(
  role: "manager" | "depositor",
  requests: BankRequest[] = [request],
) {
  const callbacks = {
    onStartMoneyAction: vi.fn(),
    onApproveRequest: vi.fn().mockResolvedValue(undefined),
    onCompleteRequest: vi.fn().mockResolvedValue(undefined),
    onRejectRequest: vi.fn().mockResolvedValue(undefined),
    onDeleteRequest: vi.fn().mockResolvedValue(undefined),
  };

  render(
    <RequestsPanel
      account={account}
      requests={requests}
      role={role}
      {...callbacks}
    />,
  );

  return callbacks;
}

describe("RequestsPanel", () => {
  it("opens a depositor request detail from the request list", () => {
    renderPanel("depositor");

    fireEvent.click(screen.getByText("学习").closest("button")!);

    expect(screen.getByRole("dialog", { name: "申请详情" })).toBeInTheDocument();
    expect(screen.getByText("购买学习资料")).toBeInTheDocument();
  });

  it("requires and trims a manager approval note", async () => {
    const { onApproveRequest } = renderPanel("manager");

    fireEvent.click(screen.getByRole("button", { name: "批准" }));
    fireEvent.click(screen.getByRole("button", { name: "确认批准" }));
    expect(screen.getByText("请填写审批留言")).toBeInTheDocument();
    expect(onApproveRequest).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/批准留言/), {
      target: { value: "  资料用途合理  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "确认批准" }));

    await waitFor(() => {
      expect(onApproveRequest).toHaveBeenCalledWith(
        "request-1",
        "资料用途合理",
      );
    });
  });

  it("requires manager confirmation before deleting a handled request", async () => {
    const handled = { ...request, status: "completed" as const };
    const { onDeleteRequest } = renderPanel("manager", [handled]);

    fireEvent.click(screen.getByText("学习").closest("button")!);
    fireEvent.click(screen.getByRole("button", { name: "删除这条记录" }));
    expect(onDeleteRequest).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "确认删除" }));
    await waitFor(() => {
      expect(onDeleteRequest).toHaveBeenCalledWith("request-1");
    });
  });
});
