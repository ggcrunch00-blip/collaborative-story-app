const { Server } = require('socket.io')

const rooms = new Map()
const drafts = new Map()

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code
  do {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  } while (rooms.has(code))
  return code
}

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function redistributeStories(room) {
  const onlineStudents = room.students.filter(s => s.isOnline)
  if (onlineStudents.length < 2) return

  // Get current assignments: storyId -> studentId
  const currentAssignments = new Map()
  onlineStudents.forEach(student => {
    const story = room.stories.find(s => s.id === student.assignedStoryId)
    if (story) currentAssignments.set(story.id, student.id)
  })

  const storyIds = onlineStudents.map(s => s.assignedStoryId).filter(Boolean)
  let shuffled

  // Shuffle until no one gets the same story they just had
  let attempts = 0
  do {
    shuffled = shuffleArray(storyIds)
    attempts++
  } while (
    attempts < 100 &&
    shuffled.some((storyId, i) => storyId === onlineStudents[i].assignedStoryId)
  )

  onlineStudents.forEach((student, i) => {
    student.assignedStoryId = shuffled[i]
  })
}

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    path: '/api/socket_io',
    cors: { origin: '*' },
  })

  io.on('connection', (socket) => {
    socket.on('create_room', ({ settings, hostNickname }) => {
      const roomCode = generateRoomCode()
      const hostStudent = {
        id: socket.id,
        nickname: hostNickname,
        isOnline: true,
        status: 'idle',
        charCount: 0,
        assignedStoryId: null,
      }
      const room = {
        roomCode,
        hostId: socket.id,
        settings,
        phase: 'waiting',
        currentStep: 0,
        students: [],
        stories: [],
        hostNickname,
      }
      rooms.set(roomCode, room)
      socket.join(roomCode)
      socket.roomCode = roomCode
      socket.isHost = true
      socket.emit('room_created', { roomCode })
      socket.emit('room_state', room)
    })

    socket.on('join_room', ({ roomCode, nickname }) => {
      const room = rooms.get(roomCode)
      if (!room) {
        socket.emit('error', { code: 'ROOM_NOT_FOUND', message: '방을 찾을 수 없어요.' })
        return
      }

      // Reconnect check
      const existing = room.students.find(s => s.nickname === nickname)
      if (existing) {
        existing.id = socket.id
        existing.isOnline = true
        socket.join(roomCode)
        socket.roomCode = roomCode
        socket.nickname = nickname
        const draft = drafts.get(existing.id)
        socket.emit('room_state', room)
        socket.emit('phase_changed', {
          phase: room.phase,
          currentStep: room.currentStep,
          assignedStoryId: existing.assignedStoryId || null,
          draft: draft || '',
        })
        io.to(roomCode).emit('room_state', room)
        return
      }

      // Duplicate nickname check
      if (room.students.some(s => s.nickname === nickname && s.isOnline)) {
        socket.emit('error', { code: 'NICKNAME_TAKEN', message: '이미 사용 중인 닉네임이에요.' })
        return
      }

      const student = {
        id: socket.id,
        nickname,
        isOnline: true,
        status: 'idle',
        charCount: 0,
        assignedStoryId: null,
      }
      room.students.push(student)
      socket.join(roomCode)
      socket.roomCode = roomCode
      socket.nickname = nickname
      io.to(roomCode).emit('room_state', room)
      socket.emit('phase_changed', { phase: room.phase, currentStep: room.currentStep, assignedStoryId: null })
    })

    socket.on('start_activity', () => {
      const room = rooms.get(socket.roomCode)
      if (!room || room.hostId !== socket.id) return
      if (room.students.length === 0) {
        socket.emit('error', { code: 'NO_STUDENTS', message: '학생이 없어요.' })
        return
      }

      room.currentStep = 1

      // Create stories, one per student
      room.stories = room.students.map(student => {
        const story = {
          id: `story_${student.id}_${Date.now()}`,
          ownerId: student.id,
          chunks: [],
        }
        student.assignedStoryId = story.id
        return story
      })

      // Step 1: skip reading phase (no previous story exists)
      room.phase = 'writing'
      room.students.forEach(s => { if (s.isOnline) s.status = 'writing' })
      io.to(room.roomCode).emit('room_state', room)
      room.students.forEach(student => {
        const studentSocket = io.sockets.sockets.get(student.id)
        if (studentSocket) {
          studentSocket.emit('phase_changed', {
            phase: 'writing',
            currentStep: 1,
            assignedStoryId: student.assignedStoryId,
          })
        }
      })
    })

    socket.on('next_phase', () => {
      const room = rooms.get(socket.roomCode)
      if (!room || room.hostId !== socket.id) return

      room.currentStep += 1

      if (room.currentStep > room.settings.chunkCount) {
        room.phase = 'done'
        room.students.forEach(s => { s.status = 'done' })
        io.to(room.roomCode).emit('room_state', room)
        room.students.forEach(student => {
          const studentSocket = io.sockets.sockets.get(student.id)
          if (studentSocket) {
            const myStory = room.stories.find(s => s.ownerId === student.id)
            studentSocket.emit('phase_changed', {
              phase: 'done',
              currentStep: room.currentStep,
              assignedStoryId: student.assignedStoryId,
              myStory,
            })
          }
        })
        return
      }

      redistributeStories(room)

      room.phase = 'reading'
      room.students.forEach(s => { if (s.isOnline) s.status = 'reading' })

      // Progressive reading time: base + (step-1) * 10 seconds
      const readingMs = (room.settings.readingSeconds + (room.currentStep - 1) * 10) * 1000
      room.currentReadingSeconds = Math.round(readingMs / 1000)

      io.to(room.roomCode).emit('room_state', room)
      room.students.forEach(student => {
        const studentSocket = io.sockets.sockets.get(student.id)
        if (studentSocket) {
          studentSocket.emit('phase_changed', {
            phase: 'reading',
            currentStep: room.currentStep,
            assignedStoryId: student.assignedStoryId,
          })
        }
      })

      setTimeout(() => {
        if (!rooms.has(room.roomCode)) return
        if (room.phase !== 'reading') return
        room.phase = 'writing'
        room.currentReadingSeconds = null
        room.students.forEach(s => { if (s.isOnline) s.status = 'writing' })
        io.to(room.roomCode).emit('room_state', room)
        room.students.forEach(student => {
          const studentSocket = io.sockets.sockets.get(student.id)
          if (studentSocket) {
            studentSocket.emit('phase_changed', {
              phase: 'writing',
              currentStep: room.currentStep,
              assignedStoryId: student.assignedStoryId,
            })
          }
        })
      }, readingMs)
    })

    socket.on('help_raise', () => {
      const room = rooms.get(socket.roomCode)
      if (!room) return
      const student = room.students.find(s => s.id === socket.id)
      if (!student) return
      student.needsHelp = true
      io.to(room.roomCode).emit('room_state', room)
    })

    socket.on('help_resolve', ({ studentId }) => {
      const room = rooms.get(socket.roomCode)
      if (!room || room.hostId !== socket.id) return
      const student = room.students.find(s => s.id === studentId)
      if (!student) return
      student.needsHelp = false
      io.to(room.roomCode).emit('room_state', room)
    })

    socket.on('submit_chunk', ({ storyId, content }) => {
      const room = rooms.get(socket.roomCode)
      if (!room) return
      const story = room.stories.find(s => s.id === storyId)
      if (!story) return
      const student = room.students.find(s => s.id === socket.id)
      if (!student) return

      // Block re-submission if allowRevision is disabled
      if (!room.settings.allowRevision && student.status === 'done') return

      // If revision is allowed, replace existing chunk authored by this student
      if (room.settings.allowRevision && student.status === 'done') {
        const idx = story.chunks.findIndex(c => c.authorId === socket.id)
        if (idx !== -1) story.chunks.splice(idx, 1)
      }

      story.chunks.push({
        authorId: socket.id,
        authorNickname: student.nickname,
        content,
        createdAt: Date.now(),
      })
      student.status = 'done'
      student.charCount = 0
      drafts.delete(socket.id)
      io.to(room.roomCode).emit('room_state', room)
    })

    socket.on('save_draft', ({ storyId, content }) => {
      const room = rooms.get(socket.roomCode)
      if (!room) return
      const student = room.students.find(s => s.id === socket.id)
      if (!student) return
      drafts.set(socket.id, content)
      student.charCount = content.length
      io.to(room.roomCode).emit('room_state', room)
    })

    socket.on('disconnect', () => {
      if (!socket.roomCode) return
      const room = rooms.get(socket.roomCode)
      if (!room) return
      const student = room.students.find(s => s.id === socket.id)
      if (student) {
        student.isOnline = false
        student.status = 'idle'
      }
      io.to(room.roomCode).emit('room_state', room)
    })
  })
}

module.exports = { initSocketServer }
