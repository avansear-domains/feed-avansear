import { randomBytes, randomUUID } from 'crypto'
import { getSupabaseAdmin } from './supabase-admin'

export type ThreadContentType = 'text' | 'photo' | 'music'

export interface ThreadRow {
  id: string
  slug: string
  title: string | null
  content_type: ThreadContentType
  text_content: string | null
  media_url: string | null
  media_kind: string | null
  spotify_url: string | null
  deleted_at: string | null
  created_at: string
}

export interface Thread {
  id: string
  slug: string
  title?: string
  contentType: ThreadContentType
  body?: string
  mediaUrl?: string
  mediaKind?: string
  spotifyUrl?: string
  tags: string[]
  createdAt: string
}

export interface CreateThreadInput {
  title?: string
  contentType: ThreadContentType
  body?: string
  mediaUrl?: string
  mediaKind?: string
  spotifyUrl?: string
  tags?: string[]
  newTags?: string[]
}

function randomThreadSlug(): string {
  // 16-character URL slug, lowercase alphanumeric.
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = randomBytes(16)
  let out = ''
  for (let i = 0; i < 16; i += 1) {
    out += chars[bytes[i] % chars.length]
  }
  return out
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, ' ')
}

function slugifyTag(tag: string): string {
  return normalizeTag(tag).replace(/\s+/g, '-')
}

function mapThread(row: ThreadRow, tags: string[]): Thread {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title || undefined,
    contentType: row.content_type,
    body: row.text_content || undefined,
    mediaUrl: row.media_url || undefined,
    mediaKind: row.media_kind || undefined,
    spotifyUrl: row.spotify_url || undefined,
    tags,
    createdAt: row.created_at,
  }
}

const MOCK_THREADS: Thread[] = [
  {
    id: 'mock-music-1',
    slug: 'a1b2c3d4e5f6g7h8',
    title: 'von dutch',
    contentType: 'music',
    spotifyUrl: 'https://open.spotify.com/track/01TnMXIy7mJJQpzx3fJ9Ei',
    tags: ['anhedonic daydreams', 'music'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-text-1',
    slug: 'j9k0l1m2n3p4q5r6',
    title: 'chasing feelings',
    contentType: 'text',
    body: `i was talking to somebody recently, and it led me on this spiral.

let's say we're hungry and we're looking around for food. you'll check your fridge once, maybe twice, then pantry, then oven, then under the oven.
then maybe your backpack. then your roommates.`,
    tags: ['realizations', 'writings'],
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'mock-photo-1',
    slug: 's7t8u9v0w1x2y3z4',
    title: 'detroit zoo trip yaya :DD',
    contentType: 'photo',
    mediaUrl: 'https://images.unsplash.com/photo-1501706362039-c6e80948db2f?auto=format&fit=crop&w=1200&q=80',
    mediaKind: 'image',
    tags: ['fun stuff hehe', 'photography'],
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 'mock-text-2',
    slug: 'b8n6m4k2j0h9g7f5',
    title: 'chasing feelings',
    contentType: 'text',
    body: `when you're different from the people around you, you get categorized into two buckets.
one's weird, and one's special. i didn't like the way people looked at weird.
they looked at it in a bad way. i didn't wanna do the same thing as everyone so i thought i'd embrace weird.`,
    tags: ['3 am thoughts', 'writings'],
    createdAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
  },
]

async function getTagsByThreadId(ids: string[]): Promise<Map<string, string[]>> {
  if (ids.length === 0) return new Map()
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('thread_tags')
    .select('thread_id,tags(name)')
    .in('thread_id', ids)
  if (error) throw error

  const map = new Map<string, string[]>()
  for (const item of data ?? []) {
    const row = item as { thread_id: string; tags: { name: string }[] | { name: string } | null }
    const tagName = Array.isArray(row.tags) ? row.tags[0]?.name : row.tags?.name
    if (!tagName) continue
    const existing = map.get(row.thread_id) || []
    existing.push(tagName)
    map.set(row.thread_id, existing)
  }
  return map
}

export async function listThreads(): Promise<Thread[]> {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('threads')
      .select('id,slug,title,content_type,text_content,media_url,media_kind,spotify_url,deleted_at,created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    const rows = (data ?? []) as ThreadRow[]
    if (rows.length === 0) {
      return MOCK_THREADS
    }
    const map = await getTagsByThreadId(rows.map((item) => item.id))
    return rows.map((row) => mapThread(row, map.get(row.id) || []))
  } catch {
    return MOCK_THREADS
  }
}

export async function getThreadBySlug(slug: string): Promise<Thread | null> {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('threads')
      .select('id,slug,title,content_type,text_content,media_url,media_kind,spotify_url,deleted_at,created_at')
      .eq('slug', slug)
      .is('deleted_at', null)
      .maybeSingle()
    if (error) throw error
    if (!data) {
      return MOCK_THREADS.find((thread) => thread.slug === slug) || null
    }

    const map = await getTagsByThreadId([data.id])
    return mapThread(data as ThreadRow, map.get(data.id) || [])
  } catch {
    return MOCK_THREADS.find((thread) => thread.slug === slug) || null
  }
}

