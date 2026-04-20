'use client'
import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { QrCode, Timer } from 'lucide-react'
import { useStore } from '@/lib/store'
import { getSocket } from '@/lib/socket'
import { Room } from '@/lib/types'
import StudentStatusGrid from '@/components/teacher/StudentStatusGrid'
import TeacherControls from '@/components/teacher/TeacherControls'
import { Toaster } from 'react-hot-toast'

const phaseLabel: Record<string, string> = {
  waiting: '대기 중',
  reading: '읽기 타임',
  writing: '작성 단계',
  done: '활동 종료',
}

export default function TeacherRoomPage() {
  const params = useParams()
  const roomCode = params.roomCode as string
  const { room, setRoom } = useStore()

  useEffect(() => {
    const socket = getSocket()
    socket.on('room_state', (r: Room) => setRoom(r))
    return () => { socket.off('room_state') }
  }, [])

  if (!room) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <p className="text-fg-3">방 정보를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-app">
      <Toaster />

      {/* 상단 바 */}
      <div
        className="sticky top-0 z-10 border-b border-subtle"
        style={{ background: 'rgba(251,247,239,.92)', backdropFilter: 'blur(6px)' }}
      >
        <div className="max-w-kit mx-auto px-6 py-3 flex items-center justify-between">
          {/* 로고 */}
          <div className="flex items-center gap-3">
            <Image src="/logo-mark.svg" alt="로고" width={28} height={28} />
            <Image src="/logo-wordmark.svg" alt="이야기 이어쓰기" width={120} height={28} />
          </div>

          {/* 우측 클러스터 */}
          <div className="flex items-center gap-5">
            {/* 방 코드 */}
            <div className="text-center">
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 28, letterSpacing: '.14em', color: 'var(--fg-1)', lineHeight: 1 }}>
                {roomCode}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--fg-3)', marginTop: 2 }}>
                방 코드
              </div>
            </div>

            {/* QR 버튼 */}
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 10px', borderRadius: 8,
                border: '1px solid var(--border-default)',
                background: 'var(--paper-0)', color: 'var(--fg-2)',
                fontSize: 13, cursor: 'pointer',
              }}
              title="QR 코드"
            >
              <QrCode size={16} />
            </button>

            {/* 타이머 pill */}
            {(room.phase === 'reading' || room.phase === 'writing') && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 999,
                background: 'var(--brand-soft)', color: 'var(--crayon-700)',
                fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14,
              }}>
                <Timer size={14} />
                {room.phase === 'writing' ? `${Math.floor(room.settings.timerSeconds / 60)}:00` : `${room.settings.readingSeconds}s`}
              </div>
            )}

            {/* 페이즈 pill */}
            <div style={{
              padding: '6px 14px', borderRadius: 999,
              background: 'var(--brand-soft)', color: 'var(--crayon-700)',
              fontSize: 13, fontWeight: 500,
            }}>
              {phaseLabel[room.phase]}
            </div>
          </div>
        </div>
      </div>

      {/* 메인 레이아웃: 320px 고정 + 나머지 */}
      <div className="max-w-kit mx-auto p-6 grid gap-6"
        style={{ gridTemplateColumns: '320px 1fr' }}>
        <TeacherControls room={room} />
        <StudentStatusGrid
          students={room.students}
          currentStep={room.currentStep}
          totalSteps={room.settings.chunkCount}
        />
      </div>
    </main>
  )
}
