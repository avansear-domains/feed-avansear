export type ThreadContentType = 'text' | 'photo' | 'music'

export interface ThreadItem {
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
