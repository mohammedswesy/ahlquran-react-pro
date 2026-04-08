type Props = {
  active?: boolean
}

export default function LoadingBar({ active = false }: Props) {
  if (!active) return null

  return (
    <div className="w-full h-1 rounded-full overflow-hidden bg-[rgba(0,61,53,0.08)]" aria-hidden>
      <div className="h-full w-1/3 bg-[var(--brand)] animate-[loading-bar_1.2s_ease-in-out_infinite]" />
    </div>
  )
}
