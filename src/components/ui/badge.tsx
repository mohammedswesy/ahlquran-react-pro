import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
    {
        variants: {
            variant: {
                default: "bg-[var(--brand2)] text-[var(--brand)] border border-[var(--brand2)]",
                primary: "bg-[var(--brand)] text-white border border-[var(--brand)]",
                success: "bg-emerald-100 text-emerald-800 border border-emerald-200",
                warning: "bg-amber-100 text-amber-800 border border-amber-200",
                destructive: "bg-red-100 text-red-800 border border-red-200",
                outline: "border border-[var(--border)] text-[var(--text)]",
                secondary: "bg-slate-100 text-slate-800 border border-slate-200",
                muted: "bg-slate-50 text-slate-600 border border-slate-200",
            },
            size: {
                sm: "px-2 py-1 text-[10px]",
                md: "px-3 py-1.5 text-xs",
                lg: "px-4 py-2 text-sm",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "md",
        },
    }
)

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
    VariantProps<typeof badgeVariants> & {
        icon?: React.ReactNode
    }

export function Badge({ className, variant, size, icon, ...props }: BadgeProps) {
    return (
        <span
            className={cn(badgeVariants({ variant, size }), "flex items-center gap-1.5", className)}
            {...props}
        >
            {icon && <span className="flex items-center">{icon}</span>}
            <span>{props.children}</span>
        </span>
    )
}

// Status-specific badge variants
export const StatusBadge = {
    active: (props?: React.HTMLAttributes<HTMLSpanElement>) => (
        <Badge
            variant="success"
            className="border-emerald-200/80 bg-emerald-100/55 text-emerald-700 shadow-[0_0_16px_rgba(16,185,129,0.16)] backdrop-blur-sm"
            {...props}
        >
            نشط
        </Badge>
    ),
    inactive: (props?: React.HTMLAttributes<HTMLSpanElement>) => (
        <Badge variant="muted" {...props}>
            غير نشط
        </Badge>
    ),
    pending: (props?: React.HTMLAttributes<HTMLSpanElement>) => (
        <Badge
            variant="warning"
            className="border-amber-200/80 bg-amber-100/60 text-amber-700 shadow-[0_0_16px_rgba(245,158,11,0.16)] backdrop-blur-sm"
            {...props}
        >
            قيد الانتظار
        </Badge>
    ),
    suspended: (props?: React.HTMLAttributes<HTMLSpanElement>) => (
        <Badge variant="destructive" {...props}>
            موقوف
        </Badge>
    ),
    completed: (props?: React.HTMLAttributes<HTMLSpanElement>) => (
        <Badge variant="success" {...props}>
            مكتمل
        </Badge>
    ),
    cancelled: (props?: React.HTMLAttributes<HTMLSpanElement>) => (
        <Badge variant="destructive" {...props}>
            ملغى
        </Badge>
    ),
    paid: (props?: React.HTMLAttributes<HTMLSpanElement>) => (
        <Badge variant="success" {...props}>
            مدفوع
        </Badge>
    ),
    unpaid: (props?: React.HTMLAttributes<HTMLSpanElement>) => (
        <Badge variant="warning" {...props}>
            غير مدفوع
        </Badge>
    ),
    partial: (props?: React.HTMLAttributes<HTMLSpanElement>) => (
        <Badge variant="warning" {...props}>
            جزئي
        </Badge>
    ),
}
