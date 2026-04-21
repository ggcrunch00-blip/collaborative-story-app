'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Timer, QrCode, Pause, ChevronRight, X } from 'lucide-react'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'
import { getSocket } from '@/lib/socket'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { StudentStatusCard } from '@/components/StudentStatusCard'
import { cn } from '@/lib/utils'
import type { Room } from '@/lib/types'

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function TeacherDashboard() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const { room, setRoom } = useStore()
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [activityStarted, setActivityStarted] = useState(false)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    const socket = getSocket()
    socket.on('room_state', (r: Room) => {
      setRoom(r)
      if (r.phase !== 'waiting') setActivityStarted(true)
    })
    return () => { socket.off('room_state') }
  }, [setRoom])

  useEffect(() => {
    if (!room || room.phase !== 'writing') return
    setTimeLeft(room.settings.timerSeconds)
    const interval = setInterval(() => {
      setTimeLeft(t => (t !== null && t > 0 ? t - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [room?.phase])

  const handleStart = () => {
    getSocket().emit('start_activity')
    setActivityStarted(true)
  }

  const handleNext = () => getSocket().emit('next_phase')

  const handleResolveHelp = (studentId: string) => {
    getSocket().emit('help_resolve', { studentId })
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <p className="text-fg-3">방 정보를 불러오는 중...</p>
      </div>
    )
  }

  const totalSteps = room.settings.chunkCount
  const phasePillLabel = { waiting: '대기 중', reading: '읽기 단계', writing: '작성 단계', done: '완료' }[room.phase]
  const timerSeconds = timeLeft ?? room.settings.timerSeconds
  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/student/join?room=${roomCode}`
    : `http://localhost:3000/student/join?room=${roomCode}`

  return (
    <div className="min-h-screen bg-app">
      {/* Top bar */}
      <header className="sticky top-0 z-10 h-14 flex items-center px-6 gap-4 bg-paper-0 border-b border-subtle">
        <Image src="/logo-mark.svg" alt="" width={28} height={28} />
        <Image src="/logo-wordmark.svg" alt="이야기 이어쓰기" width={110} height={24} />

        <div className="ml-auto flex items-center gap-3">
          <div className="text-center">
            <div className="font-mono font-bold text-2xl text-fg-1 leading-none tracking-[.14em]">
              {roomCode}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-fg-3 mt-0.5">방 코드</div>
          </div>

          <Button variant="secondary" size="sm" className="gap-1" onClick={() => setShowQR(true)}>
            <QrCode size={14} /> QR
          </Button>

          {room.phase === 'writing' && (
            <div className="flex items-center gap-1.5 bg-brand-soft text-crayon-700 px-3 py-1.5 rounded-full font-mono font-bold text-sm">
              <Timer size={14} />
              {formatTime(timerSeconds)}
            </div>
          )}

          <div className="bg-brand-soft text-crayon-700 px-3 py-1.5 rounded-full text-sm font-medium">
            {phasePillLabel}
          </div>
        </div>
      </header>

      {/* Main grid */}
      <div className="grid grid-cols-[320px_1fr] gap-6 p-6 max-w-[1280px] mx-auto">
        {/* Left panel */}
        <div className="flex flex-col gap-4">
          <div className="bg-paper-0 border border-subtle rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-bold text-fg-2 mb-3">활동 진행</h3>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="font-display font-bold text-4xl text-brand">{room.currentStep}</span>
              <span className="text-lg text-fg-3"> / {totalSteps} 단계</span>
            </div>
            <div className="flex gap-1 mb-4">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors duration-base', i < room.currentStep ? 'bg-brand' : 'bg-paper-200')} />
              ))}
            </div>

            {!activityStarted ? (
              <Button size="lg" className="w-full" onClick={handleStart} disabled={room.students.length === 0}>
                활동 시작하기
              </Button>
            ) : room.phase !== 'done' ? (
              <>
                <Button size="lg" className="w-full gap-1.5 mb-2" onClick={handleNext} disabled={room.phase === 'reading'}>
                  다음 단계로 <ChevronRight size={16} />
                </Button>
                <Button variant="ghost" size="sm" className="w-full gap-1.5">
                  <Pause size={14} /> 활동 일시 중지
                </Button>
              </>
            ) : (
              <div className="text-center text-sprout-500 font-bold text-sm">활동 완료 🎉</div>
            )}
          </div>

          <div className="bg-paper-0 border border-subtle rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-bold text-fg-2 mb-3">설정</h3>
            <ul className="text-sm text-fg-2 space-y-1.5 leading-[1.8]">
              <li>· 덩어리 수 <strong>{room.settings.chunkCount}개</strong></li>
              <li>· 단계당 <strong>{Math.floor(room.settings.timerSeconds / 60)}분</strong></li>
              <li>· 읽기 타임 <strong>{room.settings.readingSeconds}초~</strong> (단계별 증가)</li>
              <li>· 다시 쓰기 <strong>{room.settings.allowRevision ? '허용' : '불가'}</strong></li>
            </ul>
          </div>
        </div>

        {/* Right main */}
        <div>
          <h2 className="text-xl font-bold text-fg-1 mb-4">
            학생 현황{' '}
            <span className="text-fg-3 font-normal">{room.students.filter(s => s.isOnline).length}명 접속</span>
          </h2>

          {room.students.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-paper-0 border border-subtle rounded-lg text-fg-3">
              <p className="text-lg mb-1">아직 접속한 학생이 없어요</p>
              <p className="text-sm">학생들에게 방 코드를 알려주세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3.5">
              {room.students.map(student => (
                <StudentStatusCard
                  key={student.id}
                  student={student}
                  currentStep={room.currentStep}
                  totalSteps={totalSteps}
                  phase={room.phase}
                  onResolveHelp={() => handleResolveHelp(student.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR 모달 */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay" onClick={() => setShowQR(false)}>
          <div className="bg-paper-0 rounded-2xl p-8 max-w-xs w-full shadow-lg text-center" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-fg-1">학생 입장 QR</h3>
              <button onClick={() => setShowQR(false)} className="text-fg-3 hover:text-fg-1 transition-colors">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-fg-2 mb-5">스캔하면 바로 입장 화면으로 이동해요</p>
            <div className="mx-auto mb-4 p-3 bg-white rounded-xl inline-block shadow-sm">
              <QRCodeSVG value={joinUrl} size={180} level="M" />
            </div>
            <div className="font-mono font-bold text-brand text-2xl tracking-[.14em] mb-1">{roomCode}</div>
            <p className="text-xs text-fg-3">방 코드를 직접 입력해도 돼요</p>
          </div>
        </div>
      )}
    </div>
  )
}
