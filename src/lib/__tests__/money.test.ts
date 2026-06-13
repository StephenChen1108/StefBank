import { describe, expect, it } from "vitest";
import { centsToYuan, formatCentsAsYuan, isValidYuanInput, yuanToCents } from "../money";

describe("centsToYuan", () => {
  it("converts cents to yuan", () => {
    expect(centsToYuan(330000)).toBe(3300);
  });

  it("handles zero", () => {
    expect(centsToYuan(0)).toBe(0);
  });

  it("handles small values", () => {
    expect(centsToYuan(1)).toBe(0.01);
    expect(centsToYuan(99)).toBe(0.99);
  });

  it("handles negative values", () => {
    expect(centsToYuan(-5000)).toBe(-50);
  });
});

describe("yuanToCents", () => {
  it("converts valid yuan string to cents", () => {
    expect(yuanToCents("10")).toBe(1000);
    expect(yuanToCents("10.5")).toBe(1050);
    expect(yuanToCents("10.50")).toBe(1050);
    expect(yuanToCents("0.01")).toBe(1);
  });

  it("returns null for empty string", () => {
    expect(yuanToCents("")).toBeNull();
    expect(yuanToCents("   ")).toBeNull();
  });

  it("returns null for zero or negative", () => {
    expect(yuanToCents("0")).toBeNull();
    expect(yuanToCents("-10")).toBeNull();
    expect(yuanToCents("-0.01")).toBeNull();
  });

  it("returns null for non-finite numbers", () => {
    expect(yuanToCents("abc")).toBeNull();
    expect(yuanToCents("NaN")).toBeNull();
    expect(yuanToCents("Infinity")).toBeNull();
  });

  it("rounds to integer cents", () => {
    // 1.005 * 100 = 100.49999... due to floating point, so Math.round gives 100
    expect(yuanToCents("1.005")).toBe(100);
    expect(yuanToCents("1.004")).toBe(100);
    expect(yuanToCents("1.01")).toBe(101);
  });
});

describe("isValidYuanInput", () => {
  it("accepts valid positive amounts", () => {
    expect(isValidYuanInput("10")).toBe(true);
    expect(isValidYuanInput("10.5")).toBe(true);
    expect(isValidYuanInput("10.50")).toBe(true);
    expect(isValidYuanInput("0.01")).toBe(true);
    expect(isValidYuanInput("100000")).toBe(true);
  });

  it("rejects amounts with more than 2 decimal places", () => {
    expect(isValidYuanInput("10.501")).toBe(false);
    expect(isValidYuanInput("10.123")).toBe(false);
    expect(isValidYuanInput("0.001")).toBe(false);
  });

  it("rejects empty or whitespace", () => {
    expect(isValidYuanInput("")).toBe(false);
    expect(isValidYuanInput("   ")).toBe(false);
  });

  it("rejects zero or negative", () => {
    expect(isValidYuanInput("0")).toBe(false);
    expect(isValidYuanInput("-10")).toBe(false);
    expect(isValidYuanInput("0.00")).toBe(false);
  });

  it("rejects non-numeric", () => {
    expect(isValidYuanInput("abc")).toBe(false);
    expect(isValidYuanInput("NaN")).toBe(false);
    expect(isValidYuanInput("Infinity")).toBe(false);
  });
});

describe("formatCentsAsYuan", () => {
  it("formats cents as yuan with zh-CN locale", () => {
    expect(formatCentsAsYuan(330000)).toBe("3,300");
  });

  it("formats zero", () => {
    expect(formatCentsAsYuan(0)).toBe("0");
  });

  it("formats small values with decimals", () => {
    expect(formatCentsAsYuan(1)).toBe("0.01");
    expect(formatCentsAsYuan(99)).toBe("0.99");
  });

  it("formats large values with thousand separators", () => {
    expect(formatCentsAsYuan(10000000)).toBe("100,000");
  });
});
