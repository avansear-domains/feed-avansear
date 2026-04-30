import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ThreadCard } from '../components/thread-card'
import { getThreadBySlug } from '../../lib/thread-store'

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
  if (!thread) {
    return {
      title: 'thread not found',
      description: 'this thread does not exist.',
    }
  }

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

export default async function ThreadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const thread = await getThreadBySlug(slug)
  if (!thread) notFound()

  return (
    <main className="feed-root">
      <section className="feed-shell" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <div style={{ padding: 16, display: 'flex', alignItems: 'center' }}>
          <Link href="/" className="feed-text-12 feed-body-font" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ChevronLeft size={14} />
            <span>back</span>
          </Link>
        </div>
        <div className="feed-threads-wrap">
          <ThreadCard thread={thread} truncate={false} disableNavigation />
        </div>
      </section>
    </main>
  )
}
