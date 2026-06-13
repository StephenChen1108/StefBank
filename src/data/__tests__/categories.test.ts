import { describe, expect, it } from "vitest";
import { ALL_CATEGORIES, EXPENSE_CATEGORIES } from "../categories";

describe("EXPENSE_CATEGORIES", () => {
  it("contains 6 expense categories", () => {
    expect(EXPENSE_CATEGORIES).toHaveLength(6);
  });

  it("contains expected categories", () => {
    expect([...EXPENSE_CATEGORIES]).toEqual(["购物", "吃饭", "学习", "交通", "应急", "其他"]);
  });
});

describe("ALL_CATEGORIES", () => {
  it("starts with 存款", () => {
    expect(ALL_CATEGORIES[0]).toBe("存款");
  });

  it("includes all expense categories", () => {
    const allSet = new Set(ALL_CATEGORIES);
    for (const cat of EXPENSE_CATEGORIES) {
      expect(allSet.has(cat)).toBe(true);
    }
  });

  it("has length = expense categories + 1", () => {
    expect(ALL_CATEGORIES).toHaveLength(EXPENSE_CATEGORIES.length + 1);
  });
});
