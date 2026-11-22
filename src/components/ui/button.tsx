import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./feedback";

export const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-teal-600 text-white shadow-[inset_0_-1px_0_rgb(0_0_0/0.12),0_1px_2px_rgb(20_38_61/0.12)] hover:bg-teal-700",
        navy: "bg-navy-900 text-white shadow-sm hover:bg-navy-800",
        accent: "bg-amber-500 text-navy-950 shadow-[inset_0_-1px_0_rgb(0_0_0/0.1)] hover:bg-amber-600 hover:text-navy-950",
        secondary: "border border-line-strong bg-surface text-ink-strong shadow-xs hover:border-slate-ink/40 hover:bg-surface-2",
        ghost: "text-ink hover:bg-surface-3 hover:text-ink-strong",
        subtle: "bg-teal-50 text-teal-800 hover:bg-teal-100",
        danger: "bg-danger-600 text-white shadow-sm hover:bg-danger-700",
        "danger-outline": "border border-danger-600/40 bg-surface text-danger-700 hover:bg-danger-100",
        "outline-dark": "border border-white/25 text-white hover:border-white/50 hover:bg-white/5",
        link: "h-auto px-0 text-teal-700 underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 rounded-sm px-2.5 text-xs",
        sm: "h-8 rounded-md px-3 text-[0.8125rem]",
        md: "h-10 rounded-md px-4 text-sm",
        lg: "h-12 rounded-lg px-5 text-[0.9375rem]",
        icon: "size-9 rounded-md",
        "icon-sm": "size-8 rounded-md",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Spinner className="size-4" />}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";
