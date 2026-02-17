type CardsProps = { totals: Record<string, number | null | undefined> }

export default function DashboardCards({ totals }: CardsProps) {
    const items = [

        ...(typeof totals?.institutes === "number"
            ? [{ label: "المعاهد", value: totals.institutes }]
            : []),

        { label: "المعلمون", value: Number(totals?.teachers ?? 0) },
        { label: "الطلبة", value: Number(totals?.students ?? 0) },
        { label: "الحلقات", value: Number(totals?.circles ?? 0) },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" dir="rtl">
            {items.map((c, i) => (
                <div
                    key={i}
                    className="rounded-[24px] border border-[var(--border)] p-4"
                    style={{ background: "rgba(255,255,255,.06)", backdropFilter: "blur(12px)" }}
                >
                    <div className="text-[var(--muted)] text-sm">{c.label}</div>
                    <div className="text-2xl font-extrabold text-[var(--text)] mt-1">{c.value}</div>
                </div>
            ))}
        </div>
    )
}
