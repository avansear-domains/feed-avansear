import { FeedClient } from './components/feed-client'
import { listThreads } from '../lib/thread-store'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const threads = await listThreads()
  return <FeedClient initialThreads={threads} />
}
