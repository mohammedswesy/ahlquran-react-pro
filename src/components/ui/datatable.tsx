import * as React from "react"
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PiCaretUpBold, PiCaretDownBold } from "react-icons/pi"

/** ✅ الشكل القديم اللي عندك */
export type SimpleColumn<T> = {
    key: keyof T | string
    label: React.ReactNode
    /** optional render */
    render?: (row: T) => React.ReactNode
    /** optional sortable */
    sortable?: boolean
}

/** ✅ يقبل الاثنين */
type AnyColumns<T> = ColumnDef<T, any>[] | SimpleColumn<T>[]

type Props<T> = {
    columns: AnyColumns<T>
    data: T[]
    isLoading?: boolean
    searchKey?: string
    searchPlaceholder?: string
    pageSizeOptions?: number[]
    defaultPageSize?: number
}

function isColumnDefArray<T>(cols: AnyColumns<T>): cols is ColumnDef<T, any>[] {
    // Check ANY column — the first column may be an id-less serial/index cell
    // that looks like neither shape. SimpleColumn never uses `cell`, `accessorFn`,
    // or `accessorKey`. Any of those keys anywhere in the array confirms ColumnDef.
    return (cols as any[]).some(
        (c: any) => !!c && ("accessorKey" in c || "accessorFn" in c || "id" in c || "cell" in c)
    )
}

/** ✅ تحويل الأعمدة البسيطة إلى ColumnDef */
function toTanstackColumns<T>(cols: AnyColumns<T>): ColumnDef<T, any>[] {
    if (isColumnDefArray<T>(cols)) return cols

    const simple = cols as SimpleColumn<T>[]
    return simple.map((c, idx) => {
        const key = String(c.key)

        const col: ColumnDef<T, any> = {
            id: key || `col_${idx}`, // ✅ مهم لتفادي خطأ id
            header: () => c.label,
            accessorKey: key as any,
            cell: ({ row, getValue }) => {
                if (typeof c.render === "function") return c.render(row.original)
                const v = getValue() as any
                return v == null || v === "" ? "—" : v
            },
            enableSorting: c.sortable ?? true,
        }

        return col
    })
}

