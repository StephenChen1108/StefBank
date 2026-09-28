import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDialogAccessibility } from "../dialog-accessibility";

function TestDialog({ onClose }: { onClose: () => void }) {
  const dialogProps = useDialogAccessibility(onClose);
  return (
    <div {...dialogProps} aria-label="测试对话框">
      <button type="button">第一个</button>
      <button type="button">最后一个</button>
    </div>
  );
}

describe("useDialogAccessibility", () => {
  it("marks a modal dialog and closes it with Escape", () => {
    const onClose = vi.fn();
    render(<TestDialog onClose={onClose} />);

    const dialog = screen.getByRole("dialog", { name: "测试对话框" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("loops keyboard focus inside the dialog", () => {
    render(<TestDialog onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    const first = screen.getByRole("button", { name: "第一个" });
    const last = screen.getByRole("button", { name: "最后一个" });

    last.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(first).toHaveFocus();

    first.focus();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
  });
});
