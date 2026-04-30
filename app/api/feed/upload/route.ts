import sharp from 'sharp'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { FEED_ADMIN_COOKIE, verifyFeedAdminSessionToken } from '../../../../lib/feed-admin-session'
import { isWorkerUploadConfigured, uploadBufferViaWorker } from '../../../../lib/cloudflare-worker-upload'

export const runtime = 'nodejs'

function isGif(file: File): boolean {
  const name = file.name.toLowerCase()
  return file.type === 'image/gif' || name.endsWith('.gif')
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get(FEED_ADMIN_COOKIE)?.value
  const authorized = verifyFeedAdminSessionToken(token)
  if (!authorized) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  if (!isWorkerUploadConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Worker upload not configured. Set CLOUDFLARE_WORKER_URL.' },
      { status: 503 }
    )
  }

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'file is required.' }, { status: 400 })
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: 'max file size is 25MB.' }, { status: 400 })
  }

  try {
    const input = new Uint8Array(await file.arrayBuffer())
    if (isGif(file)) {
      const uploaded = await uploadBufferViaWorker({
        buffer: input,
        extension: 'gif',
        contentType: 'image/gif',
      })
      return NextResponse.json({ ok: true, mediaKind: 'gif', ...uploaded })
    }

    const jpg = await sharp(input).jpeg({ quality: 90 }).toBuffer()
    const uploaded = await uploadBufferViaWorker({
      buffer: new Uint8Array(jpg),
      extension: 'jpg',
      contentType: 'image/jpeg',
    })
    return NextResponse.json({ ok: true, mediaKind: 'image', ...uploaded })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'upload failed' },
      { status: 500 }
    )
  }
}
