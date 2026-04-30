'use client'

import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface SongCardProps {
  spotifyUrl: string
}

interface SongMeta {
  songName: string | null
  artist: string | null
  albumName: string | null
  albumArt: string | null
}

export function SongCard({ spotifyUrl }: SongCardProps) {
  const [meta, setMeta] = useState<SongMeta | null>(null)
  const [youtubeId, setYoutubeId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const readyRef = useRef(false)

  useEffect(() => {
    let mounted = true
    async function bootstrap() {
      setIsLoading(true)
      setError('')
      try {
        const metadataResponse = await fetch(
          `/api/feed/music/spotify?spotifyUrl=${encodeURIComponent(spotifyUrl)}`
        )
        const metadata = (await metadataResponse.json().catch(() => ({}))) as
          | ({ ok: true } & SongMeta)
          | { ok?: false; error?: string }

        if (!metadataResponse.ok || !metadata.ok) {
          const errorMessage = 'error' in metadata ? metadata.error : undefined
          throw new Error(errorMessage || 'failed to load song info')
        }
        if (!mounted) return

        setMeta({
          songName: metadata.songName || null,
          artist: metadata.artist || null,
          albumName: metadata.albumName || null,
          albumArt: metadata.albumArt || null,
        })

        if (metadata.songName && metadata.artist) {
          const youtubeResponse = await fetch('/api/feed/music/youtube-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ songName: metadata.songName, artist: metadata.artist }),
          })
          const youtubeData = (await youtubeResponse.json().catch(() => ({}))) as {
            ok?: boolean
            youtubeId?: string | null
          }
          if (mounted && youtubeData.ok && youtubeData.youtubeId) {
            setYoutubeId(youtubeData.youtubeId)
          }
        }
      } catch (e) {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'failed to load song')
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    bootstrap()
    return () => {
      mounted = false
    }
  }, [spotifyUrl])

  useEffect(() => {
    if (!youtubeId || !containerRef.current) return

    let cancelled = false
    const initialize = () => {
      if (cancelled || !containerRef.current || !(window as any).YT?.Player) return
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch {
          // ignore
        }
      }

      playerRef.current = new (window as any).YT.Player(containerRef.current, {
        width: 480,
        height: 270,
        videoId: youtubeId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          showinfo: 0,
        },
        events: {
          onReady: () => {
            readyRef.current = true
            setIsReady(true)
          },
          onStateChange: (event: any) => {
            const state = event?.data
            const YT = (window as any).YT
            setIsPlaying(state === YT?.PlayerState?.PLAYING)
          },
        },
      })
    }

    if (!(window as any).YT?.Player) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(script)
      const prevCb = (window as any).onYouTubeIframeAPIReady
      ;(window as any).onYouTubeIframeAPIReady = () => {
        if (typeof prevCb === 'function') prevCb()
        initialize()
      }
    } else {
      initialize()
    }

    return () => {
      cancelled = true
      readyRef.current = false
      setIsReady(false)
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch {
          // ignore
        }
        playerRef.current = null
      }
    }
  }, [youtubeId])

  const songTitle = meta?.songName || '[song title]'
  const artist = meta?.artist || '[artist name]'
  const album = meta?.albumName || '[album name]'
  const hasPlayable = Boolean(youtubeId && isReady)

  const handleTogglePlay = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!playerRef.current || !readyRef.current) return
    const YT = (window as any).YT
    const state = playerRef.current.getPlayerState?.()
    if (state === YT?.PlayerState?.PLAYING) {
      playerRef.current.pauseVideo()
      return
    }
    playerRef.current.playVideo()
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative' }}>
      <button
        type="button"
        onClick={handleTogglePlay}
        disabled={!hasPlayable}
        aria-label={isPlaying ? 'pause song' : 'play song'}
        style={{
          width: 100,
          height: 100,
          borderRadius: '999px',
          overflow: 'hidden',
          border: 'none',
          background: 'var(--feed-pill-bg)',
          color: 'var(--feed-text)',
          padding: 0,
          position: 'relative',
          cursor: hasPlayable ? 'pointer' : 'default',
          flexShrink: 0,
        }}
      >
        {meta?.albumArt ? (
          <img
            src={meta.albumArt}
            alt={album}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isPlaying ? 0.95 : 0.75 }}
          />
        ) : null}
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: meta?.albumArt ? 'rgba(0,0,0,0.35)' : 'transparent',
          }}
        >
          {isPlaying ? <Pause size={28} color="var(--feed-text)" /> : <Play size={28} style={{ marginLeft: 3, fill: 'var(--feed-text)' }} color="var(--feed-text)" />}
        </span>
      </button>

      <div style={{ display: 'grid', gap: 4 }}>
        <p className="feed-text-24 feed-title-font" style={{ margin: 0 }}>
          {songTitle}
        </p>
        <p className="feed-text-14 feed-body-font" style={{ margin: 0, color: 'var(--feed-text-muted)' }}>
          {artist}
        </p>
        <p className="feed-text-12 feed-body-font" style={{ margin: 0, color: 'var(--feed-text-muted)', fontStyle: 'italic' }}>
          {album}
        </p>
        {error ? (
          <a
            className="feed-text-12 feed-body-font"
            href={spotifyUrl}
            target="_blank"
            rel="noreferrer"
          >
            open spotify
          </a>
        ) : null}
      </div>

      <div
        aria-hidden="true"
        style={{ position: 'absolute', width: 480, height: 270, left: -99999, top: 0, overflow: 'hidden', pointerEvents: 'none' }}
      >
        <div ref={containerRef} style={{ width: 480, height: 270 }} />
      </div>
      {!youtubeId && !isLoading ? (
        <div style={{ display: 'none' }}>
          <a href={spotifyUrl} target="_blank" rel="noreferrer">
            open spotify
          </a>
        </div>
      ) : null}
    </div>
  )
}
