    import {
        ResponsiveContainer,
        AreaChart,
        Area,
        XAxis,
        YAxis,
        Tooltip,
        Legend,
        CartesianGrid,
    } from "recharts"
    import type { AttendancePoint } from "@/services/dashboard"

    export default function AttendanceChart({ data }: { data: AttendancePoint[] }) {
        return (
            <div
                dir="rtl"
                className="rounded-[28px] border border-[var(--border)] p-4"
                style={{
                    background: "linear-gradient(135deg,rgba(0,61,53,.08),rgba(220,203,160,.10))",
                    boxShadow: "var(--shadow2)",
                }}
            >
                <h3 className="font-extrabold text-[var(--text)] mb-2">حضور الأسبوع</h3>

                <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                        <AreaChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />

                            {/* بدون تحديد ألوان يدوياً */}
                            <Area type="monotone" dataKey="present" name="حاضر" strokeOpacity={1} fillOpacity={0.2} />
                            <Area type="monotone" dataKey="absent" name="غائب" strokeOpacity={1} fillOpacity={0.2} />
                            <Area type="monotone" dataKey="late" name="متأخر" strokeOpacity={1} fillOpacity={0.2} />
                            <Area type="monotone" dataKey="excused" name="مُعذّر" strokeOpacity={1} fillOpacity={0.2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )
    }
