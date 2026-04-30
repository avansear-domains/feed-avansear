import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { FEED_ADMIN_COOKIE, verifyFeedAdminSessionToken } from '../../../../../lib/feed-admin-session'
import { updateThreadBySlug } from '../../../../../lib/thread-store'

export const runtime = 'nodejs'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const cookieStore = await cookies()
  const token = cookieStore.get(FEED_ADMIN_COOKIE)?.value
  if (!verifyFeedAdminSessionToken(token)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  let body: {
    title?: string
    textContent?: string
    mediaUrl?: string
    mediaKind?: string
    spotifyUrl?: string
    tags?: string[]
    newTags?: string[]
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid JSON.' }, { status: 400 })
  }

  const { slug } = await params
  const cleanSlug = slug?.trim()
  if (!cleanSlug) {
    return NextResponse.json({ ok: false, error: 'invalid slug' }, { status: 400 })
  }

  try {
    const thread = await updateThreadBySlug(cleanSlug, {
      title: body.title,
      body: body.textContent,
      mediaUrl: body.mediaUrl,
      mediaKind: body.mediaKind,
      spotifyUrl: body.spotifyUrl,
      tags: Array.isArray(body.tags) ? body.tags : [],
      newTags: Array.isArray(body.newTags) ? body.newTags : [],
    })
    if (!thread) {
      return NextResponse.json({ ok: false, error: 'thread not found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, thread })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'failed to update thread' },
      { status: 400 }
    )
  }
}
