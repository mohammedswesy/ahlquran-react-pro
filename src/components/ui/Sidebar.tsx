import { Link, useLocation } from "react-router-dom"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/store/auth"
import { NAV_SECTIONS, type Role, type NavSection } from "@/config/nav"
import { PiListBold, PiCaretDownBold, PiX } from "react-icons/pi"

type BadgesMap = Record<string, number>

function useSidebarBadges(): BadgesMap {
  return { notifications: 0 }
}

function inRole(section: NavSection, role: Role) {
  return section.roles.includes(role)
}

export default function Sidebar() {
  const role = useAuth((s) => s.role as Role | null)
  const { pathname } = useLocation()
  const badges = useSidebarBadges()

  const [open, setOpen] = useState(true)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    dashboards: false,
    management: false,
    operations: false,
    education_management: false,
    system: false,
  })

  const sections = useMemo(() => {
    if (!role) return []
    return NAV_SECTIONS
      .filter((sec) => inRole(sec, role))
      .map((sec) => ({
        ...sec,
        items: sec.items.filter((i) => i.roles.includes(role)),
      }))
      .filter((sec) => sec.items.length > 0)
  }, [role])

  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/")

  return (
    <aside
      dir="rtl"
      className={cn(
        "h-screen sticky top-0 shrink-0 transition-all duration-300 flex flex-col",
        open ? "w-72" : "w-20"
      )}
      style={{
        background: "rgba(254, 254, 254, 0.98)",
        borderLeft: "1px solid var(--border)",
        boxShadow: "2px 0 12px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* Header */}
      <div
        className="h-16 flex items-center justify-between px-4 shrink-0"
        style={{
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-xl transition-all hover:bg-[var(--surface2)]"
          style={{ color: "var(--brand)" }}
          title={open ? "تصغير القائمة" : "توسيع القائمة"}
        >
          {open ? <PiX size={20} /> : <PiListBold size={20} />}
        </button>

        {open && (
          <div className="flex flex-col leading-tight min-w-0">
            <div className="font-extrabold tracking-tighter text-base" style={{ color: "var(--brand)" }}>
              QCircle
            </div>
            <div className="text-[10px]" style={{ color: "var(--muted)" }}>
              منصة التعليم
            </div>
          </div>
        )}

        {!open && <div className="w-2" />}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {!role ? (
          <div className="text-xs text-center" style={{ color: "var(--muted)" }} dir="rtl">
            سجّل الدخول لعرض القائمة
          </div>
        ) : (
          sections.map((sec) => {
            const isCollapsed = !!collapsed[sec.key]

            return (
              <div key={sec.key} className="space-y-2">
                {/* Section title */}
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed((p) => ({ ...p, [sec.key]: !p[sec.key] }))
                  }
                  className={cn(
                    "w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                    open ? "h-10" : "h-10 justify-center"
                  )}
                  style={{
                    background: "rgba(0, 61, 53, 0.05)",
                    color: "var(--brand)",
                  }}
                  title={open ? "" : sec.label}
                >
                  <span className={cn("truncate", !open && "sr-only")}>
                    {sec.label}
                  </span>

                  <PiCaretDownBold
                    size={14}
                    className={cn(
                      "transition-transform duration-300 shrink-0",
                      isCollapsed ? "-rotate-90" : "rotate-0"
                    )}
                    style={{ opacity: open ? 1 : 0 }}
                  />
                </button>

                {/* Items */}
                {!isCollapsed && (
                  <div className="space-y-1.5">
                    {sec.items.map((item) => {
                      const Icon = item.icon
                      const active = isActive(item.to)
                      const badge = item.badgeKey
                        ? badges[item.badgeKey] ?? 0
                        : 0

                      return (
                        <Link
                          key={item.key}
                          to={item.to}
                          className={cn(
                            "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                            open ? "h-10" : "h-10 justify-center"
                          )}
                          style={{
                            background: active
                              ? "linear-gradient(135deg, rgba(0, 61, 53, 0.1), rgba(220, 203, 160, 0.05))"
                              : "transparent",
                            color: active ? "var(--brand)" : "var(--muted)",
                          }}
                          title={open ? "" : item.label}
                        >
                          {/* Active indicator */}
                          {active && (
                            <span
                              className="absolute right-0 top-0 bottom-0 w-1 rounded-r-full"
                              style={{ background: "var(--brand)" }}
                            />
                          )}

                          <Icon
                            size={20}
                            className="shrink-0 transition-colors"
                            style={{
                              color: active ? "var(--brand)" : "var(--muted)",
                            }}
                          />

                          {open && (
                            <div className="flex items-center justify-between flex-1 min-w-0 gap-2">
                              <span className="truncate text-sm font-medium">
                                {item.label}
                              </span>

                              {badge > 0 && (
                                <span
                                  className="min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[10px] font-bold shrink-0"
                                  style={{
                                    background: "var(--brand2)",
                                    color: "var(--brand)",
                                    border: "1px solid rgba(0, 61, 53, 0.2)",
                                  }}
                                >
                                  {badge > 99 ? "99+" : badge}
                                </span>
                              )}
                            </div>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </nav>

      {/* Footer - Collapse info */}
      {open && (
        <div
          className="p-3 mt-auto shrink-0 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
            <strong style={{ color: "var(--text)" }}>💡 نصيحة:</strong> اضغط على أيقونة القائمة لتصغير الشريط الجانبي
          </div>
        </div>
      )}
    </aside>
  )
}