export async function listThreadsByTagSlug(
  rawTagSlug: string
): Promise<{ tagName: string; threads: Thread[] } | null> {
  const tagSlug = rawTagSlug.trim().toLowerCase()
  if (!tagSlug) return null

  try {
    const supabase = getSupabaseAdmin()
    const { data: tagRow, error: tagError } = await supabase
      .from('tags')
      .select('id,name,slug')
      .eq('slug', tagSlug)
      .maybeSingle()
    if (tagError) throw tagError
    if (!tagRow) return null

    const { data: threadTagRows, error: joinError } = await supabase
      .from('thread_tags')
      .select('thread_id')
      .eq('tag_id', tagRow.id)
    if (joinError) throw joinError

    const threadIds = Array.from(new Set((threadTagRows ?? []).map((row) => row.thread_id)))
    if (threadIds.length === 0) {
      return { tagName: tagRow.name, threads: [] }
    }

    const { data: threadRows, error: threadError } = await supabase
      .from('threads')
      .select('id,slug,title,content_type,text_content,media_url,media_kind,spotify_url,deleted_at,created_at')
      .in('id', threadIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (threadError) throw threadError

    const rows = (threadRows ?? []) as ThreadRow[]
    const tagsByThread = await getTagsByThreadId(rows.map((item) => item.id))
    return {
      tagName: tagRow.name,
      threads: rows.map((row) => mapThread(row, tagsByThread.get(row.id) || [])),
    }
  } catch {
    const threads = MOCK_THREADS.filter((thread) => thread.tags.some((tag) => slugifyTag(tag) === tagSlug))
    if (threads.length === 0) return null
    const tagName = threads[0].tags.find((tag) => slugifyTag(tag) === tagSlug) || tagSlug
    return { tagName, threads }
  }
}

async function getOrCreateTagIds(rawTags: string[]): Promise<string[]> {
  const tags = Array.from(new Set(rawTags.map(normalizeTag).filter(Boolean)))
  if (tags.length === 0) return []
  const supabase = getSupabaseAdmin()

  const { data: existingRows, error: existingError } = await supabase
    .from('tags')
    .select('id,name')
    .in('name', tags)
  if (existingError) throw existingError

  const existing = new Map((existingRows ?? []).map((row) => [row.name, row.id]))
  const missing = tags.filter((tag) => !existing.has(tag))

  if (missing.length > 0) {
    const insertRows = missing.map((tag) => ({
      id: randomUUID(),
      name: tag,
      slug: tag.replace(/\s+/g, '-'),
      usage_count: 0,
    }))
    const { error: insertError } = await supabase.from('tags').insert(insertRows)
    if (insertError) throw insertError
  }

  const { data: allRows, error: allError } = await supabase.from('tags').select('id,name').in('name', tags)
  if (allError) throw allError
  return (allRows ?? []).map((row) => row.id)
}

async function incrementTagUsage(tagIds: string[]): Promise<void> {
  if (tagIds.length === 0) return
  const supabase = getSupabaseAdmin()
  const { data: rows, error: rowsError } = await supabase.from('tags').select('id,usage_count').in('id', tagIds)
  if (rowsError) throw rowsError

  await Promise.all(
    (rows ?? []).map(async (row) => {
      const next = Number(row.usage_count || 0) + 1
      const { error } = await supabase.from('tags').update({ usage_count: next }).eq('id', row.id)
      if (error) throw error
    })
  )
}

export async function listTagsByPopularity(): Promise<{ id: string; name: string; usageCount: number }[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('tags')
    .select('id,name,usage_count')
    .order('usage_count', { ascending: false })
    .order('name', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => ({ id: row.id, name: row.name, usageCount: row.usage_count || 0 }))
}

export async function createThread(input: CreateThreadInput): Promise<Thread> {
  const title = input.title?.trim() || null
  const body = input.body?.trim() || null
  const mediaUrl = input.mediaUrl?.trim() || null
  const spotifyUrl = input.spotifyUrl?.trim() || null

  if (input.contentType === 'text' && !body) throw new Error('text content is required')
  if (input.contentType === 'photo' && !mediaUrl) throw new Error('media URL is required for photo')
  if (input.contentType === 'music' && !spotifyUrl) throw new Error('spotify URL is required for music')

  const slug = randomThreadSlug()

  const supabase = getSupabaseAdmin()
  const row = {
    id: randomUUID(),
    slug,
    title,
    content_type: input.contentType,
    text_content: body,
    media_url: mediaUrl,
    media_kind: input.mediaKind || null,
    spotify_url: spotifyUrl,
  }

  const { data, error } = await supabase
    .from('threads')
    .insert(row)
    .select('id,slug,title,content_type,text_content,media_url,media_kind,spotify_url,deleted_at,created_at')
    .single()
  if (error) throw error

  const allTagNames = [...(input.tags || []), ...(input.newTags || [])]
  const tagIds = await getOrCreateTagIds(allTagNames)
  if (tagIds.length > 0) {
    const joins = tagIds.map((tagId) => ({ thread_id: data.id, tag_id: tagId }))
    const { error: joinError } = await supabase.from('thread_tags').insert(joins)
    if (joinError) throw joinError
    await incrementTagUsage(tagIds)
  }

  const tags = (await listTagsByPopularity())
    .filter((tag) => tagIds.includes(tag.id))
    .map((tag) => tag.name)

  return mapThread(data as ThreadRow, tags)
}

export async function hideThreadBySlug(slug: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  const nowIso = new Date().toISOString()
  const { error } = await supabase
    .from('threads')
    .update({ deleted_at: nowIso })
    .eq('slug', slug)
    .is('deleted_at', null)
  if (error) throw error
  return true
}
