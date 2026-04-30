import { cookies } from 'next/headers'
import { FEED_ADMIN_COOKIE, verifyFeedAdminSessionToken } from '../../lib/feed-admin-session'
import { listTagsByPopularity } from '../../lib/thread-store'
import { UploadClient } from './upload-client'

export const dynamic = 'force-dynamic'

export default async function UploadPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(FEED_ADMIN_COOKIE)?.value
  const authenticated = verifyFeedAdminSessionToken(token)
  const customPassConfigured = Boolean(process.env.CUSTOM_PASS)
  const workerUploadUrl = process.env.CLOUDFLARE_WORKER_URL?.replace(/\/$/, '') || ''
  const tags = await listTagsByPopularity().catch(() => [])

  return (
    <UploadClient
      initialAuthenticated={authenticated}
      customPassConfigured={customPassConfigured}
      workerUploadUrl={workerUploadUrl}
      initialTags={tags.map((tag) => tag.name)}
    />
  )
}
