"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ArrowLeft } from "lucide-react";

type SavingsTipsScreenProps = {
  onClose: () => void;
};

const tips = [
  {
    emoji: "🍒",
    title: "先看看余额",
    content: "每次想冲动消费的时候，先打开车厘子银行看看余额",
  },
  {
    emoji: "💰",
    title: "设定小目标",
    content: "设定一个小目标，比如这个月少花 200 块奶茶钱",
  },
  {
    emoji: "📝",
    title: "记账的意义",
    content: "记账不是为了限制自己，是为了更了解自己的生活",
  },
  {
    emoji: "🎯",
    title: "拆解大目标",
    content: "把大目标拆成小目标，每达成一个就奖励自己一杯奶茶",
  },
  {
    emoji: "🏦",
    title: "安全第一",
    content: "钱存在我这里比存在你那里安全多了（大概）",
  },
  {
    emoji: "💪",
    title: "存钱的真谛",
    content: "存钱最难的不是赚更多，而是花更少",
  },
  {
    emoji: "🌟",
    title: "未来的种子",
    content: "每一分钱都是我们未来的种子",
  },
  {
    emoji: "🍒",
    title: "永远营业",
    content: "车厘子银行，永远为你营业",
  },
];

const gradients = [
  "from-[#FCE8EA] to-[#FFFFFF]",
  "from-[#E8F4FD] to-[#FFFFFF]",
  "from-[#EAF4EC] to-[#FFFFFF]",
  "from-[#FFF2DA] to-[#FFFFFF]",
  "from-[#FFF0F5] to-[#FFFFFF]",
  "from-[#FCE8EA] to-[#FFFFFF]",
  "from-[#E8F4FD] to-[#FFFFFF]",
  "from-[#EAF4EC] to-[#FFFFFF]",
];

export function SavingsTipsScreen({ onClose }: SavingsTipsScreenProps) {
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-tips-screen-item]",
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

  return (
    <div ref={screenRef} className="fixed inset-0 z-[80] overflow-hidden bg-[#FFF8F1]">
      <main className="mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden px-6 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+18px)]">
        <header data-tips-screen-item className="flex h-12 shrink-0 items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            aria-label="返回"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#C9182B] shadow-[0_6px_16px_rgba(160,80,80,0.08)] transition active:scale-95"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="text-center">
            <p className="text-[17px] font-bold leading-none text-[#2F2F2F]">存款小贴士</p>
          </div>
          <span className="h-11 w-11" />
        </header>

        <section
          data-tips-screen-item
          className="no-scrollbar mt-4 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[22px] border border-[rgba(201,24,43,0.06)] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(160,80,80,0.08)]"
        >
          <div className="space-y-3">
            {tips.map((tip, index) => (
              <div
                key={index}
                data-tips-screen-item
                className={`rounded-[18px] border border-[rgba(201,24,43,0.04)] bg-gradient-to-br ${gradients[index]} px-4 py-4`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-[24px] leading-none">{tip.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-[#2F2F2F]">{tip.title}</p>
                    <p className="mt-1 text-[14px] leading-relaxed text-[#6D5553]">
                      {tip.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
