'use client'
import RoomSetupForm from '@/components/teacher/RoomSetupForm'

export default function TeacherCreatePage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">👩‍🏫</div>
          <h1 className="text-3xl font-bold text-blue-500">방 만들기</h1>
        </div>
        <RoomSetupForm />
      </div>
    </main>
  )
}
