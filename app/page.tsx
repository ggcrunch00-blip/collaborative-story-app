'use client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  return (
    <main className="min-h-screen bg-app flex flex-col items-center justify-center px-6">
      <div className="text-center mb-12 flex flex-col items-center gap-4">
        <Image src="/mascot-fox.svg" alt="마스코트" width={120} height={120} className="mb-2" />
        <Image src="/logo-wordmark.svg" alt="이야기 이어쓰기" width={280} height={64} />
        <p className="text-lg text-fg-2 mt-1">함께 만드는 우리들의 이야기</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => router.push('/teacher/create')}
          className="min-h-14 px-7 rounded-md bg-brand text-white font-bold text-lg
            shadow-btn-brand
            hover:bg-brand-hover hover:shadow-btn-brand-hover hover:translate-y-[1px]
            active:translate-y-[2px] active:shadow-none
            transition-all duration-fast ease-out"
        >
          선생님입니다 👩‍🏫
        </button>
        <button
          onClick={() => router.push('/student/join')}
          className="min-h-14 px-7 rounded-md bg-paper-0 text-fg-1 font-bold text-lg
            border border-[var(--border-default)]
            hover:bg-paper-200
            transition-all duration-fast ease-out"
        >
          학생입니다 🙋
        </button>
      </div>
    </main>
  )
}
