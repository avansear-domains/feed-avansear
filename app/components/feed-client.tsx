'use client'

import Link from 'next/link'
import { ThreadCard } from './thread-card'
import type { ThreadItem } from './types'

interface FeedClientProps {
  initialThreads: ThreadItem[]
}

export function FeedClient({ initialThreads }: FeedClientProps) {
  return (
    <main className="min-h-screen bg-(--feed-bg) font-mono-normal tracking-tight text-(--feed-text)">
      <section className="mx-auto w-[min(768px,calc(100%-32px))] pt-16 pb-16">
        <div className="overflow-hidden rounded-[28px] border border-(--feed-border) bg-[rgba(225,220,218,0.01)]">
          <article className="p-4 border-b border-(--feed-border)">
            <div className="flex items-center justify-between gap-3">
              <a href="https://avansear.com" className="block min-w-0 flex-1">
                <div className="flex items-center gap-4">
                  <div className="relative size-[50px] shrink-0 overflow-hidden rounded-full bg-[#E1DCDA]">
                    <div
                      className="absolute left-1/2 top-1/2 size-[50px] -translate-x-1/2 -translate-y-1/2 bg-cover bg-center"
                      style={{
                        backgroundImage:
                          'url(https://app.paper.design/file-assets/01KQC0MPN7NAV89V6P9DZQ52X0/01KQDF485ZDV5FMGN30MYA1EER.png)',
                      }}
                    />
                  </div>
                  <p className="m-0 flex-1 font-mono-normal text-tag leading-none tracking-tight text-[#E1DCDACC]">
                    welcome to my domain. (sukuna)
                  </p>
                </div>
              </a>
              <Link
                href="/upload"
                className="cursor-pointer rounded-full border border-[#e1dcda] bg-[#e1dcda] px-[14px] py-[10px] font-mono-normal text-[#1b1817] transition-opacity duration-150"
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
