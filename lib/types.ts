export type AppPhase = 'waiting' | 'reading' | 'writing' | 'done'

export interface RoomSettings {
  chunkCount: number
  timerSeconds: number
  readingSeconds: number
  seedCards: string[]
}

export interface Student {
  id: string
  nickname: string
  isOnline: boolean
  status: 'idle' | 'reading' | 'writing' | 'done'
  charCount: number
}

export interface StoryChunk {
  authorId: string
  authorNickname: string
  content: string
  createdAt: number
}

export interface Story {
  id: string
  ownerId: string
  chunks: StoryChunk[]
}

export interface Room {
  roomCode: string
  hostId: string
  settings: RoomSettings
  phase: AppPhase
  currentStep: number
  students: Student[]
  stories: Story[]
}
