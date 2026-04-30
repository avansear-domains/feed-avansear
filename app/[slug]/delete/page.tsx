import { cookies } from 'next/headers'
import { FEED_ADMIN_COOKIE, verifyFeedAdminSessionToken } from '../../../lib/feed-admin-session'
import { DeleteClient } from './delete-client'

export const dynamic = 'force-dynamic'

export default async function DeletePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get(FEED_ADMIN_COOKIE)?.value
  const initiallyAuthorized = verifyFeedAdminSessionToken(token)

  return <DeleteClient slug={slug} initiallyAuthorized={initiallyAuthorized} />
}
