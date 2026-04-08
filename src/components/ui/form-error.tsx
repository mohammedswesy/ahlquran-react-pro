type Props = {
  message?: string
  className?: string
}

export default function FormError({ message, className }: Props) {
  if (!message) return null

  return (
    <div className={"text-red-600 text-xs mt-1 " + (className ?? "")} role="alert" aria-live="polite">
      {message}
    </div>
  )
}
