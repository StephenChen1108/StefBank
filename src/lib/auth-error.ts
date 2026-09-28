type AuthErrorLike = {
  code?: unknown;
  message?: unknown;
  name?: unknown;
  status?: unknown;
};

function readError(error: unknown): AuthErrorLike {
  return typeof error === "object" && error !== null ? (error as AuthErrorLike) : {};
}

export function toLoginError(error: unknown) {
  const details = readError(error);
  const code = typeof details.code === "string" ? details.code.toLowerCase() : "";
  const message = typeof details.message === "string" ? details.message.toLowerCase() : "";
  const name = typeof details.name === "string" ? details.name.toLowerCase() : "";

  if (details.status === 429 || code.includes("rate_limit")) {
    return new Error("登录尝试过于频繁，请稍后再试");
  }

  if (message.includes("supabase is not configured")) {
    return new Error("银行服务配置缺失，请联系管理员");
  }

  if (code === "user_banned" || code === "user_disabled") {
    return new Error("该账号当前无法登录，请联系管理员");
  }

  if (
    error instanceof TypeError ||
    name.includes("fetch") ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("enotfound")
  ) {
    return new Error("暂时无法连接银行服务，请稍后重试");
  }

  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return new Error("账号或密码不正确，请重新输入");
  }

  return new Error("登录服务暂时异常，请稍后重试");
}
