import { ReactNode } from 'react'

interface GoldBorderCardProps {
  children: ReactNode
  className?: string
}

export function GoldBorderCard({ children, className = '' }: GoldBorderCardProps) {
  return (
    <div className={`relative border border-gold rounded-xl bg-cream ${className}`}>
      <span className="absolute top-[5px] left-[5px] w-3 h-3 border-t-2 border-l-2 border-gold pointer-events-none" />
      <span className="absolute top-[5px] right-[5px] w-3 h-3 border-t-2 border-r-2 border-gold pointer-events-none" />
      <span className="absolute bottom-[5px] left-[5px] w-3 h-3 border-b-2 border-l-2 border-gold pointer-events-none" />
      <span className="absolute bottom-[5px] right-[5px] w-3 h-3 border-b-2 border-r-2 border-gold pointer-events-none" />
      {children}
    </div>
  )
}
