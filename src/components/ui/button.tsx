import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/cn"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed",
    {
        variants: {
            variant: {
                primary: "text-white bg-[var(--brand)] hover:bg-[#024a41] shadow-[var(--shadow2)]",
                outline: "border border-[var(--border)] bg-white/40 text-[var(--brand)] hover:bg-[rgba(0,61,53,.06)]",
                ghost: "bg-transparent text-[var(--brand)] hover:bg-[rgba(0,61,53,.06)]",
                destructive: "bg-red-600 text-white hover:bg-red-700",
            },
            size: {
                sm: "text-xs px-3 py-1.5",
                md: "text-sm px-4 py-2",
                lg: "text-base px-5 py-2.5",
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
