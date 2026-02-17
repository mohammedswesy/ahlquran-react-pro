import type { ReactNode } from "react"
import { cn } from "@/lib/utils"


type Props = {
    title: ReactNode
    subtitle?: ReactNode
    actions?: ReactNode
    className?: string
}

export function PageHeader({ title, subtitle, actions, className }: Props) {
    return (
        <div dir="rtl" className={cn("mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
            <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#04110f] truncate">
                    {title}
                </div>
                {subtitle && <div className="mt-1 text-sm text-[rgba(2,8,7,.65)]">{subtitle}</div>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    )
}
