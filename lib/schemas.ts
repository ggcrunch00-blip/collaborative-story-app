import { z } from 'zod'

export const RoomCode = z.string().regex(/^[A-Z0-9]{6}$/, '6자리 영문/숫자 코드를 입력해 주세요')
export const Nickname = z.string().min(2, '2자 이상').max(10, '10자 이하')
export const Password = z.string().min(4).max(8).optional()

export const CreateRoomSchema = z.object({
  hostNickname: Nickname,
  password: Password,
  chunkCount: z.number().min(2).max(10),
  timerMinutes: z.number().min(1).max(20),
  readingSeconds: z.number().min(10).max(120),
  order: z.enum(['random', 'group']),
  seeds: z.array(z.string()).max(5),
  allowRevision: z.boolean(),
})

export const JoinRoomSchema = z.object({
  roomCode: RoomCode,
  nickname: Nickname,
})

export type CreateRoomInput = z.infer<typeof CreateRoomSchema>
export type JoinRoomInput = z.infer<typeof JoinRoomSchema>
