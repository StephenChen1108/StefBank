"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ArrowLeft, LogOut, ShieldCheck, User } from "lucide-react";
import type { UserProfile } from "@/data/bank-types";
import { roleLabel } from "@/lib/format";
import { getBankDataSource } from "@/lib/bank-data-source-factory";

type AccountSecurityScreenProps = {
  user: UserProfile;
  onLogout: () => void;
  onClose: () => void;
};

export function AccountSecurityScreen({ user, onLogout, onClose }: AccountSecurityScreenProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-account-screen-item]",
        { autoAlpha: 0, y: 18, scale: 0.985 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.42,
          ease: "power2.out",
          stagger: 0.055,
          clearProps: "all",
        },
      );
    }, screenRef);

    return () => ctx.revert();
  }, []);

  async function handleChangePassword() {
    if (isSubmitting) {
      return;
    }

    if (!currentPassword) {
      setMessage("请输入当前密码");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setMessage("新密码至少 6 位");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("两次输入的新密码不一致");
      return;
    }

    setIsSubmitting(true);

    try {
      await getBankDataSource().changePassword(currentPassword, newPassword);
      setMessage("密码修改成功");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "密码修改失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div ref={screenRef} className="fixed inset-0 z-[80] overflow-hidden bg-[#FFF8F1]">
      <main className="mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden px-6 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+18px)]">
        <header data-account-screen-item className="flex h-12 shrink-0 items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            aria-label="返回"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#C9182B] shadow-[0_6px_16px_rgba(160,80,80,0.08)] transition active:scale-95"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="text-center">
            <p className="text-[17px] font-bold leading-none text-[#2F2F2F]">账户与安全</p>
          </div>
          <span className="h-11 w-11" />
        </header>

        <section
          data-account-screen-item
          className="no-scrollbar mt-4 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[22px] border border-[rgba(201,24,43,0.06)] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(160,80,80,0.08)]"
        >
          {/* 用户信息 */}
          <div data-account-screen-item className="flex items-center gap-4 rounded-[18px] bg-[#FFF8F1] px-4 py-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#FFE3E6_0%,#F7C5CB_100%)] text-[18px] font-bold text-[#C9182B]">
              {user.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-bold text-[#2F2F2F]">{user.name}</p>
              <p className="mt-1 text-[13px] text-[#8A8A8A]">@{user.username}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#FCE8EA] px-3 py-1 text-[12px] font-semibold text-[#C9182B]">
              {roleLabel(user.role).replace("你是本银行的", "")}
            </span>
          </div>

          {/* 修改密码 */}
          <div data-account-screen-item className="mt-5">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#C9182B]" />
              <p className="text-[14px] font-semibold text-[#2F2F2F]">修改密码</p>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-[#4B3D3B]">当前密码</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setMessage("");
                  }}
                  placeholder="输入当前密码"
                  className="h-[42px] w-full rounded-[14px] border border-[#EFE7E5] bg-white px-4 text-[14px] text-[#2F2F2F] outline-none placeholder:text-[#B9AEAC]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-[#4B3D3B]">新密码</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setMessage("");
                  }}
                  placeholder="至少 6 位"
                  className="h-[42px] w-full rounded-[14px] border border-[#EFE7E5] bg-white px-4 text-[14px] text-[#2F2F2F] outline-none placeholder:text-[#B9AEAC]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-[#4B3D3B]">确认新密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setMessage("");
                  }}
                  placeholder="再输入一次新密码"
                  className="h-[42px] w-full rounded-[14px] border border-[#EFE7E5] bg-white px-4 text-[14px] text-[#2F2F2F] outline-none placeholder:text-[#B9AEAC]"
                />
              </div>
            </div>

            {message ? (
              <p
                className={`mt-2 rounded-[12px] px-3 py-1.5 text-center text-[13px] ${
                  message.includes("成功")
                    ? "bg-[#EAF4EC] text-[#2E7D32]"
                    : "bg-[#FCE8EA] text-[#C9182B]"
                }`}
              >
                {message}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleChangePassword}
              disabled={isSubmitting}
              data-account-screen-item
              className="mt-3 flex h-[44px] w-full items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#F46B7A_0%,#C9182B_100%)] text-[14px] font-semibold text-white shadow-[0_10px_18px_rgba(201,24,43,0.16)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "修改中..." : "确认修改"}
            </button>
          </div>

          {/* Spacer */}
          <div className="min-h-4 flex-1 shrink" />

          {/* 退出登录 */}
          <button
            type="button"
            onClick={() => {
              onLogout();
              onClose();
            }}
            data-account-screen-item
            className="mt-4 flex h-[44px] shrink-0 items-center justify-center gap-2 rounded-[14px] border border-[rgba(201,24,43,0.12)] bg-white text-[14px] font-semibold text-[#C9182B] transition active:scale-[0.98]"
          >
            <LogOut size={18} />
            退出登录
          </button>
        </section>
      </main>
    </div>
  );
}
