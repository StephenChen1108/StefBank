"use client";

import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#FFF8F1] px-6">
      <div className="max-w-[380px] text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#FCE8EA] text-[28px]">
          🍒
        </div>
        <h1 className="mb-2 text-[20px] font-bold text-[#2F2F2F]">
          页面加载失败
        </h1>
        <p className="mb-6 text-[15px] leading-relaxed text-[#6D5553]">
          数据加载时出了点问题，请检查网络后重试。
        </p>
        <button
          type="button"
          onClick={unstable_retry}
          className="inline-flex h-[48px] items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#F46B7A_0%,#C9182B_100%)] px-7 text-[15px] font-semibold text-white shadow-[0_12px_22px_rgba(201,24,43,0.18)] transition active:scale-[0.98]"
        >
          重试
        </button>
      </div>
    </div>
  );
}
