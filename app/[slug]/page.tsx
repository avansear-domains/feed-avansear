import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ThreadCard } from '../components/thread-card'
import { getThreadBySlug, listThreadsByTagSlug } from '../../lib/thread-store'

export const dynamic = 'force-dynamic'

function firstMediaUrl(mediaUrl: string | undefined): string | undefined {
  if (!mediaUrl) return undefined
  const raw = mediaUrl.trim()
  if (!raw) return undefined
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw) as string[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0]
    } catch {
      return raw
    }
  }
  return raw
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const thread = await getThreadBySlug(slug)
  if (thread) {
    const title = thread.title || `${thread.contentType} thread`
    const description =
      thread.body?.slice(0, 160) ||
      (thread.contentType === 'music' ? 'music thread' : thread.contentType === 'photo' ? 'photo thread' : 'thread')

    const previewImage = firstMediaUrl(thread.mediaUrl)

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        images: previewImage ? [{ url: previewImage }] : undefined,
      },
      twitter: {
        card: previewImage ? 'summary_large_image' : 'summary',
        title,
        description,
        images: previewImage ? [previewImage] : undefined,
      },
    }
  }

  const tagFeed = await listThreadsByTagSlug(slug)
  if (!tagFeed) {
    return {
      title: 'not found',
      description: 'this page does not exist.',
    }
  }

  return {
    title: `#${tagFeed.tagName}`,
    description: `posts tagged with ${tagFeed.tagName}`,
    openGraph: {
      title: `#${tagFeed.tagName}`,
      description: `posts tagged with ${tagFeed.tagName}`,
      type: 'website',
    },
  }
}

export default async function ThreadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const thread = await getThreadBySlug(slug)
  if (thread) {
    return (
      <main className="feed-root">
        <section className="feed-shell" style={{ paddingTop: 64, paddingBottom: 64 }}>
          <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <Link
              href="/"
              className="feed-text-12 feed-body-font"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <ChevronLeft size={14} />
              <span>back</span>
            </Link>
            <Link href={`/${slug}/edit`} className="feed-text-12 feed-body-font">
              edit
            </Link>
          </div>
          <div className="feed-threads-wrap">
            <ThreadCard thread={thread} truncate={false} disableNavigation />
          </div>
        </section>
      </main>
    )
  }

  const tagFeed = await listThreadsByTagSlug(slug)
  if (!tagFeed) notFound()

  return (
    <main className="feed-root">
      <section className="feed-shell" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Link href="/" className="feed-text-12 feed-body-font" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ChevronLeft size={14} />
            <span>back</span>
          </Link>
          <h1 className="feed-text-14 feed-title-font" style={{ margin: 0, color: 'var(--feed-text-muted)' }}>
            #{tagFeed.tagName}
          </h1>
        </div>
        <div className="feed-threads-wrap">
          {tagFeed.threads.map((item) => (
            <ThreadCard key={item.id} thread={item} />
          ))}
        </div>
      </section>
    </main>
  )
}
