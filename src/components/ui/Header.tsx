import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "./button"
import { useAuth } from "@/store/auth"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { cn } from "@/lib/utils"
import { PiSignOutBold, PiBellBold, PiUserCircleBold, PiGearBold, PiCaretDownBold, PiWarningCircleBold, PiTrophyBold } from "react-icons/pi"
import { listNotifications, markNotificationAsRead, type NotificationItem } from "@/services/notifications"

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
    const { role, logout, token } = useAuth()
    const roleLabel = role === "super-admin" ? "مدير النظام" : role || "غير معروف"
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const [notifications, setNotifications] = useState<NotificationItem[]>([])
    const [loadingNotifications, setLoadingNotifications] = useState(false)

    const unreadCount = useMemo(
        () => notifications.filter((notification) => !notification.read_at).length,
        [notifications],
    )

    const toRelativeAr = (value: string): string => {
        if (!value) return "منذ لحظات"
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return "منذ لحظات"
        const diffMs = Date.now() - date.getTime()
        const minutes = Math.max(0, Math.floor(diffMs / 60000))
        if (minutes < 1) return "الآن"
        if (minutes < 60) return `منذ ${minutes} دقيقة`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `منذ ${hours} ساعة`
        const days = Math.floor(hours / 24)
        return `منذ ${days} يوم`
    }

    const getNotificationVisual = (notification: NotificationItem) => {
        const source = `${notification.type ?? ""} ${notification.message}`.toLowerCase()
        if (source.includes("absence") || source.includes("absent") || source.includes("غياب")) {
            return {
                icon: PiWarningCircleBold,
                iconClass: "text-rose-600",
                boxClass: "border-rose-200 bg-rose-50/70",
            }
        }

        if (
            source.includes("achievement") ||
            source.includes("memorization") ||
            source.includes("إنجاز") ||
            source.includes("حفظ")
        ) {
            return {
                icon: PiTrophyBold,
                iconClass: "text-emerald-600",
                boxClass: "border-emerald-200 bg-emerald-50/70",
            }
        }

        return {
            icon: PiBellBold,
            iconClass: "text-[var(--brand)]",
            boxClass: "border-[var(--border)] bg-[rgba(0,61,53,0.03)]",
        }
    }

    const loadNotifications = async () => {
        if (!token) {
            setNotifications([])
            return
        }

        setLoadingNotifications(true)
        try {
            const items = await listNotifications(5)
            setNotifications(items)
        } catch {
            setNotifications([])
        } finally {
            setLoadingNotifications(false)
        }
    }

    const onNotificationClick = async (notification: NotificationItem) => {
        setNotifications((prev) => prev.map((item) => (
            item.id === notification.id ? { ...item, read_at: item.read_at ?? new Date().toISOString() } : item
        )))

        try {
            await markNotificationAsRead(notification.id)
        } catch {
            setNotifications((prev) => prev.map((item) => (
                item.id === notification.id ? { ...item, read_at: notification.read_at ?? null } : item
            )))
        }
    }

    useEffect(() => {
        void loadNotifications()
    }, [token])

    useEffect(() => {
        if (!notificationsOpen) return
        void loadNotifications()
    }, [notificationsOpen])

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
                            {unreadCount > 0 && (
                                <span
                                    className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full text-[10px] font-extrabold text-white flex items-center justify-center"
                                    style={{ background: "#ef4444" }}
                                >
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="start">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                                    الإشعارات
                                </div>
                                <div className="text-xs font-bold" style={{ color: "#ef4444" }}>
                                    {unreadCount > 0 ? `${unreadCount} غير مقروء` : ""}
                                </div>
                            </div>

                            {loadingNotifications ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 3 }).map((_, idx) => (
                                        <div key={idx} className="p-3 rounded-lg border animate-pulse" style={{ borderColor: "var(--border)" }}>
                                            <div className="h-3 w-40 rounded bg-slate-200" />
                                            <div className="mt-2 h-2 w-24 rounded bg-slate-100" />
                                        </div>
                                    ))}
                                </div>
                            ) : notifications.length === 0 ? (
                                <div
                                    className="p-3 rounded-lg border"
                                    style={{
                                        background: "rgba(0, 61, 53, 0.02)",
                                        borderColor: "var(--border)",
                                    }}
                                >
                                    <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                                        لا توجد تنبيهات جديدة
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {notifications.slice(0, 5).map((notification) => {
                                        const visual = getNotificationVisual(notification)
                                        const Icon = visual.icon
                                        return (
                                            <button
                                                key={notification.id}
                                                onClick={() => void onNotificationClick(notification)}
                                                className={cn(
                                                    "w-full rounded-lg border p-3 text-right transition hover:opacity-90",
                                                    visual.boxClass,
                                                    !notification.read_at && "ring-1 ring-red-200",
                                                )}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <Icon className={cn("mt-0.5 h-4 w-4", visual.iconClass)} />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="line-clamp-2 text-sm font-medium" style={{ color: "var(--text)" }}>
                                                            {notification.message || "تنبيه جديد"}
                                                        </div>
                                                        <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                                                            {toRelativeAr(notification.created_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
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
