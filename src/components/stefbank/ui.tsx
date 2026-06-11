import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <section
      className={`rounded-[22px] border border-[rgba(201,24,43,0.06)] bg-white shadow-[0_8px_24px_rgba(160,80,80,0.08)] ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

export function FeatureCard({ children, className = "", ...props }: CardProps) {
  return (
    <section
      className={`feature-card relative overflow-hidden rounded-[22px] border border-[#F4C9CD] shadow-[0_10px_30px_rgba(201,24,43,0.08)] ${className}`}
      {...props}
    >
      <div className="relative z-10">{children}</div>
      <CherryMark />
    </section>
  );
}

export function CherryMark() {
  return (
    <span
      aria-hidden="true"
      className="absolute bottom-8 right-9 z-0 h-8 w-8 opacity-80"
    >
      <span className="absolute left-2 top-4 h-3.5 w-3.5 rounded-full bg-[#D94152]" />
      <span className="absolute left-5 top-4 h-3.5 w-3.5 rounded-full bg-[#D94152]" />
      <span className="absolute left-4 top-1 h-3 w-1 origin-bottom rotate-[-28deg] rounded-full bg-[#8AA070]" />
      <span className="absolute left-5 top-1 h-3 w-1 origin-bottom rotate-[28deg] rounded-full bg-[#8AA070]" />
    </span>
  );
}

type IconBadgeProps = {
  icon: LucideIcon;
  tone?: "red" | "green" | "soft" | "plain";
  size?: "sm" | "md" | "lg";
};

export function IconBadge({ icon: Icon, tone = "soft", size = "md" }: IconBadgeProps) {
  const toneClass = {
    red: "bg-[#FCE8EA] text-[#C9182B]",
    green: "bg-[#EAF4EC] text-[#2E7D32]",
    soft: "bg-[#FCE8EA] text-[#C9182B]",
    plain: "bg-white text-[#8A8A8A]",
  }[tone];

  const sizeClass = {
    sm: "h-10 w-10",
    md: "h-11 w-11",
    lg: "h-14 w-14",
  }[size];

  const iconSize = size === "lg" ? 25 : size === "md" ? 20 : 18;

  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full ${toneClass} ${sizeClass}`}>
      <Icon size={iconSize} strokeWidth={2.2} />
    </span>
  );
}

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  icon?: LucideIcon;
};

export function ActionButton({
  children,
  className = "",
  variant = "primary",
  icon: Icon,
  type = "button",
  ...props
}: ActionButtonProps) {
  const variantClass = {
    primary:
      "bg-[linear-gradient(135deg,#F46B7A_0%,#C9182B_100%)] text-white shadow-[0_12px_22px_rgba(201,24,43,0.18)]",
    secondary: "bg-[#FCE8EA] text-[#C9182B]",
    ghost: "bg-white text-[#C9182B]",
  }[variant];

  return (
    <button
      type={type}
      className={`inline-flex h-[50px] items-center justify-center gap-2 rounded-[18px] px-4 text-[15px] font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${variantClass} ${className}`}
      {...props}
    >
      {Icon ? <Icon size={20} strokeWidth={2.2} /> : null}
      {children}
    </button>
  );
}

type SegmentedControlProps<T extends string> = {
  items: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <div className={`grid gap-3 ${className}`} style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item) => {
        const selected = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={`h-[48px] rounded-[16px] text-[15px] font-semibold transition active:scale-[0.98] ${
              selected
                ? "bg-[linear-gradient(135deg,#F46B7A_0%,#C9182B_100%)] text-white shadow-[0_10px_18px_rgba(201,24,43,0.16)]"
                : "bg-white/80 text-[#6D5553]"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

