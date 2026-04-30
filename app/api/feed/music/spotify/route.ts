import { NextResponse } from 'next/server'

interface SpotifyTokenResponse {
  access_token: string
}

interface SpotifyTrackResponse {
  name: string
  artists: Array<{ name: string }>
  album: {
    name: string
    images: Array<{ url: string }>
  }
}

function parseSpotifyTrackId(spotifyUrl: string): string | null {
  const match = spotifyUrl.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/)
  return match?.[1] || null
}

async function getSpotifyAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })
  if (!response.ok) {
    throw new Error('spotify auth failed')
  }
  const data = (await response.json()) as SpotifyTokenResponse
  return data.access_token
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.json({ ok: false, error: 'spotify credentials missing' }, { status: 503 })
  }

  const url = new URL(request.url)
  const spotifyUrl = url.searchParams.get('spotifyUrl')?.trim() || ''
  const trackId = parseSpotifyTrackId(spotifyUrl)
  if (!trackId) {
    return NextResponse.json({ ok: false, error: 'invalid spotify track url' }, { status: 400 })
  }

  try {
    const accessToken = await getSpotifyAccessToken(clientId, clientSecret)
    const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) {
      return NextResponse.json({ ok: false, error: 'failed to fetch spotify track' }, { status: 502 })
    }

    const data = (await response.json()) as SpotifyTrackResponse
    return NextResponse.json({
      ok: true,
      songName: data.name || null,
      artist: data.artists?.map((item) => item.name).filter(Boolean).join(', ') || null,
      albumName: data.album?.name || null,
      albumArt: data.album?.images?.[0]?.url || null,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'spotify lookup failed' },
      { status: 500 }
    )
  }
}
