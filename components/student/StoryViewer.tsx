'use client'
import { Story, StoryChunk } from '@/lib/types'

interface PrevChunkProps {
  chunks: StoryChunk[]
  collapsible?: boolean
}

export function PrevChunk({ chunks, collapsible = false }: PrevChunkProps) {
  if (chunks.length === 0) return null

  const lastChunk = chunks[chunks.length - 1]

  if (collapsible) {
    return (
      <details className="group">
        <summary className="cursor-pointer text-sm text-fg-3 py-2 select-none list-none flex items-center gap-1">
          <span className="group-open:hidden">↑ 이전 이야기 다시 보기</span>
          <span className="hidden group-open:inline">↑ 접기</span>
        </summary>
        <div className="prev-chunk mt-2">
          <div className="cap">이전 이야기</div>
          <div className="ptxt">{lastChunk.content}</div>
          <div className="author">— {lastChunk.authorNickname}가 썼어요</div>
        </div>
      </details>
    )
  }

  return (
    <div className="prev-chunk">
      <div className="cap">이전 이야기</div>
      <div className="ptxt">{lastChunk.content}</div>
      <div className="author">— {lastChunk.authorNickname}가 썼어요</div>
    </div>
  )
}

interface StoryChunkViewProps {
  chunks: Story['chunks']
  myId: string
}

export function StoryChunkList({ chunks, myId }: StoryChunkViewProps) {
  return (
    <div>
      {chunks.map((chunk, i) => (
        <div key={i} className={`story-chunk ${chunk.authorId === myId ? 'mine' : ''}`}>
          <div className="idx">
            {i + 1}번째{chunk.authorId === myId ? ' · 내가 쓴 부분' : ''}
          </div>
          <div className="stxt">{chunk.content}</div>
          <div className="author">— {chunk.authorNickname}가 썼어요</div>
        </div>
      ))}
    </div>
  )
}

// 레거시 호환용 default export (reading 화면에서 전체 스토리 표시)
interface Props {
  story: Story
  myId: string
  collapsed?: boolean
  showMeta?: boolean
}

export default function StoryViewer({ story, myId, collapsed = false, showMeta = false }: Props) {
  if (story.chunks.length === 0) {
    return (
      <div className="prev-chunk" style={{ borderLeft: 'none', background: 'var(--paper-100)' }}>
        <div className="cap">이전 이야기</div>
        <div className="ptxt" style={{ color: 'var(--fg-3)', fontStyle: 'italic' }}>
          첫 번째 덩어리예요. 이야기를 시작해보세요!
        </div>
      </div>
    )
  }

  if (showMeta) {
    return <StoryChunkList chunks={story.chunks} myId={myId} />
  }

  return <PrevChunk chunks={story.chunks} collapsible={collapsed} />
}
