import Image from "next/image";
import { UserRound } from "lucide-react";
import type { UserProfile } from "@/data/bank-types";

type AppHeaderProps = {
  user: UserProfile;
  onProfileClick?: () => void;
};

export function AppHeader({ user, onProfileClick }: AppHeaderProps) {
  const shouldShowAvatar = Boolean(user.avatarUrl);
  const avatar = shouldShowAvatar ? (
    <Image
      src={user.avatarUrl as string}
      alt={`${user.name} 头像`}
      width={48}
      height={48}
      className="h-full w-full object-cover"
      priority
    />
  ) : <UserRound size={23} strokeWidth={2.2} />;

  return (
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[24px] font-bold leading-[1.18] text-[#C9182B] min-[390px]:text-[28px]">
          车厘子银行
        </h1>
        <p className="mt-1.5 text-[17px] leading-none text-[#7F625E]">你的专属储蓄助手</p>
      </div>
      {onProfileClick ? (
        <button type="button" onClick={onProfileClick} aria-label="打开我的页面" className="mt-1.5 inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FCE8EA] text-[#C9182B] transition active:scale-95">
          {avatar}
        </button>
      ) : (
        <span className="mt-1.5 inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FCE8EA] text-[#C9182B]">{avatar}</span>
      )}
    </header>
  );
}
