'use client'

import { ThreadCard } from './thread-card'
import type { ThreadItem } from './types'

interface FeedClientProps {
  initialThreads: ThreadItem[]
}

export function FeedClient({ initialThreads }: FeedClientProps) {
  return (
    <main className="feed-root">
      <section className="feed-shell">
        <div className="feed-threads-wrap">
          {initialThreads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </div>
      </section>
    </main>
  )
}
