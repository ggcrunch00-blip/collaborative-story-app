'use client'
import { create } from 'zustand'
import { Socket } from 'socket.io-client'
import { AppPhase, Room, Story } from './types'

interface AppStore {
  socket: Socket | null
  role: 'teacher' | 'student' | null
  roomCode: string | null
  room: Room | null
  myId: string | null
  myNickname: string | null
  myPhase: AppPhase
  assignedStoryId: string | null
  currentStory: Story | null
  myStory: Story | null
  draftContent: string

  setSocket: (socket: Socket) => void
  setRole: (role: 'teacher' | 'student') => void
  setRoom: (room: Room) => void
  setPhase: (phase: AppPhase) => void
  setDraft: (content: string) => void
  setMyId: (id: string) => void
  setMyNickname: (nickname: string) => void
  setAssignedStoryId: (id: string | null) => void
  setCurrentStory: (story: Story | null) => void
  setMyStory: (story: Story | null) => void
  reset: () => void
}

const initialState = {
  socket: null,
  role: null,
  roomCode: null,
  room: null,
  myId: null,
  myNickname: null,
  myPhase: 'waiting' as AppPhase,
  assignedStoryId: null,
  currentStory: null,
  myStory: null,
  draftContent: '',
}

export const useStore = create<AppStore>((set) => ({
  ...initialState,
  setSocket: (socket) => set({ socket }),
  setRole: (role) => set({ role }),
  setRoom: (room) => set({ room }),
  setPhase: (myPhase) => set({ myPhase }),
  setDraft: (draftContent) => set({ draftContent }),
  setMyId: (myId) => set({ myId }),
  setMyNickname: (myNickname) => set({ myNickname }),
  setAssignedStoryId: (assignedStoryId) => set({ assignedStoryId }),
  setCurrentStory: (currentStory) => set({ currentStory }),
  setMyStory: (myStory) => set({ myStory }),
  reset: () => set(initialState),
}))
