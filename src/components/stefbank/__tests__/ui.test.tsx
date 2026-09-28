import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Plane, Car } from "lucide-react";
import { Card, IconBadge, ActionButton, SegmentedControl } from "../ui";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Test Content</Card>);
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders as a section element", () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.querySelector("section")).toBeInTheDocument();
  });

  it("passes through extra HTML attributes", () => {
    const { container } = render(<Card data-testid="my-card">Content</Card>);
    expect(container.firstChild).toHaveAttribute("data-testid", "my-card");
  });
});

describe("IconBadge", () => {
  it("renders the provided icon", () => {
    const { container } = render(<IconBadge icon={Plane} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies default soft tone and md size", () => {
    const { container } = render(<IconBadge icon={Plane} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-[#FCE8EA]");
    expect(badge.className).toContain("h-11");
  });

  it("applies red tone", () => {
    const { container } = render(<IconBadge icon={Plane} tone="red" />);
    expect((container.firstChild as HTMLElement).className).toContain("bg-[#FCE8EA]");
  });

  it("applies green tone", () => {
    const { container } = render(<IconBadge icon={Plane} tone="green" />);
    expect((container.firstChild as HTMLElement).className).toContain("bg-[#EAF4EC]");
  });

  it("applies plain tone", () => {
    const { container } = render(<IconBadge icon={Plane} tone="plain" />);
    expect((container.firstChild as HTMLElement).className).toContain("bg-white");
  });

  it("applies sm size", () => {
    const { container } = render(<IconBadge icon={Plane} size="sm" />);
    expect((container.firstChild as HTMLElement).className).toContain("h-10");
  });

  it("applies lg size", () => {
    const { container } = render(<IconBadge icon={Plane} size="lg" />);
    expect((container.firstChild as HTMLElement).className).toContain("h-14");
  });
});

describe("ActionButton", () => {
  it("renders children text", () => {
    render(<ActionButton>Click Me</ActionButton>);
    expect(screen.getByText("Click Me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<ActionButton onClick={onClick}>Click</ActionButton>);
    fireEvent.click(screen.getByText("Click"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();
    render(<ActionButton onClick={onClick} disabled>Click</ActionButton>);
    fireEvent.click(screen.getByText("Click"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders icon when provided", () => {
    const { container } = render(<ActionButton icon={Car}>Text</ActionButton>);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("has type=button by default", () => {
    render(<ActionButton>Click</ActionButton>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("applies primary variant by default", () => {
    render(<ActionButton>Click</ActionButton>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("linear-gradient");
  });

  it("applies secondary variant", () => {
    render(<ActionButton variant="secondary">Click</ActionButton>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-[#FCE8EA]");
  });

  it("applies ghost variant", () => {
    render(<ActionButton variant="ghost">Click</ActionButton>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-white");
  });
});

describe("SegmentedControl", () => {
  const items = [
    { value: "a", label: "Alpha" },
    { value: "b", label: "Beta" },
    { value: "c", label: "Gamma" },
  ];

  it("renders all items", () => {
    render(<SegmentedControl items={items} value="a" onChange={() => {}} />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("Gamma")).toBeInTheDocument();
  });

  it("calls onChange when an item is clicked", () => {
    const onChange = vi.fn();
    render(<SegmentedControl items={items} value="a" onChange={onChange} />);
    fireEvent.click(screen.getByText("Beta"));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("highlights the selected item with gradient", () => {
    render(<SegmentedControl items={items} value="b" onChange={() => {}} />);
    const betaButton = screen.getByText("Beta");
    expect(betaButton.className).toContain("linear-gradient");
  });

  it("does not highlight unselected items", () => {
    render(<SegmentedControl items={items} value="a" onChange={() => {}} />);
    const betaButton = screen.getByText("Beta");
    expect(betaButton.className).not.toContain("linear-gradient");
  });
});
