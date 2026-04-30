import { NextResponse } from 'next/server'
import YouTube from 'youtube-sr'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let body: { songName?: string; artist?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 })
  }

  const songName = body.songName?.trim()
  const artist = body.artist?.trim()
  if (!songName || !artist) {
    return NextResponse.json({ ok: false, error: 'songName and artist required' }, { status: 400 })
  }

  try {
    const query = `${songName} ${artist}`.trim()
    const videos = await YouTube.search(query, { type: 'video', limit: 5 })
    const best = videos.find((item) => item.id) || videos[0]
    if (!best?.id) {
      return NextResponse.json({ ok: true, youtubeId: null })
    }
    return NextResponse.json({ ok: true, youtubeId: best.id })
  } catch {
    return NextResponse.json({ ok: true, youtubeId: null })
  }
}
