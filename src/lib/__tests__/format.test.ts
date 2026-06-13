import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  requestLabel,
  roleLabel,
  signedAmount,
  statusLabel,
  statusTone,
  transactionLabel,
} from "../format";

describe("formatCurrency", () => {
  it("formats amount as CNY with zh-CN locale", () => {
    const result = formatCurrency(3300);
    expect(result).toContain("3,300");
  });

  it("formats zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });

  it("formats with no decimal places", () => {
    const result = formatCurrency(1234);
    expect(result).not.toContain(".");
  });
});

describe("signedAmount", () => {
  it("prefixes deposit with +", () => {
    const result = signedAmount({ type: "deposit", amount: 5000 });
    expect(result).toMatch(/^\+/);
    expect(result).toContain("5,000");
  });

  it("prefixes withdraw with -", () => {
    const result = signedAmount({ type: "withdraw", amount: 3000 });
    expect(result).toMatch(/^-/);
    expect(result).toContain("3,000");
  });
});

describe("transactionLabel", () => {
  it("returns 存入 for deposit", () => {
    expect(transactionLabel("deposit")).toBe("存入");
  });

  it("returns 取出 for withdraw", () => {
    expect(transactionLabel("withdraw")).toBe("取出");
  });
});

describe("requestLabel", () => {
  it("returns 取款申请 for withdraw", () => {
    expect(requestLabel("withdraw")).toBe("取款申请");
  });

  it("returns 存款记录 for deposit", () => {
    expect(requestLabel("deposit")).toBe("存款记录");
  });
});

describe("roleLabel", () => {
  it("returns manager label", () => {
    expect(roleLabel("manager")).toBe("你是本银行的行长");
  });

  it("returns depositor label", () => {
    expect(roleLabel("depositor")).toBe("你是本银行的储户");
  });
});

describe("statusLabel", () => {
  it("maps all statuses to Chinese labels", () => {
    expect(statusLabel("pending")).toBe("待审批");
    expect(statusLabel("approved")).toBe("已批准");
    expect(statusLabel("completed")).toBe("已完成");
    expect(statusLabel("rejected")).toBe("已驳回");
  });
});

describe("statusTone", () => {
  it("returns correct Tailwind classes for each status", () => {
    expect(statusTone("pending")).toContain("bg-[#FFF2DA]");
    expect(statusTone("approved")).toContain("bg-[#FCE8EA]");
    expect(statusTone("completed")).toContain("bg-[#EAF4EC]");
    expect(statusTone("rejected")).toContain("bg-[#FCE8EA]");
  });

  it("pending and approved have different text colors", () => {
    expect(statusTone("pending")).toContain("text-[#C47B1E]");
    expect(statusTone("approved")).toContain("text-[#C9182B]");
  });
});
