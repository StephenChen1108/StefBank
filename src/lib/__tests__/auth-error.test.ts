import { describe, expect, it } from "vitest";
import { toLoginError } from "../auth-error";

describe("toLoginError", () => {
  it("keeps invalid credentials generic", () => {
    expect(
      toLoginError({ code: "invalid_credentials", message: "Invalid login credentials" }).message,
    ).toBe("账号或密码不正确，请重新输入");
  });

  it("identifies network failures", () => {
    expect(toLoginError(new TypeError("fetch failed")).message).toBe(
      "暂时无法连接银行服务，请稍后重试",
    );
  });

  it("identifies missing service configuration", () => {
    expect(toLoginError(new Error("Supabase is not configured.")).message).toBe(
      "银行服务配置缺失，请联系管理员",
    );
  });

  it("identifies rate limiting", () => {
    expect(toLoginError({ status: 429, code: "over_request_rate_limit" }).message).toBe(
      "登录尝试过于频繁，请稍后再试",
    );
  });

  it("identifies disabled accounts without exposing account existence", () => {
    expect(toLoginError({ code: "user_banned" }).message).toBe(
      "该账号当前无法登录，请联系管理员",
    );
  });

  it("uses a safe service error for unknown failures", () => {
    expect(toLoginError({ message: "unexpected provider detail" }).message).toBe(
      "登录服务暂时异常，请稍后重试",
    );
  });
});
