'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface DeleteClientProps {
  slug: string
  initiallyAuthorized: boolean
}

export function DeleteClient({ slug, initiallyAuthorized }: DeleteClientProps) {
  const [status, setStatus] = useState<'idle' | 'working' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let mounted = true

    async function runDelete() {
      setStatus('working')
      setMessage('checking auth...')

      if (!initiallyAuthorized) {
        const password = window.prompt('Enter CUSTOM_PASS to delete this post:')
        if (!password) {
          if (!mounted) return
          setStatus('error')
          setMessage('delete cancelled.')
          return
        }

        const loginResponse = await fetch('/api/feed/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        })
        const loginData = (await loginResponse.json().catch(() => ({}))) as { ok?: boolean; error?: string }
        if (!loginResponse.ok || !loginData.ok) {
          if (!mounted) return
          setStatus('error')
          setMessage(loginData.error || 'auth failed.')
          return
        }
      }

      setMessage('deleting post...')
      const response = await fetch(`/api/feed/items/${encodeURIComponent(slug)}/delete`, { method: 'POST' })
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!mounted) return

      if (!response.ok || !data.ok) {
        setStatus('error')
        setMessage(data.error || 'failed to delete post.')
        return
      }

      setStatus('success')
      setMessage('post deleted. it is now hidden from public view.')
    }

    runDelete()
    return () => {
      mounted = false
    }
  }, [initiallyAuthorized, slug])

  return (
    <main className="feed-root">
      <section className="feed-shell">
        <div className="feed-threads-wrap" style={{ padding: 16 }}>
          <p className="feed-text-14 feed-body-font" style={{ margin: 0 }}>
            {status === 'working' ? 'working...' : message || 'processing...'}
          </p>
          <div style={{ marginTop: 12 }}>
            <Link href="/" className="feed-text-12 feed-body-font">
              back to feed
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
