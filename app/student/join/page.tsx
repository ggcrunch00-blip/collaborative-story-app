'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getSocket } from '@/lib/socket'
import { useStore } from '@/lib/store'
import { generateRandomNickname } from '@/lib/nicknames'

export default function StudentJoinPage() {
  const router = useRouter()
  const { setRole, setMyNickname } = useStore()
  const [roomCode, setRoomCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isValid = roomCode.length === 6 && nickname.trim().length >= 2

  const handleJoin = () => {
    if (!isValid) return
    setLoading(true)
    setError('')
    const socket = getSocket()
    socket.emit('join_room', { roomCode: roomCode.toUpperCase(), nickname: nickname.trim() })
    socket.once('room_state', () => {
      setRole('student')
      setMyNickname(nickname.trim())
      router.push(`/student/room/${roomCode.toUpperCase()}`)
    })
    socket.once('error', ({ message }: { message: string }) => {
      setError(message)
      setLoading(false)
    })
  }

  return (
    <main className="min-h-screen bg-app flex flex-col">
      {/* 헤더 */}
      <div className="bg-paper-0 border-b border-subtle px-6 py-3 flex items-center gap-3">
        <Image src="/logo-mark.svg" alt="로고" width={24} height={24} />
        <Image src="/logo-wordmark.svg" alt="이야기 이어쓰기" width={100} height={24} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm flex flex-col items-center gap-8">
          {/* 히어로 */}
          <div className="text-center flex flex-col items-center gap-3">
            <Image src="/mascot-fox.svg" alt="마스코트" width={120} height={120} />
            <h1 className="font-display font-bold text-4xl text-fg-1">같이 이어 써볼까요?</h1>
            <p className="text-lg text-fg-2">선생님이 알려준 방 코드를 입력해요</p>
          </div>

          {/* 폼 */}
          <div className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-fg-2">방 코드</label>
              <input
                type="text" maxLength={6} value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                placeholder="000000"
                className="w-full border-[1.5px] border-[var(--border-default)] rounded-md px-4 py-3.5
                  font-mono font-bold text-3xl tracking-[.18em] text-center text-fg-1 bg-paper-0
                  focus:outline-none focus:border-brand focus:shadow-focus transition-all duration-fast"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-fg-2">내 이름</label>
              <div className="flex gap-2">
                <input
                  type="text" value={nickname} onChange={e => setNickname(e.target.value)}
                  placeholder="별명으로 참여해요. 2~10자까지"
                  maxLength={10}
                  className="flex-1 border-[1.5px] border-[var(--border-default)] rounded-md px-4 py-3 text-md
                    bg-paper-0 text-fg-1 focus:outline-none focus:border-brand focus:shadow-focus transition-all duration-fast"
                />
                <button onClick={() => setNickname(generateRandomNickname())}
                  className="w-12 h-12 rounded-md bg-surface text-xl border border-[var(--border-default)]
                    hover:bg-surface-2 transition-all duration-fast flex items-center justify-center shrink-0">
                  🎲
                </button>
              </div>
              <p className="text-xs text-fg-3">별명으로 참여해요. 2~10자까지 가능해요.</p>
            </div>

            {error && <p className="text-sm text-danger bg-danger-soft px-3 py-2 rounded-md">{error}</p>}

            <button onClick={handleJoin} disabled={!isValid || loading}
              className="w-full min-h-14 rounded-md bg-brand text-white font-bold text-lg mt-2
                shadow-btn-brand hover:bg-brand-hover hover:shadow-btn-brand-hover hover:translate-y-[1px]
                active:translate-y-[2px] active:shadow-none
                disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                transition-all duration-fast ease-out">
              {loading ? '참가 중...' : '입장하기'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
