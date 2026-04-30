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
      <main className="min-h-screen bg-(--feed-bg) font-mono-normal tracking-tight text-(--feed-text)">
        <section className="mx-auto w-[min(768px,calc(100%-32px))] pt-16 pb-16">
          <div className="p-4 flex items-center justify-between gap-[10px]">
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-mono-normal text-label leading-none tracking-tight"
            >
              <ChevronLeft size={14} />
              <span>back</span>
            </Link>
            <Link href={`/${slug}/edit`} className="font-mono-normal text-label leading-none tracking-tight">
              edit
            </Link>
          </div>
          <div className="overflow-hidden rounded-[28px] border border-(--feed-border) bg-[rgba(225,220,218,0.01)]">
            <ThreadCard thread={thread} truncate={false} disableNavigation />
          </div>
        </section>
      </main>
    )
  }

  const tagFeed = await listThreadsByTagSlug(slug)
  if (!tagFeed) notFound()

  return (
    <main className="min-h-screen bg-(--feed-bg) font-mono-normal tracking-tight text-(--feed-text)">
      <section className="mx-auto w-[min(768px,calc(100%-32px))] pt-16 pb-16">
        <div className="p-4 flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-1 font-mono-normal text-label leading-none tracking-tight">
            <ChevronLeft size={14} />
            <span>back</span>
          </Link>
          <h1 className="m-0 font-mono-semibold text-tag leading-none tracking-tight text-(--feed-text-muted)">
            #{tagFeed.tagName}
          </h1>
        </div>
        <div className="overflow-hidden rounded-[28px] border border-(--feed-border) bg-[rgba(225,220,218,0.01)]">
          {tagFeed.threads.map((item) => (
            <ThreadCard key={item.id} thread={item} />
          ))}
        </div>
      </section>
    </main>
  )
}
