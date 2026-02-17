


import { useEffect, useMemo, useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { PiListBold, PiSignOutBold, PiCaretDownBold } from "react-icons/pi"
import { useAuth } from "@/store/auth"
import { getMenuForRole, type MenuSection, type Role } from "./menus"

type Props = {
  brand?: { name: string; subtitle?: string }
}

const LS_COLLAPSED = "qc_sidebar_collapsed"
const LS_OPEN_SECTIONS = "qc_sidebar_open_sections"

export default function Sidebar({ brand = { name: "AhlQuran", subtitle: "Portal" } }: Props) {
  const { pathname } = useLocation()
  const nav = useNavigate()

  const role = useAuth((s) => s.role) as Role | null
  const logout = useAuth((s) => s.logout)

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
    const base = getMenuForRole(role)
    const isSuperAdmin = role === "super-admin"

    const blocked = new Set(["/admin/institutes", "/admin/employees"])

    return base.map((sec) => ({
      ...sec,
      items: sec.items.filter((it) => (isSuperAdmin ? true : !blocked.has(it.to))),
    }))
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

  return (
    <aside
      dir="rtl"
      className={cn("h-screen sticky top-0 border-l overflow-hidden", "bg-[#fefefe]", "text-[var(--text)]")}
      style={{
        width: collapsed ? 86 : 290,
        boxShadow: "var(--shadow2)",
        borderColor: "var(--border)",
      }}
    >
      <div className="px-4 py-4 flex items-center gap-3 border-b" style={{ borderColor: "var(--border)" }}>
        <div
          className="h-10 w-10 rounded-2xl grid place-items-center font-black"
          style={{
            background: "rgba(0,61,53,.10)",
            border: "1px solid rgba(0,61,53,.18)",
            color: "rgba(0,61,53,.95)",
          }}
          title={brand.name}
        >
          Q
        </div>

        {!collapsed && (
          <div className="flex-1">
            <div className="font-extrabold leading-5 text-[var(--text)]">{brand.name}</div>
            <div className="text-xs text-[var(--muted)]">
              {brand.subtitle || (role ? `Role: ${role}` : "Portal")}
            </div>
          </div>
        )}

        <button
          onClick={() => setCollapsed((v) => !v)}
          className="h-10 w-10 rounded-2xl border grid place-items-center hover:opacity-90 transition"
          style={{
            borderColor: "var(--border)",
            background: "rgba(0,61,53,.04)",
            color: "rgba(0,61,53,.95)",
          }}
          title={collapsed ? "توسيع" : "تصغير"}
        >
          <PiListBold />
        </button>
      </div>

      <div className="px-3 py-3 overflow-y-auto h-[calc(100vh-160px)]">
        {sections.map((sec, idx) => {
          const key = `sec_${idx}_${sec.title || "main"}`
          const open = openSections[key] ?? true

          return (
            <div className="mb-3" key={key}>
              {(sec.title || !collapsed) && (
                <button
                  type="button"
                  onClick={() => setOpenSections((p) => ({ ...p, [key]: !open }))}
                  className={cn("w-full flex items-center justify-between rounded-2xl px-3 py-2 transition", "hover:opacity-95")}
                  style={{
                    background: "rgba(0,61,53,.03)",
                    border: "1px solid rgba(0,61,53,.10)",
                    color: "var(--muted)",
                  }}
                  title={collapsed ? sec.title || "" : ""}
                >
                  <span className="text-xs opacity-70">{!collapsed ? (sec.title ?? "") : sec.title ? "•" : ""}</span>

                  {!collapsed && sec.title && (
                    <span
                      className={cn("transition", open ? "rotate-0" : "-rotate-90")}
                      style={{ color: "rgba(0,61,53,.75)" }}
                    >
                      <PiCaretDownBold />
                    </span>
                  )}
                </button>
              )}

              {open && (
                <div className="mt-2 space-y-1">
                  {sec.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          cn("group flex items-center gap-3 rounded-2xl px-3 py-3 transition border", isActive ? "active" : "")
                        }
                        style={({ isActive }) => ({
                          borderColor: isActive ? "rgba(0,61,53,.22)" : "rgba(0,61,53,.10)",
                          background: isActive ? "rgba(0,61,53,.08)" : "rgba(254,254,254,.80)",
                          color: isActive ? "rgba(0,61,53,.95)" : "var(--text)",
                        })}
                        title={collapsed ? item.label : ""}
                        end={false}
                      >
                        {Icon && (
                          <span className="text-lg opacity-90" style={{ color: "rgba(0,61,53,.85)" }}>
                            <Icon />
                          </span>
                        )}

                        {!collapsed && <span className="font-semibold">{item.label}</span>}
                      </NavLink>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="px-3 py-3 border-t" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={handleLogout}
          className={cn("w-full flex items-center gap-3 rounded-2xl px-3 py-3 transition", "border hover:opacity-90")}
          style={{
            borderColor: "var(--border)",
            background: "rgba(0,61,53,.04)",
            color: "rgba(0,61,53,.95)",
          }}
          title="خروج"
        >
          <span className="text-lg">
            <PiSignOutBold />
          </span>
          {!collapsed && <span className="font-semibold">خروج</span>}
        </button>
      </div>
    </aside>
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
