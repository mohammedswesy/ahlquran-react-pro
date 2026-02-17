// src/components/ui/skeleton-table.tsx
type Props = { rows?: number; cols?: number }
export default function SkeletonTable({ rows = 8, cols = 4 }: Props) {
    return (
        <div className="w-full rounded-xl border bg-white overflow-hidden">
            <div className="border-b px-4 py-3 font-semibold bg-gray-50">جارِ التحميل…</div>
            <div className="divide-y">
                {Array.from({ length: rows }).map((_, r) => (
                    <div key={r} className="grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                        {Array.from({ length: cols }).map((__, c) => (
                            <div key={c} className="px-4 py-3">
                                <div className="h-3 w-[70%] animate-pulse rounded bg-gray-200" />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
