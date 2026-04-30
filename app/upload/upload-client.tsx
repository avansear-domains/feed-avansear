'use client'

import { Image as ImageIcon, Music2, Type } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ThreadContentType } from '../components/types'

interface UploadClientProps {
  initialAuthenticated: boolean
  customPassConfigured: boolean
  initialTags: string[]
}

const CONTENT_TYPES: { id: ThreadContentType; label: string; icon: React.ReactNode }[] = [
  { id: 'photo', label: 'photo', icon: <ImageIcon size={16} /> },
  { id: 'text', label: 'text', icon: <Type size={16} /> },
  { id: 'music', label: 'music', icon: <Music2 size={16} /> },
]

export function UploadClient({
  initialAuthenticated,
  customPassConfigured,
  initialTags,
}: UploadClientProps) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const [title, setTitle] = useState('')
  const [contentType, setContentType] = useState<ThreadContentType>('text')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newTagInput, setNewTagInput] = useState('')
  const [knownTags, setKnownTags] = useState(initialTags)
  const [textContent, setTextContent] = useState('')
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const canPost = useMemo(() => {
    if (contentType === 'text') return textContent.trim().length > 0
    if (contentType === 'music') return spotifyUrl.trim().length > 0
    return selectedFiles.length > 0
  }, [contentType, selectedFiles.length, spotifyUrl, textContent])

  const parsedNewTags = useMemo(
    () =>
      newTagInput
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    [newTagInput]
  )

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/feed/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!response.ok || !data.ok) {
        setMessage(data.error || 'login failed')
        return
      }
      setAuthenticated(true)
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canPost || !contentType) return
    setLoading(true)
    setMessage('')
    try {
      let mediaUrl = ''
      let mediaKind: 'image' | 'gif' | '' = ''

      if (contentType === 'photo') {
        if (selectedFiles.length === 0) {
          setMessage('add at least one photo')
          return
        }

        const uploadedUrls: string[] = []
        let firstKind: 'image' | 'gif' = 'image'

        for (const file of selectedFiles) {
          const formData = new FormData()
          formData.append('file', file)
          const response = await fetch('/api/feed/upload', { method: 'POST', body: formData })
          const data = (await response.json().catch(() => ({}))) as {
            ok?: boolean
            error?: string
            url?: string
            mediaKind?: 'image' | 'gif'
          }
          if (!response.ok || !data.ok || !data.url) {
            setMessage(data.error || 'upload failed')
            return
          }
          if (uploadedUrls.length === 0) {
            firstKind = data.mediaKind || 'image'
          }
          uploadedUrls.push(data.url)
        }

        mediaUrl = uploadedUrls.length === 1 ? uploadedUrls[0] : JSON.stringify(uploadedUrls)
        mediaKind = uploadedUrls.length > 1 ? 'image' : firstKind
      }

      const response = await fetch('/api/feed/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          contentType,
          textContent,
          spotifyUrl,
          mediaUrl,
          mediaKind,
          tags: selectedTags,
          newTags: parsedNewTags,
        }),
      })
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!response.ok || !data.ok) {
        setMessage(data.error || 'failed to post')
        return
      }
      setKnownTags((prev) => Array.from(new Set([...parsedNewTags, ...prev])))
      setTitle('')
      setTextContent('')
      setSpotifyUrl('')
      setSelectedFiles([])
      setSelectedTags([])
      setNewTagInput('')
      setMessage('posted')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="feed-root" style={{ padding: 16 }}>
      <section className="feed-shell" style={{ padding: 16 }}>
        {!customPassConfigured ? <p className="feed-text-14">set CUSTOM_PASS in env first.</p> : null}
        {!authenticated ? (
          <form onSubmit={handleLogin} style={{ display: 'grid', gap: 12 }}>
            <input
              className="feed-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="CUSTOM_PASS"
            />
            <button className="feed-button" type="submit" disabled={loading || !customPassConfigured}>
              {loading ? 'checking...' : 'unlock upload'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            <div>
              <p className="feed-text-12">title (optional)</p>
              <input
                className="feed-input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="thread title"
              />
            </div>

            <div>
              <p className="feed-text-12">content type (required)</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {CONTENT_TYPES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="feed-button"
                    onClick={() => setContentType(item.id)}
                    style={{
                      borderColor: contentType === item.id ? 'var(--feed-text)' : 'var(--feed-border)',
                      background: contentType === item.id ? 'rgba(225,220,218,0.1)' : 'transparent',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="feed-text-12">tags (optional)</p>
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
                          setSelectedTags((prev) =>
                            checked ? prev.filter((item) => item !== tag) : [...prev, tag]
                          )
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
                placeholder="design, daily, songs"
              />
            </div>

            {contentType === 'text' ? (
              <div>
                <p className="feed-text-12">content</p>
                <textarea
                  className="feed-textarea"
                  value={textContent}
                  onChange={(event) => setTextContent(event.target.value)}
                  placeholder="write your thread..."
                />
              </div>
            ) : null}

            {contentType === 'music' ? (
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

            {contentType === 'photo' ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <p className="feed-text-12">upload photo(s)</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                />
                {selectedFiles.length > 0 ? (
                  <p className="feed-text-12">{selectedFiles.length} selected</p>
                ) : null}
              </div>
            ) : null}

            <button className="feed-button" type="submit" disabled={loading || !canPost}>
              {loading ? 'posting...' : 'post'}
            </button>
          </form>
        )}
        {message ? <p className="feed-text-12">{message}</p> : null}
      </section>
    </main>
  )
}
