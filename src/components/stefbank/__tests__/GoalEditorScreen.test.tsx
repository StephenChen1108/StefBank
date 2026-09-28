import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { AccountSummary, SavingGoal } from "@/data/bank-types";
import { GoalEditorScreen } from "../GoalEditorScreen";

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

beforeAll(() => {
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

describe("GoalEditorScreen", () => {
  it("selects a type, rejects decimal yuan, and saves an integer target", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <GoalEditorScreen
        account={account}
        existingGoal={null}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /旅行/ }));
    fireEvent.change(screen.getByLabelText("目标名称"), {
      target: { value: "东京旅行基金" },
    });
    fireEvent.change(screen.getByLabelText("目标金额"), {
      target: { value: "10000.5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存目标" }));
    expect(screen.getByText("请填写整数目标金额")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("目标金额"), {
      target: { value: "10000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存目标" }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        title: "东京旅行基金",
        targetAmount: 10000,
        goalType: "travel",
        metadata: {},
      });
    });
  });

  it("requires confirmation before deleting an existing goal", async () => {
    const existingGoal: SavingGoal = {
      id: "goal-1",
      title: "东京旅行基金",
      targetAmount: 10000,
      currentAmount: 2897,
      progress: 29,
      goalType: "travel",
      metadata: {},
    };
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <GoalEditorScreen
        account={account}
        existingGoal={existingGoal}
        onSave={vi.fn().mockResolvedValue(undefined)}
        onDelete={onDelete}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "删除这个目标" }));
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "确认删除" }));

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});
