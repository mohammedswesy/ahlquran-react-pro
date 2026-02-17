import React from "react"
import Sidebar from "./Sidebar"
import Header from "@/components/ui/Header"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" className="min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="flex-1 min-w-0 h-screen overflow-y-auto">
          <Header
            title="AhlQuran"
            subtitle="نظام إدارة حلقات القرآن"
            hideLogout
          />

          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
