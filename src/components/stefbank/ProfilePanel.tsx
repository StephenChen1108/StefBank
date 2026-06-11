import Image from "next/image";
import {
  Bell,
  ChartPie,
  ChevronRight,
  Cloud,
  CreditCard,
  Download,
  Info,
  Landmark,
  LogOut,
  ShieldCheck,
  Tag,
  Target,
} from "lucide-react";
import type { UserProfile } from "@/data/mock-bank";
import { roleLabel } from "@/lib/format";
import { Card } from "./ui";

type ProfilePanelProps = {
  user: UserProfile;
  onLogout: () => void;
  onOpenGoalEditor: () => void;
};

const settingGroups = [
  [
    { label: "账户与安全", icon: ShieldCheck },
    { label: "收款账户管理", icon: CreditCard },
    { label: "通知设置", icon: Bell },
  ],
  [
    { label: "预算管理", icon: ChartPie },
    { label: "标签管理", icon: Tag },
  ],
  [
    { label: "数据备份", icon: Cloud },
    { label: "导出账单", icon: Download },
    { label: "关于我们", icon: Info },
  ],
];

export function ProfilePanel({ user, onLogout, onOpenGoalEditor }: ProfilePanelProps) {
  return (
    <div className="space-y-4">
      <Card className="px-5 py-5" data-animate-item>
        <div className="grid grid-cols-[64px_1fr_auto] items-center gap-3">
          <div className="relative">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={`${user.name} 头像`}
                width={72}
                height={72}
                className="h-[64px] w-[64px] rounded-full object-cover"
                priority
              />
            ) : (
              <div className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#FFE3E6_0%,#F7C5CB_100%)] text-[21px] font-bold text-[#C9182B]">
                St
              </div>
            )}
            <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(160,80,80,0.12)]">
              <span className="h-4 w-4 rounded-full bg-[#F46B7A]" />
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[24px] font-bold leading-none text-[#111111]">Hi, {user.name}</p>
            <p className="mt-4 text-[15px] leading-6 text-[#7A6A68]">
              欢迎回来，今天也一起守护小金库。
            </p>
          </div>
          <ChevronRight size={24} className="text-[#8A8A8A]" />
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-[16px] bg-[#FFF3F4] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#FCE8EA] text-[#C9182B]">
                <Landmark size={21} />
              </span>
              <span className="text-[15px] font-medium text-[#2F2F2F]">{roleLabel(user.role)}</span>
            </div>
            <span className="h-10 shrink-0 rounded-full bg-[#FCE8EA] px-4 pt-[9px] text-[14px] font-semibold text-[#C9182B]">
              已登录
            </span>
          </div>
          </div>
      </Card>

      <Card className="px-5 py-4" data-animate-item>
        {user.role === "depositor" ? (
          <>
            <button
              type="button"
              onClick={onOpenGoalEditor}
              className="flex h-[56px] w-full items-center gap-3 text-left transition active:scale-[0.99]"
            >
              <Target size={23} strokeWidth={1.9} className="shrink-0 text-[#2F2F2F]" />
              <span className="min-w-0 flex-1 text-[15px] font-medium text-[#2F2F2F]">存款目标管理</span>
              <ChevronRight size={20} className="text-[#8A8A8A]" />
            </button>
            <div className="h-px bg-[#EFE7E5]" />
          </>
        ) : null}

        {settingGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {group.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  className="flex h-[56px] w-full items-center gap-3 text-left transition active:scale-[0.99]"
                >
                  <Icon size={23} strokeWidth={1.9} className="shrink-0 text-[#2F2F2F]" />
                  <span className="min-w-0 flex-1 text-[15px] font-medium text-[#2F2F2F]">{item.label}</span>
                  <ChevronRight size={20} className="text-[#8A8A8A]" />
                </button>
              );
            })}
            {groupIndex < settingGroups.length - 1 ? <div className="h-px bg-[#EFE7E5]" /> : null}
          </div>
        ))}
      </Card>

      <section data-animate-item className="relative overflow-hidden rounded-[22px] border border-[rgba(201,24,43,0.06)] bg-[linear-gradient(135deg,#FCE8EA_0%,#FFFFFF_100%)] px-5 py-4 shadow-[0_8px_24px_rgba(160,80,80,0.08)]">
        <div className="max-w-[68%]">
          <h2 className="text-[18px] font-bold text-[#C9182B]">StefBank 存款小贴士</h2>
          <p className="mt-3 text-[15px] leading-6 text-[#6D5553]">
            小金库会因为彼此的信任而越来越满哦～
          </p>
        </div>
        <div className="absolute right-5 top-1/2 flex h-20 w-20 -translate-y-1/2 items-center justify-center rounded-[22px] bg-[#F9C8CE] text-[#C9182B] shadow-[0_10px_24px_rgba(201,24,43,0.12)]">
          <Landmark size={38} strokeWidth={1.8} />
        </div>
        <ChevronRight className="absolute right-5 top-1/2 translate-y-[42px] text-[#8A8A8A]" size={18} />
      </section>

      <button
        type="button"
        onClick={onLogout}
        data-animate-item
        className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[16px] border border-[rgba(201,24,43,0.06)] bg-white text-[15px] font-semibold text-[#C9182B] shadow-[0_8px_24px_rgba(160,80,80,0.08)] transition active:scale-[0.98]"
      >
        <LogOut size={21} />
        退出登录
      </button>
    </div>
  );
}
