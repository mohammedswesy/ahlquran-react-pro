import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  formId: string
  submitting?: boolean
  description?: string
  size?: "sm" | "md" | "lg"
  submitLabel?: string
  cancelLabel?: string
}

export default function ModalFormShell({
  open,
  onClose,
  title,
  children,
  formId,
  submitting = false,
  description,
  size = "md",
  submitLabel = "حفظ",
  cancelLabel = "إلغاء",
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      footer={
        <div className="w-full flex items-center justify-end gap-2" dir="rtl">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            {cancelLabel}
          </Button>
          <Button type="submit" form={formId} disabled={submitting}>
            {submitting ? "جارٍ الحفظ…" : submitLabel}
          </Button>
        </div>
      }
    >
      {children}
    </Modal>
  )
}
