'use client'
import { Story } from '@/lib/types'

interface Props { story: Story }

function toText(story: Story) {
  return story.chunks.map((c, i) => `[${i + 1}번째 · ${c.authorNickname}]\n${c.content}`).join('\n\n---\n\n')
}

function toMarkdown(story: Story) {
  return ['# 우리들의 이야기\n', ...story.chunks.map((c, i) =>
    `## ${i + 1}번째 이야기\n\n${c.content}\n\n> — ${c.authorNickname}가 썼어요\n`
  )].join('\n')
}

function download(content: string, name: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  URL.revokeObjectURL(url)
}

export default function ExportButtons({ story }: Props) {
  const exportPdf = async () => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    doc.setFontSize(22)
    doc.text('우리들의 이야기', 105, 40, { align: 'center' })
    doc.setFontSize(11)
    const authors = story.chunks.map(c => c.authorNickname).filter((v, i, a) => a.indexOf(v) === i)
    doc.text(`참여: ${authors.join(', ')}`, 105, 54, { align: 'center' })
    doc.text(new Date().toLocaleDateString('ko-KR'), 105, 62, { align: 'center' })
    let y = 78
    story.chunks.forEach((chunk, i) => {
      if (y > 250) { doc.addPage(); y = 20 }
      doc.setFontSize(13); doc.text(`${i + 1}번째 이야기`, 20, y); y += 8
      doc.setFontSize(11)
      doc.splitTextToSize(chunk.content, 170).forEach((line: string) => {
        if (y > 270) { doc.addPage(); y = 20 }
        doc.text(line, 20, y); y += 6
      })
      doc.setFontSize(9); doc.text(`— ${chunk.authorNickname}`, 20, y); y += 12
    })
    doc.save('우리들의_이야기.pdf')
  }

  const exportPng = () => {
    alert('PNG 내보내기는 준비 중이에요. TXT 또는 PDF를 이용해주세요.')
  }

  const exports = [
    { label: 'TXT', caption: '글만',     action: () => download(toText(story), '우리들의_이야기.txt', 'text/plain;charset=utf-8') },
    { label: 'MD',  caption: '마크다운', action: () => download(toMarkdown(story), '우리들의_이야기.md', 'text/markdown;charset=utf-8') },
    { label: 'PDF', caption: '인쇄용',   action: exportPdf },
    { label: 'PNG', caption: '이미지',   action: exportPng },
  ]

  return (
    <div className="bg-paper-0 rounded-lg border border-subtle shadow-sm p-4">
      <p className="text-xs text-fg-3 mb-3 font-medium">이야기 저장하기</p>
      <div className="export-grid">
        {exports.map(({ label, caption, action }) => (
          <button key={label} onClick={action} className="export-btn">
            <b>{label}</b>
            <span>{caption}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
