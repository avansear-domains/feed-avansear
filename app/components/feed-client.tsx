'use client'

import Link from 'next/link'
import { ThreadCard } from './thread-card'
import type { ThreadItem } from './types'

interface FeedClientProps {
  initialThreads: ThreadItem[]
}

export function FeedClient({ initialThreads }: FeedClientProps) {
  return (
    <main className="feed-root">
      <section className="feed-shell" style ={{ paddingBottom: 64 }}>
        <div className="feed-threads-wrap">
          <article style={{ padding: 16, borderBottom: '1px solid var(--feed-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <a href="https://avansear.com" style={{ display: 'block', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      overflow: 'hidden',
                      width: 50,
                      height: 50,
                      borderRadius: 9999,
                      position: 'relative',
                      background: '#E1DCDA',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        backgroundImage:
                          'url(https://app.paper.design/file-assets/01KQC0MPN7NAV89V6P9DZQ52X0/01KQDF485ZDV5FMGN30MYA1EER.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  </div>
                  <p
                    className="feed-text-14 feed-body-font"
                    style={{ margin: 0, letterSpacing: '-0.025em', color: '#E1DCDACC', flex: 1 }}
                  >
                    welcome to my domain. (sukuna)
                  </p>
                </div>
              </a>
              <Link
                href="/upload"
                className="feed-button"
              >
                new post
              </Link>
            </div>
          </article>
          {initialThreads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </div>
      </section>
    </main>
  )
}
