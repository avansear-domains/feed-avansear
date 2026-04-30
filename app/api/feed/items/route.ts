import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { FEED_ADMIN_COOKIE, verifyFeedAdminSessionToken } from '../../../../lib/feed-admin-session'
import {
  createThread,
  hideThreadBySlug,
  listTagsByPopularity,
  listThreads,
  type ThreadContentType,
} from '../../../../lib/thread-store'

export const runtime = 'nodejs'

const ALLOWED_TYPES: ThreadContentType[] = ['text', 'photo', 'music']

function isAuthorized(token: string | undefined): boolean {
  return verifyFeedAdminSessionToken(token)
}

export async function GET() {
  const [threads, tags] = await Promise.all([listThreads(), listTagsByPopularity()])
  return NextResponse.json({ ok: true, threads, tags })
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  if (!isAuthorized(cookieStore.get(FEED_ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  let body: {
    title?: string
    contentType?: ThreadContentType
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

  const contentType = body.contentType
  if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ ok: false, error: 'invalid content type.' }, { status: 400 })
  }

  try {
    const thread = await createThread({
      title: body.title,
      contentType,
      body: body.textContent,
      mediaUrl: body.mediaUrl,
      mediaKind: body.mediaKind,
      spotifyUrl: body.spotifyUrl,
      tags: Array.isArray(body.tags) ? body.tags : [],
      newTags: Array.isArray(body.newTags) ? body.newTags : [],
    })
    return NextResponse.json({ ok: true, thread })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'failed to create thread' },
      { status: 400 }
    )
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies()
  if (!isAuthorized(cookieStore.get(FEED_ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  let body: { slug?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid JSON.' }, { status: 400 })
  }

  const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
  if (!slug) {
    return NextResponse.json({ ok: false, error: 'slug is required.' }, { status: 400 })
  }

  await hideThreadBySlug(slug)
  return NextResponse.json({ ok: true })
}
