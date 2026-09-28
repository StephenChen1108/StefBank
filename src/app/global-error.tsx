"use client";

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          background: "#FFF8F1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "32px 24px",
            maxWidth: 380,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#FCE8EA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 28,
            }}
          >
            🍒
          </div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#2F2F2F",
              marginBottom: 8,
            }}
          >
            车厘子银行出了点问题
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "#6D5553",
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            遇到了一个意外错误，请尝试重新加载页面。
          </p>
          <button
            type="button"
            onClick={unstable_retry}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 48,
              padding: "0 28px",
              borderRadius: 16,
              border: "none",
              background: "linear-gradient(135deg, #F46B7A 0%, #C9182B 100%)",
              color: "white",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 12px 22px rgba(201,24,43,0.18)",
            }}
          >
            重新加载
          </button>
        </div>
      </body>
    </html>
  );
}
