import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { FEED_ADMIN_COOKIE, verifyFeedAdminSessionToken } from '../../../../../../lib/feed-admin-session'
import { hideThreadBySlug } from '../../../../../../lib/thread-store'

export const runtime = 'nodejs'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const cookieStore = await cookies()
  const token = cookieStore.get(FEED_ADMIN_COOKIE)?.value
  if (!verifyFeedAdminSessionToken(token)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const { slug } = await params
  const cleanSlug = slug?.trim()
  if (!cleanSlug) {
    return NextResponse.json({ ok: false, error: 'invalid slug' }, { status: 400 })
  }

  await hideThreadBySlug(cleanSlug)
  return NextResponse.json({ ok: true })
}
