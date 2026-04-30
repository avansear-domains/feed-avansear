'use client'

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { ThreadItem } from '../../components/types'

interface EditClientProps {
  slug: string
  thread: ThreadItem
  initialTags: string[]
  initiallyAuthorized: boolean
}

export function EditClient({ slug, thread, initialTags, initiallyAuthorized }: EditClientProps) {
  const [authorized, setAuthorized] = useState(initiallyAuthorized)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const [title, setTitle] = useState(thread.title || '')
  const [textContent, setTextContent] = useState(thread.body || '')
  const [spotifyUrl, setSpotifyUrl] = useState(thread.spotifyUrl || '')
  const [mediaUrl, setMediaUrl] = useState(thread.mediaUrl || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(thread.tags)
  const [newTagInput, setNewTagInput] = useState('')
  const [knownTags, setKnownTags] = useState(Array.from(new Set([...initialTags, ...thread.tags])))

  const parsedNewTags = useMemo(
    () =>
      newTagInput
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    [newTagInput]
  )

  const canSave = useMemo(() => {
    if (thread.contentType === 'text') return textContent.trim().length > 0
    if (thread.contentType === 'music') return spotifyUrl.trim().length > 0
    if (thread.contentType === 'photo') return mediaUrl.trim().length > 0
    return true
  }, [mediaUrl, spotifyUrl, textContent, thread.contentType])

  async function ensureAuthorized(): Promise<boolean> {
    if (authorized) return true
    const password = window.prompt('enter CUSTOM_PASS to edit this post:')
    if (!password) {
      setMessage('edit cancelled.')
      return false
    }
    const loginResponse = await fetch('/api/feed/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const loginData = (await loginResponse.json().catch(() => ({}))) as { ok?: boolean; error?: string }
    if (!loginResponse.ok || !loginData.ok) {
      setMessage(loginData.error || 'auth failed.')
      return false
    }
    setAuthorized(true)
    return true
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSave) return
    setLoading(true)
    setMessage('')
    try {
      const ok = await ensureAuthorized()
      if (!ok) return

      const response = await fetch(`/api/feed/items/${encodeURIComponent(slug)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          textContent,
          spotifyUrl,
          mediaUrl,
          mediaKind: thread.mediaKind,
          tags: selectedTags,
          newTags: parsedNewTags,
        }),
      })
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!response.ok || !data.ok) {
        setMessage(data.error || 'failed to save edits')
        return
      }
      setKnownTags((prev) => Array.from(new Set([...prev, ...parsedNewTags])))
      if (parsedNewTags.length > 0) {
        setSelectedTags((prev) => Array.from(new Set([...prev, ...parsedNewTags])))
      }
      setNewTagInput('')
      setMessage('saved')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-(--feed-bg) p-4 font-mono-normal tracking-tight text-(--feed-text)">
      <section className="mx-auto w-[min(768px,calc(100%-32px))] px-4 pt-16 pb-4">
        <div className="mb-3 flex items-center gap-[10px]">
          <Link
            href={`/${slug}`}
            className="inline-flex items-center gap-1 font-mono-normal text-label leading-none tracking-tight"
          >
            <ChevronLeft size={14} />
            <span>back</span>
          </Link>
          <p className="m-0 text-label leading-none tracking-tight opacity-70">
            editing {thread.contentType} thread
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <p className="text-label leading-none tracking-tight">title (optional)</p>
            <input
              className="w-full rounded-[12px] border border-(--feed-border) bg-transparent px-3 py-2.5 font-mono-normal text-content tracking-tight text-(--feed-text)"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <p className="text-label leading-none tracking-tight">tags</p>
            <div className="grid gap-2">
              {knownTags.map((tag) => {
                const checked = selectedTags.includes(tag)
                return (
                  <label
                    key={tag}
                    className="flex cursor-pointer items-center gap-2 text-label leading-none tracking-tight"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedTags((prev) => (checked ? prev.filter((item) => item !== tag) : [...prev, tag]))
                      }
                    />
                    {tag}
                  </label>
                )
              })}
            </div>
          </div>

          <div className="grid gap-2">
            <p className="text-label leading-none tracking-tight">new tags (optional, comma separated)</p>
            <input
              className="w-full rounded-[12px] border border-(--feed-border) bg-transparent px-3 py-2.5 font-mono-normal text-content tracking-tight text-(--feed-text)"
              value={newTagInput}
              onChange={(event) => setNewTagInput(event.target.value)}
              placeholder="music, playlists"
            />
          </div>

          {thread.contentType === 'text' ? (
            <div className="grid gap-2">
              <p className="text-label leading-none tracking-tight">content</p>
              <textarea
                className="min-h-[140px] w-full rounded-[12px] border border-(--feed-border) bg-transparent px-3 py-2.5 font-mono-normal text-content leading-[1.25] tracking-tight text-(--feed-text)"
                value={textContent}
                onChange={(event) => setTextContent(event.target.value)}
              />
            </div>
          ) : null}

          {thread.contentType === 'music' ? (
            <div className="grid gap-2">
              <p className="text-label leading-none tracking-tight">spotify link</p>
              <input
                className="w-full rounded-[12px] border border-(--feed-border) bg-transparent px-3 py-2.5 font-mono-normal text-content tracking-tight text-(--feed-text)"
                value={spotifyUrl}
                onChange={(event) => setSpotifyUrl(event.target.value)}
                placeholder="https://open.spotify.com/track/..."
              />
            </div>
          ) : null}

          {thread.contentType === 'photo' ? (
            <div className="grid gap-2">
              <p className="text-label leading-none tracking-tight">media URL</p>
              <input
                className="w-full rounded-[12px] border border-(--feed-border) bg-transparent px-3 py-2.5 font-mono-normal text-content tracking-tight text-(--feed-text)"
                value={mediaUrl}
                onChange={(event) => setMediaUrl(event.target.value)}
              />
            </div>
          ) : null}

          <button
            className="cursor-pointer rounded-full border border-[#e1dcda] bg-[#e1dcda] px-[14px] py-[10px] font-mono-normal text-[#1b1817] transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-35"
            type="submit"
            disabled={loading || !canSave}
          >
            {loading ? 'saving...' : 'save changes'}
          </button>
        </form>
        {message ? <p className="text-label leading-none tracking-tight">{message}</p> : null}
      </section>
    </main>
  )
}
