'use client'

interface SaveCompleteModalProps {
  open: boolean
  title: string
  message: string
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel: string
  onSecondary: () => void
}

export function SaveCompleteModal({
  open,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: SaveCompleteModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brown-dark/40 backdrop-blur-sm">
      <div className="bg-cream rounded-2xl px-8 py-8 shadow-2xl border border-gold/30 text-center w-80">
        <h2 className="text-lg font-bold text-brown-dark mb-2">{title}</h2>
        <p className="text-sm text-brown-mid mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onSecondary}
            className="text-sm text-brown-light border border-gold/40 rounded-lg px-4 py-2 hover:bg-gold/10 transition-colors"
          >
            {secondaryLabel}
          </button>
          <button
            onClick={onPrimary}
            className="text-sm bg-gold text-cream font-bold px-5 py-2 rounded-lg hover:bg-gold/90 transition-colors"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
