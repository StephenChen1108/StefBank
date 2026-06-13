import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { LoginPanel } from "../LoginPanel";

describe("LoginPanel", () => {
  it("renders the login form", () => {
    render(<LoginPanel onLogin={vi.fn()} />);
    expect(screen.getByLabelText("账号")).toBeInTheDocument();
    expect(screen.getByLabelText("密码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /登录/i })).toBeInTheDocument();
  });

  it("updates input values on change", () => {
    render(<LoginPanel onLogin={vi.fn()} />);

    const accountInput = screen.getByLabelText("账号");
    const passwordInput = screen.getByLabelText("密码");

    fireEvent.change(accountInput, { target: { value: "admin" } });
    fireEvent.change(passwordInput, { target: { value: "secret" } });

    expect(accountInput).toHaveValue("admin");
    expect(passwordInput).toHaveValue("secret");
  });

  it("calls onLogin with credentials on submit", async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    render(<LoginPanel onLogin={onLogin} />);

    fireEvent.change(screen.getByLabelText("账号"), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "password123" } });
    fireEvent.submit(screen.getByRole("button", { name: /登录/i }).closest("form")!);

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith({ username: "admin", password: "password123" });
    });
  });

  it("shows error message when login fails", async () => {
    const onLogin = vi.fn().mockRejectedValue(new Error("密码错误"));
    render(<LoginPanel onLogin={onLogin} />);

    fireEvent.change(screen.getByLabelText("账号"), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "wrong" } });
    fireEvent.submit(screen.getByRole("button", { name: /登录/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("密码错误")).toBeInTheDocument();
    });
  });

  it("shows default error message for non-Error throws", async () => {
    const onLogin = vi.fn().mockRejectedValue("string error");
    render(<LoginPanel onLogin={onLogin} />);

    fireEvent.change(screen.getByLabelText("账号"), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "wrong" } });
    fireEvent.submit(screen.getByRole("button", { name: /登录/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("账号或密码不正确，请重新输入")).toBeInTheDocument();
    });
  });

  it("shows loading state during submission", async () => {
    let resolveLogin: () => void;
    const onLogin = vi.fn().mockImplementation(
      () => new Promise<void>((resolve) => { resolveLogin = resolve; }),
    );
    render(<LoginPanel onLogin={onLogin} />);

    fireEvent.change(screen.getByLabelText("账号"), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "pass" } });
    fireEvent.submit(screen.getByRole("button", { name: /登录/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("登录中...")).toBeInTheDocument();
    });

    // Button should be disabled during submission
    expect(screen.getByRole("button", { name: /登录中/i })).toBeDisabled();

    // Resolve the login
    await act(async () => { resolveLogin!(); });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^登录$/ })).not.toBeDisabled();
    });
  });

  it("clears error when user types in account field", async () => {
    const onLogin = vi.fn()
      .mockRejectedValueOnce(new Error("密码错误"))
      .mockResolvedValue(undefined);
    render(<LoginPanel onLogin={onLogin} />);

    // Trigger an error first
    fireEvent.change(screen.getByLabelText("账号"), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "wrong" } });
    fireEvent.submit(screen.getByRole("button", { name: /登录/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("密码错误")).toBeInTheDocument();
    });

    // Type in account field should clear error
    fireEvent.change(screen.getByLabelText("账号"), { target: { value: "a" } });

    expect(screen.queryByText("密码错误")).not.toBeInTheDocument();
  });
});
