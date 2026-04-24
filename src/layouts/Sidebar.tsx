


import { useEffect, useMemo, useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { PiX, PiListBold, PiSignOutBold, PiCaretDownBold } from "react-icons/pi"
import { useAuth } from "@/store/auth"
import { getMenuForRole, type MenuSection, type Role } from "./menus"

type Props = {
  brand?: { name: string; subtitle?: string }
}

const LS_COLLAPSED = "qc_sidebar_collapsed"
const LS_OPEN_SECTIONS = "qc_sidebar_open_sections"

export default function Sidebar({ brand = { name: "معاهد الخليل لتعليم القرآن الكريم", subtitle: "نظام إدارة الحلقات والاختبارات" } }: Props) {
  const { pathname } = useLocation()
  const nav = useNavigate()

  const role = useAuth((s) => s.role) as Role | null
  const instituteName = useAuth((s) => s.instituteName)
  const brandName = useAuth((s) => s.brandName)
  const setRole = useAuth((s) => s.setRole)
  const logout = useAuth((s) => s.logout)
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false)

  const displayBrandName = instituteName || brandName || brand.name
  const displayBrandSubtitle =
    role === "super-admin"
      ? "مدير النظام"
      : instituteName
      ? "بوابة المعهد"
      : brand.subtitle || (role ? role : "Portal")

  const isDev =
    ((import.meta as any)?.env?.DEV ?? false) ||
    ((globalThis as any)?.process?.env?.NODE_ENV === "development")

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_COLLAPSED) === "1"
    } catch {
      return false
    }
  })

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(LS_OPEN_SECTIONS)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(LS_COLLAPSED, collapsed ? "1" : "0")
    } catch { }
  }, [collapsed])

  useEffect(() => {
    try {
      localStorage.setItem(LS_OPEN_SECTIONS, JSON.stringify(openSections))
    } catch { }
  }, [openSections])

  const sections = useMemo<MenuSection[]>(() => {
    return getMenuForRole(role)
  }, [role])



  useEffect(() => {
    if (collapsed) return
    const key = findSectionKeyByPath(sections, pathname)
    if (!key) return
    setOpenSections((prev) => {
      if (prev[key] === undefined) return { ...prev, [key]: true }
      return prev
    })
  }, [pathname, sections, collapsed])

  useEffect(() => {
    if (!collapsed) return
    setOpenSections((prev) => {
      const next: Record<string, boolean> = {}
      Object.keys(prev).forEach((k) => (next[k] = false))
      return next
    })
  }, [collapsed])

  function handleLogout() {
    const ok = confirm("هل تريد تسجيل الخروج؟")
    if (!ok) return
    logout()
    nav("/login", { replace: true })
  }

  function switchRole(nextRole: Role) {
    setRole(nextRole)
    setRoleSwitcherOpen(false)
    if (nextRole === "teacher") nav("/teacher", { replace: true })
    else if (nextRole === "student") nav("/student", { replace: true })
    else nav("/admin", { replace: true })
  }

  return (
    <>
      <aside
        dir="rtl"
        className={cn(
          "h-screen sticky top-0 border-l overflow-hidden transition-all duration-300 flex flex-col",
          "bg-white/40 backdrop-blur-md",
          "text-[var(--text)]"
        )}
        style={{
          width: collapsed ? 80 : 290,
          boxShadow: "2px 0 24px rgba(15, 23, 42, 0.08)",
          borderColor: "var(--border)",
        }}
      >
      {/* Header */}
      <div
        className="px-4 py-4 flex items-center justify-between h-16 shrink-0 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="h-10 w-10 rounded-lg grid place-items-center font-extrabold text-sm flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, var(--brand), var(--brand2))`,
            color: "white",
          }}
          title={brand.name}
        >
          خ
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0 px-3">
            <div className="font-extrabold text-sm leading-tight text-[var(--text)]">
              {displayBrandName}
            </div>
            <div className="text-xs text-[var(--muted)] truncate">
              {displayBrandSubtitle}
            </div>
          </div>
        )}

        <button
          onClick={() => setCollapsed((v) => !v)}
          className="h-10 w-10 rounded-lg flex items-center justify-center hover:bg-[var(--surface2)] transition-colors flex-shrink-0"
          style={{
            color: "var(--brand)",
          }}
          title={collapsed ? "توسيع" : "تصغير"}
        >
          {collapsed ? <PiListBold size={20} /> : <PiX size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-4 overflow-y-auto space-y-3">
        {sections.map((sec, idx) => {
          const key = `sec_${idx}_${sec.title || "main"}`
          const open = openSections[key] ?? true

          return (
            <div className="space-y-2" key={key}>
              {(sec.title || !collapsed) && (
                <button
                  type="button"
                  onClick={() => setOpenSections((p) => ({ ...p, [key]: !open }))}
                  className={cn(
                    "w-full flex items-center justify-between rounded-lg px-3 py-2 transition-all text-xs font-semibold",
                    "h-10 shrink-0"
                  )}
                  style={{
                    background: "rgba(255,255,255,0.52)",
                    color: "var(--brand)",
                    border: "1px solid rgba(255,255,255,0.45)",
                    boxShadow: "0 6px 16px rgba(15,23,42,0.06)",
                  }}
                  title={collapsed ? sec.title || "" : ""}
                >
                  <span className={cn(!collapsed && "truncate")}>
                    {!collapsed ? (sec.title ?? "") : "•"}
                  </span>

                  {!collapsed && sec.title && (
                    <span
                      className={cn("transition-transform duration-200 flex-shrink-0", open ? "rotate-0" : "-rotate-90")}
                      style={{ color: "var(--brand)" }}
                    >
                      <PiCaretDownBold size={16} />
                    </span>
                  )}
                </button>
              )}

              {open && (
                <div className="space-y-1.5">
                  {sec.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          cn(
                            "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all h-10 shrink-0",
                            isActive ? "active" : ""
                          )
                        }
                        style={({ isActive }) => ({
                          background: isActive
                            ? "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(79,70,229,0.12))"
                            : "rgba(255,255,255,0.22)",
                          color: isActive ? "var(--brand)" : "var(--muted)",
                          borderLeft: isActive ? "3px solid var(--brand)" : "3px solid transparent",
                          backdropFilter: "blur(10px)",
                        })}
                        title={collapsed ? item.label : ""}
                        end={false}
                      >
                        {/* التعديل الجوهري هنا: إضافة ({ isActive }) => */}
                        {({ isActive }) => (
                          <>
                            {Icon && (
                              <span className="text-lg flex-shrink-0" style={{ opacity: isActive ? 1 : 0.7 }}>
                                <Icon />
                              </span>
                            )}

                            {!collapsed && (
                              <span className="font-medium text-sm truncate">{item.label}</span>
                            )}
                          </>
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer - Logout */}
      <div
        className="px-3 py-4 border-t shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all h-10",
            "hover:bg-red-50"
          )}
          style={{
            color: "#dc2626",
          }}
          title="خروج"
        >
          <span className="text-lg flex-shrink-0">
            <PiSignOutBold />
          </span>
          {!collapsed && <span className="font-medium text-sm">خروج</span>}
        </button>
      </div>
      </aside>

      {isDev && (
        <div className="fixed bottom-4 left-4 z-[60]" dir="rtl">
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleSwitcherOpen((v) => !v)}
              className="h-10 rounded-xl px-3 text-sm font-bold border"
              style={{
                background: "#003d35",
                color: "#fff",
                borderColor: "rgba(0,61,53,.8)",
                boxShadow: "0 8px 20px rgba(0,0,0,.18)",
              }}
              title="Debug Role Switcher"
            >
              تبديل الدور
            </button>

            {roleSwitcherOpen && (
              <div
                className="absolute bottom-12 left-0 w-44 rounded-xl border p-2 space-y-1"
                style={{
                  background: "rgba(254,254,254,.98)",
                  borderColor: "var(--border)",
                  boxShadow: "0 12px 28px rgba(0,0,0,.14)",
                }}
              >
                <button
                  type="button"
                  onClick={() => switchRole("super-admin")}
                  className="w-full rounded-lg px-3 py-2 text-sm text-right hover:bg-[var(--surface2)]"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => switchRole("teacher")}
                  className="w-full rounded-lg px-3 py-2 text-sm text-right hover:bg-[var(--surface2)]"
                >
                  Teacher
                </button>
                <button
                  type="button"
                  onClick={() => switchRole("student")}
                  className="w-full rounded-lg px-3 py-2 text-sm text-right hover:bg-[var(--surface2)]"
                >
                  Student
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function findSectionKeyByPath(sections: MenuSection[], path: string) {
  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i]
    const key = `sec_${i}_${sec.title || "main"}`
    if (sec.items.some((it) => path === it.to || path.startsWith(it.to + "/"))) return key
  }
  return null
}
