'use client'
import { useRef, useState } from 'react'
import { getSocket } from '@/lib/socket'
import { useStore } from '@/lib/store'

type SaveState = 'idle' | 'saving' | 'saved'

interface Props {
  initialContent: string
  storyId: string
  onSubmit: (content: string) => void
}

export default function WritingArea({ initialContent, storyId, onSubmit }: Props) {
  const [content, setContent] = useState(initialContent)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const { setDraft } = useStore()
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setContent(val)
    setDraft(val)
    setSaveState('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      getSocket().emit('save_draft', { storyId, content: val })
      setSaveState('saved')
    }, 800)
  }

  const handleSubmit = () => {
    if (!content.trim()) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    onSubmit(content)
  }

  return (
    <div className="bg-paper-0 border-[1.5px] border-[var(--border-default)] rounded-lg overflow-hidden">
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="이야기를 이어 써보세요..."
        rows={8}
        style={{
          width: '100%',
          padding: '14px',
          fontSize: 18,
          lineHeight: 1.75,
          color: 'var(--fg-1)',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          fontFamily: 'var(--font-sans)',
        }}
      />
      <div style={{
        borderTop: '1px dashed var(--border-subtle)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)' }}>{content.length}자</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: saveState === 'saved' ? 'var(--success)' : 'var(--fg-3)' }}>
            {saveState === 'saving' ? '저장 중…' : saveState === 'saved' ? '✓ 저장됨' : ''}
          </span>
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="min-h-10 px-5 rounded-md bg-brand text-white font-bold text-sm
              shadow-btn-brand hover:bg-brand-hover hover:shadow-btn-brand-hover hover:translate-y-[1px]
              active:translate-y-[2px] active:shadow-none
              disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
              transition-all duration-fast ease-out"
          >
            제출하기 ✓
          </button>
        </div>
      </div>
    </div>
  )
}