export function DataTable<T>({
    columns,
    data,
    isLoading,
    searchKey = "name",
    searchPlaceholder = "بحث…",
    pageSizeOptions = [5, 10, 20, 50],
    defaultPageSize = 10,
}: Props<T>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [globalSearch, setGlobalSearch] = React.useState("")

    /** ✅ columnsNormalized: دائماً ColumnDef */
    const columnsNormalized = React.useMemo<ColumnDef<T, any>[]>(() => toTanstackColumns<T>(columns), [columns])

    const table = useReactTable({
        data,
        columns: columnsNormalized,
        // Stable row identity: use data.id when present, fall back to row index
        getRowId: (row: any, index) => String(row?.id ?? index),
        state: { sorting, columnFilters },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: defaultPageSize } },
    })

    // ✅ pick safe search column:
    const safeSearchKey = React.useMemo(() => {
        if (table.getColumn(searchKey)) return searchKey

        // حاول أول accessorKey موجود
        const firstAccessor = columnsNormalized.find((c: any) => typeof c?.accessorKey === "string") as any
        if (firstAccessor?.accessorKey && table.getColumn(firstAccessor.accessorKey)) {
            return firstAccessor.accessorKey as string
        }

        // أو أول id موجود
        const firstId = columnsNormalized.find((c: any) => typeof c?.id === "string") as any
        if (firstId?.id && table.getColumn(firstId.id)) return firstId.id as string

        return "" // no filter column
    }, [columnsNormalized, searchKey, table])

    React.useEffect(() => {
        if (!safeSearchKey) return
        const col = table.getColumn(safeSearchKey)
        if (!col) return
        col.setFilterValue(globalSearch)
    }, [globalSearch, safeSearchKey, table])

    if (isLoading) {
        return (
            <div
                className="w-full rounded-xl overflow-hidden border"
                style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    boxShadow: "var(--shadow2)",
                }}
            >
                <div className="animate-pulse space-y-3 p-6">
                    <div className="h-10 rounded-lg" style={{ background: "var(--surface2)" }} />
                    <div className="h-4 rounded-lg" style={{ background: "var(--surface2)" }} />
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-3 rounded-lg" style={{ background: "var(--surface2)" }} />
                    ))}
                </div>
            </div>
        )
    }

    const hasRows = table.getRowModel().rows.length > 0

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div
                className="rounded-lg p-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between border"
                style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    boxShadow: "var(--shadow2)",
                }}
            >
                <div className="flex-1 min-w-0">
                    <Input
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                        placeholder={searchPlaceholder}
                        disabled={!safeSearchKey}
                    />
                    <div className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                        البحث على: <span className="font-medium" style={{ color: "var(--text)" }}>{safeSearchKey || "—"}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                        العدد:
                    </div>

                    <select
                        className="px-3 py-2 rounded-lg text-sm border transition-all"
                        style={{
                            background: "var(--surface)",
                            borderColor: "var(--border)",
                            color: "var(--text)",
                        }}
                        value={table.getState().pagination.pageSize}
                        onChange={(e) => table.setPageSize(Number(e.target.value))}
                    >
                        {pageSizeOptions.map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setGlobalSearch("")
                            table.resetColumnFilters()
                            table.resetSorting()
                        }}
                    >
                        تصفير
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div
                className="w-full rounded-lg overflow-x-auto border"
                style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    boxShadow: "var(--shadow2)",
                }}
            >
                <table className="w-full text-sm">
                    <thead
                        style={{
                            background: "var(--surface2)",
                            borderBottom: "1px solid var(--border)",
                        }}
                    >
                        {table.getHeaderGroups().map((hg) => (
                            <tr key={hg.id}>
                                {hg.headers.map((header) => {
                                    const canSort = header.column.getCanSort()
                                    const sort = header.column.getIsSorted()

                                    return (
                                        <th
                                            key={header.id}
                                            className="px-6 py-4 text-right font-semibold"
                                            style={{ color: "var(--text)" }}
                                        >
                                            <div className="flex items-center gap-2 justify-start">
                                                <div className="flex-1">
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                                </div>

                                                {canSort && (
                                                    <button
                                                        className="p-1 rounded-lg transition hover:bg-[var(--surface)]"
                                                        onClick={header.column.getToggleSortingHandler()}
                                                        title="ترتيب"
                                                    >
                                                        {sort === "asc" ? (
                                                            <PiCaretUpBold style={{ color: "var(--brand)" }} />
                                                        ) : sort === "desc" ? (
                                                            <PiCaretDownBold style={{ color: "var(--brand)" }} />
                                                        ) : (
                                                            <span style={{ color: "var(--muted)", opacity: 0.5 }}>↕</span>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </th>
                                    )
                                })}
                            </tr>
                        ))}
                    </thead>

                    <tbody>
                        {!hasRows ? (
                            <tr>
                                <td colSpan={columnsNormalized.length} className="p-12 text-center">
                                    <div className="text-base font-semibold" style={{ color: "var(--text)" }}>
                                        لا توجد بيانات
                                    </div>
                                    <div className="text-sm mt-2" style={{ color: "var(--muted)" }}>
                                        جرّب تغيير معايير البحث أو إضافة عناصر جديدة.
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="transition-colors border-t hover:bg-[var(--surface2)]"
                                    style={{ borderColor: "var(--border)" }}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            className="px-6 py-4"
                                            style={{ color: "var(--text)" }}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div
                className="rounded-lg p-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between border"
                style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    boxShadow: "var(--shadow2)",
                }}
            >
                <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    صفحة <span style={{ color: "var(--brand)" }}>
                        {table.getState().pagination.pageIndex + 1}
                    </span> من <span style={{ color: "var(--brand)" }}>
                        {table.getPageCount()}
                    </span> — الإجمالي:{" "}
                    <span style={{ color: "var(--brand)" }}>
                        {table.getFilteredRowModel().rows.length}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.firstPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        أول
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        السابق
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        التالي
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.lastPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        آخر
                    </Button>
                </div>
            </div>
        </div>
    )
}
