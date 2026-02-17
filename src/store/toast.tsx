import { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ToastKind = 'success' | 'error' | 'info'
type Toast = { id: string; message: string; kind: ToastKind }
type Ctx = {
    show: (message: string, kind?: ToastKind, timeoutMs?: number) => void
}
const ToastCtx = createContext<Ctx | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const show = useCallback((message: string, kind: ToastKind = 'info', timeoutMs = 3000) => {
        const id = crypto.randomUUID?.() ?? String(Date.now() + Math.random())
        const t: Toast = { id, message, kind }
        setToasts((prev) => [...prev, t])
        setTimeout(() => {
            setToasts((prev) => prev.filter((x) => x.id !== id))
        }, timeoutMs)
    }, [])

    const value = useMemo(() => ({ show }), [show])

    return (
        <ToastCtx.Provider value={value}>
            {children}
            {/* الحاوية المثبتة للرسائل (RTL) */}
            <div dir="rtl" className="fixed top-16 right-4 z-[9999] space-y-2">
                {toasts.map((t) => {
                    const base = 'min-w-[240px] max-w-[360px] rounded-xl px-4 py-3 text-sm shadow border bg-white'
                    const tone =
                        t.kind === 'success'
                            ? 'border-green-200 text-green-800'
                            : t.kind === 'error'
                                ? 'border-red-200 text-red-800'
                                : 'border-sky-200 text-sky-800'
                    return (
                        <div key={t.id} className={`${base} ${tone}`}>{t.message}</div>
                    )
                })}
            </div>
        </ToastCtx.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastCtx)
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
    return ctx
}
