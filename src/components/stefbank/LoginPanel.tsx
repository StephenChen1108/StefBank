"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import { LockKeyhole, UserRound } from "lucide-react";
import { ActionButton } from "./ui";

type LoginPanelProps = {
  onLogin: (credentials: { username: string; password: string }) => Promise<void>;
  initialError?: string;
};

export function LoginPanel({ onLogin, initialError = "" }: LoginPanelProps) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onLogin({ username: account, password });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "账号或密码不正确，请重新输入");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#FFF8F1]">
      <main className="mx-auto flex min-h-dvh max-w-[430px] flex-col justify-center px-6 py-8">
        <div className="mb-7">
          <h1 className="relative mx-auto flex w-[260px] justify-center min-[390px]:w-[286px]">
            <span className="pointer-events-none absolute -left-12 bottom-[5px] z-10 min-[390px]:-left-14">
              <Image
                src="/person-white-outline.webp"
                alt=""
                width={144}
                height={281}
                priority
                unoptimized
                className="person-sway h-auto w-[108px] min-[390px]:w-[120px]"
              />
            </span>
            <Image
              src="/cherry-bank-logo-small.webp"
              alt="车厘子银行，你的专属储蓄助手"
              width={240}
              height={117}
              priority
              unoptimized
              className="relative z-0 h-auto w-[216px] min-[390px]:w-[240px]"
              sizes="(max-width: 389px) 216px, 240px"
            />
          </h1>
        </div>

        <form
          onSubmit={submitLogin}
          className="rounded-[22px] border border-[rgba(201,24,43,0.06)] bg-white p-5 shadow-[0_8px_24px_rgba(160,80,80,0.08)]"
        >
          <div>
            <label htmlFor="login-account" className="mb-2 block text-[15px] font-medium text-[#4B3D3B]">
              账号
            </label>
            <div className="flex h-[50px] items-center gap-3 rounded-[16px] border border-[#EFE7E5] bg-white px-4">
              <UserRound size={21} className="shrink-0 text-[#C9182B]" />
              <input
                id="login-account"
                value={account}
                onChange={(event) => {
                  setAccount(event.target.value);
                  setError("");
                }}
                placeholder="请输入你的账号"
                autoComplete="username"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-[#2F2F2F] outline-none placeholder:text-[#6D625F]"
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="login-password" className="mb-2 block text-[15px] font-medium text-[#4B3D3B]">
              密码
            </label>
            <div className="flex h-[50px] items-center gap-3 rounded-[16px] border border-[#EFE7E5] bg-white px-4">
              <LockKeyhole size={21} className="shrink-0 text-[#C9182B]" />
              <input
                id="login-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入你的密码"
                type="password"
                autoComplete="current-password"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-[#2F2F2F] outline-none placeholder:text-[#6D625F]"
              />
            </div>
          </div>

          {error || initialError ? (
            <p className="mt-4 rounded-[16px] bg-[#FCE8EA] px-4 py-3 text-[14px] text-[#C9182B]">
              {error || initialError}
            </p>
          ) : null}

          <ActionButton type="submit" className="mt-4 w-full" disabled={isSubmitting}>
            {isSubmitting ? "登录中..." : "登录"}
          </ActionButton>
        </form>
      </main>
    </div>
  );
}
