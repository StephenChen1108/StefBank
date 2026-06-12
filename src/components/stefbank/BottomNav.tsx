import { ClipboardList, Home, PenLine, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TabId, UserRole } from "@/data/bank-types";

type BottomNavProps = {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  role: UserRole;
};

const navItems = [
  { id: "home", label: "首页", icon: Home },
  { id: "transactions", label: "流水", icon: ClipboardList },
  { id: "requests", label: "申请", icon: PenLine },
  { id: "profile", label: "我的", icon: UserRound },
] satisfies { id: TabId; label: string; icon: LucideIcon }[];

export function BottomNav({ activeTab, onChange, role }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] rounded-t-[24px] border border-[#EFE7E5] bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 shadow-[0_-10px_30px_rgba(160,80,80,0.08)] backdrop-blur">
      <div className="grid grid-cols-4">
        {navItems.map((item) => {
          const selected = activeTab === item.id;
          const Icon = item.icon;
          const label = item.id === "requests" && role === "manager" ? "审批" : item.label;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              data-active-nav={selected}
              className={`flex h-14 flex-col items-center justify-center gap-1 rounded-[16px] text-[11px] font-medium transition active:scale-95 ${
                selected ? "text-[#C9182B]" : "text-[#999999]"
              }`}
              aria-current={selected ? "page" : undefined}
            >
              <Icon size={23} strokeWidth={selected ? 2.6 : 2.1} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
