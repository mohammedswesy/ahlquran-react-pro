import type { ReactNode } from "react"

interface StatProps {
    label: string
    value: string | number
    icon?: ReactNode
    trend?: {
        value: number
        isPositive: boolean
    }
    color?: "primary" | "success" | "warning" | "destructive"
    className?: string
}

export default function Stat({ label, value, icon, trend, color = "primary", className = "" }: StatProps) {
    const colorStyles = {
        primary: {
            bg: "rgba(0, 61, 53, 0.08)",
            icon: "var(--brand)",
            accent: "var(--brand)",
        },
        success: {
            bg: "rgba(16, 185, 129, 0.08)",
            icon: "#10b981",
            accent: "#10b981",
        },
        warning: {
            bg: "rgba(251, 146, 60, 0.08)",
            icon: "#fb923c",
            accent: "#fb923c",
        },
        destructive: {
            bg: "rgba(239, 68, 68, 0.08)",
            icon: "#ef4444",
            accent: "#ef4444",
        },
    }

    const style = colorStyles[color]

    return (
        <div
            className={`rounded-xl border overflow-hidden transition-all hover:shadow-lg ${className}`}
            style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow2)",
            }}
        >
            <div className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium mb-2" style={{ color: "var(--muted)" }}>
                            {label}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <div className="text-3xl font-extrabold" style={{ color: "var(--text)" }}>
                                {value}
                            </div>
                            {trend && (
                                <span
                                    className="text-xs font-semibold px-2 py-1 rounded-lg"
                                    style={{
                                        background: trend.isPositive
                                            ? "rgba(16, 185, 129, 0.1)"
                                            : "rgba(239, 68, 68, 0.1)",
                                        color: trend.isPositive ? "#10b981" : "#ef4444",
                                    }}
                                >
                                    {trend.isPositive ? "+" : ""}
                                    {trend.value}%
                                </span>
                            )}
                        </div>
                    </div>

                    {icon && (
                        <div
                            className="p-3 rounded-lg flex items-center justify-center"
                            style={{ background: style.bg }}
                        >
                            <div style={{ color: style.icon }}>
                                {icon}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
