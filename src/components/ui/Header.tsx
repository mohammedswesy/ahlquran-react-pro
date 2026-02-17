import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "./button"
import { logout } from "@/services/auth"
import { PiSignOutBold } from "react-icons/pi"

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

    const onLogout = async () => {
        await logout()
        nav("/login", { replace: true })
    }

    return (
        <header
            dir="rtl"
            className={`sticky top-0 z-30 h-16 flex items-center justify-between px-4 ${className}`}
            style={{
                background: "rgba(255,255,255,.82)",
                backdropFilter: "blur(14px)",
                borderBottom: "1px solid rgba(0,61,53,.12)",
                boxShadow: "0 10px 30px rgba(0,0,0,.04)",
            }}
        >
            <div className="flex flex-col leading-tight">
                <div className="font-extrabold tracking-wide" style={{ color: "#04110f" }}>
                    {title}
                </div>
                {subtitle && (
                    <div className="text-xs" style={{ color: "rgba(2,8,7,.60)" }}>
                        {subtitle}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                {right}
                {!hideLogout && (
                    <Button variant="outline" onClick={onLogout}>
                        <PiSignOutBold size={18} />
                        خروج
                    </Button>
                )}
            </div>
        </header>
    )
}
