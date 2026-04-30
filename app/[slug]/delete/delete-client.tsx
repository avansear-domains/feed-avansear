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
    <main className="min-h-screen bg-(--feed-bg) font-mono-normal tracking-tight text-(--feed-text)">
      <section className="mx-auto w-[min(768px,calc(100%-32px))] pt-16">
        <div className="overflow-hidden rounded-[28px] border border-(--feed-border) bg-[rgba(225,220,218,0.01)] p-4">
          <p className="m-0 font-mono-normal text-content leading-none tracking-tight">
            {status === 'working' ? 'working...' : message || 'processing...'}
          </p>
          <div className="mt-3">
            <Link href="/" className="font-mono-normal text-label leading-none tracking-tight">
              back to feed
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
