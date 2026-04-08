import { useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "./button"
import { logout } from "@/services/auth"
import { useAuth } from "@/store/auth"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { PiSignOutBold, PiBellBold, PiUserCircleBold, PiGearBold, PiCaretDownBold } from "react-icons/pi"

type Props = {
    title?: string
    subtitle?: string
    right?: ReactNode
    hideLogout?: boolean
    className?: string
}

export default function Header({
    title = "لوحة الإدارة",
    subtitle,
    right,
    hideLogout = false,
    className = "",
}: Props) {
    const nav = useNavigate()
    const { role } = useAuth()
    const roleLabel = role === "super-admin" ? "مدير النظام" : role || "غير معروف"
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)

    const onLogout = async () => {
        await logout()
        nav("/login", { replace: true })
    }

    return (
        <header
            dir="rtl"
            className={`sticky top-0 z-30 h-16 flex items-center justify-between px-6 transition-all ${className}`}
            style={{
                background: "rgba(254, 254, 254, 0.98)",
                backdropFilter: "blur(10px)",
                borderBottom: "1px solid var(--border)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            }}
        >
            {/* Left Section - Title */}
            <div className="flex flex-col leading-tight">
                <div className="font-extrabold tracking-wide text-lg" style={{ color: "var(--text)" }}>
                    {title}
                </div>
                {subtitle && (
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                        {subtitle}
                    </div>
                )}
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-3">
                {right}

                {/* Notifications */}
                <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                    <PopoverTrigger asChild>
                        <button
                            className="relative p-2 rounded-xl transition-colors"
                            style={{
                                color: "var(--brand)",
                                background: "rgba(0, 61, 53, 0.05)",
                            }}
                            title="الإشعارات"
                        >
                            <PiBellBold size={20} />
                            {/* Notification Badge */}
                            <span
                                className="absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse"
                                style={{ background: "#ef4444" }}
                            />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="start">
                        <div className="space-y-3">
                            <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                                الإشعارات
                            </div>
                            <div className="space-y-2">
                                <div
                                    className="p-3 rounded-lg border"
                                    style={{
                                        background: "rgba(0, 61, 53, 0.02)",
                                        borderColor: "var(--border)",
                                    }}
                                >
                                    <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                                        لا توجد إشعارات جديدة
                                    </div>
                                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                                        ستظهر الإشعارات هنا عند وصولها
                                    </div>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Profile Dropdown */}
                <Popover open={profileOpen} onOpenChange={setProfileOpen}>
                    <PopoverTrigger asChild>
                        <button
                            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:opacity-80"
                            style={{
                                background: "rgba(0, 61, 53, 0.08)",
                                color: "var(--text)",
                            }}
                        >
                            <div className="flex flex-col items-end text-left">
                                <span className="text-sm font-semibold leading-tight">
                                    {role ? role.charAt(0).toUpperCase() + role.slice(1) : "المستخدم"}
                                </span>
                                <span className="text-xs" style={{ color: "var(--muted)" }}>
                                    {roleLabel}
                                </span>
                            </div>
                            <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm"
                                style={{
                                    background: `linear-gradient(135deg, var(--brand), var(--brand2))`,
                                    color: "white",
                                }}
                            >
                                {role ? role.charAt(0).toUpperCase() : "U"}
                            </div>
                            <PiCaretDownBold size={16} style={{ opacity: 0.6 }} />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="start">
                        <div className="space-y-2">
                            {/* Profile Header */}
                            <div
                                className="p-3 rounded-lg mb-2"
                                style={{
                                    background: `linear-gradient(135deg, rgba(0, 61, 53, 0.1), rgba(220, 203, 160, 0.1))`,
                                }}
                            >
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg mb-2"
                                    style={{
                                        background: `linear-gradient(135deg, var(--brand), var(--brand2))`,
                                        color: "white",
                                    }}
                                >
                                    {role ? role.charAt(0).toUpperCase() : "U"}
                                </div>
                                <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                                    {role ? role.charAt(0).toUpperCase() + role.slice(1) : "المستخدم"}
                                </div>
                                <div className="text-xs" style={{ color: "var(--muted)" }}>
                                    {roleLabel}
                                </div>
                            </div>

                            {/* Divider */}
                            <div style={{ height: "1px", background: "var(--border)" }} />

                            {/* Profile Menu Items */}
                            <button
                                onClick={() => {
                                    setProfileOpen(false)
                                    nav("/settings/profile")
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm"
                                style={{
                                    color: "var(--text)",
                                }}
                            >
                                <PiUserCircleBold size={18} style={{ color: "var(--brand)" }} />
                                <span>الملف الشخصي</span>
                            </button>

                            <button
                                onClick={() => {
                                    setProfileOpen(false)
                                    nav("/settings")
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm"
                                style={{
                                    color: "var(--text)",
                                }}
                            >
                                <PiGearBold size={18} style={{ color: "var(--brand)" }} />
                                <span>الإعدادات</span>
                            </button>

                            {/* Divider */}
                            <div style={{ height: "1px", background: "var(--border)" }} />

                            {/* Logout */}
                            {!hideLogout && (
                                <button
                                    onClick={onLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm text-red-600"
                                >
                                    <PiSignOutBold size={18} />
                                    <span>خروج</span>
                                </button>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </header>
    )
}
