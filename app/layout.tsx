import type { Metadata } from 'next'
import { Gowun_Dodum } from 'next/font/google'
import './globals.css'

const gowunDodum = Gowun_Dodum({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: 'QR Code Manager',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={gowunDodum.variable}>
      <body>{children}</body>
    </html>
  )
}
