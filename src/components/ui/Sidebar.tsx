import { Link, useLocation } from "react-router-dom"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/store/auth"
import { NAV_SECTIONS, type Role, type NavSection } from "@/config/nav"
import { PiListBold, PiCaretDownBold } from "react-icons/pi"

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
        "h-screen sticky top-0 shrink-0 transition-all",
        open ? "w-72" : "w-[84px]"
      )}
      style={{
        background: "#fefefe",
        borderLeft: "1px solid rgba(0,61,53,.15)",
        boxShadow: "0 10px 40px rgba(0,0,0,.08)",
      }}
    >
      {/* Header */}
      <div
        className="h-16 flex items-center justify-between px-3"
        style={{ borderBottom: "1px solid rgba(0,61,53,.12)" }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-2xl transition hover:bg-[rgba(0,61,53,.06)]"
          style={{ color: "#003d35" }}
        >
          <PiListBold size={18} />
        </button>

        {open && (
          <div className="flex flex-col leading-tight">
            <div className="font-extrabold tracking-wide text-[#003d35]">
              QCircle
            </div>
            <div className="text-[11px] text-[rgba(0,0,0,.55)]">
              Admin Console
            </div>
          </div>
        )}

        <div className="w-9" />
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-3">
        {!role ? (
          <div className="text-xs text-[rgba(0,0,0,.55)] px-2 py-2">
            سجّل الدخول لعرض القائمة
          </div>
        ) : (
          sections.map((sec) => {
            const isCollapsed = !!collapsed[sec.key]

            return (
              <div key={sec.key} className="space-y-1">
                {/* Section title */}
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed((p) => ({ ...p, [sec.key]: !p[sec.key] }))
                  }
                  className="w-full flex items-center justify-between rounded-2xl px-3 py-2 text-[12px] transition"
                  style={{
                    background: "rgba(0,61,53,.04)",
                    border: "1px solid rgba(0,61,53,.12)",
                    color: "rgba(0,0,0,.65)",
                  }}
                >
                  <span className={cn("truncate", !open && "sr-only")}>
                    {sec.label}
                  </span>

                  <PiCaretDownBold
                    size={14}
                    className={cn(
                      "transition",
                      isCollapsed ? "-rotate-90" : "rotate-0"
                    )}
                    style={{ opacity: open ? 1 : 0 }}
                  />
                </button>

                {/* Items */}
                {!isCollapsed && (
                  <div className="space-y-1">
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
                          className="group relative flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition"
                          style={{
                            background: active
                              ? "rgba(0,61,53,.10)"
                              : "transparent",
                            color: active
                              ? "#003d35"
                              : "rgba(0,0,0,.75)",
                          }}
                        >
                          {/* Active bar */}
                          <span
                            className={cn(
                              "absolute right-1 top-1/2 -translate-y-1/2 h-7 w-1 rounded-full transition",
                              active
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-40"
                            )}
                            style={{ background: "#003d35" }}
                          />

                          <Icon
                            size={18}
                            style={{
                              color: active
                                ? "#003d35"
                                : "rgba(0,61,53,.65)",
                            }}
                          />

                          {open && (
                            <div className="flex items-center justify-between w-full gap-2">
                              <span className="truncate">{item.label}</span>

                              {badge > 0 && (
                                <span
                                  className="min-w-6 h-6 px-2 inline-flex items-center justify-center rounded-full text-[11px] font-semibold"
                                  style={{
                                    background: "#dccba0",
                                    color: "#003d35",
                                    border: "1px solid rgba(0,61,53,.25)",
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

      {/* Footer */}
      <div
        className="mt-auto p-3"
        style={{ borderTop: "1px solid rgba(0,61,53,.12)" }}
      >
        <div
          className={cn(
            "text-xs text-[rgba(0,0,0,.55)]",
            !open && "sr-only"
          )}
        >
          اختصار: اضغط زر القائمة لطي/توسيع.
        </div>
      </div>
    </aside>
  )
}
