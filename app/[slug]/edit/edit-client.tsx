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
    <main className="feed-root" style={{ padding: 16 }}>
      <section className="feed-shell" style={{ padding: '64px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 10 }}>
          <Link
            href={`/${slug}`}
            className="feed-text-12 feed-body-font"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <ChevronLeft size={14} />
            <span>back</span>
          </Link>
          <p className="feed-text-12" style={{ margin: 0, opacity: 0.7 }}>
            editing {thread.contentType} thread
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div>
            <p className="feed-text-12">title (optional)</p>
            <input className="feed-input" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>

          <div>
            <p className="feed-text-12">tags</p>
            <div style={{ display: 'grid', gap: 8 }}>
              {knownTags.map((tag) => {
                const checked = selectedTags.includes(tag)
                return (
                  <label
                    key={tag}
                    className="feed-text-12"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
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

          <div>
            <p className="feed-text-12">new tags (optional, comma separated)</p>
            <input
              className="feed-input"
              value={newTagInput}
              onChange={(event) => setNewTagInput(event.target.value)}
              placeholder="music, playlists"
            />
          </div>

          {thread.contentType === 'text' ? (
            <div>
              <p className="feed-text-12">content</p>
              <textarea
                className="feed-textarea"
                value={textContent}
                onChange={(event) => setTextContent(event.target.value)}
              />
            </div>
          ) : null}

          {thread.contentType === 'music' ? (
            <div>
              <p className="feed-text-12">spotify link</p>
              <input
                className="feed-input"
                value={spotifyUrl}
                onChange={(event) => setSpotifyUrl(event.target.value)}
                placeholder="https://open.spotify.com/track/..."
              />
            </div>
          ) : null}

          {thread.contentType === 'photo' ? (
            <div>
              <p className="feed-text-12">media URL</p>
              <input className="feed-input" value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} />
            </div>
          ) : null}

          <button className="feed-button" type="submit" disabled={loading || !canSave}>
            {loading ? 'saving...' : 'save changes'}
          </button>
        </form>
        {message ? <p className="feed-text-12">{message}</p> : null}
      </section>
    </main>
  )
}
