import type { Metadata } from 'next'
import { Noto_Sans_KR, Gaegu, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const sans = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
  display: 'swap',
})
const display = Gaegu({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-display',
  display: 'swap',
})
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '이야기 이어쓰기',
  description: '협력 이야기 이어쓰기 활동 앱',
  icons: { icon: '/logo-mark.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="bg-app text-fg-1 font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
