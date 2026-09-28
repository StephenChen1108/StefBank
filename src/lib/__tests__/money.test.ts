import { describe, expect, it } from "vitest";
import { isPositiveIntegerYuan, parsePositiveIntegerYuan } from "../money";

describe("parsePositiveIntegerYuan", () => {
  it("parses positive whole-yuan strings", () => {
    expect(parsePositiveIntegerYuan("1")).toBe(1);
    expect(parsePositiveIntegerYuan("2897")).toBe(2897);
    expect(parsePositiveIntegerYuan(" 100000 ")).toBe(100000);
  });

  it("rejects decimals and scientific notation", () => {
    expect(parsePositiveIntegerYuan("1.5")).toBeNull();
    expect(parsePositiveIntegerYuan("1.00")).toBeNull();
    expect(parsePositiveIntegerYuan("1e3")).toBeNull();
  });

  it("rejects empty, zero, negative, and non-numeric input", () => {
    expect(parsePositiveIntegerYuan("")).toBeNull();
    expect(parsePositiveIntegerYuan("   ")).toBeNull();
    expect(parsePositiveIntegerYuan("0")).toBeNull();
    expect(parsePositiveIntegerYuan("-1")).toBeNull();
    expect(parsePositiveIntegerYuan("NaN")).toBeNull();
    expect(parsePositiveIntegerYuan("Infinity")).toBeNull();
  });

  it("rejects values outside PostgreSQL integer range", () => {
    expect(parsePositiveIntegerYuan("2147483647")).toBe(2147483647);
    expect(parsePositiveIntegerYuan("2147483648")).toBeNull();
  });
});

describe("isPositiveIntegerYuan", () => {
  it("accepts positive safe PostgreSQL integers", () => {
    expect(isPositiveIntegerYuan(1)).toBe(true);
    expect(isPositiveIntegerYuan(2897)).toBe(true);
    expect(isPositiveIntegerYuan(2147483647)).toBe(true);
  });

  it("rejects invalid numeric values", () => {
    expect(isPositiveIntegerYuan(0)).toBe(false);
    expect(isPositiveIntegerYuan(-1)).toBe(false);
    expect(isPositiveIntegerYuan(1.5)).toBe(false);
    expect(isPositiveIntegerYuan(Number.NaN)).toBe(false);
    expect(isPositiveIntegerYuan(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isPositiveIntegerYuan(2147483648)).toBe(false);
    expect(isPositiveIntegerYuan("10")).toBe(false);
  });
});
