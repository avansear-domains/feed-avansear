import Link from 'next/link'
import { SongCard } from './song-card'
import type { ThreadItem } from './types'

interface ThreadCardProps {
  thread: ThreadItem
  truncate?: boolean
}

function parsePhotoUrls(mediaUrl: string | undefined): string[] {
  if (!mediaUrl) return []
  const raw = mediaUrl.trim()
  if (!raw) return []
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw) as string[]
      if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === 'string' && item.trim().length > 0)
    } catch {
      // fallback below
    }
  }
  return [raw]
}

function ThreadBody({ thread, truncate }: { thread: ThreadItem; truncate: boolean }) {
  if (thread.contentType === 'music' && thread.spotifyUrl) {
    return <SongCard spotifyUrl={thread.spotifyUrl} />
  }

  if (thread.contentType === 'photo' && thread.mediaUrl) {
    const urls = parsePhotoUrls(thread.mediaUrl)
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: truncate ? 'row' : 'column',
          gap: 8,
          overflowX: truncate ? 'auto' : 'visible',
          overflowY: truncate ? 'hidden' : 'visible',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          paddingBottom: 2,
        }}
      >
        {urls.map((url, idx) => (
          <img
            key={`${url}-${idx}`}
            src={url}
            alt={thread.title || 'thread image'}
            className={truncate ? 'feed-photo feed-photo--truncate' : 'feed-photo'}
            style={{
              display: 'block',
              flex: '0 0 auto',
              width: truncate ? 'auto' : '100%',
              height: 'auto',
              maxHeight: truncate ? 280 : 680,
              borderRadius: 14,
              objectFit: 'contain',
            }}
          />
        ))}
      </div>
    )
  }

  if (!thread.body) return null
  return (
    <p
      className="feed-text-14 feed-body-font feed-body-copy"
      style={{
        margin: 0,
        color: 'var(--feed-text-muted)',
        display: truncate ? '-webkit-box' : 'block',
        WebkitLineClamp: truncate ? 4 : 'unset',
        WebkitBoxOrient: truncate ? 'vertical' : 'unset',
        overflow: truncate ? 'hidden' : 'visible',
        textOverflow: truncate ? 'ellipsis' : 'clip',
      }}
    >
      {thread.body}
    </p>
  )
}

export function ThreadCard({ thread, truncate = true }: ThreadCardProps) {
  const isMusic = thread.contentType === 'music'
  const isPhoto = thread.contentType === 'photo'
  const hasTags = thread.tags.length > 0
  const hasTitle = Boolean(thread.title)

  return (
    <article style={{ borderTop: '1px solid var(--feed-border)', padding: 16 }}>
      <div
        style={{
          maxHeight: truncate && !isMusic && !isPhoto ? 250 : 'none',
          overflow: truncate && !isMusic && !isPhoto ? 'hidden' : 'visible',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {hasTitle ? (
            <h2
              className="feed-text-24 feed-title-font"
              style={{
                margin: 0,
                overflow: truncate ? 'hidden' : 'visible',
                textOverflow: truncate ? 'ellipsis' : 'clip',
                whiteSpace: truncate ? 'nowrap' : 'normal',
              }}
            >
              <Link href={`/${thread.slug}`}>{thread.title}</Link>
            </h2>
          ) : null}
          {isMusic ? (
            <ThreadBody thread={thread} truncate={truncate} />
          ) : (
            <Link href={`/${thread.slug}`} style={{ display: 'block' }}>
              <ThreadBody thread={thread} truncate={truncate} />
            </Link>
          )}
        </div>
        {hasTags ? (
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {thread.tags.map((tag) => (
              <span key={tag} className="feed-pill">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}
