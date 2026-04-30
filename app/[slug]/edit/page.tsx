import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { FEED_ADMIN_COOKIE, verifyFeedAdminSessionToken } from '../../../lib/feed-admin-session'
import { getThreadBySlug, listTagsByPopularity } from '../../../lib/thread-store'
import { EditClient } from './edit-client'

export const dynamic = 'force-dynamic'

export default async function EditThreadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [thread, tags] = await Promise.all([getThreadBySlug(slug), listTagsByPopularity().catch(() => [])])
  if (!thread) notFound()

  const cookieStore = await cookies()
  const token = cookieStore.get(FEED_ADMIN_COOKIE)?.value
  const initiallyAuthorized = verifyFeedAdminSessionToken(token)

  return (
    <EditClient
      slug={slug}
      thread={thread}
      initialTags={tags.map((tag) => tag.name)}
      initiallyAuthorized={initiallyAuthorized}
    />
  )
}
