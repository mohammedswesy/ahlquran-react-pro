// src/components/ui/tenant-banner.tsx
/**
 * TenantViewBanner
 *
 * Shown to super-admin (and org-admin) when they are currently scoped
 * to a specific institute's data.  This prevents confusion about "whose
 * data am I actually looking at right now?".
 *
 * Usage:
 *   <TenantViewBanner instituteId={filterInstituteId} instituteName={resolvedName} />
 *
 * When `instituteId` is null/undefined, the component renders nothing.
 */
import { PiBuildingsBold, PiXBold } from "react-icons/pi"
import { useAuth } from "@/store/auth"

type Props = {
  /** The currently active institute filter — if null/undefined, banner is hidden. */
  instituteId: number | undefined | null
  /** Human-readable name for the institute. Shown in the banner text. */
  instituteName?: string | null
  /** Optional callback when the user clicks the "clear scope" × button. */
  onClear?: () => void
}

export default function TenantViewBanner({ instituteId, instituteName, onClear }: Props) {
  const { role } = useAuth()

  // Only super-admin and org-admin ever see this banner
  const isSuperOrOrg = role === "super-admin" || role === "org-admin"

  if (!isSuperOrOrg || !instituteId) return null

  const label = instituteName || `معهد #${instituteId}`

  return (
    <div
      className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium mb-2"
      style={{
        background: "rgba(0,61,53,.06)",
        borderColor: "rgba(0,61,53,.2)",
        color: "var(--brand)",
      }}
      dir="rtl"
    >
      <PiBuildingsBold className="shrink-0 text-base" />
      <span>
        عرض بيانات:{" "}
        <strong className="font-bold">{label}</strong>
      </span>

      {onClear && (
        <button
          onClick={onClear}
          title="إزالة تصفية المعهد"
          className="ms-auto rounded-md p-1 hover:bg-[rgba(0,61,53,.12)] transition-colors"
          aria-label="مسح تصفية المعهد"
        >
          <PiXBold className="text-sm" />
        </button>
      )}
    </div>
  )
}

export { TenantViewBanner }
