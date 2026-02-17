// src/components/ui/empty-state.tsx
import { Button } from "./button"
import { cn } from "@/lib/utils"
import { Inbox } from "lucide-react"

type Props = {
    title?: string
    desc?: string
    className?: string
    actionLabel?: string
    onAction?: () => void
    icon?: React.ElementType
}

export default function EmptyState({
    title = "لا توجد بيانات",
    desc = "ابدأ بإضافة أول سجل.",
    className,
    actionLabel,
    onAction,
    icon: Icon = Inbox,
}: Props) {
    return (
        <div className={cn("rounded-xl border py-12 px-6 text-center grid place-items-center gap-3 bg-white", className)}>
            <Icon className="opacity-70" size={36} />
            <div className="text-lg font-semibold">{title}</div>
            <div className="text-sm text-gray-600">{desc}</div>
            {actionLabel && onAction && (
                <Button className="mt-2" onClick={onAction}>{actionLabel}</Button>
            )}
        </div>
    )
}
