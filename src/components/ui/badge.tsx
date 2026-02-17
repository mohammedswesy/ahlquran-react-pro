import { cn } from "../../lib/cn"

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
    return (
        <span
            className={cn("inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700", className)}
            {...props}
        />
    )
}
