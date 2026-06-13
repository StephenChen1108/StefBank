import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Toast, type ToastItem } from "../Toast";

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Make requestAnimationFrame execute its callback immediately
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const makeItem = (overrides?: Partial<ToastItem>): ToastItem => ({
    id: 1,
    message: "测试消息",
    type: "success",
    ...overrides,
  });

  it("renders the message text", () => {
    render(<Toast item={makeItem()} onDismiss={() => {}} />);
    expect(screen.getByText("测试消息")).toBeInTheDocument();
  });

  it("renders success icon", () => {
    const { container } = render(<Toast item={makeItem({ type: "success" })} onDismiss={() => {}} />);
    expect(container.textContent).toContain("✓");
  });

  it("renders error icon", () => {
    const { container } = render(<Toast item={makeItem({ type: "error" })} onDismiss={() => {}} />);
    expect(container.textContent).toContain("✕");
  });

  it("renders info icon", () => {
    const { container } = render(<Toast item={makeItem({ type: "info" })} onDismiss={() => {}} />);
    expect(container.textContent).toContain("ℹ");
  });

  it("auto-dismisses after 3 seconds", () => {
    const onDismiss = vi.fn();
    render(<Toast item={makeItem()} onDismiss={onDismiss} />);

    // After 3s, the toast starts hiding (visible = false)
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // After another 300ms animation delay, onDismiss is called
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onDismiss).toHaveBeenCalledWith(1);
  });

  it("does not auto-dismiss before 3 seconds", () => {
    const onDismiss = vi.fn();
    render(<Toast item={makeItem()} onDismiss={onDismiss} />);

    act(() => {
      vi.advanceTimersByTime(2999);
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("manually dismisses on X button click", () => {
    const onDismiss = vi.fn();
    render(<Toast item={makeItem()} onDismiss={onDismiss} />);

    // Click the X button (it's the button element inside the toast)
    const dismissButton = screen.getByRole("button");
    fireEvent.click(dismissButton);

    // After click, 300ms animation delay before onDismiss
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onDismiss).toHaveBeenCalledWith(1);
  });
});
