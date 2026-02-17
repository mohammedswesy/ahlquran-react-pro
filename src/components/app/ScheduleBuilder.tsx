import React from "react"
import { cn } from "@/lib/utils"

export type DayKey = "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri"

export type Schedule = {
    days: DayKey[]
    // Backward compatible fields (older schedule JSON)
    from?: string // "HH:mm"
    to?: string   // "HH:mm"

    // New richer format (UI will write this). Backend can store JSON as-is.
    // We also keep (from/to) updated to the first slot to stay compatible.
    slots?: { from: string; to: string }[]
}

const DAYS: { key: DayKey; label: string }[] = [
    { key: "sat", label: "السبت" },
    { key: "sun", label: "الأحد" },
    { key: "mon", label: "الإثنين" },
    { key: "tue", label: "الثلاثاء" },
    { key: "wed", label: "الأربعاء" },
    { key: "thu", label: "الخميس" },
    { key: "fri", label: "الجمعة" },
]

type Props = {
    value: Schedule | null
    onChange: (v: Schedule | null) => void
    disabled?: boolean
}

function ensure(value: Schedule | null): Schedule {
    const days = value?.days ?? []

    // Normalize legacy -> slots
    const legacyFrom = value?.from ?? ""
    const legacyTo = value?.to ?? ""
    const slots = Array.isArray(value?.slots) && value!.slots!.length
        ? value!.slots!
        : legacyFrom || legacyTo
            ? [{ from: legacyFrom, to: legacyTo }]
            : []

    // Keep from/to in sync for backward compatibility.
    const first = slots[0]
    return {
        days,
        slots,
        from: first?.from ?? "",
        to: first?.to ?? "",
    }
}

export default function ScheduleBuilder({ value, onChange, disabled }: Props) {
    const v = ensure(value)

    const toggleDay = (d: DayKey) => {
        const exists = v.days.includes(d)
        const nextDays = exists ? v.days.filter((x) => x !== d) : [...v.days, d]
        const next = { ...v, days: nextDays }
        onChange(next.days.length === 0 && !next.from && !next.to ? null : next)
    }

    const commit = (next: Schedule) => {
        const empty = next.days.length === 0 && (!next.slots || next.slots.length === 0)
        onChange(empty ? null : next)
    }

    const setSlot = (idx: number, patch: Partial<{ from: string; to: string }>) => {
        const slots = [...(v.slots ?? [])]
        slots[idx] = { ...(slots[idx] || { from: "", to: "" }), ...patch }
        const first = slots[0]
        commit({ ...v, slots, from: first?.from ?? "", to: first?.to ?? "" })
    }

    const addSlot = () => {
        const slots = [...(v.slots ?? []), { from: "", to: "" }]
        const first = slots[0]
        commit({ ...v, slots, from: first?.from ?? "", to: first?.to ?? "" })
    }

    const removeSlot = (idx: number) => {
        const slots = [...(v.slots ?? [])]
        slots.splice(idx, 1)
        const first = slots[0]
        commit({ ...v, slots, from: first?.from ?? "", to: first?.to ?? "" })
    }

    const clear = () => onChange(null)

    return (
        <div className="rounded-2xl border p-4 bg-white">
            <div className="flex items-center justify-between">
                <div className="font-semibold text-[var(--text)]">جدول الحلقة</div>
                <button
                    type="button"
                    onClick={clear}
                    disabled={disabled}
                    className="text-xs px-3 py-1 rounded-xl border hover:opacity-90"
                >
                    مسح
                </button>
            </div>

            {/* Days table */}
            <div className="mt-3">
                <div className="text-xs text-[var(--muted)] mb-2">الأيام</div>
                <div className="overflow-x-auto rounded-2xl border">
                    <table className="min-w-[520px] w-full text-sm">
                        <thead className="bg-[rgba(18,43,67,.04)]">
                            <tr>
                                {DAYS.map((d) => (
                                    <th key={d.key} className="px-3 py-3 font-semibold text-[var(--text)] text-center whitespace-nowrap">
                                        {d.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                {DAYS.map((d) => {
                                    const active = v.days.includes(d.key)
                                    return (
                                        <td key={d.key} className="px-3 py-3 text-center">
                                            <button
                                                type="button"
                                                disabled={disabled}
                                                onClick={() => toggleDay(d.key)}
                                                className={cn(
                                                    "inline-flex items-center justify-center w-10 h-10 rounded-2xl border transition",
                                                    active ? "bg-[rgba(0,61,53,.10)] border-[rgba(0,61,53,.25)]" : "bg-white"
                                                )}
                                                aria-pressed={active}
                                                title={active ? "مُحدد" : "غير محدد"}
                                            >
                                                <span className={cn("text-base", active ? "text-[rgba(0,61,53,.95)]" : "text-[var(--muted)]")}>{active ? "✓" : "—"}</span>
                                            </button>
                                        </td>
                                    )
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Time slots table */}
            <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-[var(--muted)]">الأوقات</div>
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={addSlot}
                        className="text-xs px-3 py-1 rounded-xl border hover:opacity-90"
                    >
                        + إضافة وقت
                    </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border">
                    <table className="min-w-[520px] w-full text-sm">
                        <thead className="bg-[rgba(18,43,67,.04)]">
                            <tr>
                                <th className="px-3 py-3 font-semibold text-[var(--text)] text-right">#</th>
                                <th className="px-3 py-3 font-semibold text-[var(--text)] text-right">من</th>
                                <th className="px-3 py-3 font-semibold text-[var(--text)] text-right">إلى</th>
                                <th className="px-3 py-3 font-semibold text-[var(--text)] text-right">إجراء</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(v.slots ?? []).length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-3 py-6 text-center text-[var(--muted)]">
                                        لا يوجد أوقات. اضغط “إضافة وقت”.
                                    </td>
                                </tr>
                            ) : (
                                (v.slots ?? []).map((s, idx) => (
                                    <tr key={idx} className="border-t">
                                        <td className="px-3 py-3 text-[var(--muted)]">{idx + 1}</td>
                                        <td className="px-3 py-3">
                                            <input
                                                type="time"
                                                value={s.from}
                                                onChange={(e) => setSlot(idx, { from: e.target.value })}
                                                disabled={disabled}
                                                className="w-full rounded-2xl border px-3 py-2"
                                            />
                                        </td>
                                        <td className="px-3 py-3">
                                            <input
                                                type="time"
                                                value={s.to}
                                                onChange={(e) => setSlot(idx, { to: e.target.value })}
                                                disabled={disabled}
                                                className="w-full rounded-2xl border px-3 py-2"
                                            />
                                        </td>
                                        <td className="px-3 py-3">
                                            <button
                                                type="button"
                                                disabled={disabled}
                                                onClick={() => removeSlot(idx)}
                                                className="text-xs px-3 py-2 rounded-2xl border hover:opacity-90"
                                            >
                                                حذف
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="text-xs text-[var(--muted)] mt-2">
                    * سيتم حفظ الأوقات كـ JSON داخل schedule. للحفاظ على التوافق، يتم أيضًا تحديث (from/to) بأول وقت.
                </div>
            </div>

            <div className="text-xs text-[var(--muted)] mt-3">
                مثال: (السبت + الإثنين) — 05:00 - 06:00
            </div>
        </div>
    )
}
