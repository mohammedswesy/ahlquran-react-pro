import * as React from "react"
import { cn } from "../../lib/cn"

type ModalProps = {
    open: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    footer?: React.ReactNode
    size?: "sm" | "md" | "lg"
}

export function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 grid place-items-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div
                dir="rtl"
                className={cn(
                    "relative z-10 w-[95vw] max-w-lg rounded-3xl border bg-white shadow-lg",
                    size === "sm" && "max-w-md",
                    size === "lg" && "max-w-2xl"
                )}
            >
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="font-bold">{title}</div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
                </div>
                <div className="p-4">{children}</div>
                {footer && <div className="p-4 border-t flex gap-2">{footer}</div>}
            </div>
        </div>
    )
}
