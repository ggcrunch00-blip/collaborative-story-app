'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { getSocket } from '@/lib/socket'
import { useStore } from '@/lib/store'
import { generateRandomNickname } from '@/lib/nicknames'
import { JoinRoomSchema, type JoinRoomInput } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AppBar } from '@/components/AppBar'

function StudentJoinForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefilledRoom = (searchParams.get('room') ?? '').toUpperCase()
  const { setRole, setMyNickname } = useStore()
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors, isValid } } = useForm<JoinRoomInput>({
    resolver: zodResolver(JoinRoomSchema),
    mode: 'onChange',
    defaultValues: { roomCode: prefilledRoom, nickname: '' },
  })

  const onSubmit = (data: JoinRoomInput) => {
    setLoading(true)
    setServerError('')
    const socket = getSocket()
    socket.emit('join_room', { roomCode: data.roomCode, nickname: data.nickname })
    socket.once('room_state', () => {
      setRole('student')
      setMyNickname(data.nickname)
      router.push(`/student/room/${data.roomCode}`)
    })
    socket.once('error', ({ message }: { message: string }) => {
      setServerError(message)
      setLoading(false)
    })
  }

  return (
    <main className="min-h-screen bg-app flex flex-col">
      <AppBar />


      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm flex flex-col items-center gap-8">
          {/* 히어로 */}
          <div className="text-center flex flex-col items-center gap-3">
            <Image src="/mascot-fox.svg" alt="" width={120} height={120} className="animate-[mascot-entrance_400ms_cubic-bezier(.34,1.56,.64,1)_both]" />
            <h1 className="font-display font-bold text-4xl text-fg-1">같이 이어 써볼까요?</h1>
            <p className="text-lg text-fg-2">선생님이 알려준 방 코드를 입력해요</p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-fg-2">방 코드</label>
              <input
                {...register('roomCode', {
                  onChange: e => setValue('roomCode', e.target.value.toUpperCase(), { shouldValidate: true }),
                })}
                maxLength={6}
                placeholder="______"
                autoCapitalize="characters"
                className="w-full border-[1.5px] border-default rounded-md px-4 py-3.5 font-mono font-bold text-3xl tracking-[.18em] text-center text-fg-1 bg-paper-0 placeholder:text-fg-disabled focus:outline-none focus:border-brand focus:shadow-focus transition-[border-color,box-shadow] duration-fast"
              />
              {errors.roomCode && <p className="text-xs text-danger">{errors.roomCode.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-fg-2">내 이름</label>
              <div className="flex gap-2">
                <Input
                  {...register('nickname')}
                  placeholder="2~10자 별명"
                  maxLength={10}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => setValue('nickname', generateRandomNickname(), { shouldValidate: true })}
                  className="w-12 h-12 rounded-md bg-surface text-xl border border-default hover:bg-surface-2 transition-colors duration-fast flex items-center justify-center shrink-0"
                >
                  🎲
                </button>
              </div>
              {errors.nickname
                ? <p className="text-xs text-danger">{errors.nickname.message}</p>
                : <p className="text-xs text-fg-3">별명으로 참여해요. 2~10자까지 가능해요.</p>
              }
            </div>

            {serverError && (
              <p className="text-sm text-danger bg-berry-50 px-3 py-2 rounded-md">{serverError}</p>
            )}

            <Button type="submit" size="lg" className="w-full mt-2" disabled={!isValid || loading}>
              {loading ? '참가 중...' : '입장하기'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}

export default function StudentJoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-app flex items-center justify-center"><p className="text-fg-3">불러오는 중...</p></div>}>
      <StudentJoinForm />
    </Suspense>
  )
}
