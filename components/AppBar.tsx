import Image from 'next/image'
import { cn } from '@/lib/utils'

interface AppBarProps {
  badge?: string
  right?: React.ReactNode
  className?: string
}

export function AppBar({ badge, right, className }: AppBarProps) {
  return (
    <header className={cn('sticky top-0 z-10 h-14 flex items-center gap-3 px-6 bg-paper-0 border-b border-subtle', className)}>
      <Image src="/logo-mark.svg" alt="" width={28} height={28} />
      <Image src="/logo-wordmark.svg" alt="이야기 이어쓰기" width={110} height={24} />
      {badge && (
        <span className="ml-auto text-xs font-medium text-fg-3 bg-surface px-3 py-1 rounded-full">
          {badge}
        </span>
      )}
      {right && <div className="ml-auto">{right}</div>}
    </header>
  )
}
