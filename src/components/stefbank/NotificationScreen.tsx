"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ArrowLeft, Bell, BellOff, Check, Send } from "lucide-react";
import { getBankDataSource } from "@/lib/bank-data-source-factory";
import type { NotificationLog, UserSettings } from "@/lib/bank-data-source";

type NotificationScreenProps = {
  onClose: () => void;
};

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) {
    return "刚刚";
  }

  if (diffMin < 60) {
    return `${diffMin} 分钟前`;
  }

  const diffHour = Math.floor(diffMin / 60);

  if (diffHour < 24) {
    return `${diffHour} 小时前`;
  }

  const diffDay = Math.floor(diffHour / 24);

  if (diffDay < 7) {
    return `${diffDay} 天前`;
  }

  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

function typeLabel(type: string) {
  switch (type) {
    case "withdrawal_request":
      return "取款申请";
    case "deposit_confirmed":
      return "存款确认";
    case "test":
      return "测试推送";
    default:
      return "通知";
  }
}

function typeEmoji(type: string) {
  switch (type) {
    case "withdrawal_request":
      return "💸";
    case "deposit_confirmed":
      return "💰";
    case "test":
      return "🔔";
    default:
      return "📩";
  }
}

export function NotificationScreen({ onClose }: NotificationScreenProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const [deviceKey, setDeviceKey] = useState("");
  const [notifyWithdrawal, setNotifyWithdrawal] = useState(true);
  const [notifyDeposit, setNotifyDeposit] = useState(true);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-notification-screen-item]",
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

  const loadData = useCallback(async () => {
    setIsLoading(true);

    try {
      const ds = getBankDataSource();
      const [settings, notificationLogs] = await Promise.all([
        ds.getUserSettings(),
        ds.getNotificationLogs(),
      ]);

      setDeviceKey(settings.barkDeviceKey ?? "");
      setNotifyWithdrawal(settings.notifyWithdrawal ?? true);
      setNotifyDeposit(settings.notifyDeposit ?? true);
      setLogs(notificationLogs);
    } catch {
      setMessage("加载通知数据失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function saveDeviceKey() {
    try {
      await getBankDataSource().updateUserSettings({ barkDeviceKey: deviceKey.trim() });
      setMessage("Device Key 已保存");
    } catch {
      setMessage("保存失败");
    }
  }

  async function toggleWithdrawal() {
    const next = !notifyWithdrawal;
    setNotifyWithdrawal(next);

    try {
      await getBankDataSource().updateUserSettings({ notifyWithdrawal: next });
    } catch {
      setNotifyWithdrawal(!next);
      setMessage("保存失败");
    }
  }

  async function toggleDeposit() {
    const next = !notifyDeposit;
    setNotifyDeposit(next);

    try {
      await getBankDataSource().updateUserSettings({ notifyDeposit: next });
    } catch {
      setNotifyDeposit(!next);
      setMessage("保存失败");
    }
  }

  return (
    <div ref={screenRef} className="fixed inset-0 z-[80] overflow-hidden bg-[#FFF8F1]">
      <main className="mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden px-6 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+18px)]">
        <header data-notification-screen-item className="flex h-12 shrink-0 items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            aria-label="返回"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#C9182B] shadow-[0_6px_16px_rgba(160,80,80,0.08)] transition active:scale-95"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="text-center">
            <p className="text-[17px] font-bold leading-none text-[#2F2F2F]">通知设置</p>
          </div>
          <span className="h-11 w-11" />
        </header>

        <section
          data-notification-screen-item
          className="no-scrollbar mt-4 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[22px] border border-[rgba(201,24,43,0.06)] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(160,80,80,0.08)]"
        >
          {/* Bark 配置 */}
          <div data-notification-screen-item>
            <div className="mb-2 flex items-center gap-2">
              <Bell size={16} className="text-[#C9182B]" />
              <p className="text-[14px] font-semibold text-[#2F2F2F]">Bark 推送配置</p>
            </div>
            <p className="mb-2 text-[12px] text-[#8A8A8A]">
              输入你的 Bark Device Key，取款申请时会推送通知到你的手机
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={deviceKey}
                onChange={(e) => {
                  setDeviceKey(e.target.value);
                  setMessage("");
                }}
                placeholder="输入 Bark Device Key"
                className="h-[42px] min-w-0 flex-1 rounded-[14px] border border-[#EFE7E5] bg-white px-4 text-[14px] text-[#2F2F2F] outline-none placeholder:text-[#B9AEAC]"
              />
              <button
                type="button"
                onClick={saveDeviceKey}
                className="flex h-[42px] shrink-0 items-center justify-center gap-1 rounded-[14px] bg-[linear-gradient(135deg,#F46B7A_0%,#C9182B_100%)] px-4 text-[13px] font-semibold text-white shadow-[0_8px_16px_rgba(201,24,43,0.16)] transition active:scale-[0.98]"
              >
                <Check size={16} />
                保存
              </button>
            </div>
          </div>

          {/* 通知开关 */}
          <div data-notification-screen-item className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between rounded-[14px] bg-[#FFF8F1] px-4 py-3">
              <span className="text-[14px] font-medium text-[#2F2F2F]">💸 取款申请通知</span>
              <button
                type="button"
                onClick={toggleWithdrawal}
                className={`h-7 w-12 rounded-full transition ${
                  notifyWithdrawal ? "bg-[#C9182B]" : "bg-[#EFE7E5]"
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    notifyWithdrawal ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between rounded-[14px] bg-[#FFF8F1] px-4 py-3">
              <span className="text-[14px] font-medium text-[#2F2F2F]">💰 存款确认通知</span>
              <button
                type="button"
                onClick={toggleDeposit}
                className={`h-7 w-12 rounded-full transition ${
                  notifyDeposit ? "bg-[#C9182B]" : "bg-[#EFE7E5]"
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    notifyDeposit ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 通知历史 */}
          <div data-notification-screen-item className="mt-4">
            <div className="mb-2 flex items-center gap-2">
              <Send size={14} className="text-[#8A8A8A]" />
              <p className="text-[13px] font-medium text-[#4B3D3B]">通知历史</p>
            </div>

            {logs.length === 0 ? (
              <div className="flex flex-col items-center py-8">
                <BellOff size={32} className="text-[#D4C8C6]" />
                <p className="mt-2 text-[13px] text-[#8A8A8A]">还没有通知记录哦～</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 rounded-[14px] bg-[#FFF8F1] px-4 py-3"
                  >
                    <span className="mt-0.5 text-[16px]">{typeEmoji(log.type)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-[#2F2F2F]">{log.title}</p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            log.status === "sent"
                              ? "bg-[#EAF4EC] text-[#2E7D32]"
                              : "bg-[#FCE8EA] text-[#C9182B]"
                          }`}
                        >
                          {log.status === "sent" ? "已发送" : "失败"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[12px] text-[#6D5553] line-clamp-1">{log.body}</p>
                      <p className="mt-0.5 text-[11px] text-[#8A8A8A]">
                        {typeLabel(log.type)} · {formatTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="min-h-4 flex-1 shrink" />

          {/* 消息 */}
          {message ? (
            <p
              data-notification-screen-item
              className={`mt-3 shrink-0 rounded-[12px] px-3 py-1.5 text-center text-[13px] ${
                message.includes("已")
                  ? "bg-[#EAF4EC] text-[#2E7D32]"
                  : "bg-[#FCE8EA] text-[#C9182B]"
              }`}
            >
              {message}
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
