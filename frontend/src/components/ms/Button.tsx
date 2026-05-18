import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  asChild?: never;
};

const base =
  "inline-flex items-center justify-center font-display tracking-wider uppercase transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-lime text-black hover:bg-lime-dark hover:scale-[1.02] active:scale-95 rounded-pill shadow-lime",
  ghost: "bg-transparent text-white hover:bg-white/10 rounded-pill",
  outline:
    "bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-pill",
  danger: "bg-danger text-white hover:bg-danger/90 rounded-pill",
  dark: "bg-charcoal text-white hover:bg-dark-gray rounded-pill border border-dark-gray",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-base",
  lg: "h-14 px-10 text-lg",
};

export const MSButton = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  ),
);
MSButton.displayName = "MSButton";
