import Link from 'next/link'
import { SongCard } from './song-card'
import type { ThreadItem } from './types'

interface ThreadCardProps {
  thread: ThreadItem
  truncate?: boolean
  disableNavigation?: boolean
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
        className={
          truncate
            ? 'flex gap-2 overflow-x-auto overflow-y-hidden pb-0.5 justify-start items-start [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
            : 'flex flex-col gap-2 overflow-visible justify-start items-stretch pb-0.5'
        }
      >
        {urls.map((url, idx) => (
          <img
            key={`${url}-${idx}`}
            src={url}
            alt={thread.title || 'thread image'}
            className={truncate ? 'block h-auto w-auto max-h-[280px] max-sm:!max-h-[140px] rounded-[14px] object-contain shrink-0' : 'block h-auto w-full rounded-[14px] object-cover shrink-0'}
            style={{
              maxHeight: truncate ? 280 : 'none',
            }}
          />
        ))}
      </div>
    )
  }

  if (!thread.body) return null
  return (
    <p
      className="m-0 font-mono-normal text-content tracking-tight leading-[1.25] text-(--feed-text-muted)"
      style={{
        whiteSpace: truncate ? 'normal' : 'pre-wrap',
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

export function ThreadCard({ thread, truncate = true, disableNavigation = false }: ThreadCardProps) {
  const isMusic = thread.contentType === 'music'
  const isPhoto = thread.contentType === 'photo'
  const hasTags = thread.tags.length > 0
  const hasTitle = Boolean(thread.title)
  const tagLinks = thread.tags.map((tag) => (
    <Link
      key={tag}
      href={`/${encodeURIComponent(tag.toLowerCase().replace(/\s+/g, '-'))}`}
      className="inline-flex items-center rounded-full bg-[#e1dcda] px-2 py-1 text-tag font-mono-normal-italic tracking-tight text-[#141212]"
    >
      {tag}
    </Link>
  ))
  const titleNode = hasTitle ? (
    <h2
      className="m-0 font-semibold text-heading leading-none tracking-tight"
      style={{
        overflow: truncate ? 'hidden' : 'visible',
        textOverflow: truncate ? 'ellipsis' : 'clip',
        whiteSpace: truncate ? 'nowrap' : 'normal',
      }}
    >
      {disableNavigation ? thread.title : <Link href={`/${thread.slug}`}>{thread.title}</Link>}
    </h2>
  ) : null

  const bodyNode = disableNavigation ? (
    <ThreadBody thread={thread} truncate={truncate} />
  ) : (
    <Link href={`/${thread.slug}`} className="block">
      <ThreadBody thread={thread} truncate={truncate} />
    </Link>
  )

  return (
    <article className="border-t border-(--feed-border) p-4">
      <div
        style={{
          maxHeight: truncate && !isMusic && !isPhoto ? 250 : 'none',
          overflow: truncate && !isMusic && !isPhoto ? 'hidden' : 'visible',
        }}
      >
        {isMusic ? (
          <div className="flex items-end justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {titleNode}
              {bodyNode}
            </div>
            {hasTags ? <div className="flex min-w-max flex-1 flex-wrap justify-end gap-2">{tagLinks}</div> : null}
          </div>
        ) : isPhoto ? (
          <div className="flex flex-wrap items-end justify-start gap-4">
            <div className="flex min-w-0 flex-[1_1_auto] flex-col gap-2">
              {titleNode}
              {bodyNode}
            </div>
            {hasTags ? (
              <div className="ml-auto flex max-w-full min-w-max flex-wrap justify-end gap-2">{tagLinks}</div>
            ) : null}
          </div>
        ) : (
          <>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {titleNode}
              {bodyNode}
            </div>
            {hasTags ? <div className="mt-4 flex flex-wrap justify-end gap-2">{tagLinks}</div> : null}
          </>
        )}
      </div>
    </article>
  )
}
