"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ArrowLeft, Heart } from "lucide-react";

type AboutScreenProps = {
  onClose: () => void;
};

/** Hand-drawn cute cherry SVG logo */
function CherryLogo({ size = 60 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Stems */}
      <path
        d="M60 18 C56 28, 42 38, 36 52"
        stroke="#5B8C3E"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M60 18 C64 28, 78 38, 84 52"
        stroke="#5B8C3E"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Leaf */}
      <ellipse cx="68" cy="22" rx="12" ry="6" fill="#7CB856" transform="rotate(-25 68 22)" />
      <path d="M60 20 Q68 22 76 20" stroke="#5B8C3E" strokeWidth="1.5" fill="none" />
      {/* Left cherry */}
      <circle cx="36" cy="72" r="26" fill="url(#cL)" />
      <ellipse cx="28" cy="62" rx="7" ry="5" fill="white" opacity="0.35" transform="rotate(-25 28 62)" />
      {/* Right cherry */}
      <circle cx="84" cy="72" r="26" fill="url(#cR)" />
      <ellipse cx="76" cy="62" rx="7" ry="5" fill="white" opacity="0.35" transform="rotate(-25 76 62)" />
      {/* Cute face on left cherry */}
      <circle cx="29" cy="74" r="2.5" fill="#3D1518" />
      <circle cx="41" cy="74" r="2.5" fill="#3D1518" />
      <path d="M32 80 Q35 84 38 80" stroke="#3D1518" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Blush */}
      <ellipse cx="23" cy="79" rx="4" ry="2.5" fill="#FF8FA3" opacity="0.5" />
      <ellipse cx="47" cy="79" rx="4" ry="2.5" fill="#FF8FA3" opacity="0.5" />
      <defs>
        <radialGradient id="cL" cx="0.35" cy="0.3" r="0.7">
          <stop offset="0%" stopColor="#FF6B7A" />
          <stop offset="100%" stopColor="#D93A4E" />
        </radialGradient>
        <radialGradient id="cR" cx="0.35" cy="0.3" r="0.7">
          <stop offset="0%" stopColor="#FF6B7A" />
          <stop offset="100%" stopColor="#D93A4E" />
        </radialGradient>
      </defs>
    </svg>
  );
}

const aboutSections = [
  { emoji: "🍒", title: "欢迎回来", text: "欢迎来到「车厘子银行存款系统」🥥\n这是只服务于全世界最笨、最会乱花钱的椰子水的私人小银行。" },
  { emoji: "🏦", title: "行长亲管", text: "本系统由车厘子行长亲自设计、监管、维护，主要业务：存款记录、取款申请、余额查看、流水查询。" },
  { emoji: "🛡️", title: "郑重承诺", text: "车厘子行长在此郑重宣布：本人恪尽职守，绝不贪污腐败，绝不做假账。" },
  { emoji: "💰", title: "申诉须知", text: "如对余额、流水有疑问，可向行长申诉。但行长拥有最终解释权，不许质疑、不许反驳、不许撒娇太久——除非真的很可爱。" },
];

export function AboutScreen({ onClose }: AboutScreenProps) {
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-about-item]",
        { autoAlpha: 0, y: 16, scale: 0.98 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          ease: "power2.out",
          stagger: 0.06,
          clearProps: "all",
        },
      );
    }, screenRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={screenRef} className="fixed inset-0 z-[80] overflow-hidden bg-[#FFF5F0]">
      <main className="mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-[calc(env(safe-area-inset-top)+14px)]">
        {/* Header */}
        <header data-about-item className="flex h-11 shrink-0 items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            aria-label="返回"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#E85D6F] shadow-[0_4px_14px_rgba(200,80,100,0.1)] transition active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <p className="text-[16px] font-bold leading-none text-[#2F2F2F]">关于我们</p>
          <span className="h-10 w-10" />
        </header>

        {/* Scrollable content */}
        <div className="no-scrollbar mt-2.5 flex min-h-0 flex-1 flex-col overflow-y-auto">
          {/* Hero card */}
          <section
            data-about-item
            className="relative flex flex-col items-center overflow-hidden rounded-[26px] bg-[linear-gradient(160deg,#FFE0E6_0%,#FFD0D9_35%,#FFC8D2_65%,#FFE4DE_100%)] px-5 pb-5 pt-4 shadow-[0_8px_28px_rgba(220,100,120,0.13)]"
          >
            {/* Scattered hearts */}
            <Heart size={13} className="absolute right-4 top-3 text-white/55" fill="currentColor" />
            <Heart size={8} className="absolute right-12 top-7 text-white/35" fill="currentColor" />
            <Heart size={10} className="absolute left-4 top-4 text-white/45" fill="currentColor" />
            <Heart size={7} className="absolute left-12 top-9 text-white/30" fill="currentColor" />

            {/* Logo circle */}
            <div className="flex h-[86px] w-[86px] items-center justify-center rounded-full bg-white/85 shadow-[0_6px_20px_rgba(200,80,100,0.16)] ring-4 ring-white/50">
              <CherryLogo size={56} />
            </div>

            {/* Title */}
            <h1 className="mt-2.5 text-[21px] font-extrabold text-[#D94A5C]">
              车厘子银行
            </h1>

            {/* Version pill */}
            <span className="mt-1.5 rounded-full bg-white/55 px-3 py-0.5 text-[11px] font-semibold text-[#D94A5C] backdrop-blur-sm">
              v1.2.2
            </span>
          </section>

          {/* Section cards */}
          <div className="mt-3 space-y-2.5">
            {aboutSections.map((section, index) => (
              <div
                key={index}
                data-about-item
                className="relative flex gap-3 rounded-[18px] bg-white px-3.5 py-3 shadow-[0_3px_14px_rgba(200,100,120,0.06)]"
              >
                {/* Corner heart on first card */}
                {index === 0 && (
                  <Heart
                    size={9}
                    className="absolute right-2.5 top-2.5 text-[#FFD4DC]"
                    fill="currentColor"
                  />
                )}
                {/* Emoji icon */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#FFE0E6_0%,#FFD4DC_100%)] text-[18px] leading-none">
                  {section.emoji}
                </div>
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold text-[#D94A5C]">{section.title}</p>
                  <p className="mt-0.5 whitespace-pre-line text-[12px] leading-[1.65] text-[#5A4A4A]">
                    {section.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Signature + Footer */}
          <div data-about-item className="mt-3 flex flex-col items-center pb-1">
            <div className="flex items-center gap-2 text-[#E85D6F]/30">
              <span className="h-px w-6 bg-[#E85D6F]/20" />
              <span className="text-[10px]">🍒</span>
              <span className="h-px w-6 bg-[#E85D6F]/20" />
            </div>
            <p className="mt-1.5 text-[12.5px] font-semibold text-[#D94A5C]">
              —— 车厘子行长 🍒
            </p>
            <p className="mt-2 text-[11px] text-[#B8A8A8]">
              Made with <Heart size={10} className="inline text-[#F46B7A]" fill="#F46B7A" /> by 车厘子行长
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
