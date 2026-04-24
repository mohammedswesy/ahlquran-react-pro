// src/hooks/useInstituteGuard.ts
/**
 * Institute-level query guard.
 *
 * When an institute-admin or sub-admin is logged in, they must only
 * ever see data from their own institute. This hook:
 *  - Returns `isRestricted: true` for restricted roles so list pages
 *    can hide the institute filter dropdown entirely.
 *  - On every render cycle, if a restricted user somehow has a
 *    `filterInstituteId` that doesn't match their own, the hook
 *    calls `resetFilter()` and shows a warning toast.
 */
import { useEffect } from "react"
import { toast } from "sonner"
import { useAuth } from "@/store/auth"

type Options = {
  /**
   * The current filterInstituteId value held by the list page.
   * Pass `undefined` when no filter is active.
   */
  filterInstituteId: number | undefined
  /** Setter to reset the filter back to the user's own institute. */
  setFilterInstituteId: (id: number | undefined) => void
}

type Result = {
  /**
   * `true` when the current user's role limits them to one institute.
   * List pages should hide the institute dropdown when this is true.
   */
  isRestricted: boolean
  /**
   * The institute ID the current user is locked to, or `undefined`
   * when the user is unrestricted (super-admin / org-admin).
   */
  ownInstituteId: number | undefined
}

export function useInstituteGuard({ filterInstituteId, setFilterInstituteId }: Options): Result {
  const { role, instituteId } = useAuth()

  const isRestricted = role === "institute-admin" || role === "sub-admin"
  const ownInstituteId: number | undefined = isRestricted && instituteId != null ? instituteId : undefined

  useEffect(() => {
    if (!isRestricted || ownInstituteId == null) return

    // If filter is already correct, nothing to do
    if (filterInstituteId === ownInstituteId) return

    // Filter is either unset or set to a foreign institute ⇒ lock it
    if (filterInstituteId !== undefined && filterInstituteId !== ownInstituteId) {
      toast.warning("لا يمكنك عرض بيانات معهد آخر.")
    }

    setFilterInstituteId(ownInstituteId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRestricted, ownInstituteId, filterInstituteId])

  return { isRestricted, ownInstituteId }
}
