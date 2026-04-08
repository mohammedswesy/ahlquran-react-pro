import * as React from "react"
import { cn } from "../../lib/cn"

type ModalProps = {
    open: boolean
    onClose: () => void
    title?: string
    description?: string
    children: React.ReactNode
    footer?: React.ReactNode
    size?: "sm" | "md" | "lg"
}

export function Modal({ open, onClose, title, description, children, footer, size = "md" }: ModalProps) {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 grid place-items-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
            <div
                dir="rtl"
                className={cn(
                    "relative z-10 w-[95vw] max-w-lg rounded-3xl border bg-white/95 shadow-lg flex flex-col overflow-hidden",
                    size === "sm" && "max-w-md",
                    size === "lg" && "max-w-2xl"
                )}
                style={{ maxHeight: "85vh" }}
            >
                <div className="p-4 border-b flex items-center justify-between sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
                    <div>
                        <div className="font-bold">{title}</div>
                        {description ? <div className="text-xs text-gray-500 mt-1">{description}</div> : null}
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
                </div>
                <div
                    className="p-4 overflow-y-auto max-h-[70vh] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full"
                    style={{ scrollbarWidth: "thin" }}
                >
                    {children}
                </div>
                {footer && <div className="p-4 border-t flex gap-2 sticky bottom-0 bg-white/95 backdrop-blur-sm">{footer}</div>}
            </div>
        </div>
    )
}
