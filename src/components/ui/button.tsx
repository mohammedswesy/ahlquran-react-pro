import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/cn"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md",
    {
        variants: {
            variant: {
                primary: "text-white bg-[var(--brand)] hover:bg-[#024a41] shadow-[0_4px_12px_rgba(0,61,53,0.2)]",
                secondary: "text-white bg-[var(--brand2)] hover:bg-[#cbb88f] shadow-[0_4px_12px_rgba(220,203,160,0.2)]",
                outline: "border border-[var(--border)] bg-white/50 text-[var(--brand)] hover:bg-[rgba(0,61,53,.06)]",
                ghost: "bg-transparent text-[var(--brand)] hover:bg-[rgba(0,61,53,.06)]",
                destructive: "bg-red-600 text-white hover:bg-red-700 shadow-[0_4px_12px_rgba(220,38,38,0.2)]",
                subtle: "text-[var(--text)] bg-[var(--surface2)] hover:bg-[rgba(0,61,53,.08)]",
            },
            size: {
                sm: "text-xs px-3 py-1.5",
                md: "text-sm px-4 py-2",
                lg: "text-base px-6 py-3",
                xl: "text-lg px-8 py-3.5",
                icon: "h-10 w-10 p-0",
            },
        },
        defaultVariants: { variant: "primary", size: "md" },
    }
)

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof buttonVariants>

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => (
        <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    )
)
Button.displayName = "Button"
