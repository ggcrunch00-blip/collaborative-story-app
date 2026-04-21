'use client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const router = useRouter()
  return (
    <main className="min-h-screen bg-app flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
        <span className="absolute top-16 left-10 text-4xl opacity-20 rotate-[-15deg]">✏️</span>
        <span className="absolute top-24 right-12 text-3xl opacity-20 rotate-[12deg]">📖</span>
        <span className="absolute bottom-28 left-8 text-3xl opacity-20 rotate-[8deg]">🌱</span>
        <span className="absolute bottom-20 right-10 text-4xl opacity-20 rotate-[-10deg]">⭐</span>
        <span className="absolute top-1/3 left-4 text-2xl opacity-15 rotate-[20deg]">🎨</span>
        <span className="absolute top-1/2 right-6 text-2xl opacity-15 rotate-[-18deg]">💬</span>
      </div>

      {/* 히어로 */}
      <div className="text-center mb-10 flex flex-col items-center gap-3 relative z-10">
        <div className="animate-[mascot-entrance_500ms_cubic-bezier(.34,1.56,.64,1)_both] drop-shadow-md">
          <Image src="/mascot-fox.svg" alt="" width={160} height={160} priority />
        </div>
        <Image src="/logo-wordmark.svg" alt="이야기 이어쓰기" width={260} height={60} priority />
        <p className="font-display text-xl text-fg-2 mt-1">함께 만드는 우리들의 이야기</p>
      </div>

      {/* 버튼 카드 */}
      <div className="relative z-10 bg-paper-0 border border-subtle rounded-2xl shadow-md px-6 py-6 w-full max-w-xs flex flex-col gap-3">
        <Button size="lg" className="w-full" onClick={() => router.push('/teacher/create')}>
          선생님입니다 👩‍🏫
        </Button>
        <Button size="lg" variant="secondary" className="w-full" onClick={() => router.push('/student/join')}>
          학생입니다 🙋
        </Button>
      </div>

      {/* 하단 */}
      <p className="relative z-10 mt-8 text-xs text-fg-3">이야기 이어쓰기 · 협력 창작 활동 앱</p>
    </main>
  )
}
