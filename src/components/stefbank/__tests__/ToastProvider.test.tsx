import { describe, expect, it, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ToastProvider, useToast } from "../ToastProvider";

// Helper component to access toast context in tests
function ToastConsumer() {
  const toast = useToast();
  return (
    <div>
      <button onClick={() => toast.success("成功消息")}>Success</button>
      <button onClick={() => toast.error("错误消息")}>Error</button>
      <button onClick={() => toast.info("提示消息")}>Info</button>
    </div>
  );
}

describe("useToast", () => {
  it("throws when used outside ToastProvider", () => {
    // Suppress console.error for expected error
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      render(<ToastConsumer />);
    }).toThrow("useToast must be used within a ToastProvider");
    spy.mockRestore();
  });
});

describe("ToastProvider", () => {
  it("renders children", () => {
    render(
      <ToastProvider>
        <div>Child Content</div>
      </ToastProvider>,
    );
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("does not show toasts initially", () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>,
    );
    expect(screen.queryByText("成功消息")).not.toBeInTheDocument();
  });

  it("adds a success toast", () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText("Success").click();
    });

    expect(screen.getByText("成功消息")).toBeInTheDocument();
  });

  it("adds an error toast", () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText("Error").click();
    });

    expect(screen.getByText("错误消息")).toBeInTheDocument();
  });

  it("adds an info toast", () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText("Info").click();
    });

    expect(screen.getByText("提示消息")).toBeInTheDocument();
  });

  it("supports multiple toasts simultaneously", () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText("Success").click();
    });
    act(() => {
      screen.getByText("Error").click();
    });

    expect(screen.getByText("成功消息")).toBeInTheDocument();
    expect(screen.getByText("错误消息")).toBeInTheDocument();
  });
});
