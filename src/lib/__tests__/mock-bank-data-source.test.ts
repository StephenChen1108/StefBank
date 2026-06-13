import { describe, expect, it, vi, beforeEach } from "vitest";
import { MockBankDataSource } from "../mock-bank-data-source";

describe("MockBankDataSource", () => {
  let source: MockBankDataSource;

  beforeEach(() => {
    // Control randomness: Math.random() = 0.5 means:
    // - randomDelay = 50 + 0.5 * 150 = 125ms
    // - randomError never throws (0.5 < 0.05 is false)
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    source = new MockBankDataSource();
  });

  describe("signIn", () => {
    it("signs in with valid credentials", async () => {
      const snapshot = await source.signIn("admin", "adminadmin");
      expect(snapshot.user.username).toBe("admin");
      expect(snapshot.user.role).toBe("manager");
    });

    it("signs in as depositor", async () => {
      const snapshot = await source.signIn("yezi", "Zhouge520");
      expect(snapshot.user.username).toBe("yezi");
      expect(snapshot.user.role).toBe("depositor");
    });

    it("throws on invalid credentials", async () => {
      await expect(source.signIn("admin", "wrong")).rejects.toThrow("账号或密码不正确");
    });

    it("throws on unknown username", async () => {
      await expect(source.signIn("nobody", "pass")).rejects.toThrow("账号或密码不正确");
    });

    it("returns account summary with balance", async () => {
      const snapshot = await source.signIn("admin", "adminadmin");
      expect(snapshot.account.currentBalance).toBe(330000);
      expect(snapshot.account.name).toBe("车厘子银行总账");
    });

    it("returns transactions sorted by date descending", async () => {
      const snapshot = await source.signIn("admin", "adminadmin");
      expect(snapshot.transactions.length).toBeGreaterThan(0);
      for (let i = 1; i < snapshot.transactions.length; i++) {
        expect(snapshot.transactions[i - 1].transactionDate >= snapshot.transactions[i].transactionDate).toBe(true);
      }
    });

    it("returns savings goal", async () => {
      const snapshot = await source.signIn("admin", "adminadmin");
      expect(snapshot.account.goal.title).toBe("旅行基金");
      expect(snapshot.account.goal.goalType).toBe("travel");
    });
  });

  describe("signOut", () => {
    it("clears the current session", async () => {
      await source.signIn("admin", "adminadmin");
      await source.signOut();
      await expect(source.loadSnapshot()).rejects.toThrow("登录已失效");
    });
  });

  describe("getExistingSession", () => {
    it("returns null when not signed in", async () => {
      const session = await source.getExistingSession();
      expect(session).toBeNull();
    });

    it("returns snapshot when signed in", async () => {
      await source.signIn("admin", "adminadmin");
      const session = await source.getExistingSession();
      expect(session).not.toBeNull();
      expect(session!.user.username).toBe("admin");
    });
  });

  describe("submitRequest", () => {
    it("submits a deposit request", async () => {
      await source.signIn("yezi", "Zhouge520");
      await source.submitRequest("stefbank-main-account", {
        requestType: "deposit",
        amount: 50000,
        category: "存款",
        paymentMethod: "转账",
        note: "测试存款",
      });

      const snapshot = await source.loadSnapshot();
      expect(snapshot.requests).toHaveLength(1);
      expect(snapshot.requests[0].requestType).toBe("deposit");
      expect(snapshot.requests[0].amount).toBe(50000);
      expect(snapshot.requests[0].status).toBe("pending");
    });

    it("submits a withdraw request", async () => {
      await source.signIn("yezi", "Zhouge520");
      await source.submitRequest("stefbank-main-account", {
        requestType: "withdraw",
        amount: 10000,
        category: "取款",
        paymentMethod: "现金",
        note: "测试取款",
      });

      const snapshot = await source.loadSnapshot();
      expect(snapshot.requests).toHaveLength(1);
      expect(snapshot.requests[0].requestType).toBe("withdraw");
    });

    it("rejects withdraw request exceeding balance", async () => {
      await source.signIn("yezi", "Zhouge520");
      await expect(
        source.submitRequest("stefbank-main-account", {
          requestType: "withdraw",
          amount: 99999999,
          category: "取款",
          paymentMethod: "现金",
          note: "超额",
        }),
      ).rejects.toThrow("余额不足");
    });
  });

  describe("request lifecycle", () => {
    it("approves a withdraw request", async () => {
      await source.signIn("admin", "adminadmin");
      await source.submitRequest("stefbank-main-account", {
        requestType: "withdraw",
        amount: 10000,
        category: "取款",
        paymentMethod: "现金",
        note: "测试",
      });

      const snapshot = await source.loadSnapshot();
      const requestId = snapshot.requests[0].id;

      await source.approveWithdrawal(requestId, "同意");

      const updated = await source.loadSnapshot();
      expect(updated.requests[0].status).toBe("approved");
      expect(updated.requests[0].reviewNote).toBe("同意");
    });

    it("rejects a request", async () => {
      await source.signIn("admin", "adminadmin");
      await source.submitRequest("stefbank-main-account", {
        requestType: "withdraw",
        amount: 10000,
        category: "取款",
        paymentMethod: "现金",
        note: "测试",
      });

      const snapshot = await source.loadSnapshot();
      const requestId = snapshot.requests[0].id;

      await source.rejectRequest(requestId, "不同意");

      const updated = await source.loadSnapshot();
      expect(updated.requests[0].status).toBe("rejected");
      expect(updated.requests[0].reviewNote).toBe("不同意");
    });

    it("completes a withdraw request and creates transaction", async () => {
      await source.signIn("admin", "adminadmin");
      const before = await source.loadSnapshot();
      const txCountBefore = before.transactions.length;
      const balanceBefore = before.account.currentBalance;

      await source.submitRequest("stefbank-main-account", {
        requestType: "withdraw",
        amount: 10000,
        category: "取款",
        paymentMethod: "现金",
        note: "测试取款",
      });

      const withRequest = await source.loadSnapshot();
      const requestId = withRequest.requests[0].id;

      await source.approveWithdrawal(requestId, "同意");
      await source.completeRequest(requestId);

      const after = await source.loadSnapshot();
      expect(after.requests[0].status).toBe("completed");
      expect(after.transactions.length).toBe(txCountBefore + 1);
      expect(after.account.currentBalance).toBe(balanceBefore - 10000);
    });

    it("confirms a deposit request and increases balance", async () => {
      await source.signIn("admin", "adminadmin");
      const before = await source.loadSnapshot();
      const balanceBefore = before.account.currentBalance;

      await source.submitRequest("stefbank-main-account", {
        requestType: "deposit",
        amount: 50000,
        category: "存款",
        paymentMethod: "转账",
        note: "测试存款",
      });

      const withRequest = await source.loadSnapshot();
      const requestId = withRequest.requests[0].id;

      await source.confirmDepositRequest(requestId);

      const after = await source.loadSnapshot();
      expect(after.requests[0].status).toBe("completed");
      expect(after.account.currentBalance).toBe(balanceBefore + 50000);
    });
  });

  describe("admin transactions", () => {
    it("creates a manual deposit transaction", async () => {
      await source.signIn("admin", "adminadmin");
      const before = await source.loadSnapshot();
      const balanceBefore = before.account.currentBalance;

      await source.createAdminTransaction("stefbank-main-account", {
        type: "deposit",
        amount: 100000,
        category: "存款",
        description: "管理员手动存入",
      });

      const after = await source.loadSnapshot();
      expect(after.account.currentBalance).toBe(balanceBefore + 100000);
    });

    it("creates a manual withdraw transaction", async () => {
      await source.signIn("admin", "adminadmin");
      const before = await source.loadSnapshot();
      const balanceBefore = before.account.currentBalance;

      await source.createAdminTransaction("stefbank-main-account", {
        type: "withdraw",
        amount: 50000,
        category: "取款",
        description: "管理员手动取出",
      });

      const after = await source.loadSnapshot();
      expect(after.account.currentBalance).toBe(balanceBefore - 50000);
    });

    it("rejects withdraw exceeding balance", async () => {
      await source.signIn("admin", "adminadmin");
      await expect(
        source.createAdminTransaction("stefbank-main-account", {
          type: "withdraw",
          amount: 99999999,
          category: "取款",
          description: "超额",
        }),
      ).rejects.toThrow("余额不足");
    });

    it("deletes a transaction and recalculates balance", async () => {
      await source.signIn("admin", "adminadmin");
      const before = await source.loadSnapshot();
      const txId = before.transactions[0].id;
      const balanceBefore = before.account.currentBalance;

      await source.deleteTransaction(txId);

      const after = await source.loadSnapshot();
      expect(after.transactions.length).toBe(before.transactions.length - 1);
      // Balance should be recalculated
      expect(after.account.currentBalance).not.toBe(balanceBefore);
    });
  });

  describe("goal management", () => {
    it("updates goal", async () => {
      await source.signIn("admin", "adminadmin");

      await source.upsertGoal("stefbank-main-account", {
        title: "买房基金",
        targetAmount: 5000000,
        goalType: "house",
        metadata: { location: "北京" },
      });

      const snapshot = await source.loadSnapshot();
      expect(snapshot.account.goal.title).toBe("买房基金");
      expect(snapshot.account.goal.targetAmount).toBe(5000000);
      expect(snapshot.account.goal.goalType).toBe("house");
    });

    it("deletes goal", async () => {
      await source.signIn("admin", "adminadmin");

      await source.deleteGoal("stefbank-main-account");

      const snapshot = await source.loadSnapshot();
      expect(snapshot.account.goal.title).toBe("");
      expect(snapshot.account.goal.targetAmount).toBe(0);
      expect(snapshot.account.goal.goalType).toBe("custom");
    });
  });

  describe("deleteRequest", () => {
    it("removes a request", async () => {
      await source.signIn("admin", "adminadmin");
      await source.submitRequest("stefbank-main-account", {
        requestType: "deposit",
        amount: 10000,
        category: "存款",
        paymentMethod: "转账",
        note: "测试",
      });

      const withRequest = await source.loadSnapshot();
      expect(withRequest.requests).toHaveLength(1);

      await source.deleteRequest(withRequest.requests[0].id);

      const after = await source.loadSnapshot();
      expect(after.requests).toHaveLength(0);
    });
  });
});
