import { useEffect, useRef, useState } from 'react'
import initialPages from './content.json'

// npm run dev のときだけ編集できる。公開サイトは読むだけ
const EDITABLE = import.meta.env.DEV

const uid = () => Math.random().toString(36).slice(2, 10)
const newBlock = (type = 'text', text = '') => ({ id: uid(), type, text, done: false })
const newPage = (title = '') => ({ id: uid(), icon: '📄', title, blocks: [newBlock()] })

const pageIdFromHash = () => decodeURIComponent(location.hash.slice(1))

export default function App() {
  const [pages, setPages] = useState(initialPages)
  const [currentId, setCurrentId] = useState(pageIdFromHash)
  const [focusId, setFocusId] = useState(null)
  const refs = useRef({})

  const page = pages.find((p) => p.id === currentId) ?? pages[0]

  // URLの #ページID でページを切り替える（リンクを人に送れる）
  useEffect(() => {
    const onHash = () => setCurrentId(pageIdFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.title = page.title || '無題'
  }, [page.title])

  // 編集した内容を少し待ってから src/content.json に保存
  useEffect(() => {
    if (!EDITABLE || pages === initialPages) return
    const timer = setTimeout(() => {
      fetch('/__save', { method: 'POST', body: JSON.stringify(pages) })
    }, 500)
    return () => clearTimeout(timer)
  }, [pages])

  useEffect(() => {
    if (focusId) refs.current[focusId]?.focus()
  }, [focusId])

  const updatePage = (patch) =>
    setPages((ps) => ps.map((p) => (p.id === page.id ? { ...p, ...patch } : p)))

  const setBlocks = (fn) => updatePage({ blocks: fn(page.blocks) })

  const updateBlock = (id, patch) =>
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)))

  const onChange = (block, text) => {
    // Notion風のショートカット
    if (block.type !== 'h1' && text.startsWith('# ')) return updateBlock(block.id, { type: 'h1', text: text.slice(2) })
    if (block.type !== 'todo' && text.startsWith('[] ')) return updateBlock(block.id, { type: 'todo', text: text.slice(3) })
    updateBlock(block.id, { text })
  }

  const onKeyDown = (e, block, index) => {
    if (e.nativeEvent.isComposing) return // 日本語変換中のEnterは無視
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const next = newBlock(block.type === 'todo' ? 'todo' : 'text')
      setBlocks((bs) => [...bs.slice(0, index + 1), next, ...bs.slice(index + 1)])
      setFocusId(next.id)
    } else if (e.key === 'Backspace' && block.text === '') {
      e.preventDefault()
      if (block.type !== 'text') return updateBlock(block.id, { type: 'text' })
      if (page.blocks.length === 1) return
      setBlocks((bs) => bs.filter((b) => b.id !== block.id))
      setFocusId(page.blocks[Math.max(0, index - 1)].id)
    }
  }

  const addPage = () => {
    const p = newPage()
    setPages((ps) => [...ps, p])
    window.location.assign(`#${p.id}`)
  }

  const deletePage = (id) => {
    if (pages.length === 1 || !confirm('このページを削除しますか？')) return
    const rest = pages.filter((p) => p.id !== id)
    setPages(rest)
    if (id === page.id) window.location.assign(`#${rest[0].id}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-stone-800 md:flex-row">
      <aside className="border-b border-stone-200 bg-stone-50 p-3 md:w-60 md:shrink-0 md:border-r md:border-b-0">
        <p className="mb-2 px-2 text-xs font-semibold text-stone-500">ページ</p>
        <ul className="flex gap-1 overflow-x-auto md:block md:space-y-0.5">
          {pages.map((p) => (
            <li key={p.id} className="group flex shrink-0 items-center">
              <a
                href={`#${p.id}`}
                className={`flex-1 truncate rounded px-2 py-1 text-sm hover:bg-stone-200 ${
                  p.id === page.id ? 'bg-stone-200 font-medium' : ''
                }`}
              >
                {p.icon} {p.title || '無題'}
              </a>
              {EDITABLE && (
                <button
                  onClick={() => deletePage(p.id)}
                  className="px-2 text-stone-400 opacity-0 group-hover:opacity-100 hover:text-stone-700"
                  aria-label="ページを削除"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
        {EDITABLE && (
          <button onClick={addPage} className="mt-2 w-full rounded px-2 py-1 text-left text-sm text-stone-500 hover:bg-stone-200">
            ＋ 新しいページ
          </button>
        )}
      </aside>

      <main className="mx-auto w-full max-w-3xl px-6 py-12 md:px-16">
        {EDITABLE ? (
          <>
            <button
              onClick={() => {
                const icon = prompt('アイコンにする絵文字を入力', page.icon)
                if (icon) updatePage({ icon })
              }}
              className="mb-2 text-6xl"
              aria-label="アイコンを変更"
            >
              {page.icon}
            </button>
            <input
              value={page.title}
              onChange={(e) => updatePage({ title: e.target.value })}
              placeholder="無題"
              className="mb-6 w-full text-4xl font-bold outline-none placeholder:text-stone-300"
            />
          </>
        ) : (
          <>
            <div className="mb-2 text-6xl">{page.icon}</div>
            <h1 className="mb-6 text-4xl font-bold">{page.title || '無題'}</h1>
          </>
        )}

        {page.blocks.map((block, i) => (
          <div key={block.id} className="flex items-start gap-2 py-0.5">
            {block.type === 'todo' && (
              <input
                type="checkbox"
                checked={block.done}
                disabled={!EDITABLE}
                onChange={(e) => updateBlock(block.id, { done: e.target.checked })}
                className="mt-1.5 size-4 accent-stone-700"
              />
            )}
            {EDITABLE ? (
              <textarea
                ref={(el) => (refs.current[block.id] = el)}
                rows={1}
                value={block.text}
                onChange={(e) => onChange(block, e.target.value)}
                onKeyDown={(e) => onKeyDown(e, block, i)}
                placeholder={block.type === 'h1' ? '見出し' : '入力するか「# 」「[] 」で変換'}
                className={`field-sizing-content w-full resize-none outline-none placeholder:text-transparent focus:placeholder:text-stone-300 ${blockStyle(block)}`}
              />
            ) : block.type === 'h1' ? (
              <h2 className={blockStyle(block)}>{block.text}</h2>
            ) : (
              <p className={`min-h-7 whitespace-pre-wrap ${blockStyle(block)}`}>{block.text}</p>
            )}
          </div>
        ))}
      </main>
    </div>
  )
}

function blockStyle(block) {
  if (block.type === 'h1') return 'mt-4 text-2xl font-semibold'
  if (block.type === 'todo' && block.done) return 'leading-7 text-stone-400 line-through'
  return 'leading-7'
}
